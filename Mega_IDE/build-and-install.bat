@echo off
echo Stopping any running processes...
call npm run stop

echo Cleaning up...
call npm run clean

echo Installing dependencies...
call npm install

echo Building application...
call npm run build:all

echo Build complete!
echo To start the development environment, run: npm run start
echo To stop the development environment, run: npm run stop
pause
