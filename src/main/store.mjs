import { user } from "../common/settings.mjs";
import { getSystemSettings, updateSystemSettings } from "./system.mjs";

const store = {
  __cbs: [],
  subscribe(cb) {
    store.__cbs.push(cb);
  },
  dispatch(changes) {
    if (changes) {
      Object.defineProperties(
        store.__state,
        Object.getOwnPropertyDescriptors(changes),
      );
    }

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
        case "issueRestart":
          return { serverStatus: "pending-issued-restart" };
        default:
          break;
      }
    },
    restartingServer(context) {
      if (context?.isUserIssuedRestart) {
        return {
          serverStatus: "restarting",
        };
      }

      const lastRestartAfterCrash =
        Date.now() + (context?.serverRestartPadding ?? 0);
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
        serverStatus: "stopped-manually",
      };
    },
    serverNotInstalled() {
      return {
        serverStatus: "pending-install",
      };
    },
    toggleOpenAtLogin(openAtLogin = false) {
      updateSystemSettings({
        openAtLogin,
      });
    },
    toggleMicrophoneManagement(enabled) {
      user.settings = {
        ...user.settings,
        manageMicrophones: enabled,
      };

      return {
        manageMicrophones: enabled,
        serverStatus: "pending-user-issued-restart",
      };
    },
    toggleMicrophoneUse(device) {
      const unusedList = store.state.unusedMicrophones;

      const microphoneList = store.state.microphoneList;
      const connectedMicsWithCurrentDeviceName = microphoneList.filter(
        (d) => d.name === device.name,
      );
      const positionOfCurrentDevice =
        connectedMicsWithCurrentDeviceName.indexOf(device);

      const unusedListEntry = {
        name: device.name,
        position: positionOfCurrentDevice,
      };

      const newUnusedList = unusedList.find(
        (entry) =>
          entry.name === unusedListEntry.name &&
          entry.position === unusedListEntry.position,
      )
        ? unusedList.filter(
            (entry) =>
              entry.name !== unusedListEntry.name ||
              entry.position !== unusedListEntry.position,
          )
        : [...unusedList, unusedListEntry];

      user.settings = {
        ...user.settings,
        unusedMicrophones: newUnusedList,
      };

      return {
        unusedMicrophones: newUnusedList,
        serverStatus: "pending-user-issued-restart",
      };
    },
    setPaths(paths) {
      const validPaths = Object.values(paths).every(
        (value) => typeof value === "string",
      );
      if (validPaths) {
        user.paths = paths;
      }

      return {
        paths: user.paths,
        serverStatus: validPaths
          ? "pending-user-issued-restart"
          : store.state.serverStatus,
      };
    },
    completeSetup() {
      user.settings = {
        ...user.settings,
        setupComplete: true,
      };

      return {
        serverStatus: "pending-user-issued-restart",
        setupComplete: true,
      };
    },
    resetSetup() {
      user.settings = {
        ...user.settings,
        setupComplete: false,
      };

      return {
        setupComplete: false,
      };
    },
  },
  __state: {
    serverStatus: "starting", // pending-install, starting, restarting, running, stopped-manually, crashed, pending-user-issued-restart, pending-issued-restart
    get openAtLogin() {
      const settings = getSystemSettings();

      return settings.executableWillLaunchAtLogin && settings.openAtLogin;
    },
    lastRestartAfterCrash: 0,
    manageMicrophones: user.settings.manageMicrophones ?? false,
    joystickList: [],
    microphoneList: [],
    unusedMicrophones: user.settings.unusedMicrophones ?? [],
    paths: user.paths,
    setupComplete: user.settings.setupComplete ?? false,
  },
  get state() {
    return store.__state;
  },
};

export default store;
