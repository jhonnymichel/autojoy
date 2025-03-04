import fs from "fs";
import { resolvePathFromUserFolder, savers } from "../common/file.mjs";

const logsPath = resolvePathFromUserFolder("logs.txt");

if (!fs.existsSync(logsPath)) {
  savers.txt("", "logs.txt");
}

const logStream = fs.createWriteStream(logsPath, {
  flags: "a",
});

function log(...msg) {
  const currentDate = new Date().toLocaleString();
  const finalMessage = `${currentDate} ${msg.join(" ")}`;
  logStream.write(finalMessage);
  console.log(finalMessage);
}

export function createLogger(prefix, postfix = "\n") {
  return function logWithPrefix(...msg) {
    if (postfix) {
      return log(`[${prefix}]`, ...msg, postfix);
    }
    return log(`[${prefix}]`, ...msg);
  };
}

export const logFromApp = createLogger("APP");

export function resetLogFile() {
  savers.txt("", "logs.txt");
}
