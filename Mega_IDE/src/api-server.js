import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { program } from 'commander';
import fetch from 'node-fetch';

// APIManager for handling external API calls
const APIManager = {
  apis: {},
  addAPI: (apiName, conf) => {
    APIManager.apis[apiName] = conf;
  },
  callAPI: async (apiName, endpoint, method = 'POST', body = null, headersOverride = {}) => {
    const conf = APIManager.apis[apiName];
    if (!conf) throw new Error(`API "${apiName}" is not configured.`);
    
    const fullUrl = `${conf.baseUrl}${endpoint}`;
    const finalHeaders = { ...conf.headers, ...headersOverride };

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : null,
      });
      if (!response.ok) {
        throw new Error(`API call to ${apiName} failed: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error calling API "${apiName}":`, error);
      throw error;
    }
  },
};

// Setup APIs
APIManager.addAPI('openai', { baseUrl: 'https://api.openai.com/v1', headers: { 'Authorization': `Bearer ${process.env.OPENAI_KEY}` } });
APIManager.addAPI('google', { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', headers: { 'x-goog-api-key': process.env.GOOGLE_KEY } });
APIManager.addAPI('claude', { baseUrl: 'https://api.anthropic.com/v1', headers: { 'x-api-key': process.env.CLAUDE_KEY } });

// Collaboration Server
const collaborationApp = express();
const collaborationServer = http.createServer(collaborationApp);
const io = new SocketIOServer(collaborationServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('codeChange', (data) => socket.broadcast.emit('codeChange', data));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// CLI Interface
program.command('run <file>').action(async (file) => {
  const { exec } = await import('child_process');
  exec(`node ${file}`, (error, stdout) => console.log(stdout));
});
program.command('settings').action(() => console.log('Launching settings interface...'));

if (process.argv.length > 2) program.parse(process.argv);

// Start server
const PORT = process.env.COLLAB_PORT || 3000;
collaborationServer.listen(PORT, () => console.log(`Collaboration server running on port ${PORT}`));

export { APIManager };
