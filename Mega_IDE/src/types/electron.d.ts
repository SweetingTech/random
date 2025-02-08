declare global {
  interface Window {
    electron: {
      dialog: {
        openProjectFolder: () => Promise<string | null>;
      };
      settings: {
        changeCacheDirectory: () => Promise<boolean>;
      };
      ipcRenderer: {
        on: (channel: string, func: (...args: any[]) => void) => void;
        once: (channel: string, func: (...args: any[]) => void) => void;
      };
    };
  }
}

export {};
