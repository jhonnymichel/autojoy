import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import yaml from "yaml";

/**
 * Loaders and savers for each type of file
 */

export function resolvePathFromProjectRoot(src) {
  return path.resolve(__dirname, "..", src);
}

export const loaders = {
  yml(src) {
    const file = fs.readFileSync(src, "utf-8");
    return yaml.parse(file);
  },
  json(src) {
    const file = fs.readFileSync(src, "utf-8");
    return JSON.parse(file);
  },
};

export const savers = {
  yml(obj, path) {
    const serialized = yaml.stringify(obj);
    fs.writeFileSync(path, serialized, "utf-8");
  },
};
