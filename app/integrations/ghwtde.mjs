import { loaders, savers } from "../file.mjs";
import {
  hardwareInfo,
  isHardware,
  joystickModes,
  joystickTypes,
} from "../joystick.mjs";
import { user } from "../settings.mjs";
import { findNextConnectedXinputIdentifier } from "./shared.mjs";
import path from "path";

// PATH TO CONFIG:
// INPUTS
// <User Documents Path>\My Games\Guitar Hero World Tour Definitive Edition\GHWTDEInput.ini"
// Can only bind 3 controllers, keyboard is always controller 1. will be vocals if in launcher settings a mic is selected.
// Input settings are as follows:
// Preferences: { Device1: "deviceGUID", Device2: "", Device3: "" }, [deviceGUID]: {...settings}, [XINPUT_DEVICE_#]: {...settings} }
// In Preferences, maybe turn FillEmptySlots to 0 since we're taking over the settings, to increase compatibility.
// in SDL mode, use convertSDLToGameGUID for IDs.
// in Xinput mode, use the XINPUT_DEVICE_# starts with 0.
// MICROPHONE
// "<User Documents Path>\My Games\Guitar Hero World Tour Definitive Edition\GHWTDE.ini"
// {Audio: MicDevice: ""}

const configTemplates = loaders.ini("config-templates/ghwtde.ini");
const gameSettingsPath = user.paths.ghwtde;
const inputConfigFileName = "GHWTDEInput.ini";
// for microphone support
const mainConfigFileName = "GHWTDE.ini";

const assignedControllersKey = "Preferences";
const controllerKeys = ["Device1", "Device2", "Device3"];
const xinputPlayerIdentifiers = [
  "XINPUT_DEVICE_0",
  "XINPUT_DEVICE_1",
  "XINPUT_DEVICE_2",
  "XINPUT_DEVICE_3",
];

function convertSDLToGameGUID(arr) {
  return arr.map((device) => ({
    ...device,
    ghwtdeGUID:
      device.raw.guid.substring(0, 2) + "000000" + device.raw.guid.substring(8),
  }));
}

function appendNumbersToSDLDeviceIds(arr) {
  const counts = {};
  return arr.map((item) => {
    counts[item.ghwtdeGUID] = (counts[item.ghwtdeGUID] ?? -1) + 1;
    return {
      ...item,
      ghwtdeGUID: `${item.ghwtdeGUID}_${counts[item.ghwtdeGUID]}`,
    };
  });
}

const joystickListUpdateHandlers = {
  [joystickModes.sdl](joystickList) {
    let newConfig;
    try {
      newConfig = loaders.ini(
        path.resolve(gameSettingsPath, inputConfigFileName)
      );
    } catch (e) {
      newConfig = {};
    }

    // updating device IDs to match what the game uses
    const fixedList = appendNumbersToSDLDeviceIds(
      convertSDLToGameGUID(joystickList)
    );

    newConfig[assignedControllersKey] = { FillEmptySlots: 1 };

    // we loop the SDL joystick list instead of the player positions
    // because in SDL mode, we won't assign players directly.
    // we just make sure controllers are setup correctly and enable
    // FillEmptySlots so the game fills the positions.
    // Doing it like this because assigning two sdl devices with the same ID is broken.
    fixedList.forEach((selectedDevice, position) => {
      newConfig[selectedDevice.ghwtdeGUID] = structuredClone(
        configTemplates[selectedDevice.type] ??
          configTemplates[joystickTypes.guitar] // since we don't want to use gamepads here as the vocal is keyboard...
      );

      // we disable regular gamepads to open space for full band (2 guitars + drums).
      // player 1 is always the keyboard and it can't be changed, and when a mic is selected,
      // the keyboard becomes the vocals controller.
      // TODO: this doesn't do anything. but I tried lol
      if (selectedDevice.type === joystickTypes.gamepad) {
        newConfig[selectedDevice.ghwtdeGUID].Enabled = 0;
      }

      newConfig[selectedDevice.ghwtdeGUID].DeviceName = selectedDevice.name;
    });

    savers.ini(newConfig, path.resolve(gameSettingsPath, inputConfigFileName));

    console.log(
      "GHWTDE: Input settings saved at",
      path.resolve(gameSettingsPath, inputConfigFileName)
    );
  },
  [joystickModes.xinput](joystickList) {
    let newConfig;
    try {
      newConfig = loaders.ini(
        path.resolve(gameSettingsPath, inputConfigFileName)
      );
    } catch (e) {
      newConfig = {};
    }

    // because gwtde's player 1 is always the keyboard and the keyboard is set as the singer,
    // we want the other players in a full band to be the instruments.
    const joysticksExcludingGamepads = joystickList.map((j) => {
      if (j && j.type === joystickTypes.gamepad) {
        return null;
      }

      return j;
    });

    // trimming the list because with xinput, it's possible for device 1 to be disconnected and device 2 to be connected.
    // we want to select connected devices.
    const trimmedList = joysticksExcludingGamepads.filter(
      (joystick) => joystick
    );

    newConfig[assignedControllersKey] = { FillEmptySlots: 0 };

    controllerKeys.forEach((currentPlayerIdentifier, position) => {
      const selectedXinputDevice = trimmedList[position];
      if (!selectedXinputDevice) {
        newConfig[assignedControllersKey][currentPlayerIdentifier] = "";
        return;
      }

      const selectedXinputPosition = findNextConnectedXinputIdentifier(
        joysticksExcludingGamepads,
        position
      );

      const xinputDeviceIdentifier =
        xinputPlayerIdentifiers[selectedXinputPosition];

      // in xinput mode, we can't tell apart Guitar Hero from Rock Band Drums, so
      // in the future there might be a feature where users can pick which drums they're using.
      // for now, we default to RBDrums, as xinput DRUM_KIT is mapped as ROCKBAND_DRUM_KIT for compatibility.
      newConfig[assignedControllersKey][currentPlayerIdentifier] =
        xinputDeviceIdentifier;
      newConfig[xinputDeviceIdentifier] =
        configTemplates[selectedXinputDevice.type] ??
        configTemplates[joystickTypes.guitar]; // since we don't want to use gamepads here as the vocal is keyboard...
    });

    savers.ini(newConfig, path.resolve(gameSettingsPath, inputConfigFileName));

    console.log(
      "GHWTDE: Input settings saved at",
      path.resolve(gameSettingsPath, inputConfigFileName)
    );
  },
};

const ghwtde = {
  handleJoystickListUpdate(joystickList) {
    joystickListUpdateHandlers[user.settings.joystickMode](joystickList);
  },
  handleMicrophoneListUpdate(microphoneList) {
    const config = loaders.ini(
      path.resolve(gameSettingsPath, mainConfigFileName)
    );

    // this game only supports one microphone;
    const [firstMicrophone] = microphoneList;

    if (firstMicrophone) {
      config.Audio.MicDevice = firstMicrophone.name;
    } else {
      config.Audio.MicDevice = "";
    }

    savers.ini(config, path.resolve(gameSettingsPath, mainConfigFileName));

    console.log(
      "GHWTDE: Microphone settings saved at",
      path.resolve(gameSettingsPath, mainConfigFileName)
    );
  },
};

export default ghwtde;
