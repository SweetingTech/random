import React, { useState } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Plus, FolderPlus } from 'lucide-react';
import { FileSystemNode } from '../types/FileSystemNode';
import { ContextMenu } from './ContextMenu';
import { FileNameInput } from './FileNameInput';

interface FileTreeProps {
  fileSystem: FileSystemNode | null;
  selectedPath: string;
  onSelect: (node: FileSystemNode) => void;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  isLoading?: boolean;
}

interface FileTreeNodeProps {
  node: FileSystemNode;
  level?: number;
  selectedPath: string;
  onSelect: (node: FileSystemNode) => void;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
}

function FileTreeNode({ 
  node, 
  level = 0, 
  selectedPath,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete
}: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [createMode, setCreateMode] = useState<'file' | 'folder' | null>(null);
  const paddingLeft = level * 1.5;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreateFile = () => {
    setCreateMode('file');
  };

  const handleCreateFolder = () => {
    setCreateMode('folder');
  };

  const handleCreateSubmit = (name: string) => {
    if (createMode === 'file') {
      onCreateFile(`${node.path}/${name}`);
    } else if (createMode === 'folder') {
      onCreateFolder(`${node.path}/${name}`);
    }
    setCreateMode(null);
  };

  const handleRename = () => {
    setIsRenaming(true);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      onDelete(node.path);
    }
  };

  if (node.type === 'file') {
    return (
      <div onContextMenu={handleContextMenu}>
        {isRenaming ? (
          <FileNameInput
            initialValue={node.name}
            onSubmit={(name) => {
              const newPath = node.path.replace(node.name, name);
              onRename(node.path, newPath);
              setIsRenaming(false);
            }}
            onCancel={() => setIsRenaming(false)}
            placeholder="Enter file name"
            paddingLeft={paddingLeft + 1.5}
          />
        ) : (
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
        )}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onRename={handleRename}
            onDelete={handleDelete}
            isFolder={false}
          />
        )}
      </div>
    );
  }

  return (
    <div onContextMenu={handleContextMenu}>
      {isRenaming ? (
        <FileNameInput
          initialValue={node.name}
          onSubmit={(name) => {
            const newPath = node.path.replace(node.name, name);
            onRename(node.path, newPath);
            setIsRenaming(false);
          }}
          onCancel={() => setIsRenaming(false)}
          placeholder="Enter folder name"
          paddingLeft={paddingLeft + 1.5}
        />
      ) : (
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
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onRename={handleRename}
          onDelete={handleDelete}
          isFolder={true}
        />
      )}

      {createMode && (
        <FileNameInput
          onSubmit={handleCreateSubmit}
          onCancel={() => setCreateMode(null)}
          placeholder={`Enter ${createMode} name`}
          paddingLeft={paddingLeft + 1.5}
        />
      )}

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ 
  fileSystem, 
  selectedPath, 
  onSelect,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  isLoading 
}: FileTreeProps) {
  const [createMode, setCreateMode] = useState<'file' | 'folder' | null>(null);

  const handleCreateFile = () => {
    if (!fileSystem) return;
    setCreateMode('file');
  };

  const handleCreateFolder = () => {
    if (!fileSystem) return;
    setCreateMode('folder');
  };

  const handleCreateSubmit = (name: string) => {
    if (!fileSystem) return;
    if (createMode === 'file') {
      onCreateFile(`${fileSystem.path}/${name}`);
    } else if (createMode === 'folder') {
      onCreateFolder(`${fileSystem.path}/${name}`);
    }
    setCreateMode(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!fileSystem) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
        <Folder className="w-12 h-12 mb-2" />
        <p>No folder opened</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {createMode && (
        <FileNameInput
          onSubmit={handleCreateSubmit}
          onCancel={() => setCreateMode(null)}
          placeholder={`Enter ${createMode} name`}
          paddingLeft={1.5}
        />
      )}
      <div className="py-2">
        <FileTreeNode
          node={fileSystem}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
