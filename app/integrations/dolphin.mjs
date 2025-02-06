import { loaders, savers } from "../file.mjs";
import { user } from "../settings.mjs";
import path from "path";
import {
  findNextConnectedXinputIdentifier,
  fixInvertedSDLInputs,
} from "./shared.mjs";
import { deviceType } from "../constants.mjs";

const configTemplates = {
  gamecube: loaders.ini("config-templates/dolphin-gc.ini"),
  wiimoteEmulated: loaders.ini("config-templates/dolphin-wiimote-emulated.ini"),
  wiimoteReal: loaders.ini("config-templates/dolphin-wiimote-real.ini"),
};

const dolphinPath = path.resolve(user.paths.dolphin, "User/Config");

const gamecubeConstants = {
  inputConfigFilePath: "GCPadNew.ini",
  playerIdentifiers: ["GCPad1", "GCPad2", "GCPad3", "GCPad4"],
  deviceModeFilePath: "Dolphin.ini", // this is to enable or disable gc controllers
  devices: ["SIDevice0", "SIDevice1", "SIDevice2", "SIDevice3"],
  deviceModes: {
    enabled: "6", // this is actually the value for "Emulated Gamecube Controller". TODO: Support other modes
    disabled: "0",
  },
};

const wiiConstants = {
  inputConfigFilePath: "WiimoteNew.ini",
  playerIdentifiers: ["Wiimote1", "Wiimote2", "Wiimote3", "Wiimote4"],
  wiimoteSources: {
    emulated: "1",
    real: "2", // TODO: support real wiimotes
    none: "0",
  },
};

const xinputDeviceIdentifiers = [
  "XInput/0/Gamepad",
  "XInput/1/Gamepad",
  "XInput/2/Gamepad",
  "XInput/3/Gamepad",
];

function getDolphinXinputDeviceName(joystick, position) {
  if (joystick.type === deviceType.gamepad) {
    return xinputDeviceIdentifiers[position];
  }

  if (joystick.type === deviceType.drumKit) {
    return xinputDeviceIdentifiers[position].replace("Gamepad", "Drum Kit");
  }

  return xinputDeviceIdentifiers[position].replace("Gamepad", "Device");
}

// Dolphin uses the format: SDL/count/deviceName
// eg.: SDL/0/Xbox Series X Controller
// the number is relative to how many of the same controller is connected. it's not a player/position indicator.
function prependNumbersToSDLDeviceNames(arr) {
  const counts = {};
  return arr.map((item) => {
    if (counts.hasOwnProperty(item.name)) {
      counts[item.name] += 1;
    } else {
      counts[item.name] = 0;
    }
    return { ...item, name: `SDL/${counts[item.name]}/${item.name}` };
  });
}

function handleXinputJoystickListUpdate(joystickList) {
  // trimming the list because with xinput, it's possible for device 1 to be disconnected and device 2 to be connected.
  let trimmedList = joystickList.filter((joystick) => joystick);

  const newConfig = {};

  wiiConstants.playerIdentifiers.forEach((identifier, position) => {
    const joystick = trimmedList[position];
    // setting disconnected devices
    if (!joystick) {
      newConfig[identifier] = configTemplates.wiimoteEmulated.GAMEPAD;
      newConfig[identifier].Source = wiiConstants.wiimoteSources.none;
      return;
    }

    newConfig[identifier] = structuredClone(
      configTemplates.wiimoteEmulated[joystick.type] ??
        configTemplates.wiimoteEmulated.GAMEPAD
    );

    newConfig[identifier].Device = getDolphinXinputDeviceName(
      joystick,
      findNextConnectedXinputIdentifier(joystickList, position)
    );

    newConfig[identifier].Source = wiiConstants.wiimoteSources.emulated;
  });

  savers.ini(
    newConfig,
    path.resolve(dolphinPath, wiiConstants.inputConfigFilePath)
  );

  console.log(
    "DOLPHIN: Wii Input settings saved at",
    path.resolve(dolphinPath, wiiConstants.inputConfigFilePath)
  );

  const newGCConfig = {};
  const newMainConfig = loaders.ini(
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath)
  );

  if (!newMainConfig.Core) {
    newMainConfig.Core = {};
  }

  gamecubeConstants.playerIdentifiers.forEach((identifier, position) => {
    // setting disconnected devices
    const joystick = trimmedList[position];

    if (!joystick) {
      newGCConfig[identifier] = configTemplates.gamecube.GAMEPAD;
      newMainConfig.Core[gamecubeConstants.devices[position]] =
        gamecubeConstants.deviceModes.disabled;
      return;
    }

    newGCConfig[identifier] = {
      ...(configTemplates.gamecube[joystick.type] ??
        configTemplates.gamecube.GAMEPAD),
    };

    newGCConfig[identifier].Device =
      xinputDeviceIdentifiers[
        findNextConnectedXinputIdentifier(joystickList, position)
      ];

    newMainConfig.Core[gamecubeConstants.devices[position]] =
      gamecubeConstants.deviceModes.enabled;
  });

  savers.ini(
    newGCConfig,
    path.resolve(dolphinPath, gamecubeConstants.inputConfigFilePath)
  );

  console.log(
    "DOLPHIN: GC Input settings saved at",
    path.resolve(dolphinPath, gamecubeConstants.inputConfigFilePath)
  );

  savers.ini(
    newMainConfig,
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath)
  );

  console.log(
    "DOLPHIN: Main settings saved at",
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath)
  );
}

