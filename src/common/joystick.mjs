export const joystickTypes = {
  xinputGuitar: "XINPUT_GUITAR",
  ps3GuitarHeroGuitar: "PS3_GUITARHERO_GUITAR",
  crkdGuitarPCMode: "CRKD_GUITAR_PC_MODE",
  xinputRockBandDrumKit: "XINPUT_ROCKBAND_DRUM_KIT",
  wiiAndPs3RockBandDrumKit: "WII_PS3_ROCKBAND_DRUM_KIT",
  gamepad: "GAMEPAD",
};

export const hardwareInfo = {
  harmonixDrumControllerForNintendoWii: {
    manufacturerId: 7085,
    productId: 12560,
    type: joystickTypes.wiiAndPs3RockBandDrumKit,
  },
  harmonixDrumControllerForPS3: {
    manufacturerId: 4794,
    productId: 528,
    type: joystickTypes.wiiAndPs3RockBandDrumKit,
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
