const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => {
    return ipcRenderer.invoke("getAppVersion");
  },
});
