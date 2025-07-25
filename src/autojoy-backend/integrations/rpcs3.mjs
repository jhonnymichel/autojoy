import path from "path";
import fs from "fs";
import mmjoystick from "./rpcs3/mmjoystick.mjs";
import { loaders, savers } from "../../common/file.mjs";
import { findNextConnectedXinputIdentifier } from "./shared.mjs";
import { user } from "../../common/settings.mjs";

const configTemplates = loaders.yml("config-templates/rpcs3.yml");
const rpcs3Path = user.paths.rpcs3;
const inputProfile = "autojoy-autogenerated-profile";
const inputConfigFileName = `config/input_configs/global/${inputProfile}.yml`;
const activeProfileFileName = `config/input_configs/active_input_configurations.yml`;
// for microphone settings
const generalConfigFileName = `config/config.yml`;
const customConfigsPath = `config/custom_configs`;

const getActiveInputProfileObject = () => ({
  ["Active Configurations"]: {
    global: inputProfile,
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

// Microphone
const microphoneDevicePrefix = `OpenAL Soft on `; // looks like RPCS3 uses OpenAL and it's not something configs can change
const microphoneMode = `Standard`;
const microphoneDeviceSeparator = "@@@";
const configAudioPath = `Audio`;
const configMicrophoneTypeKey = "Microphone Type";
const configMicrophoneDevicesKey = "Microphone Devices";

function renameDLSController(arr) {
  return arr.map((item) => {
    let name = item.name;

    switch (name) {
      case "PS5 Controller":
        name = "DualSense Wireless Controller";
        break;
      case "Controller (Xbox 360 Wireless Receiver for Windows)":
        name = "Xbox 360 Wireless Controller";
        break;
      default:
        break;
    }

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

function handleXinputJoystickListUpdate(joystickList) {
  // trimming the list because with xinput, it's possible for device 1 to be disconnected and device 2 to be connected. right now we don't want to deal with disconnected positions.
  let trimmedList = joystickList.filter((joystick) => joystick);
  const newConfig = {};

  playerIdentifiers.forEach((identifier, position) => {
    // setting all positions above player 4 as empty (xinput api only lists 4 devices)
    if (!trimmedList[position]) {
      newConfig[identifier] = configTemplates.Empty;
      return;
    }

    newConfig[identifier] = structuredClone(
      configTemplates[trimmedList[position].type] ?? configTemplates.Empty
    );

    // with xinput, it's possible for device 1 to be disconnected and device 2 to be connected. the order is not always reassigned when you disconnect a controller.
    // example: [null, null, XINPUT_DEVSUBTYPE_GAMEPAD, null]. It looks like this happen when you mix x360 and one/series controllers.
    // so if we have only one controller for instance, it'll be assigned to player 1 in the emulator, but the selected device would be XInput pad #3
    newConfig[identifier].Device =
      xinputDeviceIdentifiers[
        findNextConnectedXinputIdentifier(joystickList, position)
      ];
    newConfig[identifier].Handler = inputHandlers[user.settings.joystickMode];
  });

  savers.yml(newConfig, path.resolve(rpcs3Path, inputConfigFileName));
  savers.yml(
    getActiveInputProfileObject(),
    path.resolve(rpcs3Path, activeProfileFileName)
  );

  console.log(
    "RPCS3 - Input settings saved at",
    path.resolve(rpcs3Path, inputConfigFileName)
  );
}

function handleSDLJoystickListUpdate(joystickList) {
  // updating device names to match what rpcs3 uses
  const fixedList = appendNumbersToSDLDeviceNames(
    renameDLSController(joystickList)
  );

  const newConfig = {};
  playerIdentifiers.forEach((identifier, position) => {
    const joystick = fixedList[position];

    // setting non-connected positions as empty
    if (!joystick) {
      newConfig[identifier] = configTemplates.Empty;
      return;
    }

    newConfig[identifier] = structuredClone(
      configTemplates[joystick.type] ?? configTemplates.Empty
    );

    try {
      let handler = inputHandlers[user.settings.joystickMode];
      let device = joystick.name;

      if (
        mmjoystick.shouldUseMMJoystick(
          joystick.raw.vendor,
          joystick.raw.product
        )
      ) {
        const mmJoystickDevice = `Joystick #${mmjoystick.getMMJoystickIndex(
          joystick.raw.vendor,
          joystick.raw.product
        )}`;

        device = mmJoystickDevice;
        handler = "MMJoystick";
      }

      newConfig[identifier].Device = device;
      newConfig[identifier].Handler = handler;
    } catch (e) {
      console.error(
        "RPCS3 - Device couldn't be configured properly -",
        joystick.name
      );
      console.error(e);
    }
  });

  savers.yml(newConfig, path.resolve(rpcs3Path, inputConfigFileName));
  console.log(
    "RPCS3 - Input settings saved at",
    path.resolve(rpcs3Path, inputConfigFileName)
  );
  savers.yml(
    getActiveInputProfileObject(),
    path.resolve(rpcs3Path, activeProfileFileName)
  );
  console.log(
    "RPCS3 - Input profile settings saved at",
    path.resolve(rpcs3Path, activeProfileFileName)
  );
}

const joystickListUpdateHandlers = {
  xinput: handleXinputJoystickListUpdate,
  sdl: handleSDLJoystickListUpdate,
};

function handleMicrophoneListUpdate(microphoneList) {
  const currentConfig = loaders.yml(
    path.resolve(rpcs3Path, generalConfigFileName)
  );

  const slots = [
    microphoneList[0],
    microphoneList[1],
    microphoneList[2],
    microphoneList[3],
  ];

  const microphoneDevices = slots
    .map((mic) =>
      mic
        ? `${microphoneDevicePrefix}${mic.name}${microphoneDeviceSeparator}`
        : `${microphoneDeviceSeparator}`
    )
    .join("");

  currentConfig[configAudioPath][configMicrophoneTypeKey] = microphoneMode;
  currentConfig[configAudioPath][configMicrophoneDevicesKey] =
    microphoneDevices;

  savers.yml(currentConfig, path.resolve(rpcs3Path, generalConfigFileName));

  console.log(
    "RPCS3 - Microphone settings saved at",
    path.resolve(rpcs3Path, generalConfigFileName)
  );

  const customConfigs = path.resolve(rpcs3Path, customConfigsPath);
  if (fs.existsSync(customConfigs)) {
    fs.readdirSync(customConfigs).forEach((file) => {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        const customConfigPath = path.join(customConfigs, file);
        const customConfig = loaders.yml(customConfigPath);

        customConfig[configAudioPath][configMicrophoneTypeKey] = microphoneMode;
        customConfig[configAudioPath][configMicrophoneDevicesKey] =
          microphoneDevices;

        savers.yml(customConfig, customConfigPath);

        console.log("RPCS3 - Microphone settings saved at", customConfigPath);
      }
    });
  }
}

const rpcs3 = {
  handleJoystickListUpdate(joystickList) {
    joystickListUpdateHandlers[user.settings.joystickMode](joystickList);
  },
  handleMicrophoneListUpdate,
};

export default rpcs3;
