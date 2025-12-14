export const joystickTypes = {
  xinputGuitar: "XINPUT_GUITAR",
  santrollerGuitar: "XINPUT_SANTROLLER_GUITAR",
  ps3GuitarHeroGuitar: "PS3_GUITARHERO_GUITAR",
  crkdGuitarPCMode: "CRKD_GUITAR_PC_MODE",
  xinputRockBandDrumKit: "XINPUT_ROCKBAND_DRUM_KIT",
  wiiAndPs3RockBandDrumKit: "WII_PS3_ROCKBAND_DRUM_KIT",
  gamepad: "GAMEPAD",
};

const xinputSubtypeToGlobalType = {
  XINPUT_DEVSUBTYPE_GUITAR_BASS: joystickTypes.xinputGuitar,
  XINPUT_DEVSUBTYPE_GUITAR: joystickTypes.xinputGuitar,
  XINPUT_DEVSUBTYPE_GUITAR_ALTERNATE: joystickTypes.xinputGuitar,
  // TODO: support guitar hero drum kit.
  XINPUT_DEVSUBTYPE_DRUM_KIT: joystickTypes.rockBandDrumKit,
  XINPUT_DEVSUBTYPE_GAMEPAD: joystickTypes.gamepad,
};

const xinputVendorNameToVendorId = {
  "Microsoft Corp.": 1118,
};

const xinputProductNameToProductId = {
  "Xbox One Elite Controller": 767,
};

export function getXinputJoystickType(subtype) {
  return xinputSubtypeToGlobalType[subtype];
}

export function getXinputVendorAndProductIds(vendorName, productName) {
  const vendorId = xinputVendorNameToVendorId[vendorName] ?? vendorName;
  const productId = xinputProductNameToProductId[productName] ?? productName;
  return { vendorId, productId };
}

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
  // crkdGuitarPCMode: {
  //   manufacturerId: 1118,
  //   productId: 654,
  //   getType: () => joystickTypes.crkdGuitarPCMode,
  //   name: "CRKD Guitar (PC Mode)",
  // },
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

      return joystickTypes.santrollerGuitar;
    },
  },
};

export function isHardware(
  { manufacturerId, productId } = {},
  hardwareInfoEntry,
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
      hw.productId === deviceInfo.productId,
  );
}
