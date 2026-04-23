const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window-minimize"),
  close: () => ipcRenderer.send("window-close"),
  hideToggle: () => ipcRenderer.invoke("window-hide-toggle"),   // returns Promise<boolean>
  getHidden: () => ipcRenderer.invoke("window-get-hidden"),     // returns Promise<boolean>
  toggle: () => ipcRenderer.send("window-toggle"),
  setFocusable: (b) => ipcRenderer.send("set-focusable", b),
  setOpacity: (opacity) => ipcRenderer.send("set-opacity", opacity),
  getOpacity: () => ipcRenderer.invoke("get-opacity"),
  captureScreenshot: () => ipcRenderer.invoke("capture-screenshot"), // returns Promise<string|null>
  onHiddenChange: (callback) => {
    const handler = (_event, hidden) => callback(hidden);
    ipcRenderer.on("window-hidden-change", handler);
    return () => ipcRenderer.removeListener("window-hidden-change", handler);
  },
  isElectron: true,
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  // System audio capture is handled via getDisplayMedia + desktopCapturer loopback
  // configured in main.js — no extra IPC needed.
  supportsSystemAudio: true,

  // ─── Auto-update ──────────────────────────────────────────
  onUpdateStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("update-status", handler);
    return () => ipcRenderer.removeListener("update-status", handler);
  },
  restartForUpdate: () => ipcRenderer.send("restart-for-update"),
});

