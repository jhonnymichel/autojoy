import { fork, execFile, exec } from "child_process";
import fs from "fs";
import store from "./store.mjs";
import path from "path";
import rootdir from "../common/rootdir.mjs";
import { createLogger, logFromApp } from "../common/logger.mjs";
import { promisify } from "util";
import { userFolderPath } from "../common/settings.mjs";
import {
  createDirectory,
  deleteDirectory,
  saveFile,
  copyFile,
  copyDir,
} from "../common/file.mjs";
import { app } from "electron";
import ipc from "node-ipc";

const { dispatch, actions } = store;
const logFromJoystickServer = createLogger("Joystick Server", null);

let appProcess;
let devServiceCleanupDone = false;
let serviceConnectionDone = false;

export function startServer() {
  if (process.platform === "linux") {
    createSystemServiceConnection();
    return;
  }
  // Spawn the child process
  appProcess = fork(path.resolve(rootdir, "src/dist/autojoy-backend.js"), [], {
    stdio: ["pipe", "pipe", "pipe", "ipc"], // Ensure stdout is piped
    env: {
      ...process.env,
      AUTOJOY_BACKEND_MODE: "fork",
      AUTOJOY_ENV: app.isPackaged ? "prod" : "dev",
    },
  });

  // Forward messages from child process to main process
  appProcess.on("message", (message) => {
    dispatch(actions.message(JSON.parse(message)));
  });

  // Handle output from the child process
  appProcess.stdout.on("data", (data) => {
    logFromJoystickServer(data);
  });

  appProcess.stderr.on("data", (data) => {
    logFromJoystickServer(data);
  });

  appProcess.on("exit", (exitCode) => {
    dispatch(actions.serverStopped(exitCode));
    appProcess = null;
    restartServer();
  });

  appProcess.on("spawn", () => {
    dispatch(actions.serverStarted());
  });
}

export function killServer() {
  appProcess.kill();
}

let restartAgainTimeoutId;
let serverRestartPaddingTimeoutId;

export function restartServer(context) {
  if (process.platform === "linux") {
    restartSystemService();
    return;
  }
  clearTimeout(restartAgainTimeoutId);
  clearTimeout(serverRestartPaddingTimeoutId);

  if (appProcess) {
    killServer();
    return;
  }

  // if it's an user issued restart or a restart request issued by the joystick server,
  // this function might have stopped previously at the killServer call above. (unless server was crashed).
  // the process exit event listener will then call restartServer a second time.
  // in the second call, context won't exist, so we rely on store.state.serverStatus, that was defined
  // in the process exit event listener.
  // TODO: this could actually be simplified, context could be a required param.
  const isIntentionalRestart =
    context?.userAction || store.state.serverStatus === "stopped-manually";
  const currentTime = Date.now();
  const lastRestart = store.state.lastRestartAfterCrash;
  if (!isIntentionalRestart && currentTime - lastRestart <= 3000) {
    logFromApp(
      `Server died twice in ${
        currentTime - lastRestart
      }ms. Preventing auto restart. Waiting a minute before trying again.`,
    );

    restartAgainTimeoutId = setTimeout(() => {
      restartServer();
    }, 60000);

    return;
  }

  // after a crash, xinput api needs time to recover, it seems.
  const serverRestartPadding = isIntentionalRestart ? 0 : 3000;
  logFromApp("Restarting server");
  dispatch(
    actions.restartingServer({
      isUserIssuedRestart: isIntentionalRestart,
      serverRestartPadding,
    }),
  );
  serverRestartPaddingTimeoutId = setTimeout(() => {
    startServer();
  }, serverRestartPadding);
}

store.subscribe(() => {
  if (store.state.serverStatus === "pending-user-issued-restart") {
    dispatch(actions.restartingServer({ isUserIssuedRestart: true }));
    restartServer({ userAction: true });
  }

  if (store.state.serverStatus === "pending-issued-restart") {
    dispatch(actions.restartingServer({ isUserIssuedRestart: false }));
    restartServer({ userAction: false });
  }
});

function createSystemServiceConnection() {
  if (serviceConnectionDone) {
    return;
  }

  serviceConnectionDone = true;

  ipc.config.id = "autojoy-app";
  ipc.config.retry = 1500;
  ipc.config.silent = true;
  ipc.connectTo("autojoy-backend", () => {
    const onSystemServiceDisconnect = () => {
      logFromApp("Disconnected from backend IPC server");
      ipc.of["autojoy-backend"].off("disconnect", onSystemServiceDisconnect);
    };

    ipc.of["autojoy-backend"].on("connect", () => {
      logFromApp("Connected to backend IPC server");
      ipc.of["autojoy-backend"].on("disconnect", onSystemServiceDisconnect);
      ipc.of["autojoy-backend"].emit("request-joystick-list", "autojoy-app");
    });

    ipc.of["autojoy-backend"].on("event", (message) => {
      dispatch(actions.message(JSON.parse(message)));
    });
  });
}

