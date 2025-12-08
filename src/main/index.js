import { app } from "electron";
import { validateSettings } from "../common/settings.mjs";
import store from "./store.mjs";
import { openPathsPage, openServicePage } from "./window.mjs";
import { getSystemServiceStatus, startServer } from "./joystick-server.mjs";
import { startTray } from "./tray.mjs";
import { logFromApp, resetLogFile } from "../common/logger.mjs";

resetLogFile();
validateSettings(logFromApp);

app.on("ready", async () => {
  if (Object.values(store.state.paths).every((path) => !path)) {
    openPathsPage();
  }

  logFromApp("App started");
  const serviceStatus = await getSystemServiceStatus()
  if (serviceStatus.supported) {
    if (!serviceStatus.installed) {
      logFromApp("System service not installed, prompting install to user.");
      openServicePage()
    }
  } else {
    logFromApp("Activating server");
    startServer();
  }

  startTray();
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
