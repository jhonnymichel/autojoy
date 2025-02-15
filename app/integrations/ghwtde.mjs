import { joystickModes, joystickTypes } from "../joystick.mjs";
import { user } from "../settings.mjs";
import { findNextConnectedXinputIdentifier } from "./shared.mjs";

function convertSDLToGameGUID(sdlGuid) {
  return sdlGuid.substring(0, 2) + "000000" + sdlGuid.substring(8);
}

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
// The String is capped at 31 characters for some reason.

// MOCKS

const configTemplates = {
  [joystickTypes.guitar]: "GUITAR SELECTED",
  [joystickTypes.rockBandDrumKit]: "RB DRUMS SELECTED",
  [joystickTypes.wiiRockBandDrumKit]: "WII RB DRUMS SELECTED",
};

const assignedControllersKey = "Preferences";
const controllerKeys = ["Device1", "Device2", "Device3"];
const xinputPlayerIdentifiers = [
  "XINPUT_DEVICE_0",
  "XINPUT_DEVICE_1",
  "XINPUT_DEVICE_2",
  "XINPUT_DEVICE_3",
];

const joystickListUpdateHandlers = {
  [joystickModes.sdl](joystickList) {},
  [joystickModes.xinput](joystickList) {
    const newConfig = {};
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

    newConfig[assignedControllersKey] = {};

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

      newConfig[assignedControllersKey][currentPlayerIdentifier] =
        xinputDeviceIdentifier;
      newConfig[xinputDeviceIdentifier] =
        configTemplates[selectedXinputDevice.type];
    });

    console.log("NEW CONFIG IS", newConfig);
  },
};

const ghwtde = {
  handleJoystickListUpdate(joystickList) {
    joystickListUpdateHandlers[user.settings.joystickMode](joystickList);
  },
};

export default ghwtde;
