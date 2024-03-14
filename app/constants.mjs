export const deviceType = {
  guitar: "GUITAR",
  drumKit: "DRUM_KIT",
  gamepad: "GAMEPAD",
};

export const xinputSubtypeToGlobalType = {
  XINPUT_DEVSUBTYPE_GUITAR_BASS: deviceType.guitar,
  XINPUT_DEVSUBTYPE_GUITAR: deviceType.guitar,
  XINPUT_DEVSUBTYPE_GUITAR_ALTERNATE: deviceType.guitar,
  XINPUT_DEVSUBTYPE_DRUM_KIT: deviceType.drumKit,
  XINPUT_DEVSUBTYPE_GAMEPAD: deviceType.gamepad,
};

export const joystickModes = {
  xinput: "xinput",
  sdl: "sdl",
};
