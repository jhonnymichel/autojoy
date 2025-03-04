import path from "path";
import { deleteFile, loaders, savers } from "../../common/file.mjs";
import { joystickModes } from "../../common/joystick.mjs";
import { findNextConnectedXinputIdentifier } from "./shared.mjs";
import { user } from "../../common/settings.mjs";

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

function handleSDLJoystickListUpdate() {
  console.log("CEMU: SDL Not supported yet");
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
