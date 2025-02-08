"use strict";
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
if (process.env.USE_CPU_MODE === "true") {
  console.log("CPU mode selected. Disabling hardware acceleration.");
  app.disableHardwareAcceleration();
} else {
  console.log("GPU mode selected. Hardware acceleration enabled.");
}
const getSettingsPath = () => path.join(app.getPath("userData"), "settings.json");
const loadSettings = () => {
  const settingsPath = getSettingsPath();
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      console.log("Loaded settings:", settings);
      return settings;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return {};
};
const saveSettings = (settings) => {
  const settingsPath = getSettingsPath();
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log("Saved settings:", settings);
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};
const promptForCacheDirectory = async () => {
  const result = await dialog.showOpenDialog({
    title: "Select Cache Directory",
    properties: ["openDirectory", "createDirectory"],
    message: "Please select a directory for Mega IDE to store its cache files",
    buttonLabel: "Select Cache Directory"
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
};
const promptForProjectFolder = async () => {
  const result = await dialog.showOpenDialog({
    title: "Open Project Folder",
    properties: ["openDirectory"],
    message: "Select a project folder to open",
    buttonLabel: "Open Folder"
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
};
const setupCacheDirectory = async () => {
  let settings = loadSettings();
  let cachePath = settings.cachePath;
  if (process.env.CACHE_FOLDER && process.env.CACHE_FOLDER.trim() !== "") {
    console.log("Using cache folder from environment:", process.env.CACHE_FOLDER);
    cachePath = process.env.CACHE_FOLDER;
    settings.cachePath = cachePath;
    saveSettings(settings);
  }
  if (!cachePath) {
    console.log("No cache path found in settings...");
    cachePath = path.join(app.getPath("userData"), "Cache");
    settings.cachePath = cachePath;
    saveSettings(settings);
    console.log("Using default cache path:", cachePath);
  }
  console.log("Using cache path:", cachePath);
  if (!fs.existsSync(cachePath)) {
    console.log("Creating cache directory...");
    try {
      fs.mkdirSync(cachePath, { recursive: true });
      console.log("Cache directory created successfully");
    } catch (error) {
      console.error("Error creating cache directory:", error);
      throw new Error("Unable to create cache directory");
    }
  }
  app.setPath("cache", cachePath);
  process.env.MEGA_IDE_CACHE_PATH = cachePath;
  return cachePath;
};
let mainWindow = null;
const createWindow = async () => {
  try {
    await setupCacheDirectory();
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        preload: path.join(__dirname, "preload.js")
      }
    });
    if (process.env.NODE_ENV === "development") {
      await mainWindow.loadURL("http://localhost:5174");
      if (process.env.OPEN_DEVTOOLS === "true") {
        mainWindow.webContents.openDevTools();
      }
    } else {
      await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
    mainWindow.webContents.on("did-finish-load", () => {
      mainWindow == null ? void 0 : mainWindow.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    });
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (error) {
    console.error("Error creating window:", error);
    app.quit();
  }
};
ipcMain.handle("dialog:openProjectFolder", async () => {
  if (!mainWindow) return null;
  return promptForProjectFolder();
});
ipcMain.handle("settings:changeCacheDirectory", async () => {
  const newCachePath = await promptForCacheDirectory();
  if (newCachePath) {
    const settings = loadSettings();
    settings.cachePath = newCachePath;
    saveSettings(settings);
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Restart Required",
      message: "The cache directory has been changed. Please restart Mega IDE for the changes to take effect.",
      buttons: ["OK"]
    });
    return true;
  }
  return false;
});
app.whenReady().then(createWindow).catch(console.error);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow().catch(console.error);
  }
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  if (mainWindow) {
    mainWindow.webContents.send("error", error.message);
  }
});
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  if (mainWindow) {
    mainWindow.webContents.send("error", error.message);
  }
});
