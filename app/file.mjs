import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import yaml from "yaml";
import * as ini from "ini";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
let __packagedDirname = __dirname;
if (__dirname.includes(".asar")) {
  __dirname = path.resolve(__dirname, "..");
}

const xmlParser = new XMLParser();
const xmlBuilder = new XMLBuilder();

/**
 * Loaders and savers for each type of file
 */

export function resolvePathFromProjectRoot(src) {
  return path.resolve(__dirname, "..", src);
}

export function resolvePathFromPackagedRoot(src) {
  return path.resolve(__packagedDirname, "..", src);
}

export const loaders = {
  yml(filepath) {
    const file = fs.readFileSync(resolvePathFromProjectRoot(filepath), {
      encoding: "utf-8",
    });
    return yaml.parse(file);
  },
  ini(filepath) {
    const file = fs.readFileSync(resolvePathFromPackagedRoot(filepath), {
      encoding: "utf-8",
    });
    return ini.parse(file);
  },
  xml(filepath) {
    const file = fs.readFileSync(resolvePathFromPackagedRoot(filepath), {
      encoding: "utf-8",
    });
    return xmlParser.parse(file);
  },
  json(filepath) {
    const file = fs.readFileSync(resolvePathFromProjectRoot(filepath), {
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
  const resolvedPath = resolvePathFromProjectRoot(filepath);
  const directoryPath = path.dirname(resolvedPath);
  createDirectory(directoryPath);
  fs.writeFileSync(resolvedPath, content, { flag: "w", encoding: "utf-8" });
}

function createDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}
