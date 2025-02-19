import { app } from "electron";
import { validateSettings } from "./src/autojoy-backend/settings.mjs";
import store from "./src/main/store.mjs";
import { createPathsWindow } from "./src/main/window.mjs";
import { startServer } from "./src/main/joystick-server.mjs";
import { startTray } from "./src/main/tray.mjs";

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
