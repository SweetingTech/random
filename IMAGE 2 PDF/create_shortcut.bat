@echo off
setlocal

REM Get the current directory
set CURRENT_DIR=%~dp0

REM Create VBS script to create a shortcut
echo Creating shortcut script...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo strDesktop = WshShell.SpecialFolders^("Desktop"^)
echo Set oShellLink = WshShell.CreateShortcut^(strDesktop ^& "\PDF Converter.lnk"^)
echo oShellLink.TargetPath = "%CURRENT_DIR%run_converter_silent.bat"
echo oShellLink.WorkingDirectory = "%CURRENT_DIR%"
echo oShellLink.IconLocation = "%CURRENT_DIR%venv\Lib\site-packages\reportlab\graphics\renderPM.pyd,0"
echo oShellLink.Description = "PDF Converter Application"
echo oShellLink.Save
) > create_shortcut.vbs

REM Run the script
echo Creating desktop shortcut...
cscript //nologo create_shortcut.vbs

REM Delete the script
del create_shortcut.vbs

echo Shortcut created on your desktop.
echo.
echo NOTE: You can also create additional shortcuts for this application by:
echo 1. Right-clicking on run_converter_silent.bat
echo 2. Selecting "Create shortcut"
echo 3. Moving the shortcut to your desired location
echo.
pause