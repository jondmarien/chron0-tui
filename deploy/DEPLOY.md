# Deploying chron0-tui

Target: a fresh Ubuntu 24.04 LTS Digital Ocean droplet (any region, $6/mo shared-CPU is fine).

## 0. Prerequisites on your laptop

- An SSH keypair added to your DO account.
- DNS for `chron0.tech` managed where you can add records.

## 1. Create the droplet

- Image: Ubuntu 24.04 x64
- Size: Basic, Regular SSD, 1 vCPU / 1 GB RAM / 25 GB ($6/mo)
- Authentication: SSH key
- Hostname: `chron0-tui` (or whatever you like)

Note the public IPv4.

## 2. Point DNS at it

Add an **A record** (not CNAME, not proxied):

```
A   ssh   <droplet-ip>   TTL 300
```

Important if you use Cloudflare: set the record to **DNS only (grey cloud)**. Cloudflare's orange-cloud proxy is HTTP(S) only — SSH cannot traverse it.

Wait ~1 minute, then sanity check from your laptop:

```sh
dig +short ssh.chron0.tech
# should print <droplet-ip>
```

## 3. Initial ssh in (as root on port 22, before we move it)

```sh
ssh root@ssh.chron0.tech
```

## 4. Run the provisioner

On the droplet:

```sh
git clone https://github.com/jondmarien/chron0-tui /opt/chron0-tui
bash /opt/chron0-tui/deploy/provision.sh
```

The script is idempotent and:

1. Installs deps, `bun`, `ufw`, `iptables-persistent`.
2. Creates the `tui` user and `/opt/chron0-tui` checkout owned by it.
3. `bun install && bun run gen-assets && bun run build`.
4. Generates the SSH host key at `/home/tui/.ssh/host_rsa`.
5. **Moves the admin sshd from port 22 → 2200** and reloads it.
6. **Pauses and asks you to verify** that `ssh -p 2200 root@<ip>` works in a second terminal. Don't proceed until it does — if something's wrong, Ctrl-C now and restore `/etc/ssh/sshd_config.bak.*`.
7. Opens UFW (22, 2200) and installs the iptables `22 → 2222` PREROUTING redirect.
8. Installs and starts the `chron0-tui.service` systemd unit.

## 5. Verify

From your laptop:

```sh
ssh ssh.chron0.tech            # should land in the TUI (port 22 → 2222 internally)
ssh -p 2200 root@ssh.chron0.tech   # admin shell
```

Logs:

```sh
ssh -p 2200 root@ssh.chron0.tech 'journalctl -u chron0-tui -f'
```

## 6. Updating content

Content is baked into the build. To ship an update:

```sh
ssh -p 2200 root@ssh.chron0.tech
cd /opt/chron0-tui
git pull
sudo -u tui /home/tui/.bun/bin/bun install
sudo -u tui /home/tui/.bun/bin/bun run gen-assets
sudo -u tui /home/tui/.bun/bin/bun run build
systemctl restart chron0-tui
```

## Rollback

If something goes very wrong:

```sh
# Restore sshd
ls -1 /etc/ssh/sshd_config.bak.* | tail -n1 | xargs -I {} cp {} /etc/ssh/sshd_config
systemctl reload ssh

# Drop the iptables redirect
iptables -t nat -D PREROUTING -p tcp --dport 22 -j REDIRECT --to-port 2222
iptables -t nat -D OUTPUT     -p tcp -o lo --dport 22 -j REDIRECT --to-port 2222
netfilter-persistent save

# Stop the service
systemctl disable --now chron0-tui
```

## Notes

- **Old OpenSSH / PuTTY clients** may fail the KEX negotiation. Modern OpenSSH (≥8.0) and Warp/iTerm2/Kitty/WezTerm/Windows Terminal all work.
- **OSC 8 hyperlinks** (sidebar links, contact emails) render as real clickable links in modern terminals. Older terminals still show the text label.
- **Abuse**: hard caps are enforced by the app (`MAX_PER_IP=5`, `MAX_CONNECTIONS=50`, 5 min idle, 15 min hard). For heavier protection add `fail2ban` with a custom jail on the `reject` / `close` log lines.
