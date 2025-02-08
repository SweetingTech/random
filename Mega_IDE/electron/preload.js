const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    dialog: {
      openProjectFolder: () => ipcRenderer.invoke('dialog:openProjectFolder')
    },
    settings: {
      changeCacheDirectory: () => ipcRenderer.invoke('settings:changeCacheDirectory')
    },
    ipcRenderer: {
      on: (channel, func) => {
        const validChannels = ['main-process-message', 'error'];
        if (validChannels.includes(channel)) {
          // Strip event as it includes `sender` and other internal electron stuff
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      },
      once: (channel, func) => {
        const validChannels = ['main-process-message', 'error'];
        if (validChannels.includes(channel)) {
          // Strip event as it includes `sender` and other internal electron stuff
          ipcRenderer.once(channel, (event, ...args) => func(...args));
        }
      }
    }
  }
);
