import { loaders, savers } from "./common/file.mjs";
import { resetBindings } from "./common/settings.mjs";

const migrations = [
  {
    name: "Change RPCS3 SDL face buttons labels",
    execute() {
      const userRPCS3Configs = loaders.yml("config-templates/rpcs3.yml");
      Object.values(userRPCS3Configs).forEach((joystickConfig) => {
        Object.entries(joystickConfig.Config).forEach(([key, value]) => {
          const oldNewValues = { A: "South", B: "East", Y: "North", X: "West" };
          if (Object.keys(oldNewValues).includes(value)) {
            joystickConfig.Config[key] = oldNewValues[value];
          }
        });
      });
      savers.yml(userRPCS3Configs, "config-templates/rpcs3.yml");
    },
  },
  {
    name: "SDL breaking changes -- overwriting all settings",
    execute() {
      resetBindings();
    },
  },
];

export default migrations;
