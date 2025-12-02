#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="autojoy-backend.service"
UNIT_SRC_DIR="$(dirname "$0")/../assets/systemd"
UNIT_SRC_PATH="$UNIT_SRC_DIR/$SERVICE_NAME"
UNIT_DEST_DIR="$HOME/.config/systemd/user"
UNIT_DEST_PATH="$UNIT_DEST_DIR/$SERVICE_NAME"

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
cp "$UNIT_SRC_PATH" "$UNIT_DEST_PATH"

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
systemctl --user start "$SERVICE_NAME"

echo "Installed and started $SERVICE_NAME (user service)."
