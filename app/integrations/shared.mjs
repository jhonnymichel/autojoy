import { deviceType } from "../constants.mjs";

// with xinput, it's possible for device 1 to be disconnected and device 2 to be connected. the order is not always reassigned when you disconnect a controller.
// example: [null, null, XINPUT_DEVSUBTYPE_GAMEPAD, null]. It looks like this happen when you mix x360 and one/series controllers.
// so if we have only one controller for instance, it'll be assigned to player 1 in the emulator, but the selected device would be XInput pad #3
export function findNextConnectedXinputIdentifier(deviceList, position) {
  let identifiersFound = -1;
  for (let index in deviceList) {
    const device = deviceList[index];
    if (device) {
      identifiersFound++;
      if (position === identifiersFound) {
        return Number(index);
      }
    }
  }
}

// In SDL, some controllers have inverted inputs.
// There may be more, but for now I detected Guitars.
// Sticks are swapped (left becomes right), and directions too (X axis becomes Y axis)
export function fixInvertedSDLInputs(joystick, config, sticks) {
  if (joystick.type !== deviceType.guitar) return;

  // Mapping of old stick directions to their corrected values
  const swapMap = new Map([
    [sticks.left.left, sticks.right.up],
    [sticks.left.right, sticks.right.down],
    [sticks.left.up, sticks.right.right],
    [sticks.left.down, sticks.right.left],

    [sticks.right.left, sticks.left.up],
    [sticks.right.right, sticks.left.down],
    [sticks.right.up, sticks.left.right],
    [sticks.right.down, sticks.left.left],
  ]);

  // Iterate through every value in config and swap if it's affected
  for (const key in config) {
    if (swapMap.has(config[key])) {
      config[key] = swapMap.get(config[key]);
    }
  }

  // swapping deadzones.
  // TODO: Swap Multiplier and Thresholds.
  const leftDeadzone = sticks.left.deadzone;
  const rightDeadzone = sticks.right.deadzone;
  sticks.left.deadzone = rightDeadzone;
  sticks.right.deadzone = leftDeadzone;
}
