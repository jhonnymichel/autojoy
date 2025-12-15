export const joystickTypes = {
  /* TODO: Diferentiate between RB and GH guitars. 
     1. On Dolphin, we always emulate GH guitars.
     2. On RPCS3, we always emulate RB guitars (more consistent whammy and tilt activation).
     But we are currently losing the distortion picker on RB guitars because of this. 
  */
  xinputGuitar: "XINPUT_GUITAR",
  /* Santroller Guitar should be just an xinput guitar, but it has some caveats:
    1. On windows, the whammy bar on RPCS3 does not use the full RS X axis 
    because of a driver optimization Santroller tries to do.
    2. On linux, whammy and tilt are LS axis instead of RS.
    TODO: Differentiate RB from GH guitar.
  */
  santrollerGuitar: "XINPUT_SANTROLLER_GUITAR",
  /* TODO: support PS3 RB and Wii Guitars */
  ps3GuitarHeroGuitar: "PS3_GUITARHERO_GUITAR",
  /* DEPRECATED: we only support mode 8 on PC mode, which maps to XINPUT_GUITAR. */
  crkdGuitarPCMode: "CRKD_GUITAR_PC_MODE",
  /* TODO: support xinput GH Drums */
  xinputRockBandDrumKit: "XINPUT_ROCKBAND_DRUM_KIT",
  wiiAndPs3RockBandDrumKit: "WII_PS3_ROCKBAND_DRUM_KIT",
  gamepad: "GAMEPAD",
};

const xinputSubtypeToGlobalType = {
  XINPUT_DEVSUBTYPE_GUITAR_BASS: joystickTypes.xinputGuitar,
  XINPUT_DEVSUBTYPE_GUITAR: joystickTypes.xinputGuitar,
  XINPUT_DEVSUBTYPE_GUITAR_ALTERNATE: joystickTypes.xinputGuitar,
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
  xbox360WirelessAdapter: {
    manufacturerId: 1118,
    productId: 654,
    getType: () => joystickTypes.gamepad,
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
