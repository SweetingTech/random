@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo PDF Converter - Windows Setup
echo ===================================================

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.6 or higher from https://www.python.org/downloads/
    echo Be sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment.
        echo Please ensure you have venv module installed.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment.
    pause
    exit /b 1
)

REM Install or upgrade requirements
echo Installing/upgrading dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    echo Please check requirements.txt and your internet connection.
    pause
    exit /b 1
)

REM Create desktop shortcut
echo.
echo Would you like to create a desktop shortcut? (Y/N)
set /p create_shortcut=

if /i "%create_shortcut%"=="Y" (
    call create_shortcut.bat
)

echo.
echo Setup completed successfully!
echo.
echo You can now run the application using:
echo  1. Double-click run_converter.bat (shows console)
echo  2. Double-click run_converter_silent.bat (hides console)
echo.
echo If you created a desktop shortcut, you can use that as well.
echo.
pause