import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sqlite3pkg from 'sqlite3';
import * as ort from 'onnxruntime-node';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { promisify } from 'util';

console.log('Starting backend server initialization...');

const { verbose } = sqlite3pkg;
const sqlite3 = verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.API_SERVER_PORT || 3000;

console.log('Configuring server with port:', port);
console.log('Environment variables:', {
  API_SERVER_PORT: process.env.API_SERVER_PORT,
  NODE_ENV: process.env.NODE_ENV,
  VECTORDB_PATH: process.env.VECTORDB_PATH
});

// Create HTTP server
const httpServer = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure Express CORS
app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true
}));
app.use(express.json());

// Configure environment for node runtime
process.env.TRANSFORMERS_CACHE = process.env.TRANSFORMERS_CACHE || path.join(__dirname, 'data', 'models');

// Promisify fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

// Track active client
let activeClient = null;

// File system helper functions
async function getDirectoryContents(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const contents = await Promise.all(entries.map(async entry => {
      const fullPath = path.join(dirPath, entry.name);
      const stats = await stat(fullPath);
      return {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime
      };
    }));
    return contents;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
}

class VectorDBService {
  static #instance = null;
  #db = null;
  #embedder = null;
  #settings = null;
  #isInitialized = false;

  constructor() {
    if (VectorDBService.#instance) {
      return VectorDBService.#instance;
    }
    console.log('Initializing VectorDBService...');
    this.#settings = {
      path: process.env.VECTORDB_PATH || path.join(__dirname, 'data', 'vectordb.sqlite'),
      defaultSharing: {
        newAgents: process.env.AUTO_LOAD_PLUGINS === 'true',
        existingAgents: process.env.AUTO_LOAD_PLUGINS === 'true'
      },
      memoryRetention: {
        default: parseInt(process.env.DEFAULT_MEMORY_RETENTION) || 30 * 24 * 60 * 60 * 1000, // 30 days
        minimum: parseInt(process.env.MIN_MEMORY_RETENTION) || 24 * 60 * 60 * 1000,      // 1 day
        maximum: parseInt(process.env.MAX_MEMORY_RETENTION) || 365 * 24 * 60 * 60 * 1000 // 1 year
      },
      pluginDirectory: process.env.PLUGIN_DIR || path.join(__dirname, 'plugins'),
      autoLoadPlugins: process.env.AUTO_LOAD_PLUGINS === 'true'
    };
    console.log('VectorDBService settings:', this.#settings);
    VectorDBService.#instance = this;
  }

  static getInstance() {
    if (!VectorDBService.#instance) {
      VectorDBService.#instance = new VectorDBService();
    }
    return VectorDBService.#instance;
  }

