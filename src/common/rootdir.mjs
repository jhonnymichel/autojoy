import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// default to considering we're running from the packaged source code
// exiting common/src and getting to the root directory
let rootdir = path.resolve(__dirname, "..", "..");

// when running from system service
if (process.env.AUTOJOY_BACKEND_MODE === "service") {
  // stay in the module root ie <user-folder>/.src/
  rootdir = __dirname;
}

console.log("ROOTDIR IS:", rootdir);

export default rootdir;
