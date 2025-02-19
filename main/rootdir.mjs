import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// exiting main and getting to the root directory
const rootdir = path.resolve(__dirname, "..");
export default rootdir;
