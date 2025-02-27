#!/usr/bin/env python3
"""
Main entry point for the PDF Converter application.
This file initializes the application and handles high-level errors.
"""

import tkinter as tk
import traceback
import tkinter.messagebox as msgbox
from pdf_converter_gui import PDFConverterApp

def main():
    """Main entry point for the application"""
    try:
        root = tk.Tk()
        app = PDFConverterApp(root)
        root.mainloop()
    except Exception as e:
        # Show error in console and message box
        traceback.print_exc()
        
        try:
            # Try to show error in message box if possible
            msgbox.showerror("Application Error", f"An unexpected error occurred:\n{str(e)}")
        except:
            # If even that fails, at least print to console
            print(f"Critical error: {str(e)}")

if __name__ == "__main__":
    main()