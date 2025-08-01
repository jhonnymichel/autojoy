import { logFromApp } from "./logger.mjs";
import {
  loaders,
  resolvePathFromPackagedRoot,
  resolvePathFromUserFolder,
  savers,
} from "./file.mjs";

export const userFolderPath = resolvePathFromUserFolder(".");
export const templatesFolderPath =
  resolvePathFromUserFolder("config-templates");

// must validate and migrate paths before allowing user object to be used.
migrateUserSettings();

export const user = {
  get paths() {
    return loaders.json("user/paths.json");
  },
  set paths(paths) {
    savers.json(paths, "user/paths.json");
  },
  get settings() {
    return loaders.json("user/settings.json");
  },
  set settings(value) {
    savers.json(value, "user/settings.json");
  },
};

function amendNewDefaults(filePath, loader, saver) {
  const userFile = loader(filePath);
  const appBaseFile = loader(resolvePathFromPackagedRoot(filePath));

  let itemsToAmend = [];
  for (const [key, value] of Object.entries(appBaseFile)) {
    if (!userFile[key] && !key.includes("?xml")) {
      itemsToAmend.push(key);
      userFile[key] = value;
    }
  }

  if (itemsToAmend.length) {
    logFromApp(
      `Amending new defaults (${itemsToAmend.join(", ")}) for:`,
      filePath
    );
    saver(userFile, filePath);
  }
}

function migrateUserFile(filePath, loader, saver) {
  try {
    loader(filePath);
    amendNewDefaults(filePath, loader, saver);
  } catch (e) {
    logFromApp("Creating not found user file: ", filePath);
    saver(loader(resolvePathFromPackagedRoot(filePath)), filePath);
  }
}

function migrateUserSettings() {
  // for first app execution after install or update.
  // we create the userland settings from inside the app package.
  // and amend new settings if needed.
  migrateUserFile("user/paths.json", loaders.json, savers.json);
  migrateUserFile("user/settings.json", loaders.json, savers.json);
  migrateUserFile("config-templates/rpcs3.yml", loaders.yml, savers.yml);
  migrateUserFile("config-templates/cemu.xml", loaders.xml, savers.xml);
  migrateUserFile("config-templates/dolphin-gc.ini", loaders.ini, savers.ini);
  migrateUserFile(
    "config-templates/dolphin-wiimote-emulated.ini",
    loaders.ini,
    savers.ini
  );
  migrateUserFile(
    "config-templates/dolphin-wiimote-real.ini",
    loaders.ini,
    savers.ini
  );
  migrateUserFile("config-templates/ghwtde.ini", loaders.ini, savers.ini);
}

export function validateSettings(log = (...msg) => console.log(...msg)) {
  const userSettings = user.settings;

  if (userSettings.unusedMicrophones) {
    if (!Array.isArray(userSettings.unusedMicrophones)) {
      log(
        `user settings.unusedMicrophones invalid value. Should be an array. found '${typeof userSettings.unusedMicrophones}'. Resetting it.`
      );

      user.settings = {
        ...user.settings,
        unusedMicrophones: [],
      };
    } else if (
      userSettings.unusedMicrophones.some(
        (entry) =>
          !entry.hasOwnProperty("name") || !entry.hasOwnProperty("position")
      )
    ) {
      log(
        "Invalid user settings.unusedMicrophones entries found. Resetting it."
      );

      user.settings = {
        ...user.settings,
        unusedMicrophones: [],
      };
    }

    if (userSettings.hasOwnProperty("manageMicrophones")) {
      if (typeof userSettings.manageMicrophones !== "boolean") {
        log(
          `user settings.manageMicrophones invalid value. Should true of false. found '${userSettings.manageMicrophones}'. Resetting it.`
        );
        user.settings = {
          ...user.settings,
          manageMicrophones: false,
        };
      }
    }
  }
}
