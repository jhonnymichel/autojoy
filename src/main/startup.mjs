import { app } from "electron";
import { validateSettings } from "../common/settings.mjs";
import store from "./store.mjs";
import { openDashboardPage, openSetupPage } from "./window.mjs";
import { getSystemServiceStatus, startServer } from "./joystick-server.mjs";
import { startTray } from "./tray.mjs";
import { logFromApp, resetLogFile } from "../common/logger.mjs";
import { loaders, savers } from "../common/file.mjs";

resetLogFile();
validateSettings(logFromApp);

(async () => {
  logFromApp("App started");
  const isUpdate = handleAppUpdate();
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

    openSetupPage(isUpdate ? "updated" : "");
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

function handleAppUpdate() {
  let isUpdate = false;
  const currentVersion = getCurrentVersionFromMeta();
  try {
    if (wasAppUpdated(currentVersion)) {
      logFromApp(
        `App updated from version ${currentVersion} to ${app.getVersion()}`,
      );

      store.dispatch(store.actions.resetSetup());
      updateCurrentVersionInMeta();
      isUpdate = true;
    }
  } catch (e) {
    logFromApp("Error handling app update:", e.message);
    updateCurrentVersionInMeta();
    store.dispatch(store.actions.resetSetup());
    isUpdate = true;
  }

  return isUpdate;
}

function wasAppUpdated(currentVersion) {
  return currentVersion !== app.getVersion();
}

function updateCurrentVersionInMeta() {
  try {
    savers.json({ version: app.getVersion() }, ".meta.json");
  } catch (e) {
    logFromApp("Error updating app meta:", e.message);
  }
}

function getCurrentVersionFromMeta() {
  try {
    const meta = loaders.json(".meta.json");
    return meta.version;
  } catch (e) {
    logFromApp("Error loading app meta:", e.message);
    return null;
  }
}
