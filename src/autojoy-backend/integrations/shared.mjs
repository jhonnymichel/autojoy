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

export function getEvdevName(device) {
  let evdevName = device.name;
  evdevName = `${device.hidInfo?.manufacturer} ${device.hidInfo?.product}`;
  if (!evdevName.trim()) {
    evdevName = device.name;
  }
  return evdevName;
}

export function getFixedOldDeviceSDLName(device) {
  let name = getFixedX360ControllerName(device);

  if (
    device.hidInfo?.manufacturer.includes(
      "Licensed by Sony Computer Entertainment",
    ) ||
    device.hidInfo?.manufacturer.includes("Licensed by Nintendo of America")
  ) {
    name = `${device.hidInfo.manufacturer.trim()} ${device.hidInfo.product.trim()}`;
  }

  return name;
}

function getFixedX360ControllerName(device) {
  if (process.platform === "linux") {
    return device.name.replace("Xbox 360", "X360");
  }

  return device.name;
}
