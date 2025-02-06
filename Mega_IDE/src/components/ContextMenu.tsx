import React from 'react';
import { Plus, FolderPlus, Pencil, Trash2 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onRename: () => void;
  onDelete: () => void;
  isFolder: boolean;
}

export function ContextMenu({ 
  x, y, onClose, onCreateFile, onCreateFolder, onRename, onDelete, isFolder 
}: ContextMenuProps) {
  return (
    <div 
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50 context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {isFolder && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateFile?.();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New File
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder?.();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </button>
          <div className="border-t border-gray-700 my-1" />
        </>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center"
      >
        <Pencil className="w-4 h-4 mr-2" />
        Rename
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  );
}
