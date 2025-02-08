export interface IElectronAPI {
  // File system operations
  openDirectory: () => Promise<string>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;

  // Git operations
  gitClone: (url: string, directory: string) => Promise<void>;
  gitStatus: (directory: string) => Promise<any>;
  gitAdd: (directory: string, files: string[]) => Promise<void>;
  gitCommit: (directory: string, message: string) => Promise<void>;
  gitPush: (directory: string) => Promise<void>;
  gitPull: (directory: string) => Promise<void>;
  gitBranch: (directory: string) => Promise<string[]>;
  gitCheckout: (directory: string, branch: string) => Promise<void>;

  // Editor operations
  saveFile: (filePath: string, content: string) => Promise<void>;
  formatCode: (code: string, language: string) => Promise<string>;

  // Window operations
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;

  // System operations
  getSystemInfo: () => Promise<{
    platform: string;
    arch: string;
    version: string;
    electron: string;
    chrome: string;
    node: string;
  }>;

  // Server status
  onServerStatus: (callback: (status: string) => void) => () => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

export {};
