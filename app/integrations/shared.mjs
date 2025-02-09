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