/**
 * Queries the systemd user service status for the Autojoy backend.
 * @returns {Promise<{supported: boolean, installed: boolean, active: boolean, details: { platform: NodeJS.Platform, output?: string }}>} Promise resolving service status.
 */
export function getSystemServiceStatus() {
  return new Promise(async (resolve) => {
    const details = { platform: process.platform };
    if (process.platform !== "linux") {
      resolve({ supported: false, installed: false, active: false, details });
      return;
    }

    const serviceName = "autojoy-backend.service";
    let isDev = false;

    if (!devServiceCleanupDone) {
      try {
        const processCheck = await promisify(exec)(
          `cat ${`${process.env.HOME}/.config/systemd/user/${serviceName}`} | grep autojoy-dev`,
        );
        if (processCheck.stdout && processCheck.stdout.length) {
          isDev = true;
        }
      } catch (e) {
        console.log("Error checking service unit file:", e.message);
        isDev = app.isPackaged === false;
      }
    }

    const proceedStatus = () => {
      execFile(
        "systemctl",
        ["--user", "status", serviceName],
        { encoding: "utf8" },
        (err, stdout, stderr) => {
          const output = (stdout || "") + (stderr || "");
          details.output = output;

          const installed = /Loaded:\s+loaded/gi.test(output);
          const active = /Active:\s+active \(running\)/gi.test(output);

          if (!installed) {
            dispatch(actions.serverNotInstalled());
          }

          if (installed && active) {
            dispatch(actions.serverStarted());
          }

          resolve({ supported: true, installed, active, details });
        },
      );
    };

    if (isDev && !devServiceCleanupDone) {
      // In dev mode: stop and disable service, and remove unit file before checking status
      execFile(
        "systemctl",
        ["--user", "stop", serviceName],
        { encoding: "utf8" },
        () => {
          execFile(
            "systemctl",
            ["--user", "disable", serviceName],
            { encoding: "utf8" },
            () => {
              // Attempt to remove unit file; ignore errors
              const unitPath = `${process.env.HOME}/.config/systemd/user/${serviceName}`;
              execFile("rm", ["-f", unitPath], { encoding: "utf8" }, () => {
                devServiceCleanupDone = true;
                proceedStatus();
              });
            },
          );
        },
      );
      return;
    }
    proceedStatus();
  });
}

/**
 * Installs the Autojoy systemd user service.
 * Copies backend/common runtime sources into the user config directory
 * ("~/.config/com.jhonnymichel/autojoy/src") and runs the installer script.
 * Falls back to executing via shell if the `.run` file lacks execute permission.
 * Only supported on Linux.
 * @returns {Promise<{ok: boolean, message: string}>} Result object with success flag and message.
 */
export async function installSystemService() {
  if (process.platform !== "linux") {
    return {
      ok: false,
      message: "Service install is supported on Linux only.",
    };
  }
  const execFileAsync = promisify(execFile);

  try {
    // Copy backend runtime sources to user config folder so the service can run them.
    const targetSrc = path.resolve(userFolderPath, ".src");
    const backendFilePath = path.resolve(
      rootdir,
      "src/dist/autojoy-backend.js",
    );

    createDirectory(targetSrc);
    copyFile(backendFilePath, path.resolve(targetSrc, "autojoy-backend.js"));
    copyDir(
      path.resolve(rootdir, "node_modules/@kmamal/sdl"),
      path.join(targetSrc, "node_modules/@kmamal/sdl"),
    );
    copyDir(
      path.resolve(rootdir, "config-templates"),
      path.join(targetSrc, "config-templates"),
    );
    copyDir(path.resolve(rootdir, "user"), path.join(targetSrc, "user"));

    const installerBasePath = path.resolve(
      rootdir,
      `scripts/autojoy-service-install${app.isPackaged ? "" : "-dev"}.sh`,
    );

    logFromApp("Installer script:", installerBasePath);

    const installerFileContents = fs.readFileSync(installerBasePath, {
      encoding: "utf8",
    });

    logFromApp("Installer script content read.");

    const tmpFolder = path.resolve(userFolderPath, "tmp");
    createDirectory(tmpFolder);

    const installerExecPath = path.join(
      tmpFolder,
      "autojoy-service-install.sh",
    );

    // copying file to tmp with execute permissions, needed because in prod, sh file can´t run from .asar package.
    saveFile(installerFileContents, installerExecPath, { mode: 0o755 });

    logFromApp("Installer script saved to", installerExecPath);

    let stdout, stderr;

    const shell = process.env.SHELL || "/usr/bin/bash";

    try {
      ({ stdout, stderr } = await execFileAsync(shell, [installerExecPath], {
        cwd: tmpFolder,
        env: { ...process.env },
      }));
    } catch (e) {
      logFromApp("Installer execution via shell failed", e.message);
    }

    logFromApp("install stdout:", stdout?.toString());
    logFromApp("install stderr:", stderr?.toString());

    logFromApp("Service created and activated");
    dispatch(actions.serverStarted());
    createSystemServiceConnection();

    try {
      deleteDirectory(tmpFolder);
    } catch (e) {
      logFromApp("Failed to delete tmp folder:", e.message);
    }

    return { ok: true, message: stdout?.toString() || "Service installed" };
  } catch (e) {
    const message =
      e?.stderr?.toString?.() || e?.message || "Failed to install service";
    logFromApp("Failed to install service:", e.message);
    return { ok: false, message };
  }
}

