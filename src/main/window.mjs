import path from "path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import store from "./store.mjs";
import rootdir from "../common/rootdir.mjs";
import { user } from "../common/settings.mjs";

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
  if (process.platform !== "linux") {
    return { ok: false, message: "Service install is supported on Linux only." };
  }
  const execFileAsync = promisify(execFile);
  try {
    const installer = path.resolve(rootdir, "scripts/autojoy-service-install.run");
    const { stdout } = await execFileAsync(installer, { cwd: rootdir });
    dispatch(actions.serverStarted());
    return { ok: true, message: stdout?.toString() || "Service installed" };
  } catch (error) {
    const message = error?.stderr?.toString?.() || error?.message || "Failed to install service";
    return { ok: false, message };
  }
});


ipcMain.handle("uninstallAutojoyService", (event, { removeNode } = { removeNode: false }) => {
  if (process.platform !== "linux") {
    return { ok: false, message: "Service uninstall is supported on Linux only." };
  }
  return new Promise((resolve) => {
    const scriptPath = path.resolve(rootdir, "scripts/autojoy-service-uninstall.sh");
    const child = spawn(scriptPath, { cwd: rootdir, stdio: ["pipe", "pipe", "pipe"] });

    // Pipe decision programmatically: 'y' to remove Node/NVM, otherwise 'n'
    const response = removeNode === true ? "y\n" : "n\n";
    try {
      child.stdin.write(response);
      child.stdin.end();
    } catch (e) {
      console.error("Failed to write to uninstall script stdin:", e.message);
    }

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", (error) => {
      resolve({ ok: false, message: error.message });
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ ok: true, message: stdout || "Service uninstalled" });
      } else {
        resolve({ ok: false, message: stderr || `Uninstall exited with code ${code}` });
      }
    });
  });
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
