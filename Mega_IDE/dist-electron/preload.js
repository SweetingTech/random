"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "electron",
  {
    dialog: {
      openProjectFolder: () => ipcRenderer.invoke("dialog:openProjectFolder")
    },
    settings: {
      changeCacheDirectory: () => ipcRenderer.invoke("settings:changeCacheDirectory")
    },
    ipcRenderer: {
      on: (channel, func) => {
        const validChannels = ["main-process-message", "error"];
        if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      },
      once: (channel, func) => {
        const validChannels = ["main-process-message", "error"];
        if (validChannels.includes(channel)) {
          ipcRenderer.once(channel, (event, ...args) => func(...args));
        }
      }
    }
  }
);
