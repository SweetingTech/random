import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import './styles.css';

// React Components (IDE, Settings, Workflows, Agents Panel)
const IDEComponent = () => {
  const [code, setCode] = React.useState('// Start coding...');
  const [connected, setConnected] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState('openai');
  const [providerStatuses, setProviderStatuses] = React.useState({});
  const socketClient = io('http://localhost:4000');

  React.useEffect(() => {
    socketClient.on('connect', () => setConnected(true));
    socketClient.on('disconnect', () => setConnected(false));
    socketClient.on('codeChange', (data) => setCode(data.code));
    socketClient.on('aiResponse', (response) => {
      console.log('AI Response:', response);
      // Handle the AI response here
    });
    socketClient.on('providerStatus', (status) => {
      setProviderStatuses(prev => ({
        ...prev,
        [status.provider]: status
      }));
    });

    // Test all providers on component mount
    const providers = [
      'ollama_instance1',
      'lmstudio_instance1',
      'lmstudio_instance2',
      'openai'
    ];
    providers.forEach(provider => {
      socketClient.emit('testProvider', provider);
    });

    return () => socketClient.disconnect();
  }, []);

  const handleAIAssist = () => {
    socketClient.emit('requestAIAssistance', {
      provider: selectedProvider,
      prompt: `Please review this code and suggest improvements:\n\n${code}`
    });
  };

  const editorOptions = {
    fontSize: 14,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: true,
    bracketPairColorization: { enabled: true }
  };

  return (
    <div className="ide-container">
      <div className="ide-header">
        <h2>IDE</h2>
        <div className="ai-controls">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="provider-select"
          >
            <option value="openai">OpenAI</option>
            <option value="ollama_instance1">Ollama</option>
            <option value="lmstudio_instance1">LM Studio (Instance 1)</option>
            <option value="lmstudio_instance2">LM Studio (Instance 2)</option>
          </select>
          <button
            onClick={handleAIAssist}
            className="ai-assist-button"
            disabled={!providerStatuses[selectedProvider]?.status === 'connected'}
          >
            Get AI Assistance
          </button>
        </div>
      </div>
      <div className="editor-container">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          options={editorOptions}
          onChange={(newValue) => socketClient.emit('codeChange', { code: newValue })}
        />
      </div>
      <div className="status-bar">
        <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <div className="provider-statuses">
          {Object.entries(providerStatuses).map(([provider, status]) => (
            <span
              key={provider}
              className={`provider-status ${status.status}`}
              title={status.error || ''}
            >
              {provider}: {status.status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsComponent = () => {
  const [settings, setSettings] = React.useState({
    openaiKey: '',
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl1: 'http://localhost:1234',
    lmstudioUrl2: 'http://localhost:54321'
  });

  const handleSave = () => {
    localStorage.setItem('ideSettings', JSON.stringify(settings));
    alert('Settings saved.');
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <div className="settings-group">
        <h3>API Keys</h3>
        <input
          className="settings-input"
          type="password"
          value={settings.openaiKey}
          placeholder="Enter OpenAI API Key"
          onChange={(e) => handleChange('openaiKey', e.target.value)}
        />
      </div>
      <div className="settings-group">
        <h3>Local LLM Settings</h3>
        <input
          className="settings-input"
          type="text"
          value={settings.ollamaUrl}
          placeholder="Ollama URL"
          onChange={(e) => handleChange('ollamaUrl', e.target.value)}
        />
        <input
          className="settings-input"
          type="text"
          value={settings.lmstudioUrl1}
          placeholder="LM Studio Instance 1 URL"
          onChange={(e) => handleChange('lmstudioUrl1', e.target.value)}
        />
        <input
          className="settings-input"
          type="text"
          value={settings.lmstudioUrl2}
          placeholder="LM Studio Instance 2 URL"
          onChange={(e) => handleChange('lmstudioUrl2', e.target.value)}
        />
      </div>
      <button className="settings-button" onClick={handleSave}>
        Save
      </button>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="nav-bar">
          <Link className="nav-link" to="/">IDE</Link>
          <Link className="nav-link" to="/settings">Settings</Link>
        </nav>
        <Routes>
          <Route path="/" element={<IDEComponent />} />
          <Route path="/settings" element={<SettingsComponent />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

// Initialize React app
const root = createRoot(document.getElementById('root')!);
root.render(<App />);