const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, desktopCapturer, session } = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;
let isHidden = false; // tracks skipTaskbar state (no Electron getter exists)
const isDev = process.env.NODE_ENV !== "production";
const SERVER_URL = "http://localhost:3000";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 700,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Make window invisible to screen capture (Windows)
  mainWindow.setContentProtection(true);

  // ─── System Audio Loopback ───────────────────────────────
  // Intercept getDisplayMedia requests from the renderer.
  // By passing audio: 'loopback', Electron captures system audio
  // (whatever is playing through speakers) without a virtual cable.
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
      // Grant the first screen source + loopback audio automatically
      callback({ video: sources[0], audio: "loopback" });
    });
  });

  // Load the app
  mainWindow.loadURL(SERVER_URL + "/room");

  // Set window position (bottom-right corner)
  const { screen } = require("electron");
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(screenW - 460, screenH - 720);

  // Hide to tray instead of closing
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Prevent window from being captured by screenshot tools
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

function createTray() {
  // Use a simple icon — in production you'd use a proper .ico/.png
  tray = new Tray(
    path.join(__dirname, "icon.png")
  );

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show/Hide",
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible() && !isHidden) {
            mainWindow.hide();
          } else {
            // Ensure fully visible
            isHidden = false;
            mainWindow.setOpacity(1);
            mainWindow.setIgnoreMouseEvents(false);
            mainWindow.show();
          }
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Interview Copilot");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && !isHidden) {
        mainWindow.hide();
      } else {
        isHidden = false;
        mainWindow.setOpacity(1);
        mainWindow.setIgnoreMouseEvents(false);
        mainWindow.show();
      }
    }
  });
}

// IPC handlers for window controls
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-close", () => mainWindow?.hide());

// Toggle hide: makes window fully invisible (hidden from screen + taskbar) or visible again
ipcMain.handle("window-hide-toggle", () => {
  if (!mainWindow) return isHidden;
  isHidden = !isHidden;
  if (isHidden) {
    mainWindow.setOpacity(0);          // make it invisible
    mainWindow.setSkipTaskbar(true);   // hide from taskbar
    mainWindow.setIgnoreMouseEvents(true); // click-through when hidden
  } else {
    mainWindow.setOpacity(1);          // make it visible again
    mainWindow.setSkipTaskbar(true);   // always skip taskbar (stealth)
    mainWindow.setIgnoreMouseEvents(false);
  }
  return isHidden;
});

// Getter so renderer can check initial state
ipcMain.handle("window-get-hidden", () => isHidden);

ipcMain.on("window-toggle", () => {
  if (mainWindow?.isVisible()) mainWindow.hide();
  else mainWindow?.show();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Prevent app from quitting when window is closed (minimize to tray)
app.on("before-quit", () => {
  app.isQuitting = true;
});
