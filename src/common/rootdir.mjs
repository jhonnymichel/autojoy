import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// exiting common/src and getting to the root directory
let rootdir = path.resolve(__dirname, "..", "..");

// when running from system service
if (process.env.AUTOJOY_BACKEND_MODE === "service") {
  if (process.env.AUTOJOY_ENV === "dev") {
    // going to the root of dev-app-data
    rootdir = path.resolve(__dirname, "..", "..");
  } else {
    //  stay in the module root if it's inside <user-folder>/.src/
    rootdir = __dirname;
  }
}

console.log("ROOTDIR IS:", rootdir);

export default rootdir;
