# Port Configuration Guide

## Overview
This document outlines the port configuration for the Mega IDE application. All port settings are managed through environment variables to allow for easy configuration changes without modifying code.

## Default Ports

- **Vite Development Server**: 5174 (configurable via `VITE_DEV_SERVER_PORT`)
- **API Server**: 3000 (configurable via `API_SERVER_PORT`)
- **Socket Server**: 3000 (configurable via `SOCKET_SERVER_PORT`)

## Environment Variables

The following environment variables can be set in the `.env` file:

```env
# Server Ports
VITE_DEV_SERVER_PORT=5174    # Port for Vite development server
API_SERVER_PORT=3000         # Port for the API server
SOCKET_SERVER_PORT=3000      # Port for WebSocket server
```

## Changing Ports

To change any of the ports:

1. Open the `.env` file in the project root
2. Modify the desired port number
3. Restart the application using `run-dev.bat`

## Port Usage

### Development Server (Vite)
- Used by: Frontend development server
- Default: 5174
- Environment Variable: `VITE_DEV_SERVER_PORT`
- Files that reference this:
  - `vite.config.ts`
  - `run-dev.bat`
  - `electron/main.ts`

### API Server
- Used by: Backend Express server
- Default: 3000
- Environment Variable: `API_SERVER_PORT`
- Files that reference this:
  - `server.js`

### Socket Server
- Used by: WebSocket communication
- Default: 3000
- Environment Variable: `SOCKET_SERVER_PORT`
- Files that reference this:
  - `src/lib/socket.ts`

## Troubleshooting

If you encounter port conflicts:

1. Check if any other applications are using the same ports
2. Modify the port numbers in the `.env` file
3. Run `stop-dev.bat` to ensure all processes are stopped
4. Start the application again with `run-dev.bat`

## Development Scripts

- `run-dev.bat`: Starts all servers with configured ports
- `stop-dev.bat`: Stops all running servers and processes

## Important Notes

- The Socket Server and API Server share the same port by default (3000) as they're part of the same Express server
- Always use the environment variables instead of hardcoding port numbers
- When deploying, ensure the ports are available and not blocked by firewalls
