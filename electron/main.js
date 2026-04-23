const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, desktopCapturer, session } = require("electron");
const path = require("path");
const { createServer } = require("./server");
const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let tray = null;
let isHidden = false;
let serverPort = null;
let userOpacity = 1;

// ─── Determine runtime mode ───────────────────────────────
const isPreview = process.argv.includes("--preview");
const isDev = !app.isPackaged && !isPreview;

// ─── Load environment variables ───────────────────────────
function loadEnv() {
  try {
    require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
    require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  } catch {}

  if (!isDev) {
    const exeDir = path.dirname(process.execPath);
    try {
      require("dotenv").config({ path: path.join(exeDir, ".env") });
      require("dotenv").config({ path: path.join(exeDir, ".env.local") });
    } catch {}
  }
}

// ─── Load all API keys ────────────────────────────────────
function getAllApiKeys() {
  const keys = [];
  let openRouterKey = "";

  if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
  if (process.env.GROQ_API_KEY_2) keys.push(process.env.GROQ_API_KEY_2);
  if (process.env.GROQ_API_KEY_3) keys.push(process.env.GROQ_API_KEY_3);
  if (process.env.OPENROUTER_API_KEY) openRouterKey = process.env.OPENROUTER_API_KEY;

  if (keys.length === 0) {
    const configPath = path.join(__dirname, "config.json");
    try {
      const config = JSON.parse(require("fs").readFileSync(configPath, "utf-8"));
      if (config.GROQ_API_KEY) keys.push(config.GROQ_API_KEY);
      if (config.GROQ_API_KEY_2) keys.push(config.GROQ_API_KEY_2);
      if (config.GROQ_API_KEY_3) keys.push(config.GROQ_API_KEY_3);
      if (!openRouterKey && config.OPENROUTER_API_KEY) openRouterKey = config.OPENROUTER_API_KEY;
    } catch {}
  }

  console.log(`[Main] Groq keys found: ${keys.length}, OpenRouter: ${openRouterKey ? "yes" : "no"}`);
  return { groqKeys: keys, openRouterKey };
}

// ─── Start embedded Express server (production only) ──────
function startServer() {
  return new Promise((resolve, reject) => {
    const { groqKeys, openRouterKey } = getAllApiKeys();
    if (groqKeys.length === 0 && !openRouterKey) {
      reject(new Error("No API keys found. Add them to electron/config.json or a .env file next to the executable."));
      return;
    }

    const staticDir = path.join(__dirname, "..", "out");
    const server = createServer(groqKeys, openRouterKey, staticDir);

    const listener = server.listen(0, "127.0.0.1", () => {
      serverPort = listener.address().port;
      console.log(`[Server] Running on http://127.0.0.1:${serverPort}`);
      resolve(serverPort);
    });

    listener.on("error", (err) => reject(err));
  });
}

// ─── Helper: Truly hide window (invisible, not minimized) ─
function hideWindow() {
  if (!mainWindow) return;
  isHidden = true;
  // Ghost Mode: Visible to user, but hidden from taskbar and capture
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setSkipTaskbar(true);
  mainWindow.setContentProtection(true);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.webContents.send("window-hidden-change", true);
}

// ─── Helper: Show window (visible in screen + screenshots) ─
function showWindow() {
  if (!mainWindow) return;
  isHidden = false;
  // Normal Mode: Visible to everyone and in taskbar
  mainWindow.setContentProtection(false);
  mainWindow.setIgnoreMouseEvents(false);
  // Ensure window is actually rendered
  mainWindow.show();
  mainWindow.setSkipTaskbar(false);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.webContents.send("window-hidden-change", false);
}

// ─── Helper: Bring window to front WITHOUT changing hidden state ─
function bringToFront() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
}

// ─── Create main window ───────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 700,
    minWidth: 200,
    minHeight: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    show: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "icon.png"),
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.setSkipTaskbar(true);
    mainWindow.show();
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Hidden by default from screen capture; removed when user unhides
  mainWindow.setContentProtection(true);
  mainWindow.setSkipTaskbar(true);

  // ─── System Audio Loopback ──────────────────────────────
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
      callback({ video: sources[0], audio: "loopback" });
    });
  });

  // ─── Load the app ───────────────────────────────────────
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000/room");
  } else {
    mainWindow.loadURL(`http://127.0.0.1:${serverPort}/room`);
  }

  // Set window position (bottom-right corner)
  const { screen } = require("electron");
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(screenW - 460, screenH - 720);

  // Intercept close → use hideWindow() so it stays invisible (not minimized)
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      hideWindow();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Aggressively keep on top even when losing focus
  mainWindow.on("blur", () => {
    if (mainWindow && !isHidden) {
      mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
    }
  });

  mainWindow.on("always-on-top-changed", (event, isAlwaysOnTop) => {
    if (!isAlwaysOnTop && mainWindow && !isHidden) {
      mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
    }
  });
}

