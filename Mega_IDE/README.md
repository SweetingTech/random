# Mega IDE

A powerful, extensible IDE built with Electron, React, and TypeScript.

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development environment:
```bash
.\run-dev.bat
```

## Running the Application

When you run the application using `run-dev.bat`, you'll be presented with two configuration options:

1. **Hardware Acceleration Mode:**
   - Choose between CPU mode (hardware acceleration disabled) or GPU mode (hardware acceleration enabled)
   - If you experience graphics-related issues, try running in CPU mode
   - This setting affects how the application renders its interface

2. **Cache Directory:**
   - Optionally specify a custom cache directory for storing temporary files and data
   - If not specified, a default location will be used
   - This can be useful if you want to store cache files in a specific location or drive

Example launch sequence:
```
Mega IDE Launcher

Do you want to run in CPU mode (disable hardware acceleration)? [y/n]: n

Running with GPU acceleration enabled.

Enter a custom cache folder path or press enter to use default: D:\MegaIDE\cache

Using custom cache folder: D:\MegaIDE\cache

Starting Mega IDE...
```

## Settings

The Settings page provides several configuration options:

- **Cache Directory:** Change where Mega IDE stores its cache files. Changes require restarting the application.
- **Editor Theme:** Choose between light, dark, and high contrast themes
- **Editor Settings:** Configure font size, word wrap, minimap, and auto-save options
- **Performance:** Toggle hardware acceleration and other performance settings

## Development Scripts

- `run-dev.bat`: Start the development environment with configuration options
- `stop-dev.bat`: Stop all development processes
- `npm run build`: Build the application
- `npm run clean`: Clean build directories

## Architecture

The application consists of several components:

- Backend server (Node.js)
- Frontend development server (Vite)
- Electron application

All these components are managed automatically by the development scripts.

## Features

- **Intelligent Code Editing:** Advanced code editing with syntax highlighting and auto-completion
- **Git Integration:** Built-in Git support for version control
- **AI Assistance:** AI-powered code suggestions and improvements
- **Real-time Collaboration:** Work together with team members in real-time
- **Extensible:** Plugin system for adding new functionality
- **Customizable:** Extensive settings for personalizing your development environment

## Troubleshooting

### Graphics Issues
If you experience graphics-related issues:
1. Stop the application using `stop-dev.bat`
2. Run `run-dev.bat` again and choose "y" when asked about CPU mode
3. This will disable hardware acceleration, which may resolve rendering issues

### Cache Issues
If you experience cache-related issues:
1. Try specifying a different cache directory when launching the application
2. Ensure the specified directory has appropriate read/write permissions
3. You can also change the cache directory through the Settings page in the application

### Common Problems
- **Startup Errors:** Make sure all required dependencies are installed
- **Performance Issues:** Consider running in CPU mode if you experience graphics problems
- **File Access Issues:** Check file and directory permissions
