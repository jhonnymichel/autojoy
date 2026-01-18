import { getMicrophonesInUse } from "../common/device-filters.mjs";
import { user } from "../common/settings.mjs";
import { joystickListener } from "./joystick-listener.mjs";
import { microphoneListener } from "./microphone-listener.mjs";
import { sendEvent } from "./event-broadcaster.mjs";

async function init() {
  console.log("Input server started. Using settings:\n", user.settings);
  console.log("Backend mode:", process.env.AUTOJOY_BACKEND_MODE);
  console.log("Env mode:", process.env.AUTOJOY_ENV);
  joystickListener.onListChange((joystickList) => {
    console.log("Joystick list changed: ", joystickList);
    sendEvent(JSON.stringify({ type: "joystickList", data: joystickList }));
  });

  let rpcs3;
  if (user.paths.rpcs3) {
    rpcs3 = (await import("./integrations/rpcs3.mjs")).default;
    joystickListener.onListChange(rpcs3.handleJoystickListUpdate);
  }
  if (user.paths.dolphin) {
    const dolphin = (await import("./integrations/dolphin.mjs")).default;
    joystickListener.onListChange(dolphin.handleJoystickListUpdate);
  }
  if (user.paths.cemu) {
    const cemu = (await import("./integrations/cemu.mjs")).default;
    joystickListener.onListChange(cemu.handleJoystickListUpdate);
  }
  let ghwtde;
  if (user.paths.ghwtde) {
    ghwtde = (await import("./integrations/ghwtde.mjs")).default;
    joystickListener.onListChange(ghwtde.handleJoystickListUpdate);
  }
  joystickListener.listen();

  if (user.settings.manageMicrophones === true) {
    microphoneListener.onListChange((microphoneList) => {
      console.log("Microphone list changed: ", microphoneList);
      sendEvent(
        JSON.stringify({ type: "microphoneList", data: microphoneList }),
      );
    });

    microphoneListener.onListChange((list) => {
      if (user.paths.rpcs3) {
        rpcs3.handleMicrophoneListUpdate(
          getMicrophonesInUse(list, user.settings.unusedMicrophones ?? []),
        );
      }

      if (user.paths.ghwtde) {
        ghwtde.handleMicrophoneListUpdate(
          getMicrophonesInUse(list, user.settings.unusedMicrophones ?? []),
        );
      }
    });
    microphoneListener.listen();
  }
}

init();
