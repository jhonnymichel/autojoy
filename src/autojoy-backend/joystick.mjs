import {
  hardwareInfo,
  joystickModes,
  joystickTypes,
} from "../common/joystick.mjs";

const xinputSubtypeToGlobalType = {
  XINPUT_DEVSUBTYPE_GUITAR_BASS: joystickTypes.guitar,
  XINPUT_DEVSUBTYPE_GUITAR: joystickTypes.guitar,
  XINPUT_DEVSUBTYPE_GUITAR_ALTERNATE: joystickTypes.guitar,
  // TODO: support guitar hero drum kit.
  XINPUT_DEVSUBTYPE_DRUM_KIT: joystickTypes.rockBandDrumKit,
  XINPUT_DEVSUBTYPE_GAMEPAD: joystickTypes.gamepad,
};

function getXinputJoystickType(device) {
  return xinputSubtypeToGlobalType[device.subType];
}

export function isHardware(
  { manufacturerId, productId } = {},
  hardwareInfoEntry
) {
  return (
    hardwareInfoEntry?.manufacturerId === manufacturerId &&
    hardwareInfoEntry?.productId === productId
  );
}

function getSDLJoystickType(device) {
  const deviceInfo = {
    manufacturerId: device.vendor,
    productId: device.product,
  };

  if (isHardware(deviceInfo, hardwareInfo.guitarHeroGuitarForPS3)) {
    return joystickTypes.ps3GuitarHeroGuitar;
  }

  // TODO: This is misleading. further diferentiation might be needed.
  // right now, this works well for x360 and santroller guitars only.
  if (device.name.includes("Guitar")) return joystickTypes.sdlGuitar;
  if (
    isHardware(deviceInfo, hardwareInfo.harmonixDrumControllerForNintendoWii) ||
    isHardware(deviceInfo, hardwareInfo.harmonixDrumControllerForPS3)
  ) {
    return joystickTypes.wiiRockBandDrumKit;
  }
  // TODO: This is misleading, further diferentiation might be needed.
  // right now, this works well for x360 Rock Band 2 and 3 Drum Kit.
  // TODO: Support PS kits, similar to how we're supporting wii kits.
  if (device.name.includes("Drum")) return joystickTypes.sdlRockBandDrumKit;

  return joystickTypes.gamepad;
}

function createJoystickFromSDLDevice(device) {
  return {
    name: device.name,
    type: getSDLJoystickType(device),
    raw: device,
  };
}

function createJoystickFromXinputDevice(device) {
  return {
    name: device.type,
    type: getXinputJoystickType(device),
    raw: device,
  };
}

export function createJoystick(raw, mode) {
  switch (mode) {
    case joystickModes.xinput:
      return createJoystickFromXinputDevice(raw);
    case joystickModes.sdl:
      return createJoystickFromSDLDevice(raw);
    default:
      console.error("[Joystick Creator] mode not supported:", mode);
      break;
  }
}
