const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, desktopCapturer, session } = require("electron");
const log = require("electron-log");
const path = require("path");
const fs = require("fs");

// Configure logging first
log.transports.file.level = "info";
log.transports.console.level = "info";
// This overrides the global console so console.log goes to the log file too
Object.assign(console, log.functions);
log.errorHandler.startCatching();

log.info("[Main] Application starting...");
log.info("[Main] Version:", app.getVersion());

// ─── Single Instance Lock & Protocol Registration ───────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      showWindow();
      mainWindow.focus();
    }
    // Deep link handling for Windows
    const url = commandLine.pop();
    if (url && url.startsWith("chintu://")) {
      console.log("[Main] Deep link received (second-instance):", url);
      // Pass the deep link URL to the renderer to handle tokens
      if (mainWindow) {
        mainWindow.webContents.send("deep-link-received", url);
      }
    }
  });
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("chintu", process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient("chintu");
}
// ─────────────────────────────────────────────────────────────


// Load token as early as possible for auto-updater
const configPath = path.join(__dirname, "config.json");
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (config.GH_TOKEN) {
      process.env.GH_TOKEN = config.GH_TOKEN;
    }
  } catch (err) {
    console.error("[Main] Error pre-loading config:", err.message);
  }
}

const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let tray = null;
let isHidden = false;
let userOpacity = 1;

// ─── Production Vercel URLs (with and without www) ───────
const VERCEL_URL = "https://getchintu.com";
const VERCEL_URL_WWW = "https://www.getchintu.com";

// ─── Helper: Check if a URL belongs to this app ───────────
function isAppUrl(url) {
  return (
    url.startsWith("http://localhost") ||
    url.startsWith("http://127.0.0.1") ||
    url.startsWith(VERCEL_URL) ||
    url.startsWith(VERCEL_URL_WWW)
  );
}

// ─── Helper: Check if a URL is part of the Clerk/OAuth auth flow ──
// These MUST stay inside the Electron window for auth to complete.
function isAuthFlowUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    return (
      // Clerk FAPI / auth domains
      host.endsWith(".getchintu.com") ||            // accounts.getchintu.com, etc.
      host.endsWith(".clerk.accounts.dev") ||        // Clerk dev domains
      host === "accounts.getchintu.com" ||           // Clerk FAPI (primary)
      // OAuth provider domains (Google, GitHub, etc.)
      host === "accounts.google.com" ||
      host.endsWith(".google.com") ||
      host === "github.com" ||
      host === "appleid.apple.com"
    );
  } catch {
    return false;
  }
}

// ─── Helper: Should this URL open in system browser? ──────
// Only truly external URLs (Stripe checkout, random links) go to browser
function shouldOpenExternal(url) {
  if (isAppUrl(url)) return false;       // Our app — stay inside
  if (isAuthFlowUrl(url)) return false;  // Auth flow — MUST stay inside
  return true;                            // Everything else → system browser
}

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


// ─── Helper: Truly hide window (invisible, not minimized) ─
function hideWindow() {
  if (!mainWindow) return;
  isHidden = true;
  mainWindow.setOpacity(0);
  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.setContentProtection(true);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.setSkipTaskbar(true);
  mainWindow.showInactive(); // Ensures window remains "shown" in OS but invisible, preventing minimize
  mainWindow.webContents.send("window-hidden-change", true);
}

// ─── Helper: Show window (visible to user, STILL invisible to screen capture) ─
function showStealthWindow() {
  if (!mainWindow) return;
  isHidden = false;
  mainWindow.setContentProtection(true); 
  mainWindow.setSkipTaskbar(true);
  mainWindow.show();
  mainWindow.setOpacity(1);
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.webContents.send("window-hidden-change", false);
  mainWindow.webContents.send("stealth-mode-change", true);
}

// ─── Helper: Show window in NORMAL MODE (Visible to everyone, in taskbar) ──
function showNormalWindow() {
  if (!mainWindow) return;
  isHidden = false;
  mainWindow.setContentProtection(false); 
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.setOpacity(1);
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.webContents.send("window-hidden-change", false);
  mainWindow.webContents.send("stealth-mode-change", false);
}

