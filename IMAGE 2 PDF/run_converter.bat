@echo off
setlocal enabledelayedexpansion

REM Set the Python script name
set SCRIPT_NAME=converter_app.py

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.6 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check for venv folder
if exist venv (
    echo Virtual environment found. Activating...
    call venv\Scripts\activate
    
    if %errorlevel% neq 0 (
        echo Failed to activate virtual environment.
        pause
        exit /b 1
    )
) else (
    echo Virtual environment not found. Creating new one...
    python -m venv venv
    
    if %errorlevel% neq 0 (
        echo Failed to create virtual environment.
        echo Please ensure you have venv module installed.
        pause
        exit /b 1
    )
    
    echo Virtual environment created. Activating...
    call venv\Scripts\activate
    
    if %errorlevel% neq 0 (
        echo Failed to activate virtual environment.
        pause
        exit /b 1
    )
    
    echo Installing dependencies...
    pip install -r requirements.txt
    
    if %errorlevel% neq 0 (
        echo Failed to install dependencies.
        echo Please check requirements.txt and your internet connection.
        pause
        exit /b 1
    )
)

REM Check if the script exists
if not exist %SCRIPT_NAME% (
    echo Error: %SCRIPT_NAME% not found.
    echo Please ensure the script file is in the same directory as this batch file.
    pause
    exit /b 1
)

REM Run the Python script
echo Launching PDF Converter application...
python %SCRIPT_NAME%

REM Keep the window open if there's an error
if %errorlevel% neq 0 (
    echo Application exited with error code %errorlevel%.
    pause
)

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

exit /b 0