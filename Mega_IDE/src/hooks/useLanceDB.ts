import { useState, useEffect } from 'react';
import type {
  Memory,
  MemoryShareRequest,
  AgentRegistryEntry,
  VectorSearchParams,
  VectorSearchResult,
  LanceDBSettings,
} from '../types/LanceDB';

export function useLanceDB() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if VectorDB is available by calling getSettings API
    getSettings()
      .then(() => setIsInitialized(true))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to initialize database')
      );
  }, []);

  const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
      const response = await fetch('/api/vectordb/generateEmbedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate embedding');
      throw err;
    }
  };

  const createMemory = async (
    content: string,
    metadata: Omit<Memory['metadata'], 'timestamp'>
  ): Promise<Memory> => {
    try {
      const vector = await generateEmbedding(content);
      const memory: Memory = {
        id: `memory_${Date.now()}`,
        content,
        vector,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      };
      return memory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memory');
      throw err;
    }
  };


  const storeMemory = async (memory: Memory): Promise<void> => {
    try {
      const response = await fetch('/api/vectordb/storeMemory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory }),
      });
      await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store memory');
      throw err;
    }
  };

  const searchMemories = async (
    params: VectorSearchParams
  ): Promise<VectorSearchResult[]> => {
    try {
      const response = await fetch('/api/vectordb/searchMemories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search memories');
      throw err;
    }
  };

  const registerAgent = async (agent: AgentRegistryEntry): Promise<void> => {
    try {
      const response = await fetch('/api/vectordb/registerAgent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent }),
      });
      await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register agent');
      throw err;
    }
  };

  const shareMemory = async (request: MemoryShareRequest): Promise<void> => {
    try {
      const response = await fetch('/api/vectordb/shareMemory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });
      await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share memory');
      throw err;
    }
  };

  const updateSettings = async (
    settings: Partial<LanceDBSettings>
  ): Promise<void> => {
    try {
      const response = await fetch('/api/vectordb/updateSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  const getSettings = async (): Promise<LanceDBSettings> => {
    try {
      const response = await fetch('/api/vectordb/getSettings');
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get settings');
      throw err;
    }
  };

  return {
    isInitialized,
    error,
    generateEmbedding,
    createMemory,
    storeMemory,
    searchMemories,
    registerAgent,
    shareMemory,
    updateSettings,
    getSettings,
  };
}

export default useLanceDB;
