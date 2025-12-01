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
    getType: () => joystickTypes.wiiAndPs3RockBandDrumKit,
  },
  harmonixDrumControllerForPS3: {
    manufacturerId: 4794,
    productId: 528,
    getType: () => joystickTypes.wiiAndPs3RockBandDrumKit,
  },
  guitarHeroGuitarForPS3: {
    manufacturerId: 4794,
    productId: 256,
    getType: () => joystickTypes.ps3GuitarHeroGuitar,
  },
  crkdGuitarPCMode: {
    manufacturerId: 1118,
    productId: 654,
    getType: () => joystickTypes.crkdGuitarPCMode,
    name: "CRKD Guitar (PC Mode)",
  },
  wirelessGuitarHeroGuitarForXbox360: {
    manufacturerId: 1118,
    productId: 673,
    getType: () => joystickTypes.xinputGuitar,
    name: "Wireless Guitar Hero Guitar (Xbox 360)",
  },
  santrollerBoard: {
    manufacturerId: 4617,
    productId: 10370,
    getType: (device) => {

      if (device.name.includes("Drum")) {
        return joystickTypes.xinputRockBandDrumKit;
      }

      return joystickTypes.xinputGuitar
    },
    name: "Wireless Guitar Hero Guitar (Xbox 360)",
  },
};
