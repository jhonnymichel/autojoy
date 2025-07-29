export const joystickModes = {
  xinput: "xinput",
  sdl: "sdl",
};

export const joystickTypes = {
  guitar: "GUITAR",
  sdlGuitar: "SDL_GUITAR",
  ps3GuitarHeroGuitar: "PS3_GUITARHERO_GUITAR",
  crkdGuitarPCMode: "CRKD_GUITAR_PC_MODE",
  rockBandDrumKit: "ROCKBAND_DRUM_KIT",
  sdlRockBandDrumKit: "SDL_ROCKBAND_DRUM_KIT",
  wiiRockBandDrumKit: "WII_ROCKBAND_DRUM_KIT",
  gamepad: "GAMEPAD",
};

export const hardwareInfo = {
  harmonixDrumControllerForNintendoWii: {
    manufacturerId: 7085,
    productId: 12560,
    type: joystickTypes.wiiRockBandDrumKit,
  },
  harmonixDrumControllerForPS3: {
    manufacturerId: 4794,
    productId: 528,
    type: joystickTypes.wiiRockBandDrumKit,
  },
  guitarHeroGuitarForPS3: {
    manufacturerId: 4794,
    productId: 256,
    type: joystickTypes.ps3GuitarHeroGuitar,
  },
  crkdGuitarPCMode: {
    manufacturerId: 1118,
    productId: 654,
    type: joystickTypes.crkdGuitarPCMode,
    name: "CRKD Guitar (PC Mode)",
  },
};
