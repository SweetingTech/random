import { useState, useCallback, useEffect } from 'react';
import SocketManager from '../lib/socket';
import { 
  GitStatus, 
  GitRepository, 
  GitCommitResult, 
  GitOperationResult 
} from '../types/FileSystemNode';

interface UseGitProps {
  currentPath: string | null;
}

interface GitState {
  isLoading: boolean;
  error: string | null;
  status: GitStatus | null;
  repository: GitRepository | null;
  currentBranch: string | null;
  branches: string[];
}

export function useGit({ currentPath }: UseGitProps) {
  const socket = SocketManager.getInstance();
  const [gitState, setGitState] = useState<GitState>({
    isLoading: false,
    error: null,
    status: null,
    repository: null,
    currentBranch: null,
    branches: []
  });

  const clearError = useCallback(() => {
    setGitState(prev => ({ ...prev, error: null }));
  }, []);

  const initRepository = useCallback(async () => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitInit', { path: currentPath });
  }, [currentPath, socket]);

  const cloneRepository = useCallback(async (url: string, path: string) => {
    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitClone', { url, path });
  }, [socket]);

  const getStatus = useCallback(async () => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitStatus', { path: currentPath });
  }, [currentPath, socket]);

  const stageFile = useCallback(async (filePath: string) => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitStage', { path: currentPath, file: filePath });
  }, [currentPath, socket]);

  const unstageFile = useCallback(async (filePath: string) => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitUnstage', { path: currentPath, file: filePath });
  }, [currentPath, socket]);

  const commit = useCallback(async (message: string) => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitCommit', { path: currentPath, message });
  }, [currentPath, socket]);

  const push = useCallback(async () => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitPush', { path: currentPath });
  }, [currentPath, socket]);

  const pull = useCallback(async () => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitPull', { path: currentPath });
  }, [currentPath, socket]);

  const getCurrentBranch = useCallback(async () => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitGetCurrentBranch', { path: currentPath });
  }, [currentPath, socket]);

  const getBranches = useCallback(async () => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitGetBranches', { path: currentPath });
  }, [currentPath, socket]);

  const checkoutBranch = useCallback(async (branch: string) => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitCheckoutBranch', { path: currentPath, branch });
  }, [currentPath, socket]);

  const stageFiles = useCallback(async (files: string[]) => {
    if (!currentPath) return;

    setGitState(prev => ({ ...prev, isLoading: true, error: null }));
    socket.emit('gitStageFiles', { path: currentPath, files });
  }, [currentPath, socket]);

  // Socket event handlers
  useEffect(() => {
    const handleGitStatus = (data: GitStatus) => {
      setGitState(prev => ({
        ...prev,
        isLoading: false,
        status: data
      }));
    };

    const handleGitRepository = (data: GitRepository) => {
      setGitState(prev => ({
        ...prev,
        isLoading: false,
        repository: data
      }));
    };

    const handleGitCommitResult = (data: GitCommitResult) => {
      if (data.success) {
        getStatus(); // Refresh status after successful commit
      } else {
        setGitState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Failed to commit changes'
        }));
      }
    };

    const handleGitOperationResult = (data: GitOperationResult) => {
      if (data.success) {
        getStatus(); // Refresh status after successful operation
      } else {
        setGitState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Git operation failed'
        }));
      }
    };

    const handleCurrentBranch = (branch: string) => {
      setGitState(prev => ({
        ...prev,
        isLoading: false,
        currentBranch: branch
      }));
    };

    const handleBranches = (branches: string[]) => {
      setGitState(prev => ({
        ...prev,
        isLoading: false,
        branches
      }));
    };

    socket.on('gitStatus', (data) => handleGitStatus(data));
    socket.on('gitRepository', (data) => handleGitRepository(data));
    socket.on('gitCommitResult', (data) => handleGitCommitResult(data));
    socket.on('gitOperationResult', (data) => handleGitOperationResult(data));
    socket.on('gitCurrentBranch', (data) => handleCurrentBranch(data));
    socket.on('gitBranches', (data) => handleBranches(data));

    return () => {
      socket.off('gitStatus');
      socket.off('gitRepository');
      socket.off('gitCommitResult');
      socket.off('gitOperationResult');
      socket.off('gitCurrentBranch');
      socket.off('gitBranches');
    };
  }, [socket, getStatus]);

  return {
    isLoading: gitState.isLoading,
    error: gitState.error,
    status: gitState.status,
    repository: gitState.repository,
    currentBranch: gitState.currentBranch,
    branches: gitState.branches,
    initRepository,
    cloneRepository,
    getStatus,
    stageFile,
    stageFiles,
    unstageFile,
    commit,
    push,
    pull,
    getCurrentBranch,
    getBranches,
    checkoutBranch,
    clearError
  };
}
