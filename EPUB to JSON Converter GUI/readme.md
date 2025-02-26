# EPUB to JSON Converter

A desktop application for batch converting EPUB books to JSON format with an easy-to-use interface.

![Windows Compatible](https://img.shields.io/badge/platform-windows-blue.svg)


## Overview

This application provides a graphical user interface for converting EPUB files to JSON format. It allows you to:
- Add multiple books individually or entire folders at once
- Manage a conversion queue
- Select a custom output directory
- Monitor conversion progress

The JSON output preserves book metadata (title, author) and chapter content in a structured format suitable for further processing or integration with other applications.

## Features

- **Bulk Processing**: Convert multiple EPUB files in a queue
- **Folder Support**: Scan folders recursively for EPUB files
- **Custom Output**: Choose where to save the generated JSON files
- **Visual Progress Tracking**: Monitor conversion status and progress
- **Error Handling**: Graceful handling of conversion issues
- **Multi-threaded**: Non-blocking interface during conversion

## Requirements

- Python 3.6 or higher
- Required Python packages:
  - tkinter (usually included with Python)
  - ebooklib
  - beautifulsoup4

## Installation

### Standard Installation

1. Clone or download this repository
2. Navigate to the "file converter" folder
3. Install required dependencies:

```bash
pip install ebooklib beautifulsoup4
```

### Virtual Environment Setup (Recommended)

#### Windows

```cmd
# Navigate to your project folder
cd path\to\file converter

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate

# Install dependencies
pip install ebooklib beautifulsoup4
```

When you're done using the application, you can deactivate the virtual environment:

```cmd
deactivate
```

## Usage

### Standard Usage

1. Run the application:

```bash
python converter.py
```

### Running from Virtual Environment (Windows)

```cmd
# Navigate to your project folder
cd path\to\file converter

# Activate the virtual environment
venv\Scripts\activate

# Run the application
python converter.py
```

2. Add EPUB files to the queue using "Add Book(s)" or "Add Folder"
3. Set your desired output folder (defaults to Documents folder)
4. Click "Start Processing" to begin conversion
5. Monitor progress in the queue view
6. Access your converted JSON files in the selected output folder

## Output Format

The generated JSON files follow this structure:

```json
{
    "title": "Book Title",
    "author": "Author Name",
    "chapters": [
        {
            "title": "Chapter Title",
            "content": "The full text content of the chapter..."
        },
        ...
    ]
}
```

## Notes

- The application detects and skips duplicate files in the queue
- Processing large EPUB files or a large queue may take some time
- Chapter titles are extracted from heading elements (h1, h2, h3) when available
- Files with errors during conversion will be marked in the queue but won't halt the overall process

## Windows-Specific Tips

- You can create a shortcut to the application by right-clicking on `converter.py` and selecting "Create shortcut"
- To run the application without showing a console window, rename the file extension from `.py` to `.pyw` (e.g., `converter.pyw`)
- For convenience, you can create a batch file to activate the venv and run the application:

```cmd
@echo off
cd /d %~dp0
call venv\Scripts\activate
python converter.py
pause
```

Save this as `run_converter.bat` in your "file converter" folder.