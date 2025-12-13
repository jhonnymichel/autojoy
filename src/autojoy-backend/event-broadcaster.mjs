import ipc from "node-ipc";
import { joystickListener } from "./joystick-listener.mjs";

const backendMode = process.env.AUTOJOY_BACKEND_MODE;

const sockets = [];

if (backendMode === "service") {
  ipc.config.id = "autojoy-backend";
  ipc.config.retry = 500;
  ipc.config.silent = true;
  ipc.serve(() => {
    console.log("IPC server started");
    ipc.server.on("request-joystick-list", (entity, socket) => {
      if (entity === "autojoy-app") {
        sockets.push(socket);
        console.log("sending joystick list to app");
        ipc.server.emit(
          socket,
          "event",
          JSON.stringify({
            type: "joystickList",
            data: joystickListener.getJoystickList(),
          }),
        );
      }
    });
  });
  ipc.server.start();
}

function sendIPCEvent(...args) {
  for (const socket of sockets) {
    ipc.server.emit(socket, "event", ...args);
  }
}

function sendEventToParent(...args) {
  if (process.send) {
    process.send(...args);
  }
}

const method = backendMode === "service" ? sendIPCEvent : sendEventToParent;

export function sendEvent(...args) {
  method(...args);
}
