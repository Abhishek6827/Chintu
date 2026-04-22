const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, desktopCapturer, session } = require("electron");
const path = require("path");
const { createServer } = require("./server");

let mainWindow = null;
let tray = null;
let isHidden = false;
let serverPort = null;

// ─── Determine runtime mode ───────────────────────────────
// In development (running from source), we load from Next.js dev server.
// In production (packaged .exe), we start the embedded Express server.
// Use --preview flag to test production server without packaging.
const isPreview = process.argv.includes("--preview");
const isDev = !app.isPackaged && !isPreview;

// ─── Load environment variables ───────────────────────────
function loadEnv() {
  try {
    require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
    require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  } catch {}

  // In production, also check next to the executable
  if (!isDev) {
    const exeDir = path.dirname(process.execPath);
    try {
      require("dotenv").config({ path: path.join(exeDir, ".env") });
      require("dotenv").config({ path: path.join(exeDir, ".env.local") });
    } catch {}
  }
}

// ─── Load all API keys (env vars + config.json fallback) ──
function getAllApiKeys() {
  const keys = [];

  // 1. Check environment variables first
  if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
  if (process.env.GROQ_API_KEY_2) keys.push(process.env.GROQ_API_KEY_2);
  if (process.env.GROQ_API_KEY_3) keys.push(process.env.GROQ_API_KEY_3);

  // 2. If no env keys found, read from config.json bundled with the app
  if (keys.length === 0) {
    const configPath = path.join(__dirname, "config.json");
    try {
      const config = JSON.parse(require("fs").readFileSync(configPath, "utf-8"));
      if (config.GROQ_API_KEY) keys.push(config.GROQ_API_KEY);
      if (config.GROQ_API_KEY_2) keys.push(config.GROQ_API_KEY_2);
      if (config.GROQ_API_KEY_3) keys.push(config.GROQ_API_KEY_3);
    } catch {}
  }

  console.log(`[Main] API keys found: ${keys.length}`);
  return keys;
}

// ─── Start embedded Express server (production only) ──────
function startServer() {
  return new Promise((resolve, reject) => {
    const apiKeys = getAllApiKeys();
    if (apiKeys.length === 0) {
      reject(new Error("No GROQ API keys found. Add them to electron/config.json or a .env file next to the executable."));
      return;
    }

    // Static files are in the "out" directory (Next.js export output)
    const staticDir = path.join(__dirname, "..", "out");
    const server = createServer(apiKeys, staticDir);

    // Listen on a random available port on localhost
    const listener = server.listen(0, "127.0.0.1", () => {
      serverPort = listener.address().port;
      console.log(`[Server] Running on http://127.0.0.1:${serverPort}`);
      resolve(serverPort);
    });

    listener.on("error", (err) => {
      reject(err);
    });
  });
}

// ─── Create main window ──────────────────────────────────
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

  // Force window to stay absolutely on top of everything, including fullscreen games/apps
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Make window invisible to screen capture (Windows)
  mainWindow.setContentProtection(true);

  // Aggressively enforce skipTaskbar so it doesn't appear in the Windows Taskbar
  mainWindow.setSkipTaskbar(true);

  // ─── System Audio Loopback ───────────────────────────────
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
      callback({ video: sources[0], audio: "loopback" });
    });
  });

  // ─── Load the app ────────────────────────────────────────
  if (isDev) {
    // Development: use Next.js dev server
    mainWindow.loadURL("http://localhost:3000/room");
  } else {
    // Production: use embedded Express server
    mainWindow.loadURL(`http://127.0.0.1:${serverPort}/room`);
  }

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

  // Aggressively keep it on top even when losing focus
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

function createTray() {
  tray = new Tray(path.join(__dirname, "icon.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show/Hide",
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible() && !isHidden) {
            mainWindow.hide();
          } else {
            isHidden = false;
            mainWindow.setOpacity(userOpacity);
            mainWindow.setIgnoreMouseEvents(false);
            mainWindow.show();
            mainWindow.setSkipTaskbar(true);
            mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
            mainWindow.webContents.send("window-hidden-change", false);
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

  tray.setToolTip("Chintu");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && !isHidden) {
        mainWindow.hide();
      } else {
        isHidden = false;
        mainWindow.setOpacity(userOpacity);
        mainWindow.setIgnoreMouseEvents(false);
        mainWindow.show();
        mainWindow.setSkipTaskbar(true);
        mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
        mainWindow.webContents.send("window-hidden-change", false);
      }
    }
  });
}

// ─── IPC handlers ─────────────────────────────────────────
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-close", () => mainWindow?.hide());

ipcMain.handle("window-hide-toggle", () => {
  if (!mainWindow) return isHidden;
  isHidden = !isHidden;
  if (isHidden) {
    mainWindow.setOpacity(0);
    mainWindow.setSkipTaskbar(true);
    mainWindow.setIgnoreMouseEvents(true);
  } else {
    mainWindow.setOpacity(userOpacity);
    mainWindow.setSkipTaskbar(true);
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  }
  mainWindow?.webContents.send("window-hidden-change", isHidden);
  return isHidden;
});

ipcMain.handle("window-get-hidden", () => isHidden);

// ─── Screenshot capture ──────────────────────────────────────
ipcMain.handle("capture-screenshot", async () => {
  if (!mainWindow) return null;
  try {
    // Briefly hide our window so it doesn't appear in the screenshot
    const wasVisible = mainWindow.isVisible() && !isHidden;
    if (wasVisible) {
      mainWindow.setOpacity(0);
    }
    
    // Small delay to ensure window is hidden
    await new Promise((r) => setTimeout(r, 150));
    
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });
    
    // Restore window
    if (wasVisible) {
      mainWindow.setOpacity(userOpacity);
    }
    
    if (sources.length === 0) return null;
    
    // Return the primary screen as base64 PNG
    const screenshot = sources[0].thumbnail.toPNG();
    return `data:image/png;base64,${screenshot.toString("base64")}`;
  } catch (err) {
    console.error("[Screenshot] Error:", err);
    // Make sure to restore opacity if something fails
    if (mainWindow) mainWindow.setOpacity(userOpacity);
    return null;
  }
});


ipcMain.on("window-toggle", () => {
  if (mainWindow?.isVisible()) mainWindow.hide();
  else {
    mainWindow?.show();
    mainWindow?.setSkipTaskbar(true);
    mainWindow?.setAlwaysOnTop(true, "screen-saver", 1);
  }
});

ipcMain.on("set-focusable", (event, b) => {
  if (mainWindow) {
    console.log("[Electron] Setting focusable to:", b);
    mainWindow.setFocusable(b);
    // Re-enforce skipTaskbar because setting focusable can sometimes reset it on Windows
    mainWindow.setSkipTaskbar(true);
  }
});

// ─── Opacity control ─────────────────────────────────────────
let userOpacity = 1;

ipcMain.on("set-opacity", (event, opacity) => {
  userOpacity = Math.max(0.1, Math.min(1, opacity));
  if (mainWindow && !isHidden) {
    mainWindow.setOpacity(userOpacity);
  }
});

ipcMain.handle("get-opacity", () => userOpacity);


// ─── App lifecycle ────────────────────────────────────────
app.whenReady().then(async () => {
  loadEnv();

  if (!isDev) {
    // Production: start the embedded server before creating the window
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

  // Add global shortcut to open dev tools for debugging
  globalShortcut.register("CommandOrControl+Shift+D", () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
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
