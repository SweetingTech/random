import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2 } from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    openaiKey: localStorage.getItem('openaiKey') || '',
    googleKey: localStorage.getItem('googleKey') || '',
    claudeKey: localStorage.getItem('claudeKey') || '',
    ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://localhost:11434',
    lmstudioUrl1: localStorage.getItem('lmstudioUrl1') || 'http://localhost:1234',
    extraInstanceUrl: localStorage.getItem('extraInstanceUrl') || 'http://localhost:54321'
  });

  const handleSave = () => {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Code2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-blue-400">Cloud API Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={settings.openaiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, openaiKey: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Google API Key
                </label>
                <input
                  type="password"
                  value={settings.googleKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleKey: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AIza..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Claude API Key
                </label>
                <input
                  type="password"
                  value={settings.claudeKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, claudeKey: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-ant-..."
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 text-blue-400">Local LLM Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Ollama URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  LM Studio Instance URL
                </label>
                <input
                  type="text"
                  value={settings.lmstudioUrl1}
                  onChange={(e) => setSettings(prev => ({ ...prev, lmstudioUrl1: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Extra Instance URL
                </label>
                <input
                  type="text"
                  value={settings.extraInstanceUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, extraInstanceUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
