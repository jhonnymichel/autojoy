import { app } from "electron";
import { validateSettings } from "../common/settings.mjs";
import store from "./store.mjs";
import { openDashboardPage, openSetupPage } from "./window.mjs";
import { getSystemServiceStatus, startServer } from "./joystick-server.mjs";
import { startTray } from "./tray.mjs";
import { logFromApp, resetLogFile } from "../common/logger.mjs";

resetLogFile();
validateSettings(logFromApp);

(async () => {
  logFromApp("App started");
  const serviceStatus = await getSystemServiceStatus();
  const serviceNeeded = !serviceStatus.installed && serviceStatus.supported;
  const noPaths = Object.values(store.state.paths).every((path) => !path);
  const setupComplete = store.state.setupComplete;
  if (!setupComplete) {
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

    if (serviceNeeded || noPaths) {
      openDashboardPage();
    }
  }

  startTray();
})();

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
