import { app, dialog } from "electron";

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  dialog.showErrorBox(
    "Autojoy is already running!",
    "Another instance of Autojoy is already running. Close other instances before opening the app.",
  );
  app.quit();
} else {
  app.on("ready", async () => {
    import("./startup.mjs");
  });
}
