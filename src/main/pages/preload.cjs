const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => {
    return ipcRenderer.invoke("getAppVersion");
  },
  getStoreState: () => {
    return ipcRenderer.invoke("getStoreState");
  },
  dispatchAction: (action, payload) => {
    return ipcRenderer.invoke("dispatchAction", { action, payload });
  },
  selectFolder: async () => {
    return ipcRenderer.invoke("openFolderDialog");
  },
  installAutojoyService: async () => {
    return ipcRenderer.invoke("installAutojoyService");
  },
  uninstallAutojoyService: async (removeNode = false) => {
    return ipcRenderer.invoke("uninstallAutojoyService", { removeNode });
  },
  getSystemServiceStatus: async () => {
    return ipcRenderer.invoke("getSystemServiceStatus");
  },
  stopAutojoyService: async () => {
    return ipcRenderer.invoke("stopAutojoyService");
  },
  startAutojoyService: async () => {
    return ipcRenderer.invoke("startAutojoyService");
  },
  restartAutojoyService: async () => {
    return ipcRenderer.invoke("restartAutojoyService");
  },
  getPlatform: async () => {
    return ipcRenderer.invoke("getPlatform");
  },
});