// Re-map old showWindow for compatibility if needed, or just use specific ones
const showWindow = showStealthWindow; 

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
      nativeWindowOpen: false,  // Force all window.open() through setWindowOpenHandler
    },
    title: "Chintu",
    icon: path.join(__dirname, "icon.png"),
  });

  mainWindow.setIcon(path.join(__dirname, "icon.png"));

  // Initial visibility is handled manually below

  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Hidden by default from screen capture; removed when user unhides
  mainWindow.setContentProtection(true);
  mainWindow.setSkipTaskbar(true);
  
  // ─── Set initial state: Visible on screen, HIDDEN from taskbar, and PROTECTED from screen capture ───
  isHidden = false;
  mainWindow.show();
  mainWindow.setOpacity(1);
  mainWindow.setSkipTaskbar(true);
  mainWindow.setContentProtection(true);
  mainWindow.webContents.send("stealth-mode-change", true);

  // ─── System Audio Loopback ──────────────────────────────
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
      callback({ video: sources[0], audio: "loopback" });
    });
  });

  // ─── Load the app ───────────────────────────────────────
    // In production, we load the remote Vercel URL for SaaS functionality
    const startUrl = isDev ? "http://localhost:3000/setup" : `${VERCEL_URL}/setup`;
    
    // Check if app was started with a token in the command line (Windows deep link)
    const deepLinkUrl = process.argv.find(arg => arg.startsWith("chintu://"));
    if (deepLinkUrl) {
      console.log("[Main] App started with deep link:", deepLinkUrl);
      mainWindow.loadURL(`${startUrl}${deepLinkUrl.includes('?') ? '&' : '?'}_from_deep_link=${encodeURIComponent(deepLinkUrl)}`);
    } else {
      mainWindow.loadURL(startUrl);
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

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (mainWindow.webContents.canGoBack()) {
        console.log("[Main] Escape pressed, navigating back...");
        mainWindow.webContents.goBack();
        event.preventDefault();
      }
    }
    // Alt + H or Ctrl + H for Home
    if ((input.key === 'h' || input.key === 'H') && input.type === 'keyDown' && (input.alt || input.control)) {
      console.log("[Main] Home shortcut pressed, returning to app root...");
      mainWindow.loadURL(isDev ? "http://localhost:3000" : VERCEL_URL);
      event.preventDefault();
    }
  });

  // Context menu for navigation
  mainWindow.webContents.on('context-menu', (e, props) => {
    const menu = Menu.buildFromTemplate([
      { label: 'Back', accelerator: 'Alt+Left', click: () => mainWindow.webContents.goBack(), enabled: mainWindow.webContents.canGoBack() },
      { label: 'Forward', accelerator: 'Alt+Right', click: () => mainWindow.webContents.goForward(), enabled: mainWindow.webContents.canGoForward() },
      { type: 'separator' },
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.reload() },
      { type: 'separator' },
      { label: 'Return to Chintu Home', accelerator: 'Alt+H', click: () => mainWindow.loadURL(isDev ? "http://localhost:3000" : VERCEL_URL) },
      { type: 'separator' },
      { label: 'Inspect Element', click: () => mainWindow.webContents.inspectElement(props.x, props.y) }
    ]);
    menu.popup(mainWindow);
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

  // ─── External Navigation Handler ────────────────────────
  // Strategy:
  //   - App URLs (getchintu.com, localhost) → stay in main window ✅
  //   - Auth flow URLs (accounts.getchintu.com, accounts.google.com) → stay in main window ✅
  //   - Everything else (Stripe, random links) → system browser ✅
  //   - NEVER open popups — redirect main window for auth flows

  // Layer 1: Intercept same-window navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const external = shouldOpenExternal(url);
    console.log(`[Nav] will-navigate → ${url} | external: ${external}`);

    // Force Google Account Selection screen if we're going to Google Auth
    if (url.includes("accounts.google.com/o/oauth2/auth") && !url.includes("prompt=")) {
      event.preventDefault();
      const u = new URL(url);
      u.searchParams.set("prompt", "select_account");
      mainWindow.loadURL(u.toString());
      return;
    }

    if (external) {
      event.preventDefault();
      require('electron').shell.openExternal(url);
    }
    // App URLs + Auth flow URLs proceed normally in main window
  });

  // Layer 2: setWindowOpenHandler — DENY ALL popups
  // Auth popups → redirect main window (so OAuth stays in-app)
  // External popups → system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log(`[Nav] setWindowOpenHandler → ${url}`);
    
    let targetUrl = url;
    // Force account selection for Google OAuth if it's a new window attempt
    if (url.includes("accounts.google.com/o/oauth2/auth") && !url.includes("prompt=")) {
      const u = new URL(url);
      u.searchParams.set("prompt", "select_account");
      targetUrl = u.toString();
    }
    
    if (isAppUrl(targetUrl) || isAuthFlowUrl(targetUrl)) {
      // Auth/app popup requested — DON'T create popup!
      // Instead, navigate the main window directly.
      console.log(`[Nav] Redirecting main window to: ${targetUrl} (no popup)`);
      mainWindow.loadURL(targetUrl);
      return { action: 'deny' };
    }
    
    // Truly external → system browser
    require('electron').shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  // Layer 3: Nuclear fallback — destroy any rogue popup that somehow slips through
  mainWindow.webContents.on('did-create-window', (childWindow, details) => {
    const url = details.url || '';
    console.log(`[Nav] did-create-window (rogue popup): ${url} — destroying`);
    try {
      if (isAppUrl(url)) {
        // If it somehow opened an app URL as popup, redirect main window
        mainWindow.loadURL(url);
      } else if (!isAuthFlowUrl(url) && url && url !== 'about:blank') {
        require('electron').shell.openExternal(url);
      }
      childWindow.webContents.stop();
      childWindow.destroy();
    } catch (e) {
      console.error('[Nav] Error destroying child window:', e);
    }
  });
}

