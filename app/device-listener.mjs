import * as xinput from "xinput-ffi";

const subscribers = [];
let deviceList = [];

export const deviceListener = {
  listen() {
    setInterval(async () => {
      const newDeviceList = [];
      for (
        let position = 0;
        position < xinput.constants.XUSER_MAX_COUNT;
        position++
      ) {
        try {
          const device = await xinput.getCapabilities(position);
          newDeviceList.push(device.subType);
        } catch (e) {
          // either the device is not connected or the xinput device could not be identified and we report it as not connected
          newDeviceList.push(null);
        }
      }

      if (
        newDeviceList.some((value, position) => value !== deviceList[position])
      ) {
        deviceList = newDeviceList;
        console.log(deviceList);
        subscribers.forEach((notify) => notify([...deviceList]));
      }
    }, 1000);
  },
  onListChange(notify) {
    subscribers.push(notify);
  },
};
