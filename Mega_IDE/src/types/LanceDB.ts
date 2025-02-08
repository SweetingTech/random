export interface AgentCapabilities {
  memoryAccess: {
    canRead: string[];      // Which memory pools this agent can read
    canWrite: string[];     // Which memory pools this agent can write to
    sharingPreferences: {
      autoShare: boolean;   // Automatically share relevant memories
      shareWithAgents: string[];  // Specific agents to share with
    }
  };
  specializations: string[];  // Agent's specialized domains
  supportedModels: string[]; // AI models this agent can use
  apiIntegrations: string[]; // External APIs this agent can access
  version: string;          // Agent version for compatibility
}

export interface MemoryMetadata {
  creator: string;     // Agent ID
  timestamp: string;
  type: string;       // Memory type (code, conversation, etc.)
  tags: string[];     // For categorization
  visibility: string; // public, private, or specific agents
  context: {
    file?: string;    // Related file
    language?: string; // Programming language
    project?: string; // Project context
  };
  agent?: any;        // Optional agent configuration data
}

export interface Memory {
  id: string;
  content: string;
  vector: number[];
  metadata: MemoryMetadata;
}

export interface MemoryShareRequest {
  fromAgent: string;
  toAgents: string[] | 'all';
  memoryIds: string[];
  shareType: 'temporary' | 'permanent';
  expiryTime?: Date;      // For temporary shares
  accessLevel: 'read' | 'write' | 'full';
}

export interface LanceDBSettings {
  path: string;           // Database location
  defaultSharing: {
    newAgents: boolean;   // Auto-share with new agents
    existingAgents: boolean; // Auto-share with existing agents
  };
  memoryRetention: {
    default: number;      // Default retention period
    minimum: number;      // Minimum retention period
    maximum: number;      // Maximum retention period
  };
  pluginDirectory: string; // Where to look for new agent plugins
  autoLoadPlugins: boolean; // Automatically load discovered plugins
}

export interface AgentRegistryEntry {
  id: string;
  name: string;
  capabilities: AgentCapabilities;
  status: 'active' | 'inactive';
  lastActive: string;
  memoryStats: {
    private: number;
    shared: number;
    total: number;
  };
}

export interface LanceDBTables {
  agentRegistry: string;
  agentConfigs: string;
  sharedMemories: {
    general: string;
    specialized: string;
    collaborative: string;
  };
  agentMemories: string;
}

export interface VectorSearchParams {
  vector: number[];
  limit?: number;
  filter?: Record<string, any>;
  withScores?: boolean;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  memory: Memory;
}
