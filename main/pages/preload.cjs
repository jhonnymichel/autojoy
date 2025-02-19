const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => {
    return ipcRenderer.invoke("getAppVersion");
  },
  getUser: () => {
    return ipcRenderer.invoke("getUser");
  },
  setPaths: (paths) => {
    return ipcRenderer.invoke("setPaths", paths);
  },
  selectFolder: async () => {
    return ipcRenderer.invoke("openFolderDialog"); // Calls the main process
  },
});
