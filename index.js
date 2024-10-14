import { app, Tray, Menu, nativeImage, BrowserWindow, shell } from "electron";
import { fork } from "child_process";
import { joystickModes } from "./app/constants.mjs";
import { user, userFolderPath } from "./app/settings.mjs";
import { fileURLToPath } from "url";
import path from "path";
import { savers } from "./app/file.mjs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appProcess;
const store = {
  __cbs: [],
  subscribe(cb) {
    store.__cbs.push(cb);
  },
  dispatch(changes) {
    if (!changes) {
      return;
    }

    store.__state = {
      ...store.__state,
      ...changes,
    };

    store.__cbs.forEach((cb) => {
      cb();
    });
  },
  actions: {
    message(msg) {
      const { type, data } = msg;
      switch (type) {
        case "joystickList":
          return {
            joystickList: data.filter((d) => d),
          };
        case "microphoneList":
          return {
            microphoneList: data.filter((d) => d),
          };
        default:
          break;
      }
    },
    stdout(msg) {
      const newLogs = [...store.__state.msg, msg.toString()];

      savers.txt(newLogs.join("\n"), "logs.txt");

      console.log(msg.toString());

      return {
        msg: newLogs,
      };
    },
    restartingServer(context) {
      if (context?.isUserIssuedRestart) {
        return {
          serverStatus: "restarting",
        };
      }

      const lastRestartAfterCrash = Date.now();
      return {
        lastRestartAfterCrash,
        serverStatus: "restarting",
      };
    },
    serverStarted() {
      return {
        serverStatus: "running",
      };
    },
    serverStopped(exitCode) {
      if (exitCode === 1) {
        return {
          serverStatus: "crashed",
        };
      }

      return {
        serverStatus: "killed",
      };
    },
    changeJoystickMode(mode) {
      user.settings = {
        ...user.settings,
        joystickMode: mode,
      };

      restartServer({ userAction: true });

      return {
        joystickMode: user.settings.joystickMode,
      };
    },
    toggleMicrophoneManagement(enabled) {
      user.settings = {
        ...user.settings,
        manageMicrophones: enabled,
      };

      restartServer({ userAction: true });

      return {
        manageMicrophones: enabled,
      };
    },
  },
  __state: {
    serverStatus: "starting", // starting, restarting, running, killed, crashed
    lastRestartAfterCrash: 0,
    joystickMode: user.settings.joystickMode,
    manageMicrophones: user.settings.manageMicrophones ?? false,
    msg: [],
    joystickList: [],
    microphoneList: [],
  },
  get state() {
    return store.__state;
  },
};

const { dispatch, actions } = store;

app.on("ready", () => {
  dispatch(actions.stdout("App started, activating server"));
  startServer();
  startTray();
});

function startServer() {
  // Spawn the child process
  appProcess = fork(path.resolve(__dirname, "app/index.mjs"), [], {
    stdio: ["pipe", "pipe", "pipe", "ipc"], // Ensure stdout is piped
  });

  // Forward messages from child process to main process
  appProcess.on("message", (message) => {
    dispatch(actions.message(JSON.parse(message)));
  });

  // Handle output from the child process
  appProcess.stdout.on("data", (data) => {
    dispatch(actions.stdout(data));
  });

  appProcess.stderr.on("data", (data) => {
    dispatch(actions.stdout(data));
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

function killServer() {
  appProcess.kill();
}

let restartAgainTimeoutId;

function restartServer(context) {
  clearTimeout(restartAgainTimeoutId);

  if (appProcess) {
    killServer();
    return;
  }

  const isUserIssuedRestart =
    context?.userAction || store.state.serverStatus === "killed";

  const currentTime = Date.now();
  const lastRestart = store.state.lastRestartAfterCrash;
  if (!isUserIssuedRestart && currentTime - lastRestart <= 3000) {
    console.error(
      "Server died twice in",
      currentTime - lastRestart,
      "ms. Preventing auto restart. Waiting a minute before trying again."
    );

    restartAgainTimeoutId = setTimeout(() => {
      restartServer();
    }, 60000);

    return;
  }
  console.error("Restarting server");
  dispatch(
    actions.restartingServer({
      isUserIssuedRestart,
    })
  );

  startServer();
}

function startTray() {
  const icon = nativeImage.createFromPath(
    path.resolve(__dirname, "./assets/tray.png")
  );
  const tray = new Tray(icon);

  tray.setTitle("Autojoy");
  tray.setToolTip("Autojoy");

  const setTrayMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Autojoy controller service is ${store.state.serverStatus}`,
        type: "normal",
        enabled: false,
      },
      { type: "separator" },
      {
        label: `Open settings folder`,
        type: "normal",
        click: () => {
          shell.openPath(userFolderPath);
        },
      },
      { type: "separator" },
      {
        label: "Joystick mode",
        type: "submenu",
        submenu: Object.values(joystickModes).map((mode) => ({
          label: mode,
          type: "checkbox",
          checked: store.state.joystickMode === mode,
          click: () => {
            dispatch(actions.changeJoystickMode(mode));
          },
        })),
      },
      ...(store.state.joystickList.length
        ? store.state.joystickList.map((d) => ({
            type: "normal",
            enabled: false,
            label: `${d.name} (${d.type})`,
          }))
        : [
            { type: "normal", enabled: false, label: "No joysticks detected." },
          ]),
      {
        type: "separator",
      },
      {
        label: "Manage Microphones",
        type: "checkbox",
        enabled: true,
        checked: store.state.manageMicrophones === true,
        click: () => {
          dispatch(
            actions.toggleMicrophoneManagement(!store.state.manageMicrophones)
          );
        },
      },
      ...(store.state.microphoneList.length
        ? store.state.microphoneList.map((d) => ({
            type: "normal",
            enabled: false,
            label: `${d.name}`,
          }))
        : [
            {
              type: "normal",
              enabled: false,
              label: "No Microphones detected.",
            },
          ]),
      {
        type: "separator",
      },
      {
        type: "normal",
        label: "About",
        click: () => {
          createAboutWindow();
        },
      },
      {
        type: "normal",
        label: "Exit",
        click: () => {
          app.exit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  };

  setTrayMenu();
  store.subscribe(setTrayMenu);
}

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

let aboutWindow = null;

function createAboutWindow() {
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      width: 300,
      height: 200,
      resizable: true,
      show: false, // Don't show the window immediately
      webPreferences: {
        nodeIntegration: true,
      },
    });

    aboutWindow.loadFile("ui/about.html");

    // Dereference the window object when it's closed
    aboutWindow.on("closed", () => {
      aboutWindow = null;
    });
  }

  // Show the window
  aboutWindow.show();
}

// <a href="https://www.flaticon.com/free-icons/joystick" title="joystick icons">Joystick icons created by Freepik - Flaticon (https://www.flaticon.com/free-icons/joystick)>
