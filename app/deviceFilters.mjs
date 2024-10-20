export function isMicrophoneInUse(device, microphoneList, unusedList) {
  const unusedMicssWithCurrentDeviceName = unusedList.filter(
    (d) => d.name === device.name
  );

  const connectedMicsWithCurrentDeviceName = microphoneList.filter(
    (d) => d.name === device.name
  );
  const positionOfCurrentDevice =
    connectedMicsWithCurrentDeviceName.indexOf(device);

  // we use device name and order of appearance as identifiers in unused list.
  // if multiple connected devices have the same name, but only some are marked as unused,
  // the order of appearance is used to determine which ones are in use or not.
  return unusedMicssWithCurrentDeviceName.every(
    (d) => d.name !== device.name || d.position !== positionOfCurrentDevice
  );
}

export function getMicrophonesInUse(microphoneList, unusedList) {
  return microphoneList.filter((mic) =>
    isMicrophoneInUse(mic, microphoneList, unusedList)
  );
}
