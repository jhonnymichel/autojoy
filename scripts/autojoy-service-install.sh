#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="autojoy-backend.service"
UNIT_DEST_DIR="$HOME/.config/systemd/user"
UNIT_DEST_PATH="$UNIT_DEST_DIR/$SERVICE_NAME"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure Node.js available; if missing, install via NVM
ensure_node() {
	if command -v node >/dev/null 2>&1; then
		return
	fi
	echo "Node.js not found. Installing via NVM..."
	# Install NVM
	export NVM_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/nvm"
	mkdir -p "$NVM_DIR"
	curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
	# shellcheck source=/dev/null
	if [[ -s "$NVM_DIR/nvm.sh" ]]; then
		. "$NVM_DIR/nvm.sh"
	fi
	nvm install --lts
	nvm use --lts
	# Persist environment for systemd service via environment override
	# Create environment file exporting PATH with nvm-managed node
	NODE_PATH_DIR="$HOME/.config/com.jhonnymichel/autojoy"
	mkdir -p "$NODE_PATH_DIR"
	ENV_FILE="$NODE_PATH_DIR/env.conf"
	echo "PATH=$PATH" > "$ENV_FILE"
	echo "NVM_DIR=$NVM_DIR" >> "$ENV_FILE"
	echo "Exported PATH and NVM_DIR to $ENV_FILE"
}

ensure_node

mkdir -p "$UNIT_DEST_DIR"

# Determine exec path based on dev vs packaged
DEV_EXEC_PATH="$REPO_ROOT/dev-app-data/src/autojoy-backend/index.mjs"
PKG_EXEC_PATH="$HOME/.config/com.jhonnymichel/autojoy/src/autojoy-backend/index.mjs"
if [[ -n "${AUTOJOY_DEV:-}" ]] && [[ -f "$DEV_EXEC_PATH" ]]; then
	EXEC_PATH="$DEV_EXEC_PATH"
elif [[ -f "$DEV_EXEC_PATH" ]]; then
	EXEC_PATH="$DEV_EXEC_PATH"
else
	EXEC_PATH="$PKG_EXEC_PATH"
fi

# Create unit file dynamically with correct ExecStart
cat > "$UNIT_DEST_PATH" <<EOF
[Unit]
Description=Autojoy Backend Daemon
After=network.target

[Service]
Type=simple
EnvironmentFile=$HOME/.config/com.jhonnymichel/autojoy/env.conf
ExecStart=/usr/bin/env node "$EXEC_PATH" --daemon
Restart=always
RestartSec=2

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
systemctl --user start "$SERVICE_NAME"

echo "Installed and started $SERVICE_NAME (user service)."
