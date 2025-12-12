#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="autojoy-backend.service"
UNIT_DEST_DIR="$HOME/.config/systemd/user"
UNIT_DEST_PATH="$UNIT_DEST_DIR/$SERVICE_NAME"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

EXEC_PATH="$HOME/.config/com.jhonnymichel/autojoy/.src/autojoy-backend.js"
ENV_DIR="$HOME/.config/com.jhonnymichel/autojoy"
mkdir -p "$ENV_DIR"
ENV_FILE="$ENV_DIR/env.conf"

# Ensure Node.js available; if missing, install via NVM. Also persist PATH/NVM_DIR for systemd.
ensure_node() {
	if command -v node >/dev/null 2>&1; then
		echo "PATH=$PATH" > "$ENV_FILE"
		# If NVM is present, export it; otherwise leave it unset
		if [[ -n "${NVM_DIR:-}" ]]; then
			echo "NVM_DIR=$NVM_DIR" >> "$ENV_FILE"
		fi
		echo "Exported PATH${NVM_DIR:+ and NVM_DIR} to $ENV_FILE"
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
	echo "PATH=$PATH" > "$ENV_FILE"
	echo "NVM_DIR=$NVM_DIR" >> "$ENV_FILE"
	echo "Exported PATH and NVM_DIR to $ENV_FILE"
}

ensure_node

{
	echo "AUTOJOY_BACKEND_MODE=service"
	echo "AUTOJOY_ENV=prod"
} >> "$ENV_FILE"

mkdir -p "$UNIT_DEST_DIR"

# Create unit file dynamically with correct ExecStart
cat > "$UNIT_DEST_PATH" <<EOF
[Unit]
Description=Autojoy Backend Daemon
After=network.target

[Service]
Type=simple
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/env node "$EXEC_PATH" --daemon
Restart=always
RestartSec=2

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload --no-pager
# small delay to avoid race where systemd user manager hasn't reloaded yet
sleep 0.2

# clear any previous failed state
systemctl --user reset-failed "$SERVICE_NAME" --no-pager || true

# enable and start in one shot
systemctl --user enable --now "$SERVICE_NAME" --no-pager

echo "Installed and started $SERVICE_NAME (user service)."
