import { app } from "electron";
import { validateSettings } from "../common/settings.mjs";
import store from "./store.mjs";
import { openSetupPage } from "./window.mjs";
import { getSystemServiceStatus, startServer } from "./joystick-server.mjs";
import { startTray } from "./tray.mjs";
import { logFromApp, resetLogFile } from "../common/logger.mjs";

resetLogFile();
validateSettings(logFromApp);

app.on("ready", async () => {
  logFromApp("App started");
  const serviceStatus = await getSystemServiceStatus();
  const noPaths = Object.values(store.state.paths).every((path) => !path);
  const setupComplete = store.state.setupComplete;
  if (!setupComplete || noPaths || !serviceStatus.installed) {
    store.dispatch(store.actions.resetSetup());

    logFromApp(
      "Setup pending:",
      JSON.stringify(
        {
          noPaths,
          serviceInstalled: serviceStatus.installed,
          setupComplete,
        },
        null,
        2,
      ),
    );
    openSetupPage();
  } else {
    logFromApp("Activating server");
    startServer();
  }

  startTray();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
