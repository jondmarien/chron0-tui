#!/usr/bin/env bash
# shellcheck shell=bash
# ──────────────────────────────────────────────────────────────────────────
# One-shot provisioning script for an Ubuntu 24.04 Digital Ocean droplet.
# Run as root: `sudo bash deploy/provision.sh`
#
# What this does (idempotent; safe to re-run):
#   1. Installs OS deps + bun + iptables-persistent.
#   2. Creates unprivileged `tui` user + /opt/chron0-tui checkout.
#   3. Generates the SSH host key at /home/tui/.ssh/host_rsa on first run.
#   4. Moves admin sshd from 22 → 2200 and reloads it (with a MANUAL
#      verification pause so you don't lock yourself out).
#   5. Opens the firewall (2200/tcp, 22/tcp) and redirects 22 → 2222 via
#      iptables, persisted through netfilter-persistent.
#   6. Installs + enables the systemd unit.
#
# Config (env vars, optional):
#   REPO_URL  default: https://github.com/jondmarien/chron0-tui
#   APP_DIR   default: /opt/chron0-tui
#   TUI_USER  default: tui
#   APP_PORT  default: 2222
#   ADMIN_SSH_PORT default: 2200
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/jondmarien/chron0-tui}"
APP_DIR="${APP_DIR:-/opt/chron0-tui}"
TUI_USER="${TUI_USER:-tui}"
APP_PORT="${APP_PORT:-2222}"
ADMIN_SSH_PORT="${ADMIN_SSH_PORT:-2200}"

