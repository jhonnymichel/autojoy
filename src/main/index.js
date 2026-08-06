import { app, dialog } from "electron";

const gotTheLock = app.requestSingleInstanceLock();

app.on("ready", async () => {
  if (!gotTheLock) {
    dialog.showErrorBox(
      "Autojoy is already running!",
      "Another instance of Autojoy is already running. Close other instances before opening the app.",
    );
    app.quit();
  } else {
    import("./startup.mjs");
  }
});
