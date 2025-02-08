@echo off
echo Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 2 >nul

echo Starting TypeScript compilation...
start "TSC" cmd /c "npx tsc --project electron/tsconfig.json --watch"
timeout /t 2 >nul

echo Starting Vite server...
start "VITE" cmd /c "npx vite"
timeout /t 2 >nul

echo Starting backend server...
start "SERVER" cmd /c "node --experimental-modules server.mjs"
timeout /t 5 >nul

echo Starting Electron...
set NODE_ENV=development
start "ELECTRON" cmd /c "npx electron ."
