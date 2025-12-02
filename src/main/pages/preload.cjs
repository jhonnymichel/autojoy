const { contextBridge, ipcRenderer } = require("electron");
const petiteVue = require("petite-vue");

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
});

contextBridge.exposeInMainWorld("petiteVue", petiteVue);
