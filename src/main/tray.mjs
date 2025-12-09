import { app, Menu, nativeImage, shell, Tray } from "electron";
import path from "path";
import store from "./store.mjs";
import {
  createAboutWindow,
  openDashboardPage,
  openPathsPage,
  openSetupPage,
} from "./window.mjs";
import rootdir from "../common/rootdir.mjs";
import { user, userFolderPath } from "../common/settings.mjs";
import { isMicrophoneInUse } from "../common/device-filters.mjs";

const { actions, dispatch } = store;

export function startTray() {
  const icon = nativeImage.createFromPath(
    path.resolve(rootdir, "assets/tray.png"),
  );
  const tray = new Tray(icon);

  const openApp = () => {
    if (user.settings.setupComplete) {
      openDashboardPage();
    } else {
      openSetupPage();
    }
  };

  tray.on("click", openApp);

  tray.setTitle("Autojoy");
  tray.setToolTip("Autojoy");

  const setTrayMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Autojoy controller service is ${store.state.serverStatus.replace("-", " ")}`,
        type: "normal",
        enabled: false,
      },
      { type: "separator" },
      {
        label: `Open Dashboard`,
        type: "normal",
        click: openApp,
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
            actions.toggleMicrophoneManagement(!store.state.manageMicrophones),
          );
        },
      },
      ...(store.state.microphoneList.length
        ? store.state.microphoneList.map((d, index) => ({
            type: "checkbox",
            checked: isMicrophoneInUse(
              d,
              store.state.microphoneList,
              store.state.unusedMicrophones,
            ),
            click: () => {
              dispatch(actions.toggleMicrophoneUse(d));
            },
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
        type: "checkbox",
        label: "Open at startup",
        checked: store.state.openAtLogin,
        click: () => {
          dispatch(actions.toggleOpenAtLogin(!store.state.openAtLogin));
        },
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

    contextMenu.on("menu-will-show", function beforeMenuOpen(e) {
      // idiotic hack to update Open at startup value before opening tray.
      e.preventDefault();
      contextMenu.items.find(
        (item) => item.label === "Open at startup",
      ).checked = store.state.openAtLogin;
      contextMenu.removeAllListeners("menu-will-show");
      setTimeout(() => {
        tray.popUpContextMenu();
        contextMenu.on("menu-will-show", beforeMenuOpen);
      });
    });
  };

  setTrayMenu();
  store.subscribe(setTrayMenu);
}