// ─── Create tray ─────────────────────────────────────────
function createTray() {
  tray = new Tray(path.join(__dirname, "icon.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Bring to Front",
      click: () => bringToFront(),
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

  tray.setToolTip("Chintu");
  tray.setContextMenu(contextMenu);

  // Tray click only brings window to front — NEVER changes hidden state
  tray.on("click", () => bringToFront());
}

// ─── IPC handlers ────────────────────────────────────────
ipcMain.on("window-minimize", () => mainWindow?.minimize());

// Close button → invisible hide (NOT minimize, NOT taskbar)
ipcMain.on("window-close", () => hideWindow());

// Hide/Unhide toggle from renderer
ipcMain.handle("window-hide-toggle", () => {
  if (!mainWindow) return isHidden;
  if (!isHidden) hideWindow();   // opacity=0, protection ON, taskbar hidden
  else showWindow();              // opacity=userOpacity, protection OFF, taskbar visible
  return isHidden;
});

ipcMain.handle("window-get-hidden", () => isHidden);

// ─── Screenshot capture ───────────────────────────────────
ipcMain.handle("capture-screenshot", async () => {
  if (!mainWindow) return null;
  try {
    const wasVisible = !isHidden;

    if (wasVisible) {
      // Temporarily make invisible + remove content protection for capture
      mainWindow.setOpacity(0);
      mainWindow.setContentProtection(false);
    }

    await new Promise((r) => setTimeout(r, 150));

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    if (wasVisible) {
      // Restore window to fully opaque (CSS handles visual opacity)
      mainWindow.setOpacity(1);
      // Note: content protection stays OFF because window is in "shown" state
    }

    if (sources.length === 0) return null;

    const screenshot = sources[0].thumbnail.toPNG();
    return `data:image/png;base64,${screenshot.toString("base64")}`;
  } catch (err) {
    console.error("[Screenshot] Error:", err);
    if (mainWindow) mainWindow.setOpacity(1);
    return null;
  }
});

// window-toggle (global shortcut style toggle)
ipcMain.on("window-toggle", () => {
  if (!isHidden) hideWindow();
  else showWindow();
});

ipcMain.on("set-focusable", (event, b) => {
  if (mainWindow) {
    console.log("[Electron] Setting focusable to:", b);
    mainWindow.setFocusable(b);
    mainWindow.setSkipTaskbar(true);
  }
});

// ─── Opacity control ──────────────────────────────────────
// Opacity is handled via CSS in the renderer, not window-level.
// This just stores the value so it can be retrieved on page reload.
ipcMain.on("set-opacity", (event, opacity) => {
  userOpacity = Math.max(0.1, Math.min(1, opacity));
});

ipcMain.handle("get-opacity", () => userOpacity);

// ─── App lifecycle ────────────────────────────────────────
app.whenReady().then(async () => {
  loadEnv();

  if (!isDev) {
    try {
      await startServer();
    } catch (err) {
      const { dialog } = require("electron");
      dialog.showErrorBox(
        "Startup Error",
        `Failed to start the server:\n\n${err.message}\n\nMake sure you have a .env file with GROQ_API_KEY next to the executable.`
      );
      app.quit();
      return;
    }
  }

  createWindow();
  createTray();

  if (!isDev) {
    setupAutoUpdater();
  }

  globalShortcut.register("CommandOrControl+Shift+D", () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (mainWindow) {
      if (!isHidden) hideWindow();
      else showWindow();
    }
  });
});

// ─── Auto-Updater Setup ───────────────────────────────────
function setupAutoUpdater() {
  try {
    const configPath = path.join(__dirname, "config.json");
    const config = JSON.parse(require("fs").readFileSync(configPath, "utf-8"));
    if (config.GH_TOKEN) {
      process.env.GH_TOKEN = config.GH_TOKEN;
      console.log("[AutoUpdater] GitHub token loaded for private repo access");
    }
  } catch {}

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[AutoUpdater] Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("[AutoUpdater] Update available:", info.version);
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { status: "downloading", version: info.version });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[AutoUpdater] App is up to date.");
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(`[AutoUpdater] Download: ${Math.round(progress.percent)}%`);
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { status: "downloading", percent: Math.round(progress.percent) });
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[AutoUpdater] Update downloaded:", info.version);
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { status: "ready", version: info.version });
    }
  });

  autoUpdater.on("error", (err) => {
    console.error("[AutoUpdater] Error:", err.message);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.warn("[AutoUpdater] Check failed:", err.message);
    });
  }, 5000);
}

// ─── IPC: Restart to apply update ────────────────────────
ipcMain.on("restart-for-update", () => {
  autoUpdater.quitAndInstall(false, true);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  app.isQuitting = true;
});