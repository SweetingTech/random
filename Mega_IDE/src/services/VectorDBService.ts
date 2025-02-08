// @ts-nocheck
import type {
  Memory,
  MemoryShareRequest,
  LanceDBSettings,
  AgentRegistryEntry,
  VectorSearchParams,
  VectorSearchResult
} from '../types/LanceDB';

const Database = require('better-sqlite3');
const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs');

export class VectorDBService {
  static instance = null;
  db = null;
  embedder = null;
  settings = null;
  isInitialized = false;

  constructor() {
    this.settings = {
      path: path.join(process.cwd(), 'data', 'vectordb.sqlite'),
      defaultSharing: {
        newAgents: true,
        existingAgents: true
      },
      memoryRetention: {
        default: 30 * 24 * 60 * 60 * 1000, // 30 days
        minimum: 24 * 60 * 60 * 1000,      // 1 day
        maximum: 365 * 24 * 60 * 60 * 1000 // 1 year
      },
      pluginDirectory: path.join(process.cwd(), 'plugins'),
      autoLoadPlugins: true
    };
  }

  static getInstance() {
    if (!VectorDBService.instance) {
      VectorDBService.instance = new VectorDBService();
    }
    return VectorDBService.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.settings.path);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new Database(this.settings.path);
      
      // Import transformers dynamically
      const { pipeline, env } = await import('@xenova/transformers');
      
      // Configure environment for node runtime
      env.backends.onnx.wasm.numThreads = 1;
      env.backends.onnx.backend = 'node';
      env.backends.onnx.provider = 'cpu';

      if (typeof process !== 'undefined') {
        process.env.TRANSFORMERS_CACHE = path.join(process.cwd(), 'data', 'models');
      }
      
      // Initialize the transformer model for embeddings
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
        progress_callback: (progress) => {
          console.log('Loading model:', Math.round(progress.progress * 100), '%');
        }
      });
      
      // Create tables if they don't exist
      this.createTables();
      
      this.isInitialized = true;
      console.log('VectorDB Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VectorDB Service:', error);
      throw error;
    }
  }

  createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Create memories table
    this.db.exec(`
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
    this.db.exec(`
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shared_memories (
        memory_id TEXT NOT NULL,
        from_agent TEXT NOT NULL,
        to_agents TEXT NOT NULL,
        share_type TEXT NOT NULL,
        expiry_time TEXT,
        access_level TEXT NOT NULL,
        FOREIGN KEY(memory_id) REFERENCES memories(id)
      )
    `);
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async generateEmbedding(text) {
    await this.ensureInitialized();
    try {
      const output = await this.embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async registerAgent(agent) {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(`
        INSERT INTO agents (id, name, capabilities, status, lastActive, memoryStats)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        agent.id,
        agent.name,
        JSON.stringify(agent.capabilities),
        agent.status,
        agent.lastActive,
        JSON.stringify(agent.memoryStats)
      );
    } catch (error) {
      console.error('Error registering agent:', error);
      throw error;
    }
  }

  async storeMemory(memory) {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(`
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
        JSON.stringify(memory.metadata.context)
      );
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
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
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM memories
        WHERE visibility = 'public'
        OR visibility = 'shared'
      `);

      const memories = stmt.all();
      const results = memories.map((row) => {
        const vector = new Float32Array(
          new Uint8Array(row.vector).buffer
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
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, params.limit || 10);
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  async shareMemory(request) {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stmt = this.db.prepare(`
        INSERT INTO shared_memories (memory_id, from_agent, to_agents, share_type, expiry_time, access_level)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const memoryId of request.memoryIds) {
        stmt.run(
          memoryId,
          request.fromAgent,
          Array.isArray(request.toAgents) ? JSON.stringify(request.toAgents) : request.toAgents,
          request.shareType,
          request.expiryTime?.toISOString() || null,
          request.accessLevel
        );
      }

      // Update memory visibility
      const updateStmt = this.db.prepare(`
        UPDATE memories
        SET visibility = 'shared'
        WHERE id IN (${request.memoryIds.map(() => '?').join(',')})
      `);

      updateStmt.run(...request.memoryIds);
    } catch (error) {
      console.error('Error sharing memory:', error);
      throw error;
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings() {
    return { ...this.settings };
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
  }
}

export default VectorDBService;
