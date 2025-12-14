const isWin = process.platform === "win32";

if (!isWin) {
  // On non-Windows platforms, provide a stub that safely no-ops.
  module.exports = {};
} else {
  const mmJoystick = require("../../build/Release/joystick.node");
  module.exports = mmJoystick;
}
