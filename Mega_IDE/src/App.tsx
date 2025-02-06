import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { FileText, Settings, Code2, Save, Wand2, Folder, Package, Bot, Terminal, Plus, FolderPlus, File, ChevronRight, ChevronDown, X } from 'lucide-react';
import SocketManager from './lib/socket';

// Custom Hooks
import { useEditor } from './hooks/useEditor';
import { useToast } from './components/Toast';

// Components
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner, LoadingOverlay } from './components/LoadingSpinner';
import { FileTree } from './components/FileTree';
import { Toolbar } from './components/Toolbar';

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

function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="flex items-center space-x-4 px-4 py-2 bg-gray-800 border-b border-gray-700">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="IDE"
      >
        <Code2 className="w-5 h-5" />
        <span>IDE</span>
      </button>
      <button
        onClick={() => navigate('/addons')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="Add-ons"
      >
        <Package className="w-5 h-5" />
        <span>Add-ons</span>
      </button>
      <button
        onClick={() => navigate('/ai-agent')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="AI Agent"
      >
        <Bot className="w-5 h-5" />
        <span>AI Agent</span>
      </button>
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </button>
    </nav>
  );
}

function IDEComponent() {
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

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      addToast(error.message, 'error');
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleFolderOpen = () => {
    const input = document.createElement('input') as HTMLInputElement & {
      webkitdirectory: boolean;
    };
    input.type = 'file';
    input.webkitdirectory = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0] as File & { webkitRelativePath: string };
        const pathParts = file.webkitRelativePath.split('/');
        const rootFolder = pathParts[0];
        const fullPath = (e.target as HTMLInputElement).value.split(rootFolder)[0] + rootFolder;
        handleFolderSelect(fullPath);
      }
    };

    input.click();
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-900">
        <NavBar />
        <div className="flex-none">
          <Toolbar
            hasFileSystem={!!fileSystem}
            hasActiveFile={!!activeFile}
            onFolderSelect={handleFolderOpen}
            onNewFile={() => fileSystem && createNewFile(fileSystem.path)}
            onNewFolder={() => fileSystem && createNewFolder(fileSystem.path)}
            onSave={handleSave}
            onAIAssist={requestAIAssistance}
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

