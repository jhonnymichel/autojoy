import { fork, execFile, exec } from "child_process";
import store from "./store.mjs";
import path from "path";
import rootdir from "../common/rootdir.mjs";
import { createLogger, logFromApp } from "../common/logger.mjs";
import { promisify } from "util";
import { userFolderPath } from "../common/settings.mjs";
import { copyDir, ensureDir } from "../common/file.mjs";
import { app } from "electron";

const { dispatch, actions } = store;
const logFromJoystickServer = createLogger("Joystick Server", null);

let appProcess;
let devServiceCleanupDone = false;

export function startServer() {
  // Spawn the child process
  appProcess = fork(
    path.resolve(rootdir, "src/autojoy-backend/index.mjs"),
    [],
    {
      stdio: ["pipe", "pipe", "pipe", "ipc"], // Ensure stdout is piped
    },
  );

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
          `cat ${`${process.env.HOME}/.config/systemd/user/${serviceName}`} | grep dev-app-data`,
        );
        if (processCheck.stdout && processCheck.stdout.length) {
          isDev = true;
        }
      } catch (e) {
        console.log("Error checking service unit file:", e.message);
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
    const targetSrc = path.resolve(userFolderPath, "src");
    const srcBackend = path.resolve(rootdir, "src/autojoy-backend");
    const srcCommon = path.resolve(rootdir, "src/common");

    await ensureDir(targetSrc);
    await copyDir(srcBackend, path.resolve(targetSrc, "autojoy-backend"));
    await copyDir(srcCommon, path.resolve(targetSrc, "common"));

    const installer = path.resolve(
      rootdir,
      "scripts/autojoy-service-install.run",
    );
    let stdout;
    const AUTOJOY_DEV = app.isPackaged ? "0" : "1";

    try {
      // Try running directly (requires executable bit)
      ({ stdout } = await execFileAsync(installer, {
        cwd: rootdir,
        env: { ...process.env, AUTOJOY_DEV },
      }));
    } catch (e) {
      // Fallback: execute via shell to avoid EACCES on non-executable files
      const shell = process.env.SHELL || "/usr/bin/bash";
      ({ stdout } = await execFileAsync(shell, [installer], {
        cwd: rootdir,
        env: { ...process.env, AUTOJOY_DEV },
      }));
    }
    logFromApp("Service created and activated");
    dispatch(actions.serverStarted());
    return { ok: true, message: stdout?.toString() || "Service installed" };
  } catch (error) {
    const message =
      error?.stderr?.toString?.() ||
      error?.message ||
      "Failed to install service";
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
              resolve();
            });
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

    const serviceName = "autojoy-backend.service";
    execFile(
      "systemctl",
      ["--user", "start", serviceName],
      { encoding: "utf8" },
      (err, stdout, stderr) => {
        if (err) {
          const msg =
            stderr?.toString?.() || err.message || "Failed to start service";
          resolve({ ok: false, message: msg });
          return;
        }
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

    const serviceName = "autojoy-backend.service";
    execFile(
      "systemctl",
      ["--user", "restart", serviceName],
      { encoding: "utf8" },
      (err, stdout, stderr) => {
        if (err) {
          const msg =
            stderr?.toString?.() || err.message || "Failed to restart service";
          resolve({ ok: false, message: msg });
          return;
        }
        resolve({
          ok: true,
          message: stdout?.toString?.() || "Service restarted",
        });
      },
    );
  });
}
