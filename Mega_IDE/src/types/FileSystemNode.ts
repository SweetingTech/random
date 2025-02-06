export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemNode[];
  content?: string;
  language?: string;
}

export interface SocketResponse {
  root: FileSystemNode;
}

export interface FileContentResponse {
  path: string;
  content: string;
}

export interface AIResponse {
  content: string;
}

export interface FileOperation {
  path: string;
  content?: string;
}

export type FileOperationError = {
  message: string;
  code?: string;
  path?: string;
}
