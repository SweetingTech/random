import { useState, useCallback } from 'react';
import SocketManager from '../lib/socket';
import { ZipCreationResult } from '../types/FileSystemNode';

export function useZip() {
  const socket = SocketManager.getInstance();
  const [isCreating, setIsCreating] = useState(false);

  const createZip = useCallback(async (path: string): Promise<ZipCreationResult | null> => {
    setIsCreating(true);
    
    try {
      return new Promise((resolve, reject) => {
        socket.emit('createZip', { path });

        function handleZipCreated(data: ZipCreationResult) {
          socket.off('zipCreated');
          socket.off('zipError');
          setIsCreating(false);
          resolve(data);
        }

        function handleError(error: string) {
          socket.off('zipCreated');
          socket.off('zipError');
          setIsCreating(false);
          reject(new Error(error));
        }

        socket.on('zipCreated', (data) => handleZipCreated(data));
        socket.on('zipError', (error) => handleError(error));
      });
    } catch (err) {
      setIsCreating(false);
      throw err;
    }
  }, [socket]);

  const downloadZip = useCallback((zipData: ZipCreationResult) => {
    // Convert base64 to blob
    const byteCharacters = atob(zipData.data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'application/zip' });
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  return {
    createZip,
    downloadZip,
    isCreating
  };
}
