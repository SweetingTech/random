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
  const socketClient = io('http://localhost:4000');

  React.useEffect(() => {
    socketClient.on('connect', () => setConnected(true));
    socketClient.on('disconnect', () => setConnected(false));
    socketClient.on('codeChange', (data) => setCode(data.code));
    return () => socketClient.disconnect();
  }, []);

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
    React.createElement('div', { className: 'ide-container' },
      React.createElement('h2', { className: 'ide-header' }, 'IDE'),
      React.createElement('div', { className: 'editor-container' },
        React.createElement(Editor, { 
          height: "100%",
          defaultLanguage: "javascript",
          theme: "vs-dark",
          value: code,
          options: editorOptions,
          onChange: (newValue) => socketClient.emit('codeChange', { code: newValue })
        })
      ),
      React.createElement('div', { className: 'status-bar' },
        React.createElement('span', { 
          className: `connection-status ${connected ? 'connected' : 'disconnected'}` 
        }, connected ? 'Connected' : 'Disconnected')
      )
    )
  );
};

const SettingsComponent = () => {
  const [openaiKey, setOpenaiKey] = React.useState('');
  const handleSave = () => {
    localStorage.setItem('openaiKey', openaiKey);
    alert('Settings saved.');
  };
  return (
    React.createElement('div', { className: 'settings-container' },
      React.createElement('h2', null, 'Settings'),
      React.createElement('input', { 
        className: 'settings-input',
        type: 'password',
        value: openaiKey,
        placeholder: 'Enter OpenAI API Key',
        onChange: (e) => setOpenaiKey(e.target.value)
      }),
      React.createElement('button', { 
        className: 'settings-button',
        onClick: handleSave
      }, 'Save')
    )
  );
};

const App = () => {
  return (
    React.createElement(BrowserRouter, null,
      React.createElement('div', { className: 'app-container' },
        React.createElement('nav', { className: 'nav-bar' },
          React.createElement(Link, { className: 'nav-link', to: '/' }, 'IDE'),
          React.createElement(Link, { className: 'nav-link', to: '/settings' }, 'Settings')
        ),
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/', element: React.createElement(IDEComponent) }),
          React.createElement(Route, { path: '/settings', element: React.createElement(SettingsComponent) })
        )
      )
    )
  );
};

// Initialize React app
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
