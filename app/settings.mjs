import { joystickModes } from "./constants.mjs";
import {
  loaders,
  resolvePathFromPackagedRoot,
  resolvePathFromProjectRoot,
  savers,
} from "./file.mjs";

export const userFolderPath = resolvePathFromProjectRoot(".");
export const templatesFolderPath =
  resolvePathFromProjectRoot("config-templates");

// for first app execution after install. we create the userland settings from inside the app package.
try {
  loaders.json("user/paths.json");
} catch (e) {
  savers.json(
    loaders.json(resolvePathFromPackagedRoot("user/paths.json")),
    "user/paths.json"
  );
}

try {
  loaders.json("user/settings.json");
} catch (e) {
  savers.json(
    loaders.json(resolvePathFromPackagedRoot("user/settings.json")),
    "user/settings.json"
  );
}

try {
  loaders.yml("config-templates/rpcs3.yml");
} catch (e) {
  savers.yml(
    loaders.yml(resolvePathFromPackagedRoot("config-templates/rpcs3.yml")),
    "config-templates/rpcs3.yml"
  );
}

export const user = {
  get paths() {
    return loaders.json("user/paths.json");
  },
  get settings() {
    return loaders.json("user/settings.json");
  },
  set settings(value) {
    return savers.json(value, "user/settings.json");
  },
};

export function validateSettings() {
  const userSettings = user.settings;

  if (!Object.values(joystickModes).includes(userSettings.joystickMode)) {
    console.log(
      `user settings.joystickMode invalid value. can be ${Object.values(
        joystickModes
      )}. found '${user.settings.joystickMode}'. Resetting it to xinput.`
    );

    user.settings = {
      ...user.settings,
      joystickMode: "xinput",
    };
  }

  if (userSettings.unusedMicrophones) {
    if (!Array.isArray(userSettings.unusedMicrophones)) {
      console.log(
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
      console.log(
        "Invalid user settings.unusedMicrophones entries found. Resetting it."
      );

      user.settings = {
        ...user.settings,
        unusedMicrophones: [],
      };
    }

    if (userSettings.hasOwnProperty("manageMicrophones")) {
      if (typeof userSettings.manageMicrophones !== "boolean") {
        console.log(
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
