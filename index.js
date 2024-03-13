import { app, Tray, Menu, nativeImage, BrowserWindow } from "electron";
import { fork } from "child_process";
import { joystickModes } from "./app/constants.mjs";
import { user } from "./app/settings.mjs";
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
        case "deviceList":
          return {
            deviceList: data.filter((d) => d),
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
    restartingServer() {
      return {
        serverStatus: "restarting",
      };
    },
    serverStarted() {
      return {
        serverStatus: "running",
      };
    },
    changeJoystickMode(mode) {
      user.settings = {
        joystickMode: mode,
      };

      killServer();

      return {
        joystickMode: user.settings.joystickMode,
      };
    },
  },
  __state: {
    serverStatus: "starting", // starting, restarting, running, killed
    joystickMode: user.settings.joystickMode,
    msg: [],
    deviceList: [],
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

  appProcess.on("exit", () => {
    console.error("Restarting server");
    dispatch(actions.restartingServer());
    startServer();
  });

  appProcess.on("spawn", () => {
    dispatch(actions.serverStarted());
  });
}

function killServer() {
  appProcess.kill();
}

function startTray() {
  const icon = nativeImage.createFromPath(
    path.resolve(__dirname, "./assets/joystick.png")
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
      {
        type: "separator",
      },
      ...(store.state.deviceList.length
        ? store.state.deviceList.map((d) => ({
            type: "normal",
            enabled: false,
            label: `${d.name} (${d.type})`,
          }))
        : [{ type: "normal", enabled: false, label: "No devices detected." }]),
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
