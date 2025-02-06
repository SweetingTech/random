import React, { useState } from 'react';
import { useGit } from '../hooks/useGit';
import { LoadingSpinner } from './LoadingSpinner';

interface CloneRepositoryDialogProps {
  onClose: () => void;
  onSuccess?: () => void;
  currentPath: string | null;
}

export function CloneRepositoryDialog({ onClose, onSuccess, currentPath }: CloneRepositoryDialogProps) {
  const [url, setUrl] = useState('');
  const [path, setPath] = useState('');
  const { cloneRepository, isLoading, error, clearError } = useGit({ currentPath });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !path) return;

    try {
      await cloneRepository(url, path);
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error will be handled by the Git hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[500px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-6 text-white">Clone Repository</h2>

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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Repository URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/repo.git"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Local Path
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/clone/directory"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url || !path}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Cloning...
                </>
              ) : (
                'Clone'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
