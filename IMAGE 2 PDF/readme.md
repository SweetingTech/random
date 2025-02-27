# Advanced PDF Converter

A comprehensive GUI application for converting images and EPUB files to PDF format with advanced options and batch processing capabilities.

## Features

- **Image to PDF Conversion**: Convert JPG, PNG, GIF, BMP, and TIFF files to PDF
- **EPUB to PDF Conversion**: Convert EPUB e-books to PDF format
- **Batch Processing**: Queue multiple files for conversion
- **Folder Processing**: Select entire folders to convert all compatible files
- **Combined Mode**: Option to combine multiple files into a single PDF document
- **File Management**: Reorder, remove, and view details of queued files
- **Custom Filenames**: Define your own naming patterns for output files
- **PDF Options**:
  - Multiple page size options (Letter, A4, Legal, Tabloid)
  - Quality settings for image conversion
  - Custom output directory selection
- **User-Friendly Interface**: Clean tabbed interface with progress tracking

## File Structure

The application is organized into several modules:
- `converter_app.py` - Main entry point for the application (with console)
- `converter_app.pyw` - Main entry point without console window (Windows)
- `pdf_converter_gui.py` - Main GUI implementation
- `image_converter.py` - Image to PDF conversion logic
- `epub_converter.py` - EPUB to PDF conversion logic
- `file_queue_manager.py` - Queue management functionality

### Windows-Specific Files
- `run_converter.bat` - Runs the application (shows console window)
- `run_converter_silent.bat` - Runs the application without console window
- `create_shortcut.bat` - Creates a desktop shortcut to the application
- `setup_windows.bat` - Complete setup script for Windows users

## Installation

### Windows Quick Start
1. Make sure you have Python 3.6+ installed (be sure to check "Add Python to PATH" during installation)
2. Double-click the `setup_windows.bat` file to:
   - Create a virtual environment (if needed)
   - Install required dependencies
   - Optionally create a desktop shortcut

3. To run the application, you can:
   - Double-click `run_converter.bat` (shows console window)
   - Double-click `run_converter_silent.bat` (hides console window)
   - Use the desktop shortcut (if created)
   
### Windows Troubleshooting
- If you see errors about Python not being found, ensure Python is installed and added to your PATH
- If the application crashes, check the console output in `run_converter.bat` for error messages

### Manual Installation
If you prefer to set up manually:

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python converter_app.py
   ```

## Usage

1. **Select Input Files**:
   - Use "Select Files" to choose individual files
   - Use "Select Folder" to add all files from a directory

2. **Configure Options**:
   - Select page size (Letter, A4, Legal, Tabloid)
   - Adjust image quality (1-100)
   - Choose output directory
   - Enable "Combine all files" to create a single PDF
   - Enable "Use custom filename" to specify output naming patterns

3. **Manage Files**:
   - Reorder files using "Move Up" and "Move Down" buttons
   - Remove unwanted files with "Remove Selected" or "Clear All"
   - Double-click on files to view their details

4. **Start Conversion**:
   - Click "Convert All Files" to process the queue
   - Monitor progress in the bottom panel

## Requirements

- Python 3.6+
- tkinter (usually included with Python)
- Pillow
- ReportLab
- EbookLib
- BeautifulSoup4

## Troubleshooting

- **Missing dependencies**: Run `pip install -r requirements.txt`
- **EPUB conversion issues**: Make sure the EPUB file is not DRM-protected
- **GUI doesn't appear**: Ensure tkinter is properly installed with your Python installation

## License

This software is open-source and free to use for personal and commercial purposes.