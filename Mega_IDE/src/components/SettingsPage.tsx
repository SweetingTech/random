import React, { useState } from 'react';
import { Settings, FolderOpen, Moon, Sun, Code, Palette, Monitor, Zap } from 'lucide-react';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'vs-dark',
    name: 'Dark',
    description: 'Default dark theme'
  },
  {
    id: 'vs-light',
    name: 'Light',
    description: 'Default light theme'
  },
  {
    id: 'hc-black',
    name: 'High Contrast Dark',
    description: 'High contrast dark theme'
  },
  {
    id: 'hc-light',
    name: 'High Contrast Light',
    description: 'High contrast light theme'
  }
];

export function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState('on');
  const [minimap, setMinimap] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const handleChangeCacheDirectory = async () => {
    try {
      const changed = await window.electron.settings.changeCacheDirectory();
      if (changed) {
        // The main process will show a dialog about restarting
      }
    } catch (error) {
      console.error('Error changing cache directory:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          Settings
        </h1>
      </header>

      <div className="space-y-8">
        {/* Cache Directory Section */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cache Directory</h2>
          <p className="text-gray-400 mb-4">
            Change where Mega IDE stores its cache files. This includes temporary files,
            embeddings, and other application data.
          </p>
          <button
            onClick={handleChangeCacheDirectory}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Change Cache Directory
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Note: Changing the cache directory requires restarting Mega IDE
          </p>
        </section>

        {/* Editor Theme Section */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Editor Theme
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themeOptions.map((theme) => (
              <div
                key={theme.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedTheme === theme.id
                    ? 'border-blue-500 bg-gray-700'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{theme.name}</h3>
                  {theme.id.includes('dark') ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{theme.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Editor Settings Section */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Editor Settings
          </h2>
          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-48"
                />
                <span className="text-sm">{fontSize}px</span>
              </div>
            </div>

            {/* Word Wrap */}
            <div>
              <label className="block text-sm font-medium mb-2">Word Wrap</label>
              <select
                value={wordWrap}
                onChange={(e) => setWordWrap(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="off">Off</option>
                <option value="on">On</option>
                <option value="wordWrapColumn">Fixed Column</option>
              </select>
            </div>

            {/* Minimap */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={minimap}
                  onChange={(e) => setMinimap(e.target.checked)}
                  className="mr-2"
                />
                Show Minimap
              </label>
            </div>

            {/* Auto Save */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="mr-2"
                />
                Auto Save
              </label>
            </div>
          </div>
        </section>

        {/* Performance Settings */}
        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Performance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Hardware Acceleration</h3>
                <p className="text-sm text-gray-400">
                  Use GPU acceleration when available
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
