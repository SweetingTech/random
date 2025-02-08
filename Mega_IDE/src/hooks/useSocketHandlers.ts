import { useEffect, useState, useCallback } from 'react';
import SocketManager from '../lib/socket';
import { 
  FileSystemNode, 
  SocketResponse, 
  FileContentResponse, 
  AIResponse,
  FileOperation,
  FileOperationError
} from '../types/FileSystemNode';

interface UseSocketHandlersProps {
  setFileSystem: React.Dispatch<React.SetStateAction<FileSystemNode | null>>;
  setActiveFile: React.Dispatch<React.SetStateAction<FileSystemNode | null>>;
  activeFile: FileSystemNode | null;
  setAiResponse: React.Dispatch<React.SetStateAction<string | null>>;
}

interface SocketState {
  isLoadingFileSystem: boolean;
  isLoadingFile: boolean;
  isProcessingAI: boolean;
  error: FileOperationError | null;
  isConnected: boolean;
}

const createSocketError = (message: string): FileOperationError => ({
  operation: {
    type: 'update',
    path: 'socket',
  },
  message
});

export const useSocketHandlers = ({ 
  setFileSystem, 
  setActiveFile, 
  activeFile, 
  setAiResponse 
}: UseSocketHandlersProps) => {
  const socketManager = SocketManager.getInstance();
  const [socketState, setSocketState] = useState<SocketState>({
    isLoadingFileSystem: false,
    isLoadingFile: false,
    isProcessingAI: false,
    error: null,
    isConnected: false
  });

  // Try to connect when the hook is first used
  useEffect(() => {
    socketManager.connect().then(() => {
      setSocketState(prev => ({ 
        ...prev, 
        isConnected: socketManager.isConnected() 
      }));
    });
  }, []);

  const clearError = useCallback(() => {
    setSocketState(prev => ({ ...prev, error: null }));
  }, []);

  const handleFolderSelect = useCallback((folderPath: string) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('Server connection not available - some features may be limited')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, isLoadingFileSystem: true, error: null }));
    socketManager.emit('openFolder', folderPath);
  }, []);

  const handleFileSelect = useCallback((filePath: string) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('Server connection not available - some features may be limited')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, isLoadingFile: true, error: null }));
    socketManager.emit('requestFile', filePath);
  }, []);

  const handleCreateFile = useCallback((operation: FileOperation) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('Server connection not available - some features may be limited')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, error: null }));
    socketManager.emit('createFile', operation);
  }, []);

  const handleCreateFolder = useCallback((operation: FileOperation) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('Server connection not available - some features may be limited')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, error: null }));
    socketManager.emit('createFolder', operation);
  }, []);

  const handleRename = useCallback((oldPath: string, newPath: string) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('Server connection not available - some features may be limited')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, error: null }));
    socketManager.emit('rename', { oldPath, newPath });
  }, []);

  const handleDelete = useCallback((path: string) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('Server connection not available - some features may be limited')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, error: null }));
    socketManager.emit('delete', { path });
  }, []);

  const handleSaveFile = useCallback((operation: FileOperation) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('Server connection not available - some features may be limited')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, error: null }));
    socketManager.emit('saveFile', operation);
  }, []);

  const handleRequestAI = useCallback((prompt: string) => {
    if (!socketManager.isConnected()) {
      setSocketState(prev => ({ 
        ...prev, 
        error: createSocketError('AI features require server connection')
      }));
      return;
    }
    setSocketState(prev => ({ ...prev, isProcessingAI: true, error: null }));
    setAiResponse('Analyzing code...');
    socketManager.emit('requestAIAssistance', { prompt });
  }, [setAiResponse]);

  useEffect(() => {
    const setupSocketListeners = () => {
      if (!socketManager.isConnected()) return;

      socketManager.on('folderContents', (data: SocketResponse) => {
        if (data.root) {
          setFileSystem(data.root || null);
        }
        setSocketState(prev => ({ ...prev, isLoadingFileSystem: false }));
      });

      socketManager.on('fileContent', (data: FileContentResponse) => {
        if (activeFile && activeFile.path === data.path) {
          setActiveFile({ ...activeFile, content: data.content });
        }
        setSocketState(prev => ({ ...prev, isLoadingFile: false }));
      });

      socketManager.on('aiResponse', (data: AIResponse) => {
        setAiResponse(data.content || data.suggestions);
        setSocketState(prev => ({ ...prev, isProcessingAI: false }));
      });

      socketManager.on('error', (data: FileOperationError) => {
        setSocketState(prev => ({ 
          ...prev, 
          error: data,
          isLoadingFileSystem: false,
          isLoadingFile: false,
          isProcessingAI: false
        }));
      });
    };

    setupSocketListeners();

    return () => {
      if (socketManager.isConnected()) {
        socketManager.off('folderContents');
        socketManager.off('fileContent');
        socketManager.off('aiResponse');
        socketManager.off('error');
      }
    };
  }, [socketManager, activeFile, setFileSystem, setActiveFile, setAiResponse]);

  return {
    ...socketState,
    handleFolderSelect,
    handleFileSelect,
    handleCreateFile,
    handleCreateFolder,
    handleSaveFile,
    handleRequestAI,
    handleRename,
    handleDelete,
    clearError
  };
};
