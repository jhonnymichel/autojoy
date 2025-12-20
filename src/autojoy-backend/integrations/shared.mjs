import fs from "node:fs";
import { spawnSync } from "node:child_process";

// with xinput, it's possible for device 1 to be disconnected and device 2 to be connected. the order is not always reassigned when you disconnect a controller.
// example: [null, null, XINPUT_DEVSUBTYPE_GAMEPAD, null]. It looks like this happen when you mix x360 and one/series controllers.
// so if we have only one controller for instance, it'll be assigned to player 1 in the emulator, but the selected device would be XInput pad #3
export function findNextConnectedXinputIdentifier(deviceList, position) {
  let identifiersFound = -1;
  for (let index in deviceList) {
    const device = deviceList[index];
    if (device) {
      identifiersFound++;
      if (position === identifiersFound) {
        return Number(index);
      }
    }
  }
}

export function getEvdevName(device) {
  let evdevName = device.name;
  evdevName = `${device.hidInfo?.manufacturer} ${device.hidInfo?.product}`;
  if (!evdevName.trim()) {
    evdevName = device.name;
  }
  return evdevName;
}

export function getFixedOldDeviceSDLName(device) {
  let name = getFixedX360ControllerName(device);

  if (
    device.hidInfo?.manufacturer.includes(
      "Licensed by Sony Computer Entertainment",
    ) ||
    device.hidInfo?.manufacturer.includes("Licensed by Nintendo of America")
  ) {
    name = `${device.hidInfo.manufacturer.trim()} ${device.hidInfo.product.trim()}`;
  }

  return name;
}

function getFixedX360ControllerName(device) {
  if (process.platform === "linux") {
    const hhdDetected = detectHandheldDaemon();
    if (hhdDetected && device.raw.version === 1) {
      // on handheld-daemon virtual controllers, we can use name as-is".
      // the version 1 is the strongest indication of a virtual Xbox 360 controller.
      return device.name;
    }

    return device.name.replace("Xbox 360", "X360");
  }

  return device.name;
}

// Detects presence of Handheld Daemon,
// used on Bazzite Handhelds to manage the built-in controller.
export function detectHandheldDaemon() {
  if (process.platform !== "linux") {
    return false;
  }

  // Check for running user services named hhd@/hhd_local@
  try {
    const units = spawnSync("systemctl", ["--user", "list-units"], {
      encoding: "utf8",
    });
    const s = units.stdout || "";
    if (s.includes("hhd@") || s.includes("hhd_local@")) {
      return true;
    }
  } catch {
    console.log("Failed to query user systemd units to detect HHD.");
  }

  // Fallback: running process named hhd
  try {
    const out = spawnSync("pgrep", ["-fa", "(^|/)hhd(\\b|_)"], {
      encoding: "utf8",
    });
    if (out.status === 0 && out.stdout && out.stdout.trim().length > 0) {
      return true;
    }
  } catch {
    console.log("Failed to use pgrep to detect HHD.");
  }

  // Fallback: installation directory exists
  try {
    if (
      fs.existsSync("/usr/share/handheld-daemon") ||
      fs.existsSync("/usr/lib/handheld-daemon") ||
      fs.existsSync("/opt/handheld-daemon")
    ) {
      return true;
    }
  } catch {
    console.log("Failed to detect existence of HHD-related folders.");
  }

  return false;
}
