import { hardwareInfo, isHardware } from "../common/joystick.mjs";
import { createJoystick } from "./joystick.mjs";
import sdl from "@kmamal/sdl";

const subscribers = [];
let deviceList = [];

export const joystickListener = {
  async listen() {
    sdlHandler();
  },
  onListChange(notify) {
    subscribers.push(notify);
  },
};

const sdlDevicesToInclude = [
  hardwareInfo.harmonixDrumControllerForNintendoWii,
  hardwareInfo.harmonixDrumControllerForPS3,
  hardwareInfo.guitarHeroGuitarForPS3,
];

async function sdlHandler() {
  const devices = sdl.joystick.devices;
  // TODO: support "Mayflash Wiimote PC Adapter". gotta use "name", not type.
  // TODO: support "Wii Rock Band Drums". gotta use name, not type + MMJoystick in RPCS3.
  const gameControllers = devices.filter(
    (device) =>
      device.type === "gamecontroller" ||
      sdlDevicesToInclude.some((d) =>
        isHardware(
          { manufacturerId: device.vendor, productId: device.product },
          d,
        ),
      ),
  );

  const newDeviceList = gameControllers.map((device) => createJoystick(device));

  if (
    newDeviceList.some(
      (value, position) =>
        value?.type !== deviceList[position]?.type ||
        value?.raw.id !== deviceList[position]?.raw.id ||
        value?.raw._index !== deviceList[position]?.raw._index,
    ) ||
    newDeviceList.length !== deviceList.length
  ) {
    deviceList = newDeviceList;
    subscribers.forEach((notify) => {
      try {
        notify(structuredClone(deviceList));
      } catch (e) {
        console.log("Joystick Listener - Error from subscriber:", e);
      }
    });
  }

  setTimeout(() => {
    sdlHandler();
  }, 1000);
}