/**
 * Uninstalls the Autojoy systemd user service.
 * Spawns the uninstall script and programmatically responds via stdin whether
 * Node/NVM should be removed.
 * Only supported on Linux.
 * @param {boolean} [removeNode=false] Whether to remove Node/NVM during uninstall.
 * @returns {Promise<{ok: boolean, message: string}>} Result object with success flag and message.
 */
export async function uninstallSystemService(removeNode = false) {
  if (process.platform !== "linux") {
    return {
      ok: false,
      message: "Service uninstall is supported on Linux only.",
    };
  }
  return new Promise((resolve) => {
    const serviceName = "autojoy-backend.service";

    execFile(
      "systemctl",
      ["--user", "stop", serviceName],
      { encoding: "utf8" },
      () => {
        execFile(
          "systemctl",
          ["--user", "disable", serviceName],
          { encoding: "utf8" },
          () => {
            // Attempt to remove unit file; ignore errors
            const unitPath = `${process.env.HOME}/.config/systemd/user/${serviceName}`;
            execFile("rm", ["-f", unitPath], { encoding: "utf8" }, () => {
              dispatch(actions.serverNotInstalled());
              resolve();
            });

            deleteDirectory(path.resolve(userFolderPath, ".src"));
          },
        );
      },
    );
  });
}

/**
 * Starts the Autojoy systemd user service.
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export function startSystemService() {
  return new Promise((resolve) => {
    if (process.platform !== "linux") {
      resolve({ ok: false, message: "Service start supported on Linux only." });
      return;
    }

    dispatch(actions.restartingServer());

    const serviceName = "autojoy-backend.service";
    execFile(
      "systemctl",
      ["--user", "start", serviceName],
      { encoding: "utf8" },
      (err, stdout, stderr) => {
        if (err) {
          const msg =
            stderr?.toString?.() || err.message || "Failed to start service";
          dispatch(actions.serverStopped());
          resolve({ ok: false, message: msg });
          return;
        }
        dispatch(actions.serverStarted());
        resolve({
          ok: true,
          message: stdout?.toString?.() || "Service started",
        });
      },
    );
  });
}

/**
 * Stops the Autojoy systemd user service.
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export function stopSystemService() {
  return new Promise((resolve) => {
    if (process.platform !== "linux") {
      resolve({ ok: false, message: "Service stop supported on Linux only." });
      return;
    }

    const serviceName = "autojoy-backend.service";
    execFile(
      "systemctl",
      ["--user", "stop", serviceName],
      { encoding: "utf8" },
      (err, stdout, stderr) => {
        if (err) {
          const msg =
            stderr?.toString?.() || err.message || "Failed to stop service";
          resolve({ ok: false, message: msg });
          return;
        }
        dispatch(actions.serverStopped());
        resolve({
          ok: true,
          message: stdout?.toString?.() || "Service stopped",
        });
      },
    );
  });
}

/**
 * Restarts the Autojoy systemd user service.
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export function restartSystemService() {
  return new Promise((resolve) => {
    if (process.platform !== "linux") {
      resolve({
        ok: false,
        message: "Service restart supported on Linux only.",
      });
      return;
    }

    dispatch(actions.restartingServer());

    const serviceName = "autojoy-backend.service";
    execFile(
      "systemctl",
      ["--user", "restart", serviceName],
      { encoding: "utf8" },
      (err, stdout, stderr) => {
        if (err) {
          const msg =
            stderr?.toString?.() || err.message || "Failed to restart service";
          dispatch(actions.serverStopped());
          resolve({ ok: false, message: msg });
          return;
        }
        dispatch(actions.serverStarted());
        createSystemServiceConnection();
        resolve({
          ok: true,
          message: stdout?.toString?.() || "Service restarted",
        });
      },
    );
  });
}

export function openServiceLogs(callback) {
  if (process.platform !== "linux") {
    return;
  }

  const serviceName = "autojoy-backend.service";
  // Spawn journalctl -f and stream logs into the app logger
  const child = execFile(
    "journalctl",
    ["--user", "-u", serviceName, "-f", "-n", "100", "--no-pager"],
    { encoding: "utf8" },
    () => {},
  );
  child.stdout?.on("data", (chunk) => {
    const line = chunk.toString();
    try {
      callback?.(line);
    } catch (e) {
      logFromApp("Error in service log callback", e.message);
    }
  });
  child.stderr?.on("data", (chunk) => {
    const line = chunk.toString();
    try {
      callback?.(line);
    } catch (e) {
      logFromApp("Error in service log callback", e.message);
    }
  });
  return child;
}
