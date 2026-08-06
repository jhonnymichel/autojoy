export function isMicrophoneInUse(
  device,
  position,
  microphoneList,
  unusedList,
) {
  const unusedMicssWithCurrentDeviceName = unusedList.filter(
    (d) => d.name === device.name,
  );

  const connectedMicsWithCurrentDeviceName = microphoneList.filter(
    (d) => d.name === device.name,
  );

  const deviceInStore = microphoneList.find(
    (d, p) => d.name === device.name && p === position,
  );
  const positionOfCurrentDevice =
    connectedMicsWithCurrentDeviceName.indexOf(deviceInStore);

  // we use device name and order of appearance as identifiers in unused list.
  // if multiple connected devices have the same name, but only some are marked as unused,
  // the order of appearance is used to determine which ones are in use or not.
  return unusedMicssWithCurrentDeviceName.every(
    (d) => d.name !== device.name || d.position !== positionOfCurrentDevice,
  );
}

export function getMicrophonesInUse(microphoneList, unusedList) {
  return microphoneList.filter((mic, pos) =>
    isMicrophoneInUse(mic, pos, microphoneList, unusedList),
  );
}
