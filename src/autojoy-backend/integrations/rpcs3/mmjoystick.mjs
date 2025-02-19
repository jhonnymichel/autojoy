import { hardwareInfo } from "../../../common/joystick.mjs";
import { isHardware } from "../../joystick.mjs";
import mmJoystick from "../../native/mmjoystick-native.cjs";
// Harmonix Wii Drums
const mmJoystickDevices = [hardwareInfo.harmonixDrumControllerForNintendoWii];

export default {
  shouldUseMMJoystick(manufacturerId, productId) {
    return mmJoystickDevices.some((mmJoystickDevice) =>
      isHardware({ manufacturerId, productId }, mmJoystickDevice)
    );
  },
  getMMJoystickIndex(manufacturerId, productId) {
    const joysticks = mmJoystick.getJoysticks();
    const joystick = joysticks.find((mmJoystickDevice) =>
      isHardware({ manufacturerId, productId }, mmJoystickDevice)
    );
    if (!joystick) {
      throw new Error("[RPCS3 MMJoystick Handler]: joystick not found.");
    }

    return joystick.id + 1;
  },
};
