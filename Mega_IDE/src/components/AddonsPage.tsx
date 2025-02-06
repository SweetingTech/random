import React, { useState, useEffect } from 'react';
import SocketManager from '../lib/socket';
import { NavBar } from './NavBar';

type PackageConfig = {
  installed: string[];
  available: string[];
};

type PackagesState = {
  [key: string]: PackageConfig;
};

export function AddonsPage() {
  const [packages, setPackages] = useState<PackagesState>({
    python: {
      installed: ['numpy', 'pandas', 'scikit-learn'],
      available: ['tensorflow', 'pytorch', 'keras', 'matplotlib']
    },
    r: {
      installed: ['tidyverse', 'ggplot2'],
      available: ['shiny', 'dplyr', 'caret']
    },
    java: {
      installed: ['junit', 'log4j'],
      available: ['spring-boot', 'hibernate', 'mockito']
    },
    cpp: {
      installed: ['boost', 'opencv'],
      available: ['eigen', 'tensorflow-cpp', 'dlib']
    },
    julia: {
      installed: ['Plots', 'DataFrames'],
      available: ['Flux', 'DifferentialEquations']
    },
    javascript: {
      installed: ['typescript', 'eslint'],
      available: ['prettier', 'babel', 'webpack']
    }
  });

  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [terminalOutput, setTerminalOutput] = useState('');
  const socket = SocketManager.getInstance();

  const installPackage = (language: string, pkg: string): void => {
    socket.emit('installPackage', { language, package: pkg });
    setTerminalOutput(prev => `${prev}\nInstalling ${pkg} for ${language}...`);
  };

  const uninstallPackage = (language: string, pkg: string): void => {
    socket.emit('uninstallPackage', { language, package: pkg });
    setTerminalOutput(prev => `${prev}\nUninstalling ${pkg} from ${language}...`);
  };

  useEffect(() => {
    socket.on('packageOutput', (data: { output: string }) => {
      setTerminalOutput(prev => `${prev}\n${data.output}`);
    });

    return () => {
      socket.off('packageOutput');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NavBar />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Package Manager</h1>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              {Object.keys(packages).map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Installed Packages</h2>
                <div className="space-y-2">
                  {packages[selectedLanguage].installed.map(pkg => (
                    <div key={pkg} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <span>{pkg}</span>
                      <button
                        onClick={() => uninstallPackage(selectedLanguage, pkg)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Uninstall
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Available Packages</h2>
                <div className="space-y-2">
                  {packages[selectedLanguage].available.map(pkg => (
                    <div key={pkg} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <span>{pkg}</span>
                      <button
                        onClick={() => installPackage(selectedLanguage, pkg)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Install
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Terminal Output</h2>
                <button
                  onClick={() => setTerminalOutput('')}
                  className="px-3 py-1 text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="bg-black rounded-lg p-4 h-[600px] overflow-auto font-mono text-sm">
                <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
