const mmJoystick = require("../../../build/Release/joystick.node");

// Harmonix Wii Drums
const mmJoystickDevices = [{ manufacturerId: 7085, productId: 12560 }];

module.exports = {
  shouldUseMMJoystick(manufacturerId, productId) {
    return mmJoystickDevices.some(
      (mmJoystickDevice) =>
        mmJoystickDevice.manufacturerId === manufacturerId &&
        mmJoystickDevice.productId === productId
    );
  },
  getMMJoystickIndex(manufacturerId, productId) {
    const joysticks = mmJoystick.getJoysticks();
    const joystick = joysticks.find(
      (mmJoystickDevice) =>
        mmJoystickDevice.manufacturerId === manufacturerId &&
        mmJoystickDevice.productId === productId
    );
    if (!joystick) {
      throw new Error("[RPCS3 MMJoystick Handler]: joystick not found.");
    }

    return joystick.id + 1;
  },
};
