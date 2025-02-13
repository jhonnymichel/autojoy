export const joystickModes = {
  xinput: "xinput",
  sdl: "sdl",
};

export const joystickTypes = {
  guitar: "GUITAR",
  sdlGuitar: "SDL_GUITAR",
  rockBandDrumKit: "ROCKBAND_DRUM_KIT",
  wiiRockBandDrumKit: "WII_ROCKBAND_DRUM_KIT",
  gamepad: "GAMEPAD",
};

export const hardwareInfo = {
  harmonixDrumControllerForNintendoWii: {
    manufacturerId: 7085,
    productId: 12560,
  },
  harmonixDrumControllerForPS3: {
    manufacturerId: 4794,
    productId: 528,
  },
};

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
  // TODO: This is misleading. further diferentiation might be needed.
  // right now, this works well for x360 and santroller guitars only.
  if (device.name.includes("Guitar")) return joystickTypes.sdlGuitar;
  if (
    isHardware(
      device.vendor,
      device.product,
      hardwareInfo.harmonixDrumControllerForNintendoWii
    ) ||
    isHardware(
      device.vendor,
      device.product,
      hardwareInfo.harmonixDrumControllerForPS3
    )
  ) {
    return joystickTypes.wiiRockBandDrumKit;
  }
  // TODO: This is misleading, further diferentiation might be needed.
  // right now, this works well for x360 Rock Band 2 and 3 Drum Kit.
  // TODO: Support PS kits, similar to how we're supporting wii kits.
  if (device.name.includes("Drum")) return joystickTypes.rockBandDrumKit;

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
