@echo off
setlocal

REM Get the current directory
cd /d "%~dp0"

REM Activate the virtual environment without showing the console
call venv\Scripts\activate.bat >nul 2>&1

REM Launch the application without console window (.pyw extension)
start /b "" pythonw converter_app.pyw

REM No need to deactivate since we're using start /b command
exit