const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window-minimize"),
  close: () => ipcRenderer.send("window-close"),
  hideToggle: () => ipcRenderer.invoke("window-hide-toggle"),   // returns Promise<boolean>
  getHidden: () => ipcRenderer.invoke("window-get-hidden"),     // returns Promise<boolean>
  toggle: () => ipcRenderer.send("window-toggle"),
  isElectron: true,
  // System audio capture is handled via getDisplayMedia + desktopCapturer loopback
  // configured in main.js — no extra IPC needed.
  supportsSystemAudio: true,
});
