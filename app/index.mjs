import { user } from "./settings.mjs";
import { joystickListener } from "./joystick-listener.mjs";
import rpcs3 from "./integrations/rpcs3.mjs";
import { microphoneListener } from "./microphone-listener.mjs";
import { getMicrophonesInUse } from "./deviceFilters.mjs";

console.log("input server started. settings:", user.settings);
joystickListener.onListChange((joystickList) => {
  console.log("joystick list changed: ", joystickList);
  process.send(JSON.stringify({ type: "joystickList", data: joystickList }));
});

joystickListener.onListChange(rpcs3.handleJoystickListUpdate);
joystickListener.listen();

if (user.settings.manageMicrophones === true) {
  microphoneListener.onListChange((microphoneList) => {
    console.log("microphone list changed: ", microphoneList);
    process.send(
      JSON.stringify({ type: "microphoneList", data: microphoneList })
    );
  });

  microphoneListener.onListChange((list) => {
    rpcs3.handleMicrophoneListUpdate(
      getMicrophonesInUse(list, user.settings.unusedMicrophones ?? [])
    );
  });
  microphoneListener.listen();
}
