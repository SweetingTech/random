import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileSystemManager {
  async readDirectory(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const children = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const node = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file'
        };

        if (entry.isDirectory()) {
          node.children = await this.readDirectory(fullPath);
        } else {
          node.language = this.getLanguage(entry.name);
        }

        return node;
      })
    );

    return children.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  getLanguage(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.md': 'markdown',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.sql': 'sql',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.sh': 'shell',
      '.bash': 'shell'
    };
    return languageMap[ext] || 'plaintext';
  }

  async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  async writeFile(filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  async createFile(filePath) {
    try {
      await fs.writeFile(filePath, '', 'utf-8');
    } catch (error) {
      console.error(`Error creating file ${filePath}:`, error);
      throw error;
    }
  }

  async createDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath);
    } catch (error) {
      console.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }

  async rename(oldPath, newPath) {
    try {
      await fs.rename(oldPath, newPath);
    } catch (error) {
      console.error(`Error renaming ${oldPath} to ${newPath}:`, error);
      throw error;
    }
  }

  async delete(path) {
    try {
      const stats = await fs.stat(path);
      if (stats.isDirectory()) {
        await fs.rm(path, { recursive: true });
      } else {
        await fs.unlink(path);
      }
    } catch (error) {
      console.error(`Error deleting ${path}:`, error);
      throw error;
    }
  }
}

class AIHandler {
  async generateResponse(code) {
    // For testing purposes, return a mock response
    return {
      content: `Here's my analysis of your code:

1. Code Structure
   - The code is well-organized
   - Consider breaking down larger functions into smaller ones

2. Best Practices
   - Good use of modern JavaScript features
   - Consider adding error handling for edge cases

3. Suggestions
   - Add comments to explain complex logic
   - Consider adding unit tests
   - Use TypeScript for better type safety

Would you like me to help you implement any of these suggestions?`
    };
  }
}

const fileSystemManager = new FileSystemManager();
const aiHandler = new AIHandler();

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('openFolder', async (folderPath) => {
    try {
      const children = await fileSystemManager.readDirectory(folderPath);
      const root = {
        name: path.basename(folderPath),
        path: folderPath,
        type: 'directory',
        children
      };
      socket.emit('folderContents', { root });
    } catch (error) {
      console.error('Error reading directory:', error);
      socket.emit('error', { message: 'Error reading directory' });
    }
  });

  socket.on('requestFile', async (filePath) => {
    try {
      const content = await fileSystemManager.readFile(filePath);
      socket.emit('fileContent', { path: filePath, content });
    } catch (error) {
      console.error('Error reading file:', error);
      socket.emit('error', { message: 'Error reading file' });
    }
  });

  socket.on('saveFile', async ({ path: filePath, content }) => {
    try {
      await fileSystemManager.writeFile(filePath, content);
      socket.emit('fileSaved', { path: filePath });
    } catch (error) {
      console.error('Error saving file:', error);
      socket.emit('error', { message: 'Error saving file' });
    }
  });

  socket.on('createFile', async ({ path: filePath }) => {
    try {
      await fileSystemManager.createFile(filePath);
      const parentDir = path.dirname(filePath);
      const children = await fileSystemManager.readDirectory(parentDir);
      socket.emit('folderContents', {
        root: {
          name: path.basename(parentDir),
          path: parentDir,
          type: 'directory',
          children
        }
      });
    } catch (error) {
      console.error('Error creating file:', error);
      socket.emit('error', { message: 'Error creating file' });
    }
  });

  socket.on('createFolder', async ({ path: folderPath }) => {
    try {
      await fileSystemManager.createDirectory(folderPath);
      const parentDir = path.dirname(folderPath);
      const children = await fileSystemManager.readDirectory(parentDir);
      socket.emit('folderContents', {
        root: {
          name: path.basename(parentDir),
          path: parentDir,
          type: 'directory',
          children
        }
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      socket.emit('error', { message: 'Error creating folder' });
    }
  });

  socket.on('requestAIAssistance', async ({ prompt }) => {
    try {
      const response = await aiHandler.generateResponse(prompt);
      socket.emit('aiResponse', response);
    } catch (error) {
      socket.emit('aiResponse', {
        content: `Error: ${error.message}`
      });
    }
  });

  socket.on('rename', async ({ oldPath, newPath }) => {
    try {
      await fileSystemManager.rename(oldPath, newPath);
      const parentDir = path.dirname(oldPath);
      const children = await fileSystemManager.readDirectory(parentDir);
      socket.emit('folderContents', {
        root: {
          name: path.basename(parentDir),
          path: parentDir,
          type: 'directory',
          children
        }
      });
    } catch (error) {
      console.error('Error renaming:', error);
      socket.emit('error', { message: 'Error renaming file/folder' });
    }
  });

  socket.on('delete', async ({ path: filePath }) => {
    try {
      await fileSystemManager.delete(filePath);
      const parentDir = path.dirname(filePath);
      const children = await fileSystemManager.readDirectory(parentDir);
      socket.emit('folderContents', {
        root: {
          name: path.basename(parentDir),
          path: parentDir,
          type: 'directory',
          children
        }
      });
    } catch (error) {
      console.error('Error deleting:', error);
      socket.emit('error', { message: 'Error deleting file/folder' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
