import { user } from "../settings.mjs";
import { loaders, savers } from "../file.mjs";
import path from "path";

const configTemplates = loaders.yml("config-templates/rpcs3.yml");
const rpcs3Path = user.paths.rpcs3;
const profileName = "autojoy-autogenerated-profile";
const configFileName = `config/input_configs/global/${profileName}.yml`;
const activeProfileFileName = `config/input_configs/active_input_configurations.yml`;

const getActiveProfileObject = () => ({
  ["Active Configurations"]: {
    global: profileName,
  },
});

// identifier for each slot in the input settings
const playerIdentifiers = [
  "Player 1 Input",
  "Player 2 Input",
  "Player 3 Input",
  "Player 4 Input",
  "Player 5 Input",
  "Player 6 Input",
  "Player 7 Input",
];

// that's how rpcs3 calls the devices when using xinput handler (when using SDL handler, it uses the SDL device names)
const xinputDeviceIdentifiers = [
  "XInput Pad #1",
  "XInput Pad #2",
  "XInput Pad #3",
  "XInput Pad #4",
];

// the input setting "Handler" option
const inputHandlers = {
  xinput: "XInput",
  sdl: "SDL",
};

// the SDL device name for DualSense controller is PS5 Controller, but rpcs3 internally calls it DualSense Wireless Controller
function renamePS5Controllers(arr) {
  return arr.map((item) => {
    const name =
      item.name === "PS5 Controller"
        ? "DualSense Wireless Controller"
        : item.name;
    return { ...item, name };
  });
}

// rpcs3 uses the SDL device names + a number at the end.
// eg.: Xbox Series X Controller 1, DualSense Wireless Controller 1.
// the number is relative to how many of the same controller is connected. it's not a player/position indicator.
function appendNumbersToSDLDeviceNames(arr) {
  const counts = {};
  return arr.map((item) => {
    counts[item.name] = (counts[item.name] || 0) + 1;
    return { ...item, name: `${item.name} ${counts[item.name]}` };
  });
}

// with xinput, it's possible for device 1 to be disconnected and device 2 to be connected. the order is not always reassigned when you disconnect a controller.
// example: [null, null, XINPUT_DEVSUBTYPE_GAMEPAD, null]. It looks like this happen when you mix x360 and one/series controllers.
// so if we have only one controller for instance, it'll be assigned to player 1 in the emulator, but the selected device would be XInput pad #3
function findNextConnectedXinputIdentifier(deviceList, position) {
  let identifiersFound = -1;
  for (let index in deviceList) {
    const device = deviceList[index];
    if (device) {
      identifiersFound++;
      if (position === identifiersFound) {
        return xinputDeviceIdentifiers[index];
      }
    }
  }
}

function handleXinputDeviceListUpdate(deviceList) {
  // trimming the list because with xinput, it's possible for device 1 to be disconnected and device 2 to be connected. right now we don't want to deal with disconnected positions.
  let trimmedList = deviceList.filter((device) => device);
  const newConfig = {};

  playerIdentifiers.forEach((identifier, position) => {
    // setting all positions above player 4 as empty (xinput api only lists 4 devices)
    if (!trimmedList[position]) {
      newConfig[identifier] = configTemplates.Empty;
      return;
    }

    newConfig[identifier] = {
      ...(configTemplates[trimmedList[position].type] ?? configTemplates.Empty),
    };

    // with xinput, it's possible for device 1 to be disconnected and device 2 to be connected. the order is not always reassigned when you disconnect a controller.
    // example: [null, null, XINPUT_DEVSUBTYPE_GAMEPAD, null]. It looks like this happen when you mix x360 and one/series controllers.
    // so if we have only one controller for instance, it'll be assigned to player 1 in the emulator, but the selected device would be XInput pad #3
    newConfig[identifier].Device = findNextConnectedXinputIdentifier(
      deviceList,
      position
    );
    newConfig[identifier].Handler = inputHandlers[user.settings.joystickMode];
    console.log(newConfig[identifier].Device);
  });

  savers.yml(newConfig, path.resolve(rpcs3Path, configFileName));
  savers.yml(
    getActiveProfileObject(),
    path.resolve(rpcs3Path, activeProfileFileName)
  );
}

function handleSDLDeviceListUpdate(deviceList) {
  // updating device names to match what rpcs3 uses
  const fixedList = appendNumbersToSDLDeviceNames(
    renamePS5Controllers(deviceList)
  );

  const newConfig = {};
  playerIdentifiers.forEach((identifier, position) => {
    // setting non-connected positions as empty
    if (!fixedList[position]) {
      newConfig[identifier] = configTemplates.Empty;
      return;
    }

    newConfig[identifier] = {
      ...(configTemplates[fixedList[position].type] ?? configTemplates.Empty),
    };

    newConfig[identifier].Device = fixedList[position].name;
    newConfig[identifier].Handler = inputHandlers[user.settings.joystickMode];
    console.log(newConfig[identifier].Device);
  });

  savers.yml(newConfig, path.resolve(rpcs3Path, configFileName));
  savers.yml(
    getActiveProfileObject(),
    path.resolve(rpcs3Path, activeProfileFileName)
  );
}

const deviceListUpdateHandlers = {
  xinput: handleXinputDeviceListUpdate,
  sdl: handleSDLDeviceListUpdate,
};

const rpcs3 = {
  handleDeviceListUpdate(deviceList) {
    deviceListUpdateHandlers[user.settings.joystickMode](deviceList);
  },
};

export default rpcs3;
