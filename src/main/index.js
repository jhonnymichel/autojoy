import { app } from "electron";
import { validatePaths, validateSettings } from "../common/settings.mjs";
import store from "./store.mjs";
import { createPathsWindow } from "./window.mjs";
import { startServer } from "./joystick-server.mjs";
import { startTray } from "./tray.mjs";

validatePaths();
validateSettings();

const { dispatch, actions } = store;

app.on("ready", () => {
  if (Object.values(store.state.paths).every((path) => !path)) {
    createPathsWindow();
  }

  dispatch(actions.stdout("App started, activating server"));
  startServer();
  startTray();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
