"""
EPUB to PDF conversion functionality
"""

import os
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
from reportlab.lib.pagesizes import letter, A4, legal
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class EPUBConverter:
    """
    Handles conversion of EPUB files to PDF
    """
    
    def __init__(self, app):
        """Initialize with reference to the main application"""
        self.app = app
    
    def convert_to_pdf(self, epub_path):
        """Convert a single EPUB file to PDF"""
        try:
            # Generate output path
            if self.app.custom_filename.get() and self.app.override_filename.get():
                # Use custom filename pattern
                base_name = os.path.splitext(os.path.basename(epub_path))[0]
                file_num = 0
                
                # Find the index if possible
                for i, (path, file_type) in enumerate(self.app.file_paths):
                    if path == epub_path and file_type == "epub":
                        file_num = i
                        break
                
                # Replace placeholders in pattern
                output_filename = self.app.override_filename.get().replace('{name}', base_name).replace('{num}', str(file_num + 1))
                if not output_filename.endswith('.pdf'):
                    output_filename += '.pdf'
            else:
                # Use default filename
                output_filename = os.path.splitext(os.path.basename(epub_path))[0] + ".pdf"
                
            output_path = os.path.join(self.app.output_dir, output_filename)
            
            # Get page size
            page_size = self._get_page_size()
            
            # Read EPUB
            book = epub.read_epub(epub_path)
            
            # Create PDF
            c = canvas.Canvas(output_path, pagesize=page_size)
            pdf_width, pdf_height = page_size
            
            # Process EPUB content
            items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))
            line_height = 14
            margin = 50
            y_position = pdf_height - margin
            
            for item in items:
                content = item.get_content().decode('utf-8')
                soup = BeautifulSoup(content, 'html.parser')
                
                # Extract text content
                for paragraph in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                    text = paragraph.get_text()
                    if not text.strip():
                        continue
                        
                    # Check if we need a new page
                    if y_position < margin + line_height:
                        c.showPage()
                        y_position = pdf_height - margin
                    
                    # Add text to PDF
                    if paragraph.name.startswith('h'):
                        # Make headings bold and larger
                        c.setFont("Helvetica-Bold", 14)
                        c.drawString(margin, y_position, text)
                        y_position -= line_height * 2
                    else:
                        c.setFont("Helvetica", 11)
                        # Handle text wrapping
                        text_obj = c.beginText(margin, y_position)
                        text_obj.setFont("Helvetica", 11)
                        
                        # Split long text into multiple lines
                        words = text.split()
                        current_line = ""
                        
                        for word in words:
                            test_line = current_line + " " + word if current_line else word
                            if c.stringWidth(test_line, "Helvetica", 11) < (pdf_width - 2 * margin):
                                current_line = test_line
                            else:
                                text_obj.textLine(current_line)
                                y_position -= line_height
                                
                                # Check if we need a new page
                                if y_position < margin + line_height:
                                    c.drawText(text_obj)
                                    c.showPage()
                                    y_position = pdf_height - margin
                                    text_obj = c.beginText(margin, y_position)
                                    text_obj.setFont("Helvetica", 11)
                                
                                current_line = word
                        
                        # Add the last line
                        if current_line:
                            text_obj.textLine(current_line)
                            y_position -= line_height
                        
                        c.drawText(text_obj)
                    
                    # Add some space between paragraphs
                    y_position -= line_height
            
            # Save the PDF
            c.save()
            return True
            
        except Exception as e:
            raise Exception(f"Error converting {epub_path}: {str(e)}")
    
    def convert_multiple_to_pdf(self, epub_paths):
        """Convert multiple EPUB files to a single PDF"""
        try:
            # Generate output path
            output_filename = f"{self.app.combined_filename.get()}.pdf"
            output_path = os.path.join(self.app.output_dir, output_filename)
            
            # Get page size
            page_size = self._get_page_size()
            
            # Create PDF
            c = canvas.Canvas(output_path, pagesize=page_size)
            pdf_width, pdf_height = page_size
            line_height = 14
            margin = 50
            y_position = pdf_height - margin
            
            # Process each EPUB
            for epub_idx, epub_path in enumerate(epub_paths):
                try:
                    # Read EPUB
                    book = epub.read_epub(epub_path)
                    
                    # Add title page for this EPUB
                    epub_title = os.path.splitext(os.path.basename(epub_path))[0]
                    c.setFont("Helvetica-Bold", 18)
                    c.drawString(margin, pdf_height - 100, f"Book: {epub_title}")
                    c.setFont("Helvetica", 12)
                    c.drawString(margin, pdf_height - 120, f"Source: {epub_path}")
                    
                    # Add page break after title
                    c.showPage()
                    y_position = pdf_height - margin
                    
                    # Update status
                    self.app.root.after(0, lambda idx=epub_idx, total=len(epub_paths): 
                                      self.app.status_var.set(f"Processing EPUB {idx+1} of {total}: {epub_title}"))
                    
                    # Process EPUB content
                    items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))
                    
                    for item in items:
                        content = item.get_content().decode('utf-8')
                        soup = BeautifulSoup(content, 'html.parser')
                        
                        # Extract text content
                        for paragraph in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                            text = paragraph.get_text()
                            if not text.strip():
                                continue
                                
                            # Check if we need a new page
                            if y_position < margin + line_height:
                                c.showPage()
                                y_position = pdf_height - margin
                            
                            # Add text to PDF
                            if paragraph.name.startswith('h'):
                                # Make headings bold and larger
                                c.setFont("Helvetica-Bold", 14)
                                c.drawString(margin, y_position, text)
                                y_position -= line_height * 2
                            else:
                                c.setFont("Helvetica", 11)
                                # Handle text wrapping
                                text_obj = c.beginText(margin, y_position)
                                text_obj.setFont("Helvetica", 11)
                                
                                # Split long text into multiple lines
                                words = text.split()
                                current_line = ""
                                
                                for word in words:
                                    test_line = current_line + " " + word if current_line else word
                                    if c.stringWidth(test_line, "Helvetica", 11) < (pdf_width - 2 * margin):
                                        current_line = test_line
                                    else:
                                        text_obj.textLine(current_line)
                                        y_position -= line_height
                                        
                                        # Check if we need a new page
                                        if y_position < margin + line_height:
                                            c.drawText(text_obj)
                                            c.showPage()
                                            y_position = pdf_height - margin
                                            text_obj = c.beginText(margin, y_position)
                                            text_obj.setFont("Helvetica", 11)
                                        
                                        current_line = word
                                
                                # Add the last line
                                if current_line:
                                    text_obj.textLine(current_line)
                                    y_position -= line_height
                                
                                c.drawText(text_obj)
                            
                            # Add some space between paragraphs
                            y_position -= line_height
                    
                    # Add page break after each EPUB
                    if epub_idx < len(epub_paths) - 1:
                        c.showPage()
                        y_position = pdf_height - margin
                        
                except Exception as e:
                    # Log error but continue with next EPUB
                    print(f"Error processing {epub_path}: {str(e)}")
                    continue
            
            # Save the PDF
            c.save()
            
            # Show success message
            self.app.root.after(0, lambda: messagebox.showinfo("Success", 
                                f"Combined PDF created successfully at:\n{output_path}"))
            
            return True
            
        except Exception as e:
            raise Exception(f"Error creating combined PDF: {str(e)}")
    
    def _get_page_size(self):
        """Get the selected page size"""
        page_size_dict = {
            "letter": letter,
            "A4": A4,
            "legal": legal,
            "tabloid": (11*inch, 17*inch)  # Define tabloid size manually
        }
        return page_size_dict.get(self.app.page_size.get(), letter)


# Import at the end to avoid circular imports
from tkinter import messagebox