import { deviceListener } from "./app/device-listener.mjs";
import rpcs3 from "./app/integrations/rpcs3.mjs";

deviceListener.onListChange(rpcs3.handleDeviceListUpdate);
deviceListener.listen();
