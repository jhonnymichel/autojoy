import path from "path";
import fs from "fs";
import { loaders, savers } from "../../common/file.mjs";
import { user } from "../../common/settings.mjs";
import {
  getXinputJoystickType,
  getXinputVendorAndProductIds,
  hardwareInfo,
  isHardware,
  joystickTypes,
} from "../../common/joystick.mjs";
import { createJoystickFromXinputDevice } from "../joystick.mjs";

const configTemplates = {
  gamecube: loaders.ini("config-templates/dolphin-gc.ini"),
  wiimoteEmulated: loaders.ini("config-templates/dolphin-wiimote-emulated.ini"),
  wiimoteReal: loaders.ini("config-templates/dolphin-wiimote-real.ini"),
};

const dolphinPath = resolveDolphinPath();

const gamecubeConstants = {
  inputConfigFilePath: "GCPadNew.ini",
  playerIdentifiers: ["GCPad1", "GCPad2", "GCPad3", "GCPad4"],
  deviceModeFilePath: "Dolphin.ini", // this is to enable or disable gc controllers
  devices: ["SIDevice0", "SIDevice1", "SIDevice2", "SIDevice3"],
  deviceModes: {
    enabled: "6", // this is actually the value for "Emulated Gamecube Controller". TODO: Support other modes
    disabled: "0",
  },
};

const wiiConstants = {
  inputConfigFilePath: "WiimoteNew.ini",
  playerIdentifiers: ["Wiimote1", "Wiimote2", "Wiimote3", "Wiimote4"],
  wiimoteSources: {
    emulated: "1",
    real: "2", // TODO: support real wiimotes
    none: "0",
  },
};

function resolveDolphinPath() {
  const dolphinPortablePath = path.resolve(user.paths.dolphin, "User/Config");
  if (fs.existsSync(dolphinPortablePath)) {
    return dolphinPortablePath;
  }

  const dolphinFlatpackPath = path.resolve(
    user.paths.dolphin,
    "config/dolphin-emu",
  );
  if (fs.existsSync(dolphinFlatpackPath)) {
    return dolphinFlatpackPath;
  }

  // TODO: Dolphin installed via regular installer on Windows, folder is on My Documents. check structure and add case.
  return path.resolve(user.paths.dolphin);
}

// SDL3 on windows now uses xinput when possible, and dolphin name resolution is not reliable.
// some xinput devices will be "SDL/<number>/XInput Controller #1", others will be "SDL/<number>/<original name>".
// we will have to fallback to using xinput api directly on dolphin.
async function addXinputNameToDevices(arr) {
  if (process.platform !== "win32") {
    return arr;
  }

  const xinput = await import("xinput-ffi");

  const xinputDevices = [];

  for (
    let position = 0;
    position < xinput.constants.XUSER_MAX_COUNT;
    position++
  ) {
    try {
      const device = await xinput.getCapabilitiesEx(position);
      xinputDevices.push(createJoystickFromXinputDevice(device));
    } catch {
      // either the device is not connected or the xinput device could not be identified and we report it as not connected
      xinputDevices.push(null);
    }
  }

  const assignedXinputIndexes = [];

  return arr.map((item) => {
    const deviceType = item.type;
    const vendorId = item.raw.vendor;
    const productId = item.raw.product;
    const equivalentXinputDeviceIndex = xinputDevices.findIndex(
      (xinputDevice, index) => {
        if (!xinputDevice) {
          return false;
        }

        const xinputDeviceType = getXinputJoystickType(
          xinputDevice.raw.capabilities.dubType,
        );

        const { vendorId: xinputVendorId, productId: xinputProductId } =
          getXinputVendorAndProductIds(
            xinputDevice.raw.vendorId,
            xinputDevice.raw.productId,
          );

        const hasFullMatch =
          xinputDeviceType === deviceType &&
          xinputVendorId === vendorId &&
          xinputProductId === productId;

        const hasVendorAndProduct =
          xinputVendorId === vendorId && xinputProductId === productId;
        const hasVendorAndType =
          xinputDeviceType === deviceType && xinputVendorId === vendorId;

        const hasMatch =
          (hasFullMatch || hasVendorAndProduct || hasVendorAndType) &&
          !assignedXinputIndexes.includes(index);

        if (hasMatch) {
          assignedXinputIndexes.push(index);
        }

        return hasMatch;
      },
    );
    const isXinput = equivalentXinputDeviceIndex > -1;

    if (isXinput) {
      return {
        ...item,
        name: `XInput/${equivalentXinputDeviceIndex}/${getTypeToXinputIdentifier(deviceType)}`,
      };
    }
    return item;
  });
}

