import * as xinput from "xinput-ffi";
import sdl from "@kmamal/sdl";
import { deviceType, user, xinputSubtypeToGlobalType } from "./constants.mjs";

const subscribers = [];
let deviceList = [];

const mode = user.settings.joystickMode; // sdl or xinput

if (mode !== "sdl" && mode !== "xinput") {
  throw new TypeError(
    `user settings.joystickMode invalid value. can be 'sdl' or 'xinput'. found '${mode}'`
  );
}

export const deviceListener = {
  listen() {
    handlers[mode]();
  },
  onListChange(notify) {
    subscribers.push(notify);
  },
};

const handlers = {
  sdl: sdlHandler,
  xinput: xinputHandler,
};

async function xinputHandler() {
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
    console.log(deviceList);
    subscribers.forEach((notify) => notify([...deviceList]));
  }

  setTimeout(xinputHandler, 1000);
}

function extractSDLType(device) {
  if (device.name.includes("Guitar")) return deviceType.guitar;
  if (device.name.includes("Drum")) return deviceType.drumKit;

  return deviceType.gamepad;
}

async function sdlHandler() {
  const devices = sdl.joystick.devices;
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
    console.log(deviceList);
    subscribers.forEach((notify) => notify([...deviceList]));
  }

  setTimeout(sdlHandler, 1000);
}