  async initialize() {
    if (this.#isInitialized) {
      return;
    }

    try {
      console.log('Starting VectorDBService initialization...');
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.#settings.path);
      if (!fs.existsSync(dataDir)) {
        console.log('Creating data directory:', dataDir);
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize SQLite database
      console.log('Initializing SQLite database...');
      this.#db = new sqlite3.Database(this.#settings.path);
      
      // Initialize the transformer model for embeddings using dynamic import
      console.log('Initializing transformer model...');
      const transformers = await import('@xenova/transformers');
      transformers.env.backends.onnx.wasm.numThreads = 1;
      transformers.env.backends.onnx.backend = 'node';
      transformers.env.backends.onnx.provider = 'cpu';
      
      this.#embedder = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
        progress_callback: (progress) => {
          if (progress && typeof progress.progress === 'number') {
            const percentage = Math.round(progress.progress * 100);
            console.log('Loading model:', percentage, '%');
          }
        }
      });
      
      // Create tables if they don't exist
      await this.createTables();
      
      this.#isInitialized = true;
      console.log('VectorDB Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VectorDB Service:', error);
      throw error;
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
      if (!this.#db) {
        reject(new Error('Database not initialized'));
        return;
      }

      console.log('Creating database tables...');
      this.#db.serialize(() => {
        // Create memories table
        this.#db.run(`
          CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            vector BLOB NOT NULL,
            creator TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            type TEXT NOT NULL,
            tags TEXT NOT NULL,
            visibility TEXT NOT NULL,
            context TEXT NOT NULL
          )
        `);

        // Create agents table
        this.#db.run(`
          CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            capabilities TEXT NOT NULL,
            status TEXT NOT NULL,
            lastActive TEXT NOT NULL,
            memoryStats TEXT NOT NULL
          )
        `);

        // Create shared_memories table
        this.#db.run(`
          CREATE TABLE IF NOT EXISTS shared_memories (
            memory_id TEXT NOT NULL,
            from_agent TEXT NOT NULL,
            to_agents TEXT NOT NULL,
            share_type TEXT NOT NULL,
            expiry_time TEXT,
            access_level TEXT NOT NULL,
            FOREIGN KEY(memory_id) REFERENCES memories(id)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating tables:', err);
            reject(err);
          } else {
            console.log('Database tables created successfully');
            resolve();
          }
        });
      });
    });
  }

  async ensureInitialized() {
    if (!this.#isInitialized) {
      await this.initialize();
    }
  }

  async generateEmbedding(text) {
    await this.ensureInitialized();
    try {
      const output = await this.#embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async registerAgent(agent) {
    await this.ensureInitialized();
    if (!this.#db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const stmt = this.#db.prepare(`
        INSERT INTO agents (id, name, capabilities, status, lastActive, memoryStats)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        agent.id,
        agent.name,
        JSON.stringify(agent.capabilities),
        agent.status,
        agent.lastActive,
        JSON.stringify(agent.memoryStats),
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async storeMemory(memory) {
    await this.ensureInitialized();
    if (!this.#db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const stmt = this.#db.prepare(`
        INSERT INTO memories (id, content, vector, creator, timestamp, type, tags, visibility, context)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        memory.id,
        memory.content,
        Buffer.from(new Float32Array(memory.vector).buffer),
        memory.metadata.creator,
        memory.metadata.timestamp,
        memory.metadata.type,
        JSON.stringify(memory.metadata.tags),
        memory.metadata.visibility,
        JSON.stringify(memory.metadata.context),
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async searchMemories(params) {
    await this.ensureInitialized();
    if (!this.#db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.#db.all(`
        SELECT * FROM memories
        WHERE visibility = 'public'
        OR visibility = 'shared'
      `, [], (err, memories) => {
        if (err) {
          reject(err);
          return;
        }

        const results = memories.map((row) => {
          const vector = new Float32Array(
            Buffer.from(row.vector).buffer
          );
          
          return {
            id: row.id,
            score: this.cosineSimilarity(params.vector, vector),
            memory: {
              id: row.id,
              content: row.content,
              vector: Array.from(vector),
              metadata: {
                creator: row.creator,
                timestamp: row.timestamp,
                type: row.type,
                tags: JSON.parse(row.tags),
                visibility: row.visibility,
                context: JSON.parse(row.context)
              }
            }
          };
        });

        // Sort by similarity score and limit results
        resolve(results
          .sort((a, b) => b.score - a.score)
          .slice(0, params.limit || 10));
      });
    });
  }

  async shareMemory(request) {
    await this.ensureInitialized();
    if (!this.#db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.#db.serialize(() => {
        const stmt = this.#db.prepare(`
          INSERT INTO shared_memories (memory_id, from_agent, to_agents, share_type, expiry_time, access_level)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          request.memoryIds,
          request.fromAgent,
          JSON.stringify(request.toAgents),
          request.shareType,
          request.expiryTime?.toISOString() || null,
          request.accessLevel,
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            // Update memory visibility
            const updateStmt = this.#db.prepare(`
              UPDATE memories
              SET visibility = 'shared'
              WHERE id IN (${request.memoryIds.map(() => '?').join(',')})
            `);

            updateStmt.run(...request.memoryIds, (err) => {
              if (err) reject(err);
              else resolve();
            });
          }
        );
      });
    });
  }

  async updateSettings(newSettings) {
    this.#settings = { ...this.#settings, ...newSettings };
  }

  getSettings() {
    return { ...this.#settings };
  }

  close() {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
    this.#isInitialized = false;
  }
}

const vectorDBService = VectorDBService.getInstance();
console.log('Initializing VectorDBService...');
vectorDBService.initialize().catch(error => {
  console.error('Failed to initialize VectorDBService:', error);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  // If there's already an active client, reject the new connection
  if (activeClient) {
    console.log('Rejecting new client connection:', socket.id);
    socket.emit('error', { message: 'Another client is already connected' });
    socket.disconnect(true);
    return;
  }

  console.log('Client connected:', socket.id);
  activeClient = socket;

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (activeClient === socket) {
      activeClient = null;
    }
  });

  // Handle file system events
  socket.on('openFolder', async (folderPath) => {
    console.log('Opening folder:', folderPath);
    try {
      const contents = await getDirectoryContents(folderPath);
      socket.emit('folderContents', { path: folderPath, contents });
    } catch (error) {
      console.error('Error opening folder:', error);
      socket.emit('error', { message: 'Failed to open folder', error: error.message });
    }
  });

  socket.on('requestFile', async (filePath) => {
    console.log('Requesting file:', filePath);
    try {
      const content = await readFile(filePath, 'utf8');
      socket.emit('fileContent', { path: filePath, content });
    } catch (error) {
      console.error('Error reading file:', error);
      socket.emit('error', { message: 'Failed to read file', error: error.message });
    }
  });

  socket.on('createFile', async (operation) => {
    console.log('Creating file:', operation);
    try {
      const { path: filePath, content = '' } = operation;
      await writeFile(filePath, content, 'utf8');
      socket.emit('fileCreated', { path: filePath });
    } catch (error) {
      console.error('Error creating file:', error);
      socket.emit('error', { message: 'Failed to create file', error: error.message });
    }
  });

  socket.on('createFolder', async (operation) => {
    console.log('Creating folder:', operation);
    try {
      const { path: folderPath } = operation;
      await mkdir(folderPath, { recursive: true });
      socket.emit('folderCreated', { path: folderPath });
    } catch (error) {
      console.error('Error creating folder:', error);
      socket.emit('error', { message: 'Failed to create folder', error: error.message });
    }
  });

  socket.on('rename', async ({ oldPath, newPath }) => {
    console.log('Renaming:', oldPath, 'to', newPath);
    try {
      await rename(oldPath, newPath);
      socket.emit('renamed', { oldPath, newPath });
    } catch (error) {
      console.error('Error renaming:', error);
      socket.emit('error', { message: 'Failed to rename', error: error.message });
    }
  });

  socket.on('delete', async ({ path: itemPath }) => {
    console.log('Deleting:', itemPath);
    try {
      const stats = await stat(itemPath);
      if (stats.isDirectory()) {
        await fs.promises.rmdir(itemPath, { recursive: true });
      } else {
        await unlink(itemPath);
      }
      socket.emit('deleted', { path: itemPath });
    } catch (error) {
      console.error('Error deleting:', error);
      socket.emit('error', { message: 'Failed to delete', error: error.message });
    }
  });

  socket.on('saveFile', async (operation) => {
    console.log('Saving file:', operation);
    try {
      const { path: filePath, content } = operation;
      await writeFile(filePath, content, 'utf8');
      socket.emit('fileSaved', { path: filePath });
    } catch (error) {
      console.error('Error saving file:', error);
      socket.emit('error', { message: 'Failed to save file', error: error.message });
    }
  });

  socket.on('requestAIAssistance', ({ prompt }) => {
    console.log('AI assistance requested:', prompt);
    // Add your AI assistance logic here
    socket.emit('aiResponse', { response: 'AI response placeholder' });
  });
});

// API endpoints for VectorDB operations
app.post('/api/vectordb/generateEmbedding', async (req, res) => {
  try {
    const embedding = await vectorDBService.generateEmbedding(req.body.text);
    res.json(embedding);
  } catch (error) {
    console.error('Error in generateEmbedding endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vectordb/storeMemory', async (req, res) => {
  try {
    await vectorDBService.storeMemory(req.body.memory);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in storeMemory endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vectordb/searchMemories', async (req, res) => {
  try {
    const results = await vectorDBService.searchMemories(req.body.params);
    res.json(results);
  } catch (error) {
    console.error('Error in searchMemories endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vectordb/registerAgent', async (req, res) => {
  try {
    await vectorDBService.registerAgent(req.body.agent);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in registerAgent endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vectordb/shareMemory', async (req, res) => {
  try {
    await vectorDBService.shareMemory(req.body.request);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in shareMemory endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vectordb/getSettings', async (req, res) => {
  try {
    const settings = vectorDBService.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error in getSettings endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vectordb/updateSettings', async (req, res) => {
  try {
    await vectorDBService.updateSettings(req.body.settings);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in updateSettings endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start the server
console.log('Starting server on port:', port);
httpServer.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    vectorDBService.close();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    vectorDBService.close();
  });
});
