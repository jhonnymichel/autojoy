import { hardwareInfo, isHardware } from "../../../common/joystick.mjs";
import { sendEvent } from "../../event-broadcaster.mjs";
import mmJoystick from "../../native/mmjoystick-native.cjs";
const isWindows = process.platform === "win32";
// Harmonix Wii Drums
const mmJoystickDevices = [
  hardwareInfo.harmonixDrumControllerForNintendoWii,
  hardwareInfo.harmonixDrumControllerForPS3,
  hardwareInfo.guitarHeroGuitarForPS3,
];

export default {
  shouldUseMMJoystick(manufacturerId, productId) {
    if (!isWindows) return false;
    return mmJoystickDevices.some((mmJoystickDevice) =>
      isHardware({ manufacturerId, productId }, mmJoystickDevice),
    );
  },
  getMMJoystickIndex(manufacturerId, productId) {
    if (!isWindows) return null;
    const joysticks = mmJoystick.getJoysticks();
    const joystick = joysticks.find((mmJoystickDevice) =>
      isHardware({ manufacturerId, productId }, mmJoystickDevice),
    );
    if (!joystick) {
      console.error(
        "RPCS3 MMJoystick Handler - joystick not found. Restarting server to refresh list",
      );
      sendEvent(JSON.stringify({ type: "issueRestart" }));
    }

    return joystick ? joystick.id + 1 : null;
  },
};
