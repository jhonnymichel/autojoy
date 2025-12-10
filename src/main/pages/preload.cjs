/* eslint-disable */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("autojoy", (command, payload) => {
  switch (command) {
    case "onServiceLog": {
      if (typeof payload !== "function") return false;
      ipcRenderer.on("serviceLog", (_event, line) => {
        try {
          payload(line);
        } catch (e) {
          console.error("Error in onServiceLog listener:", e);
        }
      });
      return true;
    }

    default: {
      return ipcRenderer.invoke(command, payload);
    }
  }
});
