import { loaders } from "./file.mjs";

export const deviceSubtype = {
  guitar: "XINPUT_DEVSUBTYPE_GUITAR_ALTERNATE",
  drums: "XINPUT_DEVSUBTYPE_DRUM_KIT",
  joystick: "XINPUT_DEVSUBTYPE_GAMEPAD",
};

export const user = {
  paths: loaders.json("user/paths.json"),
};
