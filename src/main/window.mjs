import path from "path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import store from "./store.mjs";
import rootdir from "../common/rootdir.mjs";
import {
  getSystemServiceStatus,
  installSystemService,
  openServiceLogs,
  restartSystemService,
  stopSystemService,
  uninstallSystemService,
} from "./joystick-server.mjs";
import { logFromApp } from "../common/logger.mjs";

const { dispatch, actions } = store;
let aboutWindow = null;
let logsWindow = null;

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:5173/index.html";
const pagesDist = path.resolve(rootdir, "src/main/pages/dist");

function loadPage(window, page = "") {
  if (isDev) {
    window.loadURL(`${DEV_URL}#${page}`);
  } else {
    window.loadFile(path.join(pagesDist, "index.html"), { hash: page });
  }
}

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

export function createLogsWindow() {
  if (!logsWindow) {
    logsWindow = new BrowserWindow({
      autoHideMenuBar: true,
      resizable: true,
      width: 900,
      height: 600,
      icon: path.resolve(rootdir, "assets/tray.png"),
      show: false,
      webPreferences: {
        preload: path.resolve(rootdir, "src/main/pages/preload.cjs"),
        contextIsolation: true,
      },
    });

    logsWindow.loadFile(path.resolve(rootdir, "src/main/pages/live-logs.html"));

    logsWindow.on("closed", () => {
      logsWindow = null;
    });
  }

  logsWindow.show();
}

export function openPathsPage() {
  createMainWindow();

  loadPage(mainWindow, "paths");
  mainWindow.show();
}

export function openServicePage() {
  createMainWindow();

  loadPage(mainWindow, "service");
  mainWindow.show();
}

export function openSetupPage() {
  createMainWindow();

  loadPage(mainWindow, "start-setup");
  mainWindow.show();
}

export function openDashboardPage() {
  createMainWindow();

  loadPage(mainWindow);
  mainWindow.show();
}

ipcMain.handle("getAppVersion", () => {
  return app.getVersion();
});

ipcMain.handle("getStoreState", () => {
  return structuredClone(store.state);
});

ipcMain.handle("dispatchAction", (event, { action, payload }) => {
  dispatch(actions[action](payload));
});

ipcMain.handle("openFolderDialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"], // Allow selecting folders
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("installAutojoyService", async () => {
  return installSystemService();
});

ipcMain.handle("restartAutojoyService", async () => {
  return restartSystemService();
});

ipcMain.handle("stopAutojoyService", async () => {
  return stopSystemService();
});

ipcMain.handle("openServiceLogs", async () => {
  createLogsWindow();
  const child = openServiceLogs((line) => {
    try {
      logsWindow?.webContents.send("serviceLog", line);
    } catch (e) {
      logFromApp("Error sending web contents to logs window", e.message);
    }
  });
  return !!child;
});

ipcMain.handle(
  "uninstallAutojoyService",
  (event, { removeNode } = { removeNode: false }) => {
    return uninstallSystemService(removeNode);
  },
);

ipcMain.handle("getSystemServiceStatus", () => {
  return getSystemServiceStatus();
});

ipcMain.handle("getPlatform", () => {
  return process.platform;
});

// <a href="https://www.flaticon.com/free-icons/joystick" title="joystick icons">Joystick icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/joystick)>
