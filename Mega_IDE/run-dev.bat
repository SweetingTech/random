@echo off
echo Starting development environment...

rem Stop any existing processes
call stop-dev.bat

rem Clean build directories
echo Cleaning build directories...
call npm run clean

rem Build project
echo Building project...
call npm run build

rem Start the prelaunch configuration window
echo Starting Mega IDE configuration...
call npx electron prelaunch.js

echo Development environment is running.
echo - Backend server: http://localhost:3000
echo - Vite dev server: http://localhost:5174
echo - Electron app is running
echo.
echo Console windows are now visible for debugging.
echo To stop the development environment run stop-dev.bat
pause
