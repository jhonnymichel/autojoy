import { user } from "./settings.mjs";
import { deviceListener } from "./device-listener.mjs";
import rpcs3 from "./integrations/rpcs3.mjs";

console.log("input server started. settings:", user.settings);
deviceListener.onListChange((deviceList) => {
  console.log("device list changed: ", deviceList);
  process.send(JSON.stringify({ type: "deviceList", data: deviceList }));
});
deviceListener.onListChange(rpcs3.handleDeviceListUpdate);

deviceListener.listen();
