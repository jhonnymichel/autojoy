import { fork } from "child_process";
import store from "./store.mjs";
import path from "path";
import rootdir from "../common/rootdir.mjs";
import { createLogger, logFromApp } from "./logger.mjs";

const { dispatch, actions } = store;
const logFromJoystickServer = createLogger("Joystick Server", null);

let appProcess;

export function startServer() {
  // Spawn the child process
  appProcess = fork(
    path.resolve(rootdir, "src/autojoy-backend/index.mjs"),
    [],
    {
      stdio: ["pipe", "pipe", "pipe", "ipc"], // Ensure stdout is piped
    }
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
      }ms. Preventing auto restart. Waiting a minute before trying again.`
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
    })
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
