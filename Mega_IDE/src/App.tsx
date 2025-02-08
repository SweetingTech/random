import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { FileText, Save, Wand2, Folder, Plus, FolderPlus, File, ChevronRight, ChevronDown, X, GitBranch, Bot } from 'lucide-react';
import SocketManager from './lib/socket';

// Custom Hooks
import { useEditor } from './hooks/useEditor';
import { useToast } from './components/Toast';
import { useZip } from './hooks/useZip';

// Components
import { NavBar } from './components/NavBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner, LoadingOverlay } from './components/LoadingSpinner';
import { FileTree } from './components/FileTree';
import { Toolbar } from './components/Toolbar';
import { GitPanel } from './components/GitPanel';
import { SettingsPage } from './components/SettingsPage';
import { AddonsPage } from './components/AddonsPage';
import { AIAgentPage } from './components/AIAgentPage';

interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileSystemNode[];
  content?: string;
  language?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCreateFile: (name: string) => void;
  onCreateFolder: (name: string) => void;
}

function ContextMenu({ x, y, onClose, onCreateFile, onCreateFolder }: ContextMenuProps) {
  const [mode, setMode] = useState<'none' | 'file' | 'folder'>('none');
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  useEffect(() => {
    if (mode !== 'none' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'file') {
      onCreateFile(name);
    } else if (mode === 'folder') {
      onCreateFolder(name);
    }
    onClose();
  };

  return (
    <div 
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50 context-menu"
      style={{ left: x, top: y }}
    >
      {mode === 'none' ? (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode('file');
            }}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New File
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode('folder');
            }}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="p-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={mode === 'file' ? 'File name' : 'Folder name'}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm mb-2"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setMode('none')}
              className="px-2 py-1 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FileTreeNode({ node, level = 0, onSelect, selectedPath }: { 
  node: FileSystemNode; 
  level?: number; 
  onSelect: (node: FileSystemNode) => void;
  selectedPath: string;
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const paddingLeft = level * 1.5;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (node.type === 'directory') {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCreateFile = (fileName: string) => {
    const path = node.path + '/' + fileName;
    const socket = SocketManager.getInstance();
    socket.emit('createFile', { path, content: '' });
  };

  const handleCreateFolder = (folderName: string) => {
    const path = node.path + '/' + folderName;
    const socket = SocketManager.getInstance();
    socket.emit('createFolder', { path });
  };

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onSelect(node)}
        className={`flex items-center w-full px-2 py-1.5 hover:bg-gray-700 ${
          selectedPath === node.path ? 'bg-gray-700 text-white' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${paddingLeft}rem` }}
      >
        <File className="w-4 h-4 mr-2" />
        {node.name}
      </button>
    );
  }

  return (
    <div onContextMenu={handleContextMenu}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full px-2 py-1.5 text-gray-300 hover:bg-gray-700"
        style={{ paddingLeft: `${paddingLeft}rem` }}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 mr-2" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-2" />
        )}
        <Folder className="w-4 h-4 mr-2" />
        {node.name}
      </button>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
        />
      )}
      {isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IDEComponent() {
  const [showGitPanel, setShowGitPanel] = useState(false);
  const {
    fileSystem,
    activeFile,
    theme,
    aiResponse,
    isLoadingFileSystem,
    isLoadingFile,
    isProcessingAI,
    error,
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
  } = useEditor();

  const { addToast, ToastContainer } = useToast();
  const { createZip, downloadZip, isCreating: isCreatingZip } = useZip();

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      addToast(error.message, 'error');
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleDownloadZip = async () => {
    if (!fileSystem) return;
    
    try {
      const zipData = await createZip(fileSystem.path);
      if (zipData) {
        downloadZip(zipData);
      }
    } catch (err) {
      addToast('Failed to create ZIP file', 'error');
    }
  };

  const handleToggleGitPanel = () => {
    setShowGitPanel(prev => !prev);
  };

  const handleFolderOpen = async () => {
    try {
      const folderPath = await window.electron.dialog.openProjectFolder();
      if (folderPath) {
        handleFolderSelect(folderPath);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      addToast('Failed to open folder', 'error');
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-900">
        <NavBar />
        <div className="flex-none">
          <Toolbar
            hasFileSystem={!!fileSystem}
            hasActiveFile={!!activeFile}
            currentPath={fileSystem?.path || null}
            onFolderSelect={handleFolderOpen}
            onNewFile={() => fileSystem && createNewFile(fileSystem.path)}
            onNewFolder={() => fileSystem && createNewFolder(fileSystem.path)}
            onSave={handleSave}
            onAIAssist={requestAIAssistance}
            onDownloadZip={handleDownloadZip}
            onToggleGitPanel={handleToggleGitPanel}
          />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
            <FileTree
              fileSystem={fileSystem}
              selectedPath={activeFile?.path || ''}
              onSelect={handleFileSelect}
              onCreateFile={createNewFile}
              onCreateFolder={createNewFolder}
              onRename={handleRename}
              onDelete={handleDelete}
              isLoading={isLoadingFileSystem}
            />
          </aside>

          <div className="flex-1 flex relative">
            {showGitPanel && (
              <aside className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                <GitPanel currentPath={fileSystem?.path || null} />
              </aside>
            )}
            {isLoadingFile && (
              <LoadingOverlay message="Loading file..." />
            )}
            <main className={`flex-1 ${aiResponse ? 'border-r border-gray-700' : ''}`}>
              {activeFile ? (
                <Editor
                  height="100%"
                  theme={theme}
                  language={activeFile.language}
                  value={activeFile.content}
                  onChange={handleEditorChange}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 10 },
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FileText className="w-12 h-12 mb-2" />
                  <p>Select a file to start editing</p>
                </div>
              )}
            </main>

            {aiResponse && (
              <aside className="w-96 bg-gray-800 overflow-y-auto relative">
                {isProcessingAI && (
                  <LoadingOverlay message="Processing..." />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                      <Bot className="w-5 h-5 mr-2" />
                      AI Suggestions
                    </h2>
                    <button
                      onClick={() => setAiResponse(null)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="prose prose-invert">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-900 p-4 rounded-lg">
                      {aiResponse}
                    </pre>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IDEComponent />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/addons" element={<AddonsPage />} />
        <Route path="/ai-agent" element={<AIAgentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
