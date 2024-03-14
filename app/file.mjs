import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import yaml from "yaml";

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
let __packagedDirname = __dirname;
if (__dirname.includes(".asar")) {
  __dirname = path.resolve(__dirname, "..");
}

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
  yml(src) {
    const file = fs.readFileSync(resolvePathFromProjectRoot(src), {
      encoding: "utf-8",
    });
    return yaml.parse(file);
  },
  json(src) {
    const file = fs.readFileSync(resolvePathFromProjectRoot(src), {
      encoding: "utf-8",
    });
    return JSON.parse(file);
  },
};

export const savers = {
  yml(obj, filePath) {
    const serialized = yaml.stringify(obj);
    const resolvedPath = resolvePathFromProjectRoot(filePath);
    const directoryPath = path.dirname(resolvedPath);
    createDirectory(directoryPath);
    fs.writeFileSync(resolvedPath, serialized, {
      flag: "w",
      encoding: "utf-8",
    });
  },
  json(obj, filePath) {
    const serialized = JSON.stringify(obj);
    const resolvedPath = resolvePathFromProjectRoot(filePath);
    const directoryPath = path.dirname(resolvedPath);
    createDirectory(directoryPath);
    fs.writeFileSync(resolvedPath, serialized, {
      flag: "w",
      encoding: "utf-8",
    });
  },
  txt(text, filePath) {
    const resolvedPath = resolvePathFromProjectRoot(filePath);
    const directoryPath = path.dirname(resolvedPath);
    createDirectory(directoryPath);
    fs.writeFileSync(resolvedPath, text, { flag: "w", encoding: "utf-8" });
  },
};

function createDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}
