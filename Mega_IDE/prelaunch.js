const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let configWindow = null;

const createConfigWindow = () => {
  configWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'prelaunch.preload.js')
    },
    resizable: false,
    frame: true,
    title: 'Mega IDE Configuration'
  });

  configWindow.loadFile('prelaunch.html');
};

app.whenReady().then(createConfigWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createConfigWindow();
  }
});

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(configWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Cache Directory',
    buttonLabel: 'Select Directory'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Handle app start
ipcMain.on('start-app', (event, config) => {
  const env = Object.assign({}, process.env, {
    USE_CPU_MODE: config.cpuMode ? 'true' : 'false',
    CACHE_FOLDER: config.cacheFolder,
    NODE_ENV: 'development',
    VITE_SOCKET_SERVER_PORT: '3000',
    API_SERVER_PORT: '3000'
  });

  const npmCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  // Start the backend server
  const serverProcess = spawn(npmCmd, ['node', 'server.mjs'], {
    env,
    stdio: 'inherit',
    shell: true
  });

  // Start Vite development server
  const viteProcess = spawn(npmCmd, ['vite'], {
    env,
    stdio: 'inherit',
    shell: true
  });

  // Wait a bit for the servers to start
  setTimeout(() => {
    // Start Electron
    const electronProcess = spawn(npmCmd, ['electron', '.'], {
      env,
      stdio: 'inherit',
      shell: true
    });

    // Handle process cleanup
    const cleanup = () => {
      serverProcess.kill();
      viteProcess.kill();
      electronProcess.kill();
      process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    electronProcess.on('exit', (code) => {
      cleanup();
    });
  }, 5000);

  // Close the config window
  configWindow.close();
});
