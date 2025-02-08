/// <reference types="electron" />

declare namespace Electron {
  interface BrowserWindow {
    loadURL(url: string): Promise<void>;
    loadFile(filePath: string): Promise<void>;
    minimize(): void;
    maximize(): void;
    unmaximize(): void;
    isMaximized(): boolean;
    close(): void;
    webContents: Electron.WebContents;
    on(event: string, listener: Function): this;
  }

  interface WebContents {
    openDevTools(): void;
    setWindowOpenHandler(handler: (details: { url: string }) => { action: 'deny' | 'allow' }): void;
  }
}

declare module 'electron' {
  export const app: {
    quit(): void;
    whenReady(): Promise<void>;
    on(event: string, listener: Function): void;
    getPath(name: string): string;
    getVersion(): string;
  };

  export const BrowserWindow: {
    new(options: any): Electron.BrowserWindow;
    getAllWindows(): Electron.BrowserWindow[];
  };

  export const ipcMain: {
    handle(channel: string, listener: (event: any, ...args: any[]) => any): void;
  };

  export const dialog: {
    showOpenDialog(window: Electron.BrowserWindow, options: any): Promise<{ filePaths: string[] }>;
  };

  export const shell: {
    openExternal(url: string): Promise<void>;
  };
}
