#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="autojoy-backend.service"
UNIT_DEST_DIR="$HOME/.config/systemd/user"
UNIT_DEST_PATH="$UNIT_DEST_DIR/$SERVICE_NAME"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Decide dev vs packaged paths
DEV_EXEC_PATH="$REPO_ROOT/dev-app-data/src/autojoy-backend/index.mjs"
PKG_EXEC_PATH="$HOME/.config/com.jhonnymichel/autojoy/src/autojoy-backend/index.mjs"
DEV_MODE=0
if [[ -n "${AUTOJOY_DEV:-}" ]] && [[ -f "$DEV_EXEC_PATH" ]]; then
  EXEC_PATH="$DEV_EXEC_PATH"; DEV_MODE=1
elif [[ -f "$DEV_EXEC_PATH" ]]; then
  EXEC_PATH="$DEV_EXEC_PATH"; DEV_MODE=1
else
  EXEC_PATH="$PKG_EXEC_PATH"; DEV_MODE=0
fi

# Environment file location depends on mode
if [[ "$DEV_MODE" -eq 1 ]]; then
	ENV_DIR="$REPO_ROOT/dev-app-data"
else
  ENV_DIR="$HOME/.config/com.jhonnymichel/autojoy"
fi
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
$( [[ "$DEV_MODE" -eq 1 ]] && echo "WorkingDirectory=$REPO_ROOT" )

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
