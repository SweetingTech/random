import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Package, Bot, Settings } from 'lucide-react';

export function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="flex items-center space-x-4 px-4 py-2 bg-gray-800 border-b border-gray-700">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="IDE"
      >
        <Code2 className="w-5 h-5" />
        <span>IDE</span>
      </button>
      <button
        onClick={() => navigate('/addons')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="Add-ons"
      >
        <Package className="w-5 h-5" />
        <span>Add-ons</span>
      </button>
      <button
        onClick={() => navigate('/ai-agent')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="AI Agent"
      >
        <Bot className="w-5 h-5" />
        <span>AI Agent</span>
      </button>
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </button>
    </nav>
  );
}
