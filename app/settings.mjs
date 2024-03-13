import { loaders, savers } from "./file.mjs";

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
