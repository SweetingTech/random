import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Bot, Share2, Database, Settings2 } from 'lucide-react';
import { NavBar } from './NavBar';
import { useLanceDB } from '../hooks/useLanceDB';
import type { AgentRegistryEntry, Memory, MemoryMetadata } from '../types/LanceDB';

interface Agent {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  instructions: string;
  active: boolean;
  memorySettings?: {
    shareByDefault: boolean;
    retentionPeriod: number;
    allowedAgents: string[];
  };
}

export function AIAgentPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'default',
      name: 'Default Assistant',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      instructions: '# Default Instructions\n\nBe helpful and concise.',
      active: true,
      memorySettings: {
        shareByDefault: true,
        retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
        allowedAgents: []
      }
    }
  ]);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [editingInstructions, setEditingInstructions] = useState(agents[0].instructions);
  const [showMemorySettings, setShowMemorySettings] = useState(false);

  const {
    isInitialized,
    error,
    registerAgent,
    storeMemory,
    createMemory,
    searchMemories
  } = useLanceDB();

  // Initialize agents from LanceDB
  useEffect(() => {
    const loadAgents = async () => {
      if (!isInitialized) return;

      try {
        // Search for all agents in registry
        const results = await searchMemories({
          vector: await createMemory('agent configuration', {
            creator: 'system',
            type: 'agent_config',
            tags: ['configuration'],
            visibility: 'private',
            context: {}
          }).then(m => m.vector),
          limit: 100
        });

        if (results.length > 0) {
          const loadedAgents = results.map(result => result.memory.metadata.agent as Agent);
          setAgents(loadedAgents);
          setSelectedAgent(loadedAgents[0]);
          setEditingInstructions(loadedAgents[0].instructions);
        }
      } catch (err) {
        console.error('Failed to load agents:', err);
      }
    };

    loadAgents();
  }, [isInitialized, createMemory, searchMemories]);

  const saveAgent = async () => {
    if (!isInitialized) return;

    try {
      // Create agent registry entry
      const agentEntry: AgentRegistryEntry = {
        id: selectedAgent.id,
        name: selectedAgent.name,
        capabilities: {
          memoryAccess: {
            canRead: ['shared_memories_general'],
            canWrite: ['agent_memories', 'shared_memories_general'],
            sharingPreferences: {
              autoShare: selectedAgent.memorySettings?.shareByDefault ?? false,
              shareWithAgents: selectedAgent.memorySettings?.allowedAgents ?? []
            }
          },
          specializations: [],
          supportedModels: [selectedAgent.model],
          apiIntegrations: [],
          version: '1.0.0'
        },
        status: 'active',
        lastActive: new Date().toISOString(),
        memoryStats: {
          private: 0,
          shared: 0,
          total: 0
        }
      };

      // Register agent in LanceDB
      await registerAgent(agentEntry);

      // Store agent configuration as memory
      const memory = await createMemory(
        `Agent Configuration: ${selectedAgent.name}`,
        {
          creator: 'system',
          type: 'agent_config',
          tags: ['configuration', 'agent'],
          visibility: 'private',
          context: {},
          agent: selectedAgent // Store full agent configuration in metadata
        }
      );
      await storeMemory(memory);

      // Update local state
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

    } catch (err) {
      console.error('Failed to save agent:', err);
    }
  };

  const addNewAgent = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: 'New Agent',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      instructions: '# New Agent Instructions\n\nAdd your instructions here.',
      active: false,
      memorySettings: {
        shareByDefault: true,
        retentionPeriod: 30 * 24 * 60 * 60 * 1000,
        allowedAgents: []
      }
    };
    setAgents(prev => [...prev, newAgent]);
  };

  if (!isInitialized) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Initializing LanceDB...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Error: {error}</div>;
  }

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
                      setShowMemorySettings(false);
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowMemorySettings(!showMemorySettings)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" />
                      Memory Settings
                    </button>
                    <button
                      onClick={saveAgent}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {showMemorySettings ? (
                  <div className="mb-6 space-y-4">
                    <h3 className="text-lg font-semibold">Memory Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Share Memories by Default
                        </label>
                        <input
                          type="checkbox"
                          checked={selectedAgent.memorySettings?.shareByDefault}
                          onChange={(e) => setSelectedAgent(prev => ({
                            ...prev,
                            memorySettings: {
                              ...prev.memorySettings!,
                              shareByDefault: e.target.checked
                            }
                          }))}
                          className="mr-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Memory Retention (days)
                        </label>
                        <input
                          type="number"
                          value={selectedAgent.memorySettings?.retentionPeriod! / (24 * 60 * 60 * 1000)}
                          onChange={(e) => setSelectedAgent(prev => ({
                            ...prev,
                            memorySettings: {
                              ...prev.memorySettings!,
                              retentionPeriod: parseInt(e.target.value) * 24 * 60 * 60 * 1000
                            }
                          }))}
                          className="w-full bg-gray-700 px-3 py-2 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}

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
