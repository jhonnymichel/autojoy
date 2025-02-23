import { user } from "../common/settings.mjs";
import { savers } from "../common/file.mjs";

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
        case "issueRestart":
          return { serverStatus: "pending-issued-restart" };
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
    changeJoystickMode(mode) {
      user.settings = {
        ...user.settings,
        joystickMode: mode,
      };

      return {
        joystickMode: user.settings.joystickMode,
        serverStatus: "pending-user-issued-restart",
      };
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
        (d) => d.name === device.name
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
          entry.position === unusedListEntry.position
      )
        ? unusedList.filter(
            (entry) =>
              entry.name !== unusedListEntry.name ||
              entry.position !== unusedListEntry.position
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
        (value) => typeof value === "string"
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
  },
  __state: {
    serverStatus: "starting", // starting, restarting, running, stopped-manually, crashed, pending-user-issued-restart, pending-issued-restart
    lastRestartAfterCrash: 0,
    joystickMode: user.settings.joystickMode,
    manageMicrophones: user.settings.manageMicrophones ?? false,
    msg: [],
    joystickList: [],
    microphoneList: [],
    unusedMicrophones: user.settings.unusedMicrophones ?? [],
    paths: user.paths,
  },
  get state() {
    return store.__state;
  },
};

export default store;
