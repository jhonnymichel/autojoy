import { hardwareInfo, joystickTypes } from "../common/joystick.mjs";

export function createJoystick(raw) {
  return createJoystickFromSDLDevice(
    raw,
    getHardwareInfo({
      manufacturerId: raw.vendor,
      productId: raw.product,
    })
  );
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

function getSDLJoystickType(device, hardwareInfo) {
  // Device-specific handlers.
  // not all devices need this. a generic joystick type exists further down this function.
  if (hardwareInfo) {
    return hardwareInfo.type;
  }

  // TODO: This is a catch-all generic matcher. further diferentiation might be needed.
  // right now, this works well for x360 and santroller guitars only.
  if (device.name.includes("Guitar")) return joystickTypes.xinputGuitar;
  // TODO: This is catch-all generic matcher. further diferentiation might be needed.
  // right now, this works well for x360 Rock Band 2 and 3 Drum Kit.
  if (device.name.includes("Drum")) return joystickTypes.xinputRockBandDrumKit;

  return joystickTypes.gamepad;
}

function createJoystickFromSDLDevice(device, hardwareInfo) {
  return {
    name: device.name,
    type: getSDLJoystickType(device, hardwareInfo),
    raw: device,
  };
}

export function createJoystickFromXinputDevice(device) {
  return {
    name: device.type,
    type: joystickTypes.gamepad,
    raw: device,
  };
}
