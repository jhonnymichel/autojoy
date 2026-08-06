import fs from "fs";
import path from "path";
import yaml from "yaml";
import * as ini from "ini";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { execSync } from "child_process";
import rootdir from "./rootdir.mjs";

const isDev = process.env.AUTOJOY_ENV === "dev";
// we keep a reference to the app directory so we can grab templates from here when needed. applies in production where the app dir is packaged.
let __packagedDirname = rootdir;

// Resolving user folder. we start inside the root.
let settingsFolder = rootdir;

// if we're in a package, we set user folder to be outside of the app directory, in the root of the install first.
// if not the case, we create a folder inside the root.
// if we can't find a better user folder based on platform, we stay with this default.
if (settingsFolder.includes(".asar")) {
  settingsFolder = path.resolve(settingsFolder, "..");
} else {
  settingsFolder = path.resolve(settingsFolder, "user-data");
}

function getSettingsBaseFolderByPlatform() {
  try {
    if (process.platform === "win32") {
      const localAppDataPath = execSync(
        "powershell -command \"[System.Environment]::GetFolderPath('LocalApplicationData')\"",
        {
          encoding: "utf8",
        },
      ).trim();

      return localAppDataPath;
    }

    // linux: use XDG config home or ~/.config
    const xdg = process.env.XDG_CONFIG_HOME;
    if (xdg && xdg.length) {
      return xdg;
    }

    const home = process.env.HOME || process.env.USERPROFILE;
    return path.resolve(home, ".config");
  } catch (error) {
    console.error("Failed to resolve settings base folder:", error);
    return null;
  }
}

// resolving the proper user folder based on platform, if possible.
const platformBaseSettingsFolder = getSettingsBaseFolderByPlatform();
if (platformBaseSettingsFolder) {
  settingsFolder = path.resolve(
    platformBaseSettingsFolder,
    "com.jhonnymichel",
    isDev ? "autojoy-dev" : "autojoy",
  );
}

const xmlParser = new XMLParser();
const xmlBuilder = new XMLBuilder();

/**
 * Loaders and savers for each type of file
 */

// should be used to find files from user folder
export function resolvePathFromUserFolder(src) {
  return path.resolve(settingsFolder, src);
}

// this should only be used when trying to get the template files packaged inside the app.
export function resolvePathFromPackagedRoot(src) {
  return path.resolve(__packagedDirname, src);
}

console.log(`PATHS:
  User: ${settingsFolder}
  Package: ${__packagedDirname}`);

export const loaders = {
  yml(filepath) {
    const file = fs.readFileSync(resolvePathFromUserFolder(filepath), {
      encoding: "utf-8",
    });
    return yaml.parse(file);
  },
  ini(filepath) {
    const file = fs.readFileSync(resolvePathFromUserFolder(filepath), {
      encoding: "utf-8",
    });
    return ini.parse(file);
  },
  xml(filepath) {
    const file = fs.readFileSync(resolvePathFromUserFolder(filepath), {
      encoding: "utf-8",
    });
    return xmlParser.parse(file);
  },
  json(filepath) {
    const file = fs.readFileSync(resolvePathFromUserFolder(filepath), {
      encoding: "utf-8",
    });
    return JSON.parse(file);
  },
};

export const savers = {
  yml(obj, filepath) {
    // Serialize each top-level key separately to avoid anchors
    let serialized = "";
    for (const key in obj) {
      const yamlSection = yaml.stringify({ [key]: obj[key] });
      serialized += yamlSection;
    }
    saveFile(serialized, filepath);
  },
  ini(obj, filepath) {
    const serialized = ini.stringify(obj);
    saveFile(serialized, filepath);
  },
  xml(obj, filepath) {
    const serialized = xmlBuilder.build(obj);
    saveFile(serialized, filepath);
  },
  json(obj, filepath) {
    const serialized = JSON.stringify(obj);
    saveFile(serialized, filepath);
  },
  txt(text, filepath) {
    saveFile(text, filepath);
  },
};

export function deleteFile(filepath) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

export function saveFile(content, filepath, options = {}) {
  const resolvedPath = resolvePathFromUserFolder(filepath);
  const directoryPath = path.dirname(resolvedPath);
  createDirectory(directoryPath);
  fs.writeFileSync(resolvedPath, content, {
    flag: "w",
    encoding: "utf-8",
    ...options,
  });
}

export function createDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

export function copyDir(src, dest) {
  createDirectory(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  createDirectory(destDir);
  fs.copyFileSync(src, dest);
}

export function deleteDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true, force: true });
  }
}
