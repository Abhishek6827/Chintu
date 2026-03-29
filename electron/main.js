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

// ─── Load embedded config (API key baked into the build) ──
function getApiKey() {
  // 1. Check environment variable first (override)
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;

  // 2. Read from config.json bundled with the app
  const configPath = path.join(__dirname, "config.json");
  try {
    const config = JSON.parse(require("fs").readFileSync(configPath, "utf-8"));
    if (config.GROQ_API_KEY) return config.GROQ_API_KEY;
  } catch {}

  return null;
}

// ─── Start embedded Express server (production only) ──────
function startServer() {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      reject(new Error("GROQ_API_KEY not found. Add it to electron/config.json"));
      return;
    }

    // Static files are in the "out" directory (Next.js export output)
    const staticDir = path.join(__dirname, "..", "out");
    const server = createServer(apiKey, staticDir);

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

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
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
    mainWindow.setOpacity(1);
    mainWindow.setSkipTaskbar(true);
    mainWindow.setIgnoreMouseEvents(false);
  }
  return isHidden;
});

ipcMain.handle("window-get-hidden", () => isHidden);

ipcMain.on("window-toggle", () => {
  if (mainWindow?.isVisible()) mainWindow.hide();
  else mainWindow?.show();
});

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
