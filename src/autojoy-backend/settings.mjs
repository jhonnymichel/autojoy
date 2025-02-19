import {
  loaders,
  resolvePathFromPackagedRoot,
  resolvePathFromUserFolder,
  savers,
} from "../common/file.mjs";
import { joystickModes } from "../common/joystick.mjs";

export const userFolderPath = resolvePathFromUserFolder(".");
export const templatesFolderPath =
  resolvePathFromUserFolder("config-templates");

// for first app execution after install. we create the userland settings from inside the app package.
try {
  loaders.json("user/paths.json");
} catch (e) {
  savers.json(
    loaders.json(resolvePathFromPackagedRoot("user/paths.template.json")),
    "user/paths.json"
  );
}

try {
  loaders.json("user/settings.json");
} catch (e) {
  savers.json(
    loaders.json(resolvePathFromPackagedRoot("user/settings.template.json")),
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

try {
  loaders.xml("config-templates/cemu.xml");
} catch (e) {
  savers.xml(
    loaders.xml(resolvePathFromPackagedRoot("config-templates/cemu.xml")),
    "config-templates/cemu.xml"
  );
}

try {
  loaders.ini("config-templates/dolphin-gc.ini");
} catch (e) {
  savers.ini(
    loaders.ini(resolvePathFromPackagedRoot("config-templates/dolphin-gc.ini")),
    "config-templates/dolphin-gc.ini"
  );
}

try {
  loaders.ini("config-templates/dolphin-wiimote-emulated.ini");
} catch (e) {
  savers.ini(
    loaders.ini(
      resolvePathFromPackagedRoot(
        "config-templates/dolphin-wiimote-emulated.ini"
      )
    ),
    "config-templates/dolphin-wiimote-emulated.ini"
  );
}

try {
  loaders.ini("config-templates/dolphin-wiimote-real.ini");
} catch (e) {
  savers.ini(
    loaders.ini(
      resolvePathFromPackagedRoot("config-templates/dolphin-wiimote-real.ini")
    ),
    "config-templates/dolphin-wiimote-real.ini"
  );
}

try {
  loaders.ini("config-templates/ghwtde.ini");
} catch (e) {
  savers.ini(
    loaders.ini(resolvePathFromPackagedRoot("config-templates/ghwtde.ini")),
    "config-templates/ghwtde.ini"
  );
}

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
