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
log "updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git unzip ca-certificates ufw iptables-persistent

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
sudo -u "${TUI_USER}" bash -lc "cd '${APP_DIR}/server' && '${BUN_BIN}' install && '${BUN_BIN}' run gen-assets && '${BUN_BIN}' run build"

# ── 4. Host key ───────────────────────────────────────────────────────────
HOST_KEY="/home/${TUI_USER}/.ssh/host_rsa"
log "ensuring SSH host key exists at ${HOST_KEY}"
sudo -u "${TUI_USER}" mkdir -p "/home/${TUI_USER}/.ssh"
sudo -u "${TUI_USER}" chmod 700 "/home/${TUI_USER}/.ssh"
if [[ ! -f "${HOST_KEY}" ]]; then
  sudo -u "${TUI_USER}" ssh-keygen -t ed25519 -N '' -f "${HOST_KEY}" >/dev/null
fi
chmod 600 "${HOST_KEY}"

# ── 5. Move admin sshd to ${ADMIN_SSH_PORT} ───────────────────────────────
log "relocating admin sshd from 22 → ${ADMIN_SSH_PORT}"
SSHD="/etc/ssh/sshd_config"
if ! grep -Eq "^Port ${ADMIN_SSH_PORT}$" "${SSHD}"; then
  cp -a "${SSHD}" "${SSHD}.bak.$(date +%s)"
  # Remove any existing Port directive(s), then add ours at the top.
  sed -i -E 's/^\s*#?\s*Port\s+.*$//' "${SSHD}"
  printf '\n# chron0-tui: admin sshd relocated so port 22 can host the TUI\nPort %s\n' "${ADMIN_SSH_PORT}" >> "${SSHD}"
  systemctl reload ssh
fi

warn "Admin sshd is now on port ${ADMIN_SSH_PORT}."
warn "In a SECOND terminal, verify now:"
warn "  ssh -p ${ADMIN_SSH_PORT} root@$(hostname -I | awk '{print $1}')"
read -rp "Press ENTER once that works. (Ctrl-C aborts; old config is backed up.) "

# ── 6. Firewall + port redirect ───────────────────────────────────────────
log "configuring UFW"
ufw --force enable
ufw allow "${ADMIN_SSH_PORT}/tcp"
ufw allow 22/tcp
# 2222 is for internal use only — only redirected traffic reaches it.

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
install -m 0644 "${APP_DIR}/server/deploy/chron0-tui.service" /etc/systemd/system/chron0-tui.service
systemctl daemon-reload
systemctl enable --now chron0-tui

log "done."
log "Test:   ssh <your-ssh-hostname>           (should hit the TUI on 22 via redirect)"
log "Admin:  ssh -p ${ADMIN_SSH_PORT} root@<hostname>"
log "Logs:   journalctl -u chron0-tui -f"
