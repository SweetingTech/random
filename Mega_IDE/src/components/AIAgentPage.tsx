import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Bot } from 'lucide-react';
import { NavBar } from './NavBar';

interface Agent {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  instructions: string;
  active: boolean;
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
