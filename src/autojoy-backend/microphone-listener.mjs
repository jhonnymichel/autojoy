import { SDL3Controller } from "./native/sdl3-native.mjs";

const subscribers = [];
let deviceList = [];

async function getApi() {
  return new SDL3Controller();
}

export const microphoneListener = {
  async listen() {
    sdlMicrophoneHandler(await getApi());
  },
  onListChange(notify) {
    subscribers.push(notify);
  },
};

async function sdlMicrophoneHandler(sdl) {
  const devices = sdl.getAudioDevices();
  const microphones = devices.filter((device) => device.type === "recording");

  const newDeviceList = microphones.map((device) => ({
    name: device.name,
    raw: device,
  }));

  if (
    newDeviceList.some(
      (value, position) => value?.name !== deviceList[position]?.name
    ) ||
    newDeviceList.length !== deviceList.length
  ) {
    deviceList = newDeviceList;
    subscribers.forEach((notify) => {
      try {
        notify(structuredClone(deviceList));
      } catch (e) {
        console.log("[Microphone Listener] Error from subscriber:", e);
      }
    });
  }

  setTimeout(() => {
    sdlMicrophoneHandler(sdl);
  }, 1000);
}
