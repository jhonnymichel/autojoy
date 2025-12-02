#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="autojoy-backend.service"
UNIT_DEST_DIR="$HOME/.config/systemd/user"
UNIT_DEST_PATH="$UNIT_DEST_DIR/$SERVICE_NAME"
SOCKET_PATH="$HOME/.config/com.jhonnymichel/autojoy/backend.sock"

# Stop and disable
systemctl --user stop "$SERVICE_NAME" || true
systemctl --user disable "$SERVICE_NAME" || true
systemctl --user daemon-reload || true

# Remove unit file
if [[ -f "$UNIT_DEST_PATH" ]]; then
  rm -f "$UNIT_DEST_PATH"
fi

# Remove stale socket
if [[ -S "$SOCKET_PATH" ]]; then
  rm -f "$SOCKET_PATH"
fi

# Offer to remove Node/NVM
read -r -p "Do you want to remove NVM/Node installed by the installer? [y/N] " RESP
RESP=${RESP:-N}
if [[ "$RESP" =~ ^[Yy]$ ]]; then
  NVM_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/nvm"
  if [[ -d "$NVM_DIR" ]]; then
    rm -rf "$NVM_DIR"
    echo "Removed NVM at $NVM_DIR"
  fi
  # Remove environment file
  ENV_FILE="$HOME/.config/com.jhonnymichel/autojoy/env.conf"
  if [[ -f "$ENV_FILE" ]]; then
    rm -f "$ENV_FILE"
  fi
  echo "Node/NVM cleanup complete."
fi

echo "Uninstalled $SERVICE_NAME and cleaned up."
