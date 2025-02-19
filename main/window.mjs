import path from "path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { user } from "../app/settings.mjs";
import store from "./store.mjs";
import rootdir from "./rootdir.mjs";

const { dispatch, actions } = store;
let aboutWindow = null;

export function createAboutWindow() {
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      autoHideMenuBar: true,
      resizable: false,
      icon: path.resolve(rootdir, "assets/tray.png"),
      show: false, // Don't show the window immediately
      webPreferences: {
        preload: path.resolve(rootdir, "main/pages/preload.cjs"),
        contextIsolation: true,
        nodeIntegrationInWorker: true,
      },
    });

    aboutWindow.loadFile("main/pages/about.html");

    // Dereference the window object when it's closed
    aboutWindow.on("closed", () => {
      aboutWindow = null;
    });
  }

  // Show the window
  aboutWindow.show();
}

ipcMain.handle("getAppVersion", () => {
  return app.getVersion();
});

ipcMain.handle("getUser", () => {
  return structuredClone(user);
});

ipcMain.handle("setPaths", (event, paths) => {
  dispatch(actions.setPaths(paths));
});

ipcMain.handle("openFolderDialog", async (event, paths) => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"], // Allow selecting folders
  });

  return result.canceled ? null : result.filePaths[0];
});

let pathsWindow;
export function createPathsWindow() {
  if (!pathsWindow) {
    pathsWindow = new BrowserWindow({
      autoHideMenuBar: true,
      resizable: false,
      icon: path.resolve(rootdir, "assets/tray.png"),
      show: false, // Don't show the window immediately
      webPreferences: {
        preload: path.resolve(rootdir, "main/pages/preload.cjs"),
        contextIsolation: true,
        nodeIntegrationInWorker: true,
      },
    });

    pathsWindow.loadFile("main/pages/paths.html");

    // Dereference the window object when it's closed
    pathsWindow.on("closed", () => {
      pathsWindow = null;
    });
  }

  // Show the window
  pathsWindow.show();
}

// <a href="https://www.flaticon.com/free-icons/joystick" title="joystick icons">Joystick icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/joystick)>
