import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copySDL() {
  const sourceFile = join(
    __dirname,
    "..",
    "src",
    "autojoy-backend",
    "native",
    "SDL3.dll"
  );
  const targetDir = join(__dirname, "..", "build", "Release");
  const targetFile = join(targetDir, "SDL3.dll");

  // Create Release directory if it doesn't exist
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  try {
    copyFileSync(sourceFile, targetFile);
    console.log("SDL3.dll successfully copied to build/Release");
  } catch (err) {
    console.error("Error copying SDL3.dll:", err.message);
  }
}

copySDL();
