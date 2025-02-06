import { useState, useCallback } from 'react';
import { FileSystemNode, FileOperation } from '../types/FileSystemNode';
import { useSocketHandlers } from './useSocketHandlers';
import { useDebounce } from './useDebounce';

export function useEditor() {
  const [fileSystem, setFileSystem] = useState<FileSystemNode | null>(null);
  const [activeFile, setActiveFile] = useState<FileSystemNode | null>(null);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const {
    isLoadingFileSystem,
    isLoadingFile,
    isProcessingAI,
    error,
    handleFolderSelect,
    handleFileSelect: socketHandleFileSelect,
    handleCreateFile,
    handleCreateFolder,
    handleSaveFile,
    handleRequestAI,
    handleRename: socketHandleRename,
    handleDelete: socketHandleDelete,
    clearError
  } = useSocketHandlers({
    setFileSystem,
    setActiveFile,
    activeFile,
    setAiResponse
  });

  const handleFileSelect = useCallback((node: FileSystemNode) => {
    if (node.type === 'file') {
      setActiveFile(node);
      if (!node.content) {
        socketHandleFileSelect(node.path);
      }
    }
  }, [socketHandleFileSelect]);

  const debouncedEmitChange = useDebounce((path: string, content: string) => {
    handleSaveFile({ path, content });
  }, 500);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value || !activeFile) return;
    
    const updatedFile = { ...activeFile, content: value };
    setActiveFile(updatedFile);
    debouncedEmitChange(activeFile.path, value);
  }, [activeFile, debouncedEmitChange]);

  const handleSave = useCallback(() => {
    if (activeFile) {
      handleSaveFile({ 
        path: activeFile.path, 
        content: activeFile.content 
      });
    }
  }, [activeFile, handleSaveFile]);

  const createNewFile = useCallback((path: string) => {
    if (!fileSystem) {
      throw new Error('Please open a folder first');
    }
    handleCreateFile({ path, content: '' });
  }, [fileSystem, handleCreateFile]);

  const createNewFolder = useCallback((path: string) => {
    if (!fileSystem) {
      throw new Error('Please open a folder first');
    }
    handleCreateFolder({ path });
  }, [fileSystem, handleCreateFolder]);

  const requestAIAssistance = useCallback(() => {
    if (activeFile) {
      handleRequestAI(`Please review this code and suggest improvements:\n\n${activeFile.content}`);
    }
  }, [activeFile, handleRequestAI]);

  const handleRename = useCallback((oldPath: string, newPath: string) => {
    socketHandleRename(oldPath, newPath);
  }, [socketHandleRename]);

  const handleDelete = useCallback((path: string) => {
    socketHandleDelete(path);
  }, [socketHandleDelete]);

  return {
    // State
    fileSystem,
    activeFile,
    theme,
    aiResponse,
    isLoadingFileSystem,
    isLoadingFile,
    isProcessingAI,
    error,

    // Actions
    setTheme,
    setAiResponse,
    handleFolderSelect,
    handleFileSelect,
    handleEditorChange,
    handleSave,
    createNewFile,
    createNewFolder,
    handleRename,
    handleDelete,
    requestAIAssistance,
    clearError
  };
}
