export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemNode[];
  content?: string;
  language?: string;
}

// Git Types
export interface GitStatus {
  staged: string[];
  not_staged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface GitRepository {
  path: string;
  remote?: string;
  branch?: string;
}

export interface GitCommitResult {
  hash: string;
  message: string;
}

export interface GitOperationResult {
  success: boolean;
  message: string;
}

// ZIP Types
export interface ZipCreationResult {
  fileName: string;
  data: string; // base64 encoded zip data
}

// Socket Types
export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  root?: FileSystemNode;
  content?: string;
}

export interface FileContentResponse {
  path: string;
  content: string;
  language?: string;
}

export interface AIResponse {
  suggestions: string;
  content: string;
  error?: string;
}

export interface FileOperation {
  type: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  newPath?: string; // for rename operations
  content?: string; // for create/update operations
}

export interface FileOperationError {
  operation: FileOperation;
  message: string;
}

// Git Types
export interface GitStatus {
  staged: string[];
  not_staged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface GitRepository {
  path: string;
  remote?: string;
  branch?: string;
}

export interface GitCommitResult {
  hash: string;
  message: string;
  success: boolean;
  error?: string;
}

export interface GitOperationResult {
  success: boolean;
  message: string;
  error?: string;
}

// ZIP Types
export interface ZipCreationResult {
  fileName: string;
  data: string; // base64 encoded zip data
}
