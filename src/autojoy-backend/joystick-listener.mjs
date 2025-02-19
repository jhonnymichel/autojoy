import { hardwareInfo, joystickModes } from "../common/joystick.mjs";
import { createJoystick, isHardware } from "./joystick.mjs";
import { user } from "./settings.mjs";

const subscribers = [];
let deviceList = [];

const mode = user.settings.joystickMode; // sdl or xinput

async function getApi() {
  if (mode === joystickModes.sdl) {
    return (await import("@kmamal/sdl")).default;
  }

  if (mode === joystickModes.xinput) {
    return await import("xinput-ffi");
  }
}

export const joystickListener = {
  async listen() {
    handlers[mode](await getApi());
  },
  onListChange(notify) {
    subscribers.push(notify);
  },
};

const handlers = {
  sdl: sdlHandler,
  xinput: xinputHandler,
};

async function xinputHandler(xinput) {
  const newDeviceList = [];

  for (
    let position = 0;
    position < xinput.constants.XUSER_MAX_COUNT;
    position++
  ) {
    try {
      const device = await xinput.getCapabilities(position);
      newDeviceList.push(createJoystick(device, mode));
    } catch (e) {
      // either the device is not connected or the xinput device could not be identified and we report it as not connected
      newDeviceList.push(null);
    }
  }

  if (
    newDeviceList.some(
      (value, position) => value?.type !== deviceList[position]?.type
    ) ||
    newDeviceList.length !== deviceList.length
  ) {
    deviceList = newDeviceList;
    subscribers.forEach((notify) => {
      try {
        notify(structuredClone(deviceList));
      } catch (e) {
        console.log("[Joystick Listener] Error from subscriber:", e);
      }
    });
  }

  setTimeout(() => {
    xinputHandler(xinput);
  }, 1000);
}

const sdlDevicesToInclude = [
  hardwareInfo.harmonixDrumControllerForNintendoWii,
  hardwareInfo.harmonixDrumControllerForPS3,
];

async function sdlHandler(sdl) {
  const devices = sdl.joystick.devices;
  // TODO: support "Mayflash Wiimote PC Adapter". gotta use "name", not type.
  // TODO: support "Wii Rock Band Drums". gotta use name, not type + MMJoystick in RPCS3.
  const gameControllers = devices.filter(
    (device) =>
      device.type === "gamecontroller" ||
      sdlDevicesToInclude.some((d) =>
        isHardware(
          { manufacturerId: device.vendor, productId: device.product },
          d
        )
      )
  );

  const newDeviceList = gameControllers.map((device) =>
    createJoystick(device, mode)
  );

  if (
    newDeviceList.some(
      (value, position) =>
        value?.type !== deviceList[position]?.type ||
        value?.raw.id !== deviceList[position]?.raw.id ||
        value?.raw._index !== deviceList[position]?.raw._index
    ) ||
    newDeviceList.length !== deviceList.length
  ) {
    deviceList = newDeviceList;
    subscribers.forEach((notify) => {
      try {
        notify(structuredClone(deviceList));
      } catch (e) {
        console.log("[Joystick Listener] Error from subscriber:", e);
      }
    });
  }

  setTimeout(() => {
    sdlHandler(sdl);
  }, 1000);
}