// ─── Create tray ─────────────────────────────────────────
function createTray() {
  tray = new Tray(path.join(__dirname, "icon.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Chintu",
      click: () => showWindow(),
    },
    {
      label: "Hide Chintu",
      click: () => hideWindow(),
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

  // Tray click toggles visibility (Always restores to STEALTH)
  tray.on("click", () => {
    if (isHidden) showStealthWindow();
    else hideWindow();
  });
}

// ─── IPC handlers ────────────────────────────────────────
ipcMain.on("window-minimize", () => mainWindow?.minimize());

// Close button → invisible hide (NOT minimize, NOT taskbar)
ipcMain.on("window-close", () => hideWindow());

// Hide/Unhide toggle from renderer (Visible vs Invisible to USER)
ipcMain.handle("window-hide-toggle", () => {
  if (!mainWindow) return isHidden;
  
  if (isHidden) {
    showStealthWindow();
  } else {
    hideWindow();
  }
  
  return isHidden;
});

// Ghost Mode toggle from renderer (Protected vs Normal)
ipcMain.handle("window-ghost-toggle", () => {
  if (!mainWindow) return isHidden;
  
  const isProtected = mainWindow.isContentProtected();
  
  if (isProtected) {
    showNormalWindow();
  } else {
    showStealthWindow();
  }
  
  return isHidden;
});

ipcMain.handle("window-get-hidden", () => isHidden);

// ─── Screenshot capture ───────────────────────────────────
ipcMain.handle("capture-screenshot", async () => {
  if (!mainWindow) return null;
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    if (sources.length === 0) return null;

    const screenshot = sources[0].thumbnail.toPNG();
    return `data:image/png;base64,${screenshot.toString("base64")}`;
  } catch (err) {
    console.error("[Screenshot] Error:", err);
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
ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("clear-auth-session", async () => {
  console.log("[Main] Selectively clearing auth session data...");
  try {
    const { session } = require('electron');
    const cookies = await session.defaultSession.cookies.get({});
    
    // Only clear cookies related to Clerk and Chintu to allow Google/GitHub account persistence
    for (const cookie of cookies) {
      const domain = cookie.domain || "";
      if (domain.includes("clerk") || domain.includes("getchintu") || domain.includes("localhost")) {
        const protocol = cookie.secure ? "https://" : "http://";
        const host = domain.startsWith(".") ? domain.slice(1) : domain;
        const url = `${protocol}${host}${cookie.path}`;
        await session.defaultSession.cookies.remove(url, cookie.name);
      }
    }

    // Clear local storage and cache for the app only
    await session.defaultSession.clearStorageData({
      storages: ['localstorage', 'indexdb', 'cache'],
      // We don't specify origins here because it's safer to clear these 
      // but preserve the main session cookies of IDPs
    });
    
    return true;
  } catch (err) {
    console.error("[Main] Error selectively clearing session:", err);
    return false;
  }
});

// ─── Restart for update ───────────────────────────────────
ipcMain.on("restart-for-update", () => {
  app.isQuitting = true;
  autoUpdater.quitAndInstall(false, true);
});

// ─── Manual update check ──────────────────────────────────
ipcMain.on("check-for-updates", () => {
  log.info("[AutoUpdater] Manual check triggered");
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    log.error("[AutoUpdater] Manual check error:", err);
  });
});

ipcMain.on("renderer-log", (event, { msg, level }) => {
  if (log[level]) log[level](`[Renderer] ${msg}`);
  else log.info(`[Renderer] ${msg}`);
});

ipcMain.on("open-external", (event, url) => {
  console.log(`[Main] IPC open-external: ${url}`);
  require('electron').shell.openExternal(url);
});

// ─── App lifecycle ────────────────────────────────────────
app.whenReady().then(async () => {
  app.setAppUserModelId("com.chintu.app");
  if (!PROFILE_FILE) PROFILE_FILE = path.join(app.getPath("userData"), "profile.json");
  loadEnv();
  
  // ─── Resolve Razorpay 'unsafe header' and Permissions-Policy warnings ───
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const exposeHeaders = ['x-rtb-fingerprint-id', 'request-id', 'x-razorpay-signature'];
    const responseHeaders = details.responseHeaders || {};

    // Standardize lowercase for consistency with common browser expectations
    const exposeKey = 'access-control-expose-headers';
    const existingExpose = responseHeaders[exposeKey] || responseHeaders['Access-Control-Expose-Headers'] || [];
    const currentExpose = Array.isArray(existingExpose) ? existingExpose : [existingExpose];
    const combinedExpose = Array.from(new Set([...currentExpose, ...exposeHeaders]));
    
    // Set both to be safe, though most modern systems prefer lowercase
    responseHeaders[exposeKey] = combinedExpose;
    
    // Also inject Permissions-Policy header directly (often more effective than meta tag)
    responseHeaders['Permissions-Policy'] = 'accelerometer=*, camera=*, geolocation=*, gyroscope=*, magnetometer=*, microphone=*, payment=*, usb=*';

    callback({ responseHeaders });
  });




  // ─── App Setup ──────────────────────────────────────────
  app.name = "Chintu";

  createWindow();
  createTray();

  if (!isDev) {
    setupAutoUpdater();
  }

  // ─── Universal Shortcuts Management ────────────────────────
  let universalShortcutsEnabled = false;

  function registerUniversalShortcuts() {
    // Unregister first to avoid duplicates
    globalShortcut.unregister("Space");
    globalShortcut.unregister("Enter");

    // WARNING: Registering "Space" globally will block the spacebar in ALL other apps.
    globalShortcut.register("Space", () => {
      if (mainWindow) {
        mainWindow.webContents.send("trigger-universal-recording");
      }
    });

    // WARNING: Registering "Enter" globally will block the Enter key in ALL other apps.
    globalShortcut.register("Enter", () => {
      if (mainWindow) {
        mainWindow.webContents.send("trigger-universal-screenshot");
      }
    });
    console.log("[Main] Universal shortcuts registered");
  }

  function unregisterUniversalShortcuts() {
    globalShortcut.unregister("Space");
    globalShortcut.unregister("Enter");
    console.log("[Main] Universal shortcuts unregistered");
  }

  ipcMain.handle("set-universal-shortcuts", (event, enabled) => {
    universalShortcutsEnabled = enabled;
    if (enabled) {
      registerUniversalShortcuts();
    } else {
      unregisterUniversalShortcuts();
    }
    return universalShortcutsEnabled;
  });

  ipcMain.handle("get-universal-shortcuts", () => {
    return universalShortcutsEnabled;
  });

  // ─── Standard App Shortcuts ───────────────────────────────
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

// ─── Profile Storage (File-based for persistence) ────────
let PROFILE_FILE = null;
try { PROFILE_FILE = path.join(app.getPath("userData"), "profile.json"); } catch (e) { /* deferred */ }

ipcMain.handle("save-profile", (event, profile) => {
  try {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving profile:", err);
    return false;
  }
});




ipcMain.handle("save-video", async (event, arrayBuffer) => {
  try {
    const buffer = Buffer.from(arrayBuffer);
    const videosDir = path.join(app.getPath("videos"), "Chintu Recordings");
    
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const filename = `recording-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
    const filePath = path.join(videosDir, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`[Main] Stealth recording saved to: ${filePath}`);
    return { success: true, path: filePath };
  } catch (err) {
    console.error("[Main] Error saving recording:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("load-profile", () => {

  try {
    if (fs.existsSync(PROFILE_FILE)) {
      return JSON.parse(fs.readFileSync(PROFILE_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
  return null;
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

// ─── Auto-Updater Setup ───────────────────────────────────
function setupAutoUpdater() {
  const { dialog } = require("electron");

  // Logger setup
  autoUpdater.logger = log;
  log.info("[AutoUpdater] Setup started");

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Ensure headers are set if token exists
  if (process.env.GH_TOKEN) {
    autoUpdater.requestHeaders = {
      "Authorization": `token ${process.env.GH_TOKEN}`,
      "Accept": "application/vnd.github.v3+json"
    };
    log.info("[AutoUpdater] GH_TOKEN found, headers configured");
  } else {
    log.warn("[AutoUpdater] GH_TOKEN NOT found, update checks on private repo will fail");
  }

  autoUpdater.on("checking-for-update", () => {
    if (mainWindow) mainWindow.webContents.send("update-status", { status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { status: "downloading", version: info.version, percent: 0 });
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { 
        status: "downloading", 
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
        speed: progress.bytesPerSecond
      });
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[AutoUpdater] Update downloaded:", info.version);
    
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { status: "ready", version: info.version });
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("[AutoUpdater] No update available. Current version:", info.version);
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { status: "up-to-date", version: info.version });
    }
  });

  autoUpdater.on("error", (err) => {
    const errorMsg = err.message || String(err);
    console.error("[AutoUpdater] Error:", errorMsg);
    if (mainWindow) {
      mainWindow.webContents.send("update-status", { 
        status: "error", 
        message: errorMsg 
      });
    }
    // Only show dialog for non-auth errors to avoid annoying popups if token is just expired
    if (!errorMsg.includes("401") && !errorMsg.includes("403")) {
      dialog.showErrorBox("Update Error", `Failed to check for updates: ${errorMsg}`);
    }
  });

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.error("[AutoUpdater] Check error:", err);
    });
  }, 5000);

  // ─── Periodic update check every 30 minutes ─────────────
  setInterval(() => {
    console.log("[AutoUpdater] Periodic check for updates...");
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.error("[AutoUpdater] Periodic check error:", err);
    });
  }, 30 * 60 * 1000);

  // ─── Debug Shortcut for Updates ─────────────────────────
  globalShortcut.register("CommandOrControl+Shift+U", () => {
    const tokenPresent = !!process.env.GH_TOKEN;
    const version = app.getVersion();
    const packaged = app.isPackaged;
    
    dialog.showMessageBox({
      title: "Update Debug Info",
      message: `Version: ${version}\nPackaged: ${packaged}\nToken Present: ${tokenPresent}\n\nChecking for updates now...`,
      buttons: ["OK"]
    });
    autoUpdater.checkForUpdatesAndNotify();
  });
}