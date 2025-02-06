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
}

export const useSocketHandlers = ({ 
  setFileSystem, 
  setActiveFile, 
  activeFile, 
  setAiResponse 
}: UseSocketHandlersProps) => {
  const socket = SocketManager.getInstance();
  const [socketState, setSocketState] = useState<SocketState>({
    isLoadingFileSystem: false,
    isLoadingFile: false,
    isProcessingAI: false,
    error: null
  });

  const clearError = useCallback(() => {
    setSocketState(prev => ({ ...prev, error: null }));
  }, []);

  const handleFolderSelect = useCallback((folderPath: string) => {
    setSocketState(prev => ({ ...prev, isLoadingFileSystem: true, error: null }));
    socket.emit('openFolder', folderPath);
  }, [socket]);

  const handleFileSelect = useCallback((filePath: string) => {
    setSocketState(prev => ({ ...prev, isLoadingFile: true, error: null }));
    socket.emit('requestFile', filePath);
  }, [socket]);

  const handleCreateFile = useCallback((operation: FileOperation) => {
    setSocketState(prev => ({ ...prev, error: null }));
    socket.emit('createFile', operation);
  }, [socket]);

  const handleCreateFolder = useCallback((operation: FileOperation) => {
    setSocketState(prev => ({ ...prev, error: null }));
    socket.emit('createFolder', operation);
  }, [socket]);

  const handleRename = useCallback((oldPath: string, newPath: string) => {
    setSocketState(prev => ({ ...prev, error: null }));
    socket.emit('rename', { oldPath, newPath });
  }, [socket]);

  const handleDelete = useCallback((path: string) => {
    setSocketState(prev => ({ ...prev, error: null }));
    socket.emit('delete', { path });
  }, [socket]);

  const handleSaveFile = useCallback((operation: FileOperation) => {
    setSocketState(prev => ({ ...prev, error: null }));
    socket.emit('saveFile', operation);
  }, [socket]);

  const handleRequestAI = useCallback((prompt: string) => {
    setSocketState(prev => ({ ...prev, isProcessingAI: true, error: null }));
    setAiResponse('Analyzing code...');
    socket.emit('requestAIAssistance', { prompt });
  }, [socket, setAiResponse]);

  useEffect(() => {
    const handleFolderContents = ({ root }: SocketResponse) => {
      setFileSystem(root);
      setSocketState(prev => ({ ...prev, isLoadingFileSystem: false }));
    };

    const handleFileContent = ({ path, content }: FileContentResponse) => {
      if (activeFile && activeFile.path === path) {
        setActiveFile({ ...activeFile, content });
      }
      setSocketState(prev => ({ ...prev, isLoadingFile: false }));
    };

    const handleAiResponse = (response: AIResponse) => {
      setAiResponse(response.content);
      setSocketState(prev => ({ ...prev, isProcessingAI: false }));
    };

    const handleError = (error: FileOperationError) => {
      setSocketState(prev => ({ 
        ...prev, 
        error,
        isLoadingFileSystem: false,
        isLoadingFile: false,
        isProcessingAI: false
      }));
    };

    const setupSocketListeners = () => {
      socket.on('folderContents', (data: SocketResponse) => {
        setFileSystem(data.root);
        setSocketState(prev => ({ ...prev, isLoadingFileSystem: false }));
      });

      socket.on('fileContent', (data: FileContentResponse) => {
        if (activeFile && activeFile.path === data.path) {
          setActiveFile({ ...activeFile, content: data.content });
        }
        setSocketState(prev => ({ ...prev, isLoadingFile: false }));
      });

      socket.on('aiResponse', (data: AIResponse) => {
        setAiResponse(data.content);
        setSocketState(prev => ({ ...prev, isProcessingAI: false }));
      });

      socket.on('error', (data: FileOperationError) => {
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
      socket.off('folderContents');
      socket.off('fileContent');
      socket.off('aiResponse');
      socket.off('error');
    };
  }, [socket, activeFile, setFileSystem, setActiveFile, setAiResponse]);

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
