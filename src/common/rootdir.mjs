import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// exiting common/src and getting to the root directory

let rootdir = path.resolve(__dirname, "..", "..");

// Hack to move out of dev-app-data when running from system service
if (rootdir.includes("dev-app-data")) {
  rootdir = path.resolve(rootdir, "..")
}

console.log("ROOTDIR IS:", rootdir);

export default rootdir;