function handleSDLJoystickListUpdate(joystickList) {
  const renamedList = prependNumbersToSDLDeviceNames(joystickList);
  const newConfig = {};

  wiiConstants.playerIdentifiers.forEach((identifier, position) => {
    const joystick = renamedList[position];

    // setting disconnected devices
    if (!joystick) {
      newConfig[identifier] = configTemplates.wiimoteEmulated.GAMEPAD;
      newConfig[identifier].Source = wiiConstants.wiimoteSources.none;
      return;
    }

    newConfig[identifier] = structuredClone(
      configTemplates.wiimoteEmulated[joystick.type] ??
        configTemplates.wiimoteEmulated.GAMEPAD
    );

    newConfig[identifier].Device = joystick.name;
    newConfig[identifier].Source = wiiConstants.wiimoteSources.emulated;

    fixInvertedSDLInputs(joystick, newConfig[identifier], {
      left: {
        get left() {
          return "Left X-";
        },
        get right() {
          return "Left X+";
        },
        get up() {
          return "Left Y+";
        },
        get down() {
          return "Left Y-";
        },
        get deadzone() {
          return null;
        },
        set deadzone(value) {},
      },
      right: {
        get left() {
          return "Right X-";
        },
        get right() {
          return "Right X+";
        },
        get up() {
          return "Right Y+";
        },
        get down() {
          return "Right Y-";
        },
        get deadzone() {
          return null;
        },
        set deadzone(value) {},
      },
    });
  });

  savers.ini(
    newConfig,
    path.resolve(dolphinPath, wiiConstants.inputConfigFilePath)
  );

  console.log(
    "DOLPHIN: Wii Input settings saved at",
    path.resolve(dolphinPath, wiiConstants.inputConfigFilePath)
  );

  const newGCConfig = {};
  const newMainConfig = loaders.ini(
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath)
  );

  gamecubeConstants.playerIdentifiers.forEach((identifier, position) => {
    // setting disconnected devices
    if (!renamedList[position]) {
      newGCConfig[identifier] = configTemplates.gamecube.GAMEPAD;
      newMainConfig.Core[gamecubeConstants.devices[position]] =
        gamecubeConstants.deviceModes.disabled;
      return;
    }

    newGCConfig[identifier] = {
      ...(configTemplates.gamecube[renamedList[position].type] ??
        configTemplates.gamecube.GAMEPAD),
    };

    newGCConfig[identifier].Device = renamedList[position].name;

    newMainConfig.Core[gamecubeConstants.devices[position]] =
      gamecubeConstants.deviceModes.enabled;
  });

  savers.ini(
    newGCConfig,
    path.resolve(dolphinPath, gamecubeConstants.inputConfigFilePath)
  );

  console.log(
    "DOLPHIN: GC Input settings saved at",
    path.resolve(dolphinPath, gamecubeConstants.inputConfigFilePath)
  );

  savers.ini(
    newMainConfig,
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath)
  );

  console.log(
    "DOLPHIN: Main settings saved at",
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath)
  );
}

const joystickListUpdateHandlers = {
  xinput: handleXinputJoystickListUpdate,
  sdl: handleSDLJoystickListUpdate,
};

const dolphin = {
  handleJoystickListUpdate(joystickList) {
    joystickListUpdateHandlers[user.settings.joystickMode](joystickList);
  },
};

export default dolphin;
