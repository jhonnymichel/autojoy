import { app } from "electron";

export function updateSystemSettings(settings) {
  app.setLoginItemSettings(settings);
}

export function getSystemSettings() {
  return app.getLoginItemSettings();
}
