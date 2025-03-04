import fs from "fs";
import path from "path";
import yaml from "yaml";
import * as ini from "ini";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { execSync } from "child_process";
import rootdir from "./rootdir.mjs";

// Resolving user folder. in development mode, it'll be root of the repository (user and config-templates folders).
let settingsFolder = rootdir;
// we keep a reference to the app directory so we can grab templates from here when needed. applies in production where the app dir is packaged.
let __packagedDirname = settingsFolder;
// if we're in production, we set user folder to be outside of the app directory, in the root of the install first.
if (settingsFolder.includes(".asar")) {
  settingsFolder = path.resolve(settingsFolder, "..");

  // function getRealDocumentsPath() {
  //   try {
  //     const docPath = execSync(
  //       "powershell -command \"[Environment]::GetFolderPath('MyDocuments')\"",
  //       { encoding: "utf8" }
  //     ).trim();
  //     return docPath;
  //   } catch (error) {
  //     console.error("Failed to get Documents path:", error);
  //     return null;
  //   }
  // }

  // const documentsPath = getRealDocumentsPath();

  // // if we have the documents path extracted, we use documents/autojoy as the user folder.
  // if (documentsPath) {
  //   userFolder = documentsPath + "/autojoy";
  // }

  function getLocalAppDataPath() {
    try {
      const localAppDataPath = execSync(
        "powershell -command \"[System.Environment]::GetFolderPath('LocalApplicationData')\"",
        {
          encoding: "utf8",
        }
      ).trim();

      return localAppDataPath;
    } catch (error) {
      console.error("Failed to get Local AppData path:", error);
      return null;
    }
  }

  const appDataFolder = getLocalAppDataPath();

  // if we have the documents path extracted, we use documents/autojoy as the user folder.
  if (appDataFolder) {
    settingsFolder = path.resolve(appDataFolder, "com.jhonnymichel", "autojoy");
  }
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
    const serialized = yaml.stringify(obj);
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

function saveFile(content, filepath) {
  const resolvedPath = resolvePathFromUserFolder(filepath);
  const directoryPath = path.dirname(resolvedPath);
  createDirectory(directoryPath);
  fs.writeFileSync(resolvedPath, content, { flag: "w", encoding: "utf-8" });
}

function createDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}
