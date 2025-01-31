import {
  deviceType,
  joystickModes,
  xinputSubtypeToGlobalType,
} from "./constants.mjs";
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
      newDeviceList.push({
        name: device.type,
        type: xinputSubtypeToGlobalType[device.subType],
        raw: device,
      });
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
        notify([...deviceList]);
      } catch (e) {
        console.log("[Joystick Listener] Error from subscriber:", e);
      }
    });
  }

  setTimeout(() => {
    xinputHandler(xinput);
  }, 1000);
}

function extractSDLType(device) {
  if (device.name.includes("Guitar")) return deviceType.guitar;
  if (device.name.includes("Drum")) return deviceType.drumKit;

  return deviceType.gamepad;
}

async function sdlHandler(sdl) {
  const devices = sdl.joystick.devices;
  // TODO: support "Mayflash Wiimote PC Adapter". gotta use "name", not type.
  const gameControllers = devices.filter(
    (device) => device.type === "gamecontroller"
  );

  const newDeviceList = gameControllers.map((device) => ({
    name: device.name,
    type: extractSDLType(device),
    raw: device,
  }));

  if (
    newDeviceList.some(
      (value, position) => value?.type !== deviceList[position]?.type
    ) ||
    newDeviceList.length !== deviceList.length
  ) {
    deviceList = newDeviceList;
    subscribers.forEach((notify) => {
      try {
        notify([...deviceList]);
      } catch (e) {
        console.log("[Joystick Listener] Error from subscriber:", e);
      }
    });
  }

  setTimeout(() => {
    sdlHandler(sdl);
  }, 1000);
}
