import { app } from "electron";
import { validateSettings } from "../common/settings.mjs";
import store from "./store.mjs";
import { createPathsWindow } from "./window.mjs";
import { startServer } from "./joystick-server.mjs";
import { startTray } from "./tray.mjs";
import { logFromApp, resetLogFile } from "../common/logger.mjs";

resetLogFile();
validateSettings(logFromApp);

app.on("ready", () => {
  if (Object.values(store.state.paths).every((path) => !path)) {
    createPathsWindow();
  }

  logFromApp("App started, activating server");
  startServer();
  startTray();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
