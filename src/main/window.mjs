import path from "path";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
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
import { userFolderPath } from "../common/settings.mjs";

const { dispatch, actions } = store;
let logsWindow = null;
let serviceLogsChild = null;

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
    resizable: true,
    icon: path.resolve(rootdir, "assets/tray.png"),
    show: false, // Don't show the window immediately,
    title: "Autojoy",
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
      // Ensure we stop streaming logs when window closes
      try {
        serviceLogsChild?.kill?.();
      } catch {}
      serviceLogsChild = null;
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

function exposeCommand(name, handler) {
  ipcMain.handle(name, handler);
}

function subscribeToStore() {
  store.subscribe(() => {
    mainWindow?.webContents.send("storeUpdate", structuredClone(store.state));
  });
}

subscribeToStore();

exposeCommand("getAppVersion", () => {
  return app.getVersion();
});

exposeCommand("getStoreState", () => {
  return structuredClone(store.state);
});

exposeCommand("dispatchAction", (event, { action, payload }) => {
  dispatch(actions[action](payload));
});

exposeCommand("openFolderDialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

exposeCommand("installAutojoyService", async () => {
  return installSystemService();
});

exposeCommand("restartAutojoyService", async () => {
  return restartSystemService();
});

exposeCommand("stopAutojoyService", async () => {
  return stopSystemService();
});

exposeCommand("openServiceLogs", async () => {
  createLogsWindow();
  // Avoid spawning multiple journalctl processes
  if (serviceLogsChild) {
    return true;
  }
  serviceLogsChild = openServiceLogs((line) => {
    try {
      logsWindow?.webContents.send("serviceLog", line);
    } catch (e) {
      logFromApp("Error sending web contents to logs window", e.message);
    }
  });
  return !!serviceLogsChild;
});

exposeCommand(
  "uninstallAutojoyService",
  (event, { removeNode } = { removeNode: false }) => {
    return uninstallSystemService(removeNode);
  },
);

exposeCommand("getSystemServiceStatus", () => {
  return getSystemServiceStatus();
});

exposeCommand("getPlatform", () => {
  return process.platform;
});

exposeCommand("openUserFolder", () => {
  shell.openPath(userFolderPath);
});

exposeCommand("openExternalLink", (event, url) => {
  shell.openExternal(url);
});
