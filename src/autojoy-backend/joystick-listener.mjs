import { hardwareInfo, isHardware } from "../common/joystick.mjs";
import { createJoystick } from "./joystick.mjs";
import sdl from "@kmamal/sdl";
import hid from "node-hid";

const subscribers = [];
let deviceList = [];
let hasSyncedOnStartup = false;

export const joystickListener = {
  async listen() {
    sdl.joystick.on("*", sdlHandler);
    sdlHandler();
  },
  getJoystickList() {
    return structuredClone(deviceList);
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
  const hidDevices = hid.devices();

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

  const newDeviceList = gameControllers.map((device) => {
    const hidInfo = hidDevices.find(
      (h) => h.vendorId === device.vendor && h.productId === device.product,
    );
    return { ...createJoystick(device), hidInfo };
  });

  const hasChanged =
    newDeviceList.some(
      (value, position) =>
        value?.type !== deviceList[position]?.type ||
        value?.raw.id !== deviceList[position]?.raw.id ||
        value?.raw._index !== deviceList[position]?.raw._index,
    ) || newDeviceList.length !== deviceList.length;

  // always notify once on startup, even if the list is unchanged from the
  // (empty) initial state. integrations re-derive their emulator configs
  // from current settings on every notification, and settings changes are
  // applied by restarting this process.
  // TODO: fix this mess.
  if (hasChanged || !hasSyncedOnStartup) {
    hasSyncedOnStartup = true;
    deviceList = newDeviceList;
    subscribers.forEach((notify) => {
      try {
        notify(structuredClone(deviceList));
      } catch (e) {
        console.log("Joystick Listener - Error from subscriber:", e);
      }
    });
  }
}