function AddonsPage() {
  type PackageConfig = {
    installed: string[];
    available: string[];
  };

  type PackagesState = {
    [key: string]: PackageConfig;
  };

  const [packages, setPackages] = useState<PackagesState>({
    python: {
      installed: ['numpy', 'pandas', 'scikit-learn'],
      available: ['tensorflow', 'pytorch', 'keras', 'matplotlib']
    },
    r: {
      installed: ['tidyverse', 'ggplot2'],
      available: ['shiny', 'dplyr', 'caret']
    },
    java: {
      installed: ['junit', 'log4j'],
      available: ['spring-boot', 'hibernate', 'mockito']
    },
    cpp: {
      installed: ['boost', 'opencv'],
      available: ['eigen', 'tensorflow-cpp', 'dlib']
    },
    julia: {
      installed: ['Plots', 'DataFrames'],
      available: ['Flux', 'DifferentialEquations']
    },
    javascript: {
      installed: ['typescript', 'eslint'],
      available: ['prettier', 'babel', 'webpack']
    }
  });

  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [terminalOutput, setTerminalOutput] = useState('');
  const socket = SocketManager.getInstance();

  const installPackage = (language: string, pkg: string): void => {
    socket.emit('installPackage', { language, package: pkg });
    setTerminalOutput(prev => `${prev}\nInstalling ${pkg} for ${language}...`);
  };

  const uninstallPackage = (language: string, pkg: string): void => {
    socket.emit('uninstallPackage', { language, package: pkg });
    setTerminalOutput(prev => `${prev}\nUninstalling ${pkg} from ${language}...`);
  };

  useEffect(() => {
    socket.on('packageOutput', (data: { output: string }) => {
      setTerminalOutput(prev => `${prev}\n${data.output}`);
    });

    return () => {
      socket.off('packageOutput');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NavBar />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Package Manager</h1>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              {Object.keys(packages).map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Installed Packages</h2>
                <div className="space-y-2">
                  {packages[selectedLanguage].installed.map(pkg => (
                    <div key={pkg} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <span>{pkg}</span>
                      <button
                        onClick={() => uninstallPackage(selectedLanguage, pkg)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Uninstall
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Available Packages</h2>
                <div className="space-y-2">
                  {packages[selectedLanguage].available.map(pkg => (
                    <div key={pkg} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <span>{pkg}</span>
                      <button
                        onClick={() => installPackage(selectedLanguage, pkg)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Install
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Terminal Output</h2>
                <button
                  onClick={() => setTerminalOutput('')}
                  className="px-3 py-1 text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="bg-black rounded-lg p-4 h-[600px] overflow-auto font-mono text-sm">
                <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAgentPage() {
  const [agents, setAgents] = useState([
    {
      id: 'default',
      name: 'Default Assistant',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      instructions: '# Default Instructions\n\nBe helpful and concise.',
      active: true
    }
  ]);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [editingInstructions, setEditingInstructions] = useState(agents[0].instructions);

  const saveAgent = () => {
    setAgents(prev => prev.map(agent => 
      agent.id === selectedAgent.id 
        ? { 
            ...agent, 
            instructions: editingInstructions,
            temperature: selectedAgent.temperature,
            maxTokens: selectedAgent.maxTokens
          }
        : agent
    ));
  };

  const addNewAgent = () => {
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: 'New Agent',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      instructions: '# New Agent Instructions\n\nAdd your instructions here.',
      active: false
    };
    setAgents(prev => [...prev, newAgent]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NavBar />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">AI Agent Configuration</h1>
            <button
              onClick={addNewAgent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New Agent
            </button>
          </div>

          <div className="grid grid-cols-4 gap-8">
            <div className="col-span-1 bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Agents</h2>
              <div className="space-y-2">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setEditingInstructions(agent.instructions);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg ${
                      selectedAgent.id === agent.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <Bot className="w-4 h-4 mr-2" />
                      {agent.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-3 space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <input
                    type="text"
                    value={selectedAgent.name}
                    onChange={(e) => setSelectedAgent(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 px-3 py-2 rounded-lg"
                  />
                  <button
                    onClick={saveAgent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Model
                    </label>
                    <select
                      value={selectedAgent.model}
                      onChange={(e) => setSelectedAgent(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-gray-700 px-3 py-2 rounded-lg"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-2">Claude 2</option>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="codellama">CodeLlama</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Temperature
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={selectedAgent.temperature}
                      onChange={(e) => setSelectedAgent(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-400">
                      {selectedAgent.temperature}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={selectedAgent.maxTokens}
                      onChange={(e) => setSelectedAgent(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full bg-gray-700 px-3 py-2 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Instructions
                  </label>
                  <Editor
                    height="400px"
                    theme="vs-dark"
                    language="markdown"
                    value={editingInstructions}
                    onChange={(value) => setEditingInstructions(value || '')}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'off',
                      wordWrap: 'on',
                      wrappingIndent: 'indent',
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    openaiKey: localStorage.getItem('openaiKey') || '',
    googleKey: localStorage.getItem('googleKey') || '',
    claudeKey: localStorage.getItem('claudeKey') || '',
    ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://localhost:11434',
    lmstudioUrl1: localStorage.getItem('lmstudioUrl1') || 'http://localhost:1234',
    extraInstanceUrl: localStorage.getItem('extraInstanceUrl') || 'http://localhost:54321'
  });

  const handleSave = () => {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Code2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-blue-400">Cloud API Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={settings.openaiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, openaiKey: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Google API Key
                </label>
                <input
                  type="password"
                  value={settings.googleKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleKey: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AIza..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Claude API Key
                </label>
                <input
                  type="password"
                  value={settings.claudeKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, claudeKey: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-ant-..."
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 text-blue-400">Local LLM Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Ollama URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  LM Studio Instance URL
                </label>
                <input
                  type="text"
                  value={settings.lmstudioUrl1}
                  onChange={(e) => setSettings(prev => ({ ...prev, lmstudioUrl1: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Extra Instance URL
                </label>
                <input
                  type="text"
                  value={settings.extraInstanceUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, extraInstanceUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
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
