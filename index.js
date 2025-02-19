import { app } from "electron";
import { validateSettings } from "./app/settings.mjs";
import store from "./main/store.mjs";
import { startServer } from "./main/joystick-server.mjs";
import { createPathsWindow } from "./main/window.mjs";
import { startTray } from "./main/tray.mjs";

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
