import path from "path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import store from "./store.mjs";
import rootdir from "../common/rootdir.mjs";
import { user } from "../common/settings.mjs";
import { getSystemServiceStatus, installSystemService, uninstallSystemService } from "./joystick-server.mjs";

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
        preload: path.resolve(rootdir, "src/main/pages/preload.cjs"),
        contextIsolation: true,
        nodeIntegrationInWorker: true,
      },
    });

    aboutWindow.loadFile(path.resolve(rootdir, "src/main/pages/about.html"));

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

ipcMain.handle("openFolderDialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"], // Allow selecting folders
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("installAutojoyService", async () => {
  return installSystemService()
});


ipcMain.handle("uninstallAutojoyService", (event, { removeNode } = { removeNode: false }) => {
  return uninstallSystemService(removeNode)
});

ipcMain.handle("getSystemServiceStatus", () => {
  return getSystemServiceStatus();
});

let mainWindow;

function createMainWindow() {
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    resizable: false,
    icon: path.resolve(rootdir, "assets/tray.png"),
    show: false, // Don't show the window immediately
    webPreferences: {
      preload: path.resolve(rootdir, "src/main/pages/preload.cjs"),
      contextIsolation: true,
      nodeIntegrationInWorker: true,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

export function openPathsPage() {
  createMainWindow()

  mainWindow.loadFile(path.resolve(rootdir, "src/main/pages/paths.html"));
  mainWindow.show();
}

export function openServicePage() {
  createMainWindow()

  mainWindow.loadFile(path.resolve(rootdir, "src/main/pages/service.html"));
  mainWindow.show();
}

// <a href="https://www.flaticon.com/free-icons/joystick" title="joystick icons">Joystick icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/joystick)>
