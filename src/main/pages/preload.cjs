/* eslint-disable */
const { contextBridge, ipcRenderer } = require("electron");

const storeSubscribers = [];

ipcRenderer.on("storeUpdate", (_, state) => {
  storeSubscribers.forEach((payload) => {
    try {
      payload(state);
    } catch (e) {
      console.error("Error in subscribeToStore listener:", e);
    }
  });
});

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
      break;
    }

    case "subscribeToStore": {
      if (typeof payload !== "function") return false;
      if (!storeSubscribers.includes(payload)) {
        storeSubscribers.push(payload);
      }
      break;
    }

    case "unsubscribeFromStore": {
      if (typeof payload !== "function") return false;
      if (storeSubscribers.includes(payload)) {
        storeSubscribers.splice(storeSubscribers.indexOf(payload), 1);
      }
      break;
    }

    default: {
      return ipcRenderer.invoke(command, payload);
    }
  }
});