function getTypeToXinputIdentifier(type) {
  switch (type) {
    case joystickTypes.crkdGuitarPCMode:
    case joystickTypes.xinputGuitar:
      return "Device";
    case joystickTypes.xinputRockBandDrumKit:
      return "Drum Kit";
    default:
      return "Gamepad";
  }
}

function renameSDLControllers(arr) {
  return arr.map((item) => {
    let name = item.name;

    if (process.platform === "linux") {
      if (
        isHardware(
          {
            manufacturerId: item.raw.vendor,
            productId: item.raw.product,
          },
          hardwareInfo.xbox360Controller,
        )
      ) {
        name = "Atari Xbox 360 Game Controller";
      }

      if (name === "Xbox 360 Wireless Controller") {
        name = "X360 Wireless Controller";
      }
    }

    if (
      item.hidInfo?.manufacturer.includes(
        "Licensed by Sony Computer Entertainment",
      ) ||
      item.hidInfo?.manufacturer.includes("Licensed by Nintendo of America")
    ) {
      name = `${item.hidInfo.manufacturer.trim()} ${item.hidInfo.product.trim()}`;
    }

    return { ...item, name };
  });
}

// Dolphin uses the format: SDL/count/deviceName
// eg.: SDL/0/Xbox Series X Controller
// the number is relative to how many of the same controller is connected. it's not a player/position indicator.
function prependNumbersToSDLDeviceNames(arr) {
  const counts = {};
  return arr.map((item) => {
    if (counts.hasOwnProperty(item.name)) {
      counts[item.name] += 1;
    } else {
      counts[item.name] = 0;
    }
    return { ...item, name: `SDL/${counts[item.name]}/${item.name}` };
  });
}

async function handleSDLJoystickListUpdate(joystickList) {
  const renamedList = await addXinputNameToDevices(
    prependNumbersToSDLDeviceNames(renameSDLControllers(joystickList)),
  );

  const newConfig = {};

  wiiConstants.playerIdentifiers.forEach((identifier, position) => {
    const joystick = renamedList[position];

    // setting disconnected devices
    if (!joystick) {
      newConfig[identifier] = configTemplates.wiimoteEmulated.GAMEPAD;
      newConfig[identifier].Source = wiiConstants.wiimoteSources.none;
      return;
    }

    newConfig[identifier] = structuredClone(
      configTemplates.wiimoteEmulated[joystick.type] ??
        configTemplates.wiimoteEmulated.GAMEPAD,
    );

    newConfig[identifier].Device = joystick.name;
    newConfig[identifier].Source = wiiConstants.wiimoteSources.emulated;
  });

  savers.ini(
    newConfig,
    path.resolve(dolphinPath, wiiConstants.inputConfigFilePath),
  );

  console.log(
    "DOLPHIN - Wii Input settings saved at",
    path.resolve(dolphinPath, wiiConstants.inputConfigFilePath),
  );

  const newGCConfig = {};
  const newMainConfig = loaders.ini(
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath),
  );

  gamecubeConstants.playerIdentifiers.forEach((identifier, position) => {
    // setting disconnected devices
    if (!renamedList[position]) {
      newGCConfig[identifier] = configTemplates.gamecube.GAMEPAD;
      newMainConfig.Core[gamecubeConstants.devices[position]] =
        gamecubeConstants.deviceModes.disabled;
      return;
    }

    newGCConfig[identifier] = {
      ...(configTemplates.gamecube[renamedList[position].type] ??
        configTemplates.gamecube.GAMEPAD),
    };

    newGCConfig[identifier].Device = renamedList[position].name;

    newMainConfig.Core[gamecubeConstants.devices[position]] =
      gamecubeConstants.deviceModes.enabled;
  });

  savers.ini(
    newGCConfig,
    path.resolve(dolphinPath, gamecubeConstants.inputConfigFilePath),
  );

  console.log(
    "DOLPHIN - GC Input settings saved at",
    path.resolve(dolphinPath, gamecubeConstants.inputConfigFilePath),
  );

  savers.ini(
    newMainConfig,
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath),
  );

  console.log(
    "DOLPHIN - Main settings saved at",
    path.resolve(dolphinPath, gamecubeConstants.deviceModeFilePath),
  );
}

const dolphin = {
  handleJoystickListUpdate(joystickList) {
    handleSDLJoystickListUpdate(joystickList);
  },
};

export default dolphin;
