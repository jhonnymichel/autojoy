let mmJoystick;
try {
	mmJoystick = require("../../../build/Release/joystick.node");
} catch (e) {
	mmJoystick = {
		getJoysticks() {
			return [];
		},
	};
}
module.exports = mmJoystick;
