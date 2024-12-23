import { loaders } from "../file.mjs";
import { user } from "../settings.mjs";
import path from "path";

const configTemplates = {
  gamecube: loaders.ini("config-templates/dolphin-gc.ini"),
  wiimoteEmulated: loaders.ini("config-templates/dolphin-wiimote-emulated.ini"),
  wiimoteReal: loaders.ini("config-templates/dolphin-wiimote-real.ini"),
};

const dolphinPath = path.resolve(user.paths.dolphin, "User/Config");

const gamecubeConstants = {
  inputConfigFilePath: "GCPadNew.ini",
  playerIdentifiers: ["GCPad1", "GCPad2", "GCPad3", "GCPad4"],
  deviceModeFilePath: "Dolphin.ini", // this is to enable or disable gc controllers
  devices: ["SIDevice0", "SIDevice1", "SIDevice2", "SIDevice3"],
  deviceModes: {
    enabled: "6", // this is actually the value for "Emulated Gamecube Controller". TODO: Support other modes
    disabled: "0",
  },
};

const wiiConstants = {
  inputConfigFilePath: "WiimoteNew.ini",
  playerIdentifiers: ["Wiimote1", "Wiimote2", "Wiimote3", "Wiimote4"],
  wiimoteSources: {
    emulated: "1",
    real: "2", // TODO: support real wiimotes
    none: "0",
  },
};

const xinputDeviceIdentifiers = [
  "XInput/0/Gamepad",
  "XInput/1/Gamepad",
  "XInput/2/Gamepad",
  "XInput/3/Gamepad",
];