log()  { printf '\e[1;34m[provision]\e[0m %s\n' "$*"; }
warn() { printf '\e[1;33m[warn]\e[0m %s\n' "$*"; }
die()  { printf '\e[1;31m[error]\e[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run as root"

# ── 1. Base packages ──────────────────────────────────────────────────────
# Installed in small groups so a single package failure is obvious, and with
# --no-install-recommends to avoid the typical Ubuntu 24.04 `iptables-persistent`
# vs `nftables` held-packages breakage.
log "updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends curl git unzip ca-certificates openssh-server
# Note: we deliberately do NOT install `ufw` here — on Ubuntu 24.04 the
# legacy `iptables-persistent` package conflicts with `ufw` (nftables
# backend) and apt silently removes ufw when you install the former.
# We manage the firewall directly with iptables instead.
apt-get install -y --no-install-recommends netfilter-persistent iptables-persistent

# ── 2. Bun (as the tui user — official install script) ────────────────────
log "ensuring user '${TUI_USER}' exists"
if ! id "${TUI_USER}" >/dev/null 2>&1; then
  useradd --create-home --shell /usr/sbin/nologin "${TUI_USER}"
fi

BUN_BIN="/home/${TUI_USER}/.bun/bin/bun"
if [[ ! -x "${BUN_BIN}" ]]; then
  log "installing bun as ${TUI_USER}"
  sudo -u "${TUI_USER}" bash -lc 'curl -fsSL https://bun.sh/install | bash'
fi
"${BUN_BIN}" --version

# ── 3. Repo checkout + install + build ────────────────────────────────────
log "checking out ${REPO_URL} → ${APP_DIR}"
if [[ ! -d "${APP_DIR}/.git" ]]; then
  git clone --depth=1 "${REPO_URL}" "${APP_DIR}"
else
  git -C "${APP_DIR}" pull --ff-only
fi
chown -R "${TUI_USER}:${TUI_USER}" "${APP_DIR}"

log "installing deps + building + generating assets"
sudo -u "${TUI_USER}" bash -lc "cd '${APP_DIR}' && '${BUN_BIN}' install && '${BUN_BIN}' run gen-assets && '${BUN_BIN}' run build"

# ── 4. Host key ───────────────────────────────────────────────────────────
HOST_KEY="/home/${TUI_USER}/.ssh/host_rsa"
log "ensuring SSH host key exists at ${HOST_KEY}"
sudo -u "${TUI_USER}" mkdir -p "/home/${TUI_USER}/.ssh"
sudo -u "${TUI_USER}" chmod 700 "/home/${TUI_USER}/.ssh"
if [[ ! -f "${HOST_KEY}" ]]; then
  sudo -u "${TUI_USER}" ssh-keygen -t ed25519 -N '' -f "${HOST_KEY}" >/dev/null
fi
chmod 600 "${HOST_KEY}"

# ── 5. Move admin sshd to ${ADMIN_SSH_PORT} ───────────────────────
log "relocating admin sshd from 22 → ${ADMIN_SSH_PORT}"

# Ubuntu 24.04 uses systemd socket activation by default: ssh.socket listens on
# port 22 and hands off to sshd, which ignores the `Port` directive in
# sshd_config. We must disable the socket and run sshd directly.
if systemctl list-unit-files ssh.socket &>/dev/null; then
  log "  disabling ssh.socket (socket activation overrides sshd_config Port)"
  systemctl disable --now ssh.socket 2>/dev/null || true
fi
systemctl enable ssh 2>/dev/null || true

SSHD="/etc/ssh/sshd_config"
if ! grep -Eq "^Port ${ADMIN_SSH_PORT}$" "${SSHD}"; then
  cp -a "${SSHD}" "${SSHD}.bak.$(date +%s)"
  # Remove any existing Port directive(s), then add ours at the top.
  sed -i -E 's/^\s*#?\s*Port\s+.*$//' "${SSHD}"
  printf '\n# chron0-tui: admin sshd relocated so port 22 can host the TUI\nPort %s\n' "${ADMIN_SSH_PORT}" >> "${SSHD}"
fi

# Hard restart (reload isn't enough after socket-activation changes).
systemctl restart ssh

# Verify sshd is actually bound to the new port before we let the user proceed.
if ! ss -tlnp 2>/dev/null | grep -q ":${ADMIN_SSH_PORT}\b"; then
  die "sshd is NOT listening on ${ADMIN_SSH_PORT} after restart. Check: systemctl status ssh ; journalctl -u ssh -n 50"
fi
log "  sshd confirmed listening on ${ADMIN_SSH_PORT}"

warn "Admin sshd is now on port ${ADMIN_SSH_PORT}."
warn "In a SECOND terminal, verify now:"
warn "  ssh -p ${ADMIN_SSH_PORT} root@$(hostname -I | awk '{print $1}')"
read -rp "Press ENTER once that works. (Ctrl-C aborts; old config is backed up.) "

# ── 6. Firewall + port redirect ─────────────────────────────────
# DO droplets start with a wide-open iptables INPUT policy (ACCEPT, no rules),
# so the admin port (${ADMIN_SSH_PORT}) and the public redirect target (22)
# are already reachable. Ports 2222 (app) reaches only via the PREROUTING
# redirect below. If you later harden INPUT, remember to allow these:
#   iptables -A INPUT -p tcp --dport ${ADMIN_SSH_PORT} -j ACCEPT
#   iptables -A INPUT -p tcp --dport 22 -j ACCEPT

log "installing iptables 22 → ${APP_PORT} redirect"
if ! iptables -t nat -C PREROUTING -p tcp --dport 22 -j REDIRECT --to-port "${APP_PORT}" 2>/dev/null; then
  iptables -t nat -A PREROUTING -p tcp --dport 22 -j REDIRECT --to-port "${APP_PORT}"
fi
# Also redirect loopback traffic for self-testing.
if ! iptables -t nat -C OUTPUT -p tcp -o lo --dport 22 -j REDIRECT --to-port "${APP_PORT}" 2>/dev/null; then
  iptables -t nat -A OUTPUT -p tcp -o lo --dport 22 -j REDIRECT --to-port "${APP_PORT}"
fi
netfilter-persistent save

# ── 7. Systemd unit ──────────────────────────────────────────────────────
log "installing systemd unit"
install -m 0644 "${APP_DIR}/deploy/chron0-tui.service" /etc/systemd/system/chron0-tui.service
systemctl daemon-reload
systemctl enable --now chron0-tui

log "done."
log "Test:   ssh <your-ssh-hostname>           (should hit the TUI on 22 via redirect)"
log "Admin:  ssh -p ${ADMIN_SSH_PORT} root@<hostname>"
log "Logs:   journalctl -u chron0-tui -f"
