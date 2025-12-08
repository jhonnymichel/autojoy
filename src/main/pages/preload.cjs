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
  installAutojoyService: async () => {
    return ipcRenderer.invoke("installAutojoyService"); // Calls the main process
  },
  uninstallAutojoyService: async (removeNode = false) => {
    return ipcRenderer.invoke("uninstallAutojoyService", { removeNode }); // Calls the main process
  },
  getSystemServiceStatus: async () => {
    return ipcRenderer.invoke("getSystemServiceStatus"); // Calls the main process
  },
  stopAutojoyService: async () => {
    return ipcRenderer.invoke("stopAutojoyService"); // Calls the main process
  },
  startAutojoyService: async () => {
    return ipcRenderer.invoke("startAutojoyService"); // Calls the main process
  },
  restartAutojoyService: async () => {
    return ipcRenderer.invoke("restartAutojoyService"); // Calls the main process
  },
});
