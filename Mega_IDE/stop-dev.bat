@echo off
echo Stopping development environment...

echo Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Stopping Electron processes...
taskkill /F /IM electron.exe >nul 2>&1

echo Cleaning build directories...
call npm run clean

echo Development environment stopped.
echo - Backend server stopped (port 3000)
echo - Vite server stopped (port 5174)
echo - Electron app stopped
timeout /t 2 /nobreak >nul
