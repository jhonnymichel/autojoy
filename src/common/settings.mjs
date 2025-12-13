import { logFromApp } from "./logger.mjs";
import path from "path";
import {
  loaders,
  resolvePathFromPackagedRoot,
  resolvePathFromUserFolder,
  savers,
} from "./file.mjs";

export const userFolderPath = resolvePathFromUserFolder(".");

const packagedRootConfigTemplatesPath = path.join(
  "config-templates",
  process.platform === "win32" ? "win32" : "linux",
);

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

function amendNewDefaults({ filePath, templatePath, loader, saver }) {
  const userFile = loader(filePath);
  const appBaseFile = loader(
    resolvePathFromPackagedRoot(templatePath ?? filePath),
  );

  let itemsToAmend = [];
  for (const [key, value] of Object.entries(appBaseFile)) {
    if (!Object.hasOwn(userFile, key) && !key.includes("?xml")) {
      itemsToAmend.push(key);
      userFile[key] = value;
    }
  }

  if (itemsToAmend.length) {
    logFromApp(
      `Amending new defaults (${itemsToAmend.join(", ")}) for:`,
      filePath,
    );
    saver(userFile, filePath);
  }
}

function migrateUserFile({ filePath, templatePath, loader, saver }) {
  try {
    loader(filePath);
    amendNewDefaults({ filePath, templatePath, loader, saver });
  } catch (e) {
    logFromApp("Creating not found user file: ", filePath);
    saver(
      loader(resolvePathFromPackagedRoot(templatePath ?? filePath)),
      filePath,
    );
  }
}

function migrateUserSettings() {
  // for first app execution after install or update.
  // we create the userland settings from inside the app package.
  // and amend new settings if needed.
  migrateUserFile({
    filePath: "user/migrations.json",
    templatePath: "user/migrations.template.json",
    loader: loaders.json,
    saver: savers.json,
  });
  migrateUserFile({
    filePath: "user/paths.json",
    templatePath: "user/paths.template.json",
    loader: loaders.json,
    saver: savers.json,
  });
  migrateUserFile({
    filePath: "user/settings.json",
    templatePath: "user/settings.template.json",
    loader: loaders.json,
    saver: savers.json,
  });
  migrateUserFile({
    filePath: "config-templates/rpcs3.yml",
    templatePath: path.join(packagedRootConfigTemplatesPath, "rpcs3.yml"),
    loader: loaders.yml,
    saver: savers.yml,
  });
  migrateUserFile({
    filePath: "config-templates/cemu.xml",
    templatePath: path.join(packagedRootConfigTemplatesPath, "cemu.xml"),
    loader: loaders.xml,
    saver: savers.xml,
  });
  migrateUserFile({
    filePath: "config-templates/dolphin-gc.ini",
    templatePath: path.join(packagedRootConfigTemplatesPath, "dolphin-gc.ini"),
    loader: loaders.ini,
    saver: savers.ini,
  });
  migrateUserFile({
    filePath: "config-templates/dolphin-wiimote-emulated.ini",
    templatePath: path.join(
      packagedRootConfigTemplatesPath,
      "dolphin-wiimote-emulated.ini",
    ),
    loader: loaders.ini,
    saver: savers.ini,
  });
  migrateUserFile({
    filePath: "config-templates/dolphin-wiimote-real.ini",
    templatePath: path.join(
      packagedRootConfigTemplatesPath,
      "dolphin-wiimote-real.ini",
    ),
    loader: loaders.ini,
    saver: savers.ini,
  });
  migrateUserFile({
    filePath: "config-templates/ghwtde.ini",
    templatePath: path.join(packagedRootConfigTemplatesPath, "ghwtde.ini"),
    loader: loaders.ini,
    saver: savers.ini,
  });

  try {
    const migrations = require("../migrations.mjs").default;
    const migrationsRan = loaders.json("user/migrations.json");
    migrations.forEach((migration) => {
      if (!migrationsRan[migration.name]) {
        try {
          migration.execute();
          logFromApp(`Migration "${migration.name}" applied!`);
          migrationsRan[migration.name] = new Date().toLocaleDateString();
        } catch (e) {
          logFromApp(`Migration "${migration.name}" failed: `, e.message);
        }
      }
    });
    savers.json(migrationsRan, "user/migrations.json");
  } catch (e) {
    console.log("No migrations to run.");
  }
}

export function validateSettings(log = (...msg) => console.log(...msg)) {
  const userSettings = user.settings;

  if (userSettings.hasOwnProperty("setupComplete")) {
    if (typeof userSettings.setupComplete !== "boolean") {
      log(
        `user settings.setupComplete invalid value. Should be true of false. found '${userSettings.setupComplete}'. Resetting it.`,
      );
      user.settings = {
        ...user.settings,
        setupComplete: false,
      };
    }
  }

  if (userSettings.unusedMicrophones) {
    if (!Array.isArray(userSettings.unusedMicrophones)) {
      log(
        `user settings.unusedMicrophones invalid value. Should be an array. found '${typeof userSettings.unusedMicrophones}'. Resetting it.`,
      );

      user.settings = {
        ...user.settings,
        unusedMicrophones: [],
      };
    } else if (
      userSettings.unusedMicrophones.some(
        (entry) =>
          !entry.hasOwnProperty("name") || !entry.hasOwnProperty("position"),
      )
    ) {
      log(
        "Invalid user settings.unusedMicrophones entries found. Resetting it.",
      );

      user.settings = {
        ...user.settings,
        unusedMicrophones: [],
      };
    }

    if (userSettings.hasOwnProperty("manageMicrophones")) {
      if (typeof userSettings.manageMicrophones !== "boolean") {
        log(
          `user settings.manageMicrophones invalid value. Should true of false. found '${userSettings.manageMicrophones}'. Resetting it.`,
        );
        user.settings = {
          ...user.settings,
          manageMicrophones: false,
        };
      }
    }
  }
}
