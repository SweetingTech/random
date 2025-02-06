import React, { useEffect, useState } from 'react';
import { useGit } from '../hooks/useGit';
import { LoadingSpinner } from './LoadingSpinner';
import { GitBranch, GitCommit, GitPullRequest, RefreshCw } from 'lucide-react';

interface GitPanelProps {
  currentPath: string | null;
}

export function GitPanel({ currentPath }: GitPanelProps) {
  const {
    isLoading,
    error,
    status,
    currentBranch,
    branches,
    repository,
    getStatus,
    getCurrentBranch,
    getBranches,
    checkoutBranch,
    stageFiles,
    commit,
    pull,
    push,
    clearError
  } = useGit({ currentPath });

  const [commitMessage, setCommitMessage] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    if (currentPath) {
      getStatus();
      getCurrentBranch();
      getBranches();
    }
  }, [currentPath, getStatus, getCurrentBranch, getBranches]);

  const handleStageAll = async () => {
    if (!status) return;
    await stageFiles([...status.not_staged, ...status.untracked]);
    getStatus();
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    await commit(commitMessage);
    setCommitMessage('');
  };

  const handleBranchChange = async (branch: string) => {
    await checkoutBranch(branch);
    setSelectedBranch('');
    getStatus();
    getCurrentBranch();
  };

  return (
    <div className="p-4 text-gray-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Git</h2>
        <button
          onClick={getStatus}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-200 hover:text-white ml-2"
          >
            ×
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <GitBranch className="w-4 h-4" />
              <span className="text-sm font-medium">Current Branch:</span>
              <span className="text-blue-400">{currentBranch || 'None'}</span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="">Switch Branch...</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <button
                onClick={() => selectedBranch && handleBranchChange(selectedBranch)}
                disabled={!selectedBranch}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Switch
              </button>
            </div>
          </div>

          {status && (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Changes</h3>
                <div className="space-y-1">
                  {status.staged.length > 0 && (
                    <div className="text-green-400 text-sm">
                      <h4 className="font-medium mb-1">Staged</h4>
                      <ul className="list-disc list-inside">
                        {status.staged.map(file => (
                          <li key={file} className="truncate">{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {status.not_staged.length > 0 && (
                    <div className="text-yellow-400 text-sm">
                      <h4 className="font-medium mb-1">Modified</h4>
                      <ul className="list-disc list-inside">
                        {status.not_staged.map(file => (
                          <li key={file} className="truncate">{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {status.untracked.length > 0 && (
                    <div className="text-red-400 text-sm">
                      <h4 className="font-medium mb-1">Untracked</h4>
                      <ul className="list-disc list-inside">
                        {status.untracked.map(file => (
                          <li key={file} className="truncate">{file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {(status.not_staged.length > 0 || status.untracked.length > 0) && (
                  <button
                    onClick={handleStageAll}
                    className="w-full mt-4 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Stage All Changes
                  </button>
                )}
              </div>

              {status.staged.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Commit</h3>
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2"
                    rows={3}
                  />
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim()}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                  >
                    <GitCommit className="w-4 h-4 mr-2" />
                    Commit Changes
                  </button>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={pull}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm flex items-center justify-center"
                >
                  <GitPullRequest className="w-4 h-4 mr-2" />
                  Pull
                </button>
                <button
                  onClick={push}
                  disabled={status.ahead === 0}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                >
                  <GitPullRequest className="w-4 h-4 mr-2 transform rotate-180" />
                  Push
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
