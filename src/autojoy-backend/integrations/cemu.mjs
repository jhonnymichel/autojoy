import path from "path";
import { deleteFile, loaders, savers } from "../../common/file.mjs";
import { joystickModes } from "../../common/joystick.mjs";
import { findNextConnectedXinputIdentifier } from "./shared.mjs";
import { user } from "../../common/settings.mjs";
import { createJoystick } from "../joystick.mjs";

const configTemplates = loaders.xml("config-templates/cemu.xml");
const cemuPath = path.resolve(user.paths.cemu, "controllerProfiles");
const inputConfigFileNames = [
  "controller0.xml",
  "controller1.xml",
  "controller2.xml",
  "controller3.xml",
];

const apiValues = {
  [joystickModes.sdl]: "SDLController",
  [joystickModes.xinput]: "XInput",
};

const xinputDisplayNamePrefix = "Controller";

function handleXinputJoystickListUpdate(joystickList) {
  let trimmedList = joystickList.filter((joystick) => joystick);

  inputConfigFileNames.forEach((filename, position) => {
    // deleting file if there is no controller to use
    if (!trimmedList[position]) {
      console.log(
        "CEMU - Deleting input Settings for controller",
        position + 1,
        path.resolve(cemuPath, filename)
      );
      deleteFile(path.resolve(cemuPath, filename));
      return;
    }

    const deviceIndex = findNextConnectedXinputIdentifier(
      joystickList,
      position
    );

    const device = joystickList[deviceIndex];

    const newConfig = configTemplates[device.type] ?? configTemplates.GAMEPAD;

    newConfig.emulated_controller.controller.api =
      apiValues[joystickModes.xinput];
    newConfig.emulated_controller.controller.uuid = deviceIndex;
    newConfig.emulated_controller.controller.display_name = `${xinputDisplayNamePrefix} ${
      deviceIndex + 1
    }`;

    savers.xml(newConfig, path.resolve(cemuPath, filename));
    console.log(
      "CEMU - Input Settings for controller",
      position + 1,
      "saved at",
      path.resolve(cemuPath, filename)
    );
  });
}

async function handleSDLJoystickListUpdate() {
  // we don't actually support SDL, so we'll just spin up xinput here real quick to support cemu while in SDL mode lol.

  const xinput = await import("xinput-ffi");
  const deviceList = [];

  for (
    let position = 0;
    position < xinput.constants.XUSER_MAX_COUNT;
    position++
  ) {
    try {
      const device = await xinput.getCapabilities(position);
      deviceList.push(createJoystick(device, joystickModes.xinput));
    } catch (e) {
      // either the device is not connected or the xinput device could not be identified and we report it as not connected
      deviceList.push(null);
    }
  }

  return handleXinputJoystickListUpdate(deviceList);
}

const joystickListUpdateHandlers = {
  xinput: handleXinputJoystickListUpdate,
  sdl: handleSDLJoystickListUpdate,
};

const cemu = {
  handleJoystickListUpdate(joystickList) {
    joystickListUpdateHandlers[user.settings.joystickMode](joystickList);
  },
};

export default cemu;
