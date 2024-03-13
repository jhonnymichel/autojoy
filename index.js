import { app, Tray, Menu, nativeImage, BrowserWindow } from "electron";
import { fork } from "child_process";
import { joystickModes } from "./app/constants.mjs";
import { user } from "./app/settings.mjs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appProcess;
const store = {
  __cbs: [],
  subscribe(cb) {
    store.__cbs.push(cb);
  },
  dispatch(changes) {
    store.__state = {
      ...store.__state,
      ...changes,
    };

    store.__cbs.forEach((cb) => {
      cb();
    });
  },
  actions: {
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
  },
  get state() {
    return store.__state;
  },
};

const { dispatch, actions } = store;

app.on("ready", () => {
  console.log("App started, activating server");
  startServer();
  startTray();
});

function startServer() {
  // Spawn the child process
  appProcess = fork("app/index.mjs");

  // Forward messages from child process to main process
  appProcess.on("message", (message) => {
    console.log("Message from app.js:", message);
  });

  // Handle errors in the child process
  appProcess.on("exit", () => {
    if (store.state.serverStatus === "killed") {
      return;
    }
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
        type: "normal",
        label: "About",
        click: () => {
          createAboutWindow();
        },
      },
      {
        type: "separator",
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
