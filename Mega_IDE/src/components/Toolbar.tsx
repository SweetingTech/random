import React, { useState } from 'react';
import { Folder, FolderPlus, Save, Wand2, FileText, GitBranch, Download } from 'lucide-react';
import { CloneRepositoryDialog } from './CloneRepositoryDialog';

interface ToolbarProps {
  hasFileSystem: boolean;
  hasActiveFile: boolean;
  currentPath: string | null;
  onFolderSelect: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onSave: () => void;
  onAIAssist: () => void;
  onDownloadZip?: () => void;
  onToggleGitPanel?: () => void;
}

export function Toolbar({
  hasFileSystem,
  hasActiveFile,
  currentPath,
  onFolderSelect,
  onNewFile,
  onNewFolder,
  onSave,
  onAIAssist,
  onDownloadZip,
  onToggleGitPanel
}: ToolbarProps) {
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowCloneDialog(true)}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg flex items-center space-x-1"
          title="Clone Repository"
        >
          <GitBranch className="w-5 h-5" />
          <span>Clone</span>
        </button>
        <button
          onClick={onFolderSelect}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg flex items-center space-x-1"
          title="Open Folder"
        >
          <Folder className="w-5 h-5" />
          <span>Open</span>
        </button>
        <div className="h-6 w-px bg-gray-700 mx-2" />
        <button
          onClick={onNewFile}
          className={`
            p-2 rounded-lg flex items-center space-x-1
            ${hasFileSystem 
              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
              : 'text-gray-500 cursor-not-allowed'
            }
          `}
          title="New File"
          disabled={!hasFileSystem}
        >
          <FileText className="w-5 h-5" />
          <span>New File</span>
        </button>
        <button
          onClick={onNewFolder}
          className={`
            p-2 rounded-lg flex items-center space-x-1
            ${hasFileSystem 
              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
              : 'text-gray-500 cursor-not-allowed'
            }
          `}
          title="New Folder"
          disabled={!hasFileSystem}
        >
          <FolderPlus className="w-5 h-5" />
          <span>New Folder</span>
        </button>
        <div className="h-6 w-px bg-gray-700 mx-2" />
        <button
          onClick={onSave}
          className={`
            flex items-center space-x-1 px-3 py-2 rounded-lg
            ${hasActiveFile 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }
          `}
          disabled={!hasActiveFile}
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
        <button
          onClick={onAIAssist}
          className={`
            p-2 rounded-lg flex items-center space-x-1
            ${hasActiveFile 
              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
              : 'text-gray-500 cursor-not-allowed'
            }
          `}
          title="Get AI Assistance"
          disabled={!hasActiveFile}
        >
          <Wand2 className="w-5 h-5" />
          <span>AI Assist</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        {onDownloadZip && (
          <button
            onClick={onDownloadZip}
            className={`
              p-2 rounded-lg flex items-center space-x-1
              ${hasFileSystem 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 cursor-not-allowed'
              }
            `}
            title="Download as ZIP"
            disabled={!hasFileSystem}
          >
            <Download className="w-5 h-5" />
            <span>Download ZIP</span>
          </button>
        )}
        {onToggleGitPanel && (
          <button
            onClick={onToggleGitPanel}
            className={`
              p-2 rounded-lg flex items-center space-x-1
              ${hasFileSystem 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 cursor-not-allowed'
              }
            `}
            title="Git"
            disabled={!hasFileSystem}
          >
            <GitBranch className="w-5 h-5" />
            <span>Git</span>
          </button>
        )}
      </div>

      {showCloneDialog && (
        <CloneRepositoryDialog
          currentPath={currentPath}
          onClose={() => setShowCloneDialog(false)}
          onSuccess={() => {
            setShowCloneDialog(false);
            if (onToggleGitPanel) {
              onToggleGitPanel();
            }
          }}
        />
      )}
    </div>
  );
}
