import path from "path";
import { deleteFile, loaders, savers } from "../../common/file.mjs";
import {
  findNextConnectedXinputIdentifier,
  getFixedOldDeviceSDLName,
} from "./shared.mjs";
import { user } from "../../common/settings.mjs";
import { createJoystickFromXinputDevice } from "../joystick.mjs";

const configTemplates = loaders.xml("config-templates/cemu.xml").configs;
const cemuPath = path.resolve(user.paths.cemu, "controllerProfiles");
const inputConfigFileNames = [
  "controller0.xml",
  "controller1.xml",
  "controller2.xml",
  "controller3.xml",
];

const xinputApiValue = "XInput";
const sdlApiValue = "SDLController";

const wiiUGamepadType = "Wii U GamePad";
const wiiUProControllerType = "Wii U Pro Controller";

const xinputDisplayNamePrefix = "Controller";

// Ceumu adds a <index>_ before the UUID.
// the number is relative to how many of the same controller is connected. it's not a player/position indicator.
function prependNumbersToSDLDeviceUUID(arr) {
  const counts = {};
  return arr.map((item) => {
    if (counts.hasOwnProperty(item.raw.guid)) {
      counts[item.raw.guid] += 1;
    } else {
      counts[item.raw.guid] = 0;
    }
    return { ...item, uuid: `${counts[item.raw.guid]}_${item.raw.guid}` };
  });
}

function handleXinputJoystickListUpdate(joystickList) {
  let trimmedList = joystickList.filter((joystick) => joystick);

  inputConfigFileNames.forEach((filename, position) => {
    // deleting file if there is no controller to use
    if (!trimmedList[position]) {
      console.log(
        "CEMU - Deleting input Settings for controller",
        position + 1,
        path.resolve(cemuPath, filename),
      );
      deleteFile(path.resolve(cemuPath, filename));
      return;
    }

    const deviceIndex = findNextConnectedXinputIdentifier(
      joystickList,
      position,
    );

    const device = joystickList[deviceIndex];

    const newConfig = configTemplates[device.type] ?? configTemplates.GAMEPAD;

    newConfig.emulated_controller.controller.api = xinputApiValue;
    newConfig.emulated_controller.controller.uuid = deviceIndex;
    newConfig.emulated_controller.controller.display_name = `${xinputDisplayNamePrefix} ${
      deviceIndex + 1
    }`;

    savers.xml(newConfig, path.resolve(cemuPath, filename));
    console.log(
      "CEMU - Input Settings for controller",
      position + 1,
      "saved at",
      path.resolve(cemuPath, filename),
    );
  });
}

async function handleSDLJoystickListUpdate(joystickList) {
  if (process.platform === "linux") {
    const deviceList = prependNumbersToSDLDeviceUUID(joystickList);
    inputConfigFileNames.forEach((filename, position) => {
      if (!deviceList[position]) {
        console.log(
          "CEMU - Deleting input Settings for controller",
          position + 1,
          path.resolve(cemuPath, filename),
        );
        deleteFile(path.resolve(cemuPath, filename));
        return;
      }

      const device = deviceList[position];
      let newConfig;
      if (position === 0) {
        newConfig = configTemplates.WII_U_GAMEPAD;

        newConfig.emulated_controller.controller[1].api = sdlApiValue;
        newConfig.emulated_controller.controller[1].uuid = device.uuid;
        newConfig.emulated_controller.controller[1].display_name =
          getFixedOldDeviceSDLName(device);
      } else {
        newConfig = configTemplates.GAMEPAD;

        newConfig.emulated_controller.controller.api = sdlApiValue;
        newConfig.emulated_controller.controller.uuid = device.uuid;
        newConfig.emulated_controller.controller.display_name =
          getFixedOldDeviceSDLName(device);
      }

      savers.xml(newConfig, path.resolve(cemuPath, filename));
      console.log(
        "CEMU - Input Settings for controller",
        position + 1,
        "saved at",
        path.resolve(cemuPath, filename),
      );
    });
    return;
  }

  // we don't actually support SDL on windows, so we'll just spin up xinput here real quick to support cemu.
  const xinput = await import("xinput-ffi");
  const deviceList = [];

  for (
    let position = 0;
    position < xinput.constants.XUSER_MAX_COUNT;
    position++
  ) {
    try {
      const device = await xinput.getCapabilities(position);
      deviceList.push(createJoystickFromXinputDevice(device));
    } catch (e) {
      // either the device is not connected or the xinput device could not be identified and we report it as not connected
      deviceList.push(null);
    }
  }

  return handleXinputJoystickListUpdate(deviceList);
}

const cemu = {
  handleJoystickListUpdate(joystickList) {
    handleSDLJoystickListUpdate(joystickList);
  },
};

export default cemu;
