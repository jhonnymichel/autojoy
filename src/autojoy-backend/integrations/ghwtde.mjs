import path from "path";
import { loaders, savers } from "../../common/file.mjs";
import { joystickTypes } from "../../common/joystick.mjs";
import { user } from "../../common/settings.mjs";

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

function handleSDLJoystickListUpdate(joystickList) {
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
        configTemplates[joystickTypes.xinputGuitar] // since we don't want to use gamepads here as the vocal is keyboard...
    );

    // we disable regular gamepads to open space for full band (2 guitars + drums).
    // player 1 is always the keyboard and it can't be changed, and when a mic is selected,
    // the keyboard becomes the vocals controller.
    // FIXME: this doesn't do anything. but I tried lol
    if (selectedDevice.type === joystickTypes.gamepad) {
      newConfig[selectedDevice.ghwtdeGUID].Enabled = 0;
    }

    newConfig[selectedDevice.ghwtdeGUID].DeviceName = selectedDevice.name;
  });

  // deactivating all xinput positions to avoid xinput devices to be enabled twice (one as SDL once as Xinput), causing double inputs
  xinputPlayerIdentifiers.forEach((xinputIdentifier) => {
    // FIXME: The "Enabled" key just doesn't work in the game.
    newConfig[xinputIdentifier] = structuredClone(configTemplates.Empty);
  });

  savers.ini(newConfig, path.resolve(gameSettingsPath, inputConfigFileName));

  console.log(
    "GHWTDE - Input settings saved at",
    path.resolve(gameSettingsPath, inputConfigFileName)
  );
}

const ghwtde = {
  handleJoystickListUpdate(joystickList) {
    handleSDLJoystickListUpdate(joystickList);
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
      "GHWTDE - Microphone settings saved at",
      path.resolve(gameSettingsPath, mainConfigFileName)
    );
  },
};

export default ghwtde;
