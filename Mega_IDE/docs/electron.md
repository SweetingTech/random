# Electron Configuration

This document details the Electron setup and configuration in Mega IDE.

## Directory Structure

```
electron/
├── main.ts           # Main process
├── preload.ts        # Preload script
├── preload.d.ts      # Preload type definitions
├── tsconfig.json     # TypeScript config
└── types/            # Custom type definitions
    └── electron-is-dev.d.ts
```

## Main Process (main.ts)

The main process is responsible for:
- Creating and managing application windows
- Handling native system integration
- Managing IPC (Inter-Process Communication)
- Coordinating application lifecycle

### Window Management
```typescript
// Window creation and configuration
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
}
```

### Development vs Production
```typescript
// Environment-specific loading
if (isDev) {
  mainWindow.loadURL('http://localhost:5173');
} else {
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}
```

## Preload Script (preload.ts)

The preload script provides:
- Secure bridge between renderer and main processes
- Exposed APIs for renderer process
- Context isolation implementation

### IPC Bridge
```typescript
// Expose APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  // File system operations
  // Native dialogs
  // System information
});
```

### Security Considerations
- Context isolation enabled
- Limited API exposure
- Secure IPC communication

## Build Configuration

### Electron Forge (forge.config.js)
```javascript
module.exports = {
  packagerConfig: {
    // Application packaging settings
  },
  makers: [
    // Platform-specific builders
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // Windows installer configuration
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ]
};
```

### Development Scripts

#### run-dev.bat
```batch
# Development mode startup
npm run electron-dev
```

#### build-and-install.bat
```batch
# Production build and installation
npm run make
```

## IPC Communication

### Main to Renderer
```typescript
// Send events to renderer
mainWindow.webContents.send('event-name', data);
```

### Renderer to Main
```typescript
// Handle renderer requests
ipcMain.handle('request-name', async (event, ...args) => {
  // Handle request
  return result;
});
```

## Native Features

### File System Access
- Direct file system operations
- Native file dialogs
- Directory management

### System Integration
- Native menus
- System tray
- Global shortcuts
- Notifications

## Development Tools

### DevTools Integration
```typescript
if (isDev) {
  mainWindow.webContents.openDevTools();
}
```

### Hot Reload
- Vite integration
- Source watching
- Fast refresh

## Production Build

### Application Packaging
- Platform-specific builds
- Resource bundling
- Dependency management

### Distribution
- Windows installer (NSIS)
- macOS DMG
- Linux packages (deb, rpm)

## Security

### Context Isolation
- Renderer process sandboxing
- Limited API access
- Secure IPC channels

### CSP Configuration
- Content Security Policy
- Script restrictions
- Resource loading rules

## Performance

### Window Management
- Lazy loading
- Resource cleanup
- Memory management

### Process Communication
- Efficient IPC
- Event batching
- State synchronization

## Configuration Files

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "outDir": "../dist-electron",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["."]
}
```

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [
    // Electron build plugins
    // React integration
  ],
  build: {
    // Build configuration
  }
});
```

## Error Handling

### Process Crashes
- Crash reporting
- Recovery mechanisms
- Error logging

### IPC Errors
- Communication failures
- Request timeouts
- State recovery

## Testing

### Integration Testing
- IPC communication
- Window management
- Native features

### End-to-End Testing
- Application flow
- Cross-platform behavior
- Installation process
