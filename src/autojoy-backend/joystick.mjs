import {
  hardwareInfo,
  joystickModes,
  joystickTypes,
} from "../common/joystick.mjs";

export function createJoystick(raw, mode) {
  switch (mode) {
    case joystickModes.xinput:
      return createJoystickFromXinputDevice(raw);
    case joystickModes.sdl:
      return createJoystickFromSDLDevice(
        raw,
        getHardwareInfo({
          manufacturerId: raw.vendor,
          productId: raw.product,
        })
      );
    default:
      console.error("[Joystick Creator] mode not supported:", mode);
      break;
  }
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

export function getHardwareInfo(deviceInfo) {
  return Object.values(hardwareInfo).find(
    (hw) =>
      hw.manufacturerId === deviceInfo.manufacturerId &&
      hw.productId === deviceInfo.productId
  );
}

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

function getSDLJoystickType(device, hardwareInfo) {
  // Device-specific handlers.
  // not all devices need this. a generic joystick type exists further down this function.
  if (hardwareInfo) {
    return hardwareInfo.type;
  }

  // TODO: This is a catch-all generic matcher. further diferentiation might be needed.
  // right now, this works well for x360 and santroller guitars only.
  if (device.name.includes("Guitar")) return joystickTypes.sdlGuitar;
  // TODO: This is catch-all generic matcher. further diferentiation might be needed.
  // right now, this works well for x360 Rock Band 2 and 3 Drum Kit.
  if (device.name.includes("Drum")) return joystickTypes.sdlRockBandDrumKit;

  return joystickTypes.gamepad;
}

function createJoystickFromSDLDevice(device, hardwareInfo) {
  return {
    name: hardwareInfo?.name ?? device.name,
    type: getSDLJoystickType(device, hardwareInfo),
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
