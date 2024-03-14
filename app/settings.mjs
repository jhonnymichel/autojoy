import {
  loaders,
  resolvePathFromPackagedRoot,
  resolvePathFromProjectRoot,
  savers,
} from "./file.mjs";

export const userFolderPath = resolvePathFromProjectRoot(".");
export const templatesFolderPath =
  resolvePathFromProjectRoot("config-templates");

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
