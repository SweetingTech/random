"""
Image to PDF conversion functionality
"""

import os
from PIL import Image
from reportlab.lib.pagesizes import letter, A4, legal
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class ImageConverter:
    """
    Handles conversion of image files to PDF
    """
    
    def __init__(self, app):
        """Initialize with reference to the main application"""
        self.app = app
    
    def convert_to_pdf(self, image_path):
        """Convert a single image to PDF"""
        try:
            # Generate output path
            if self.app.custom_filename.get() and self.app.override_filename.get():
                # Use custom filename pattern
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                file_num = 0
                
                # Find the index if possible
                for i, (path, file_type) in enumerate(self.app.file_paths):
                    if path == image_path and file_type == "image":
                        file_num = i
                        break
                
                # Replace placeholders in pattern
                output_filename = self.app.override_filename.get().replace('{name}', base_name).replace('{num}', str(file_num + 1))
                if not output_filename.endswith('.pdf'):
                    output_filename += '.pdf'
            else:
                # Use default filename
                output_filename = os.path.splitext(os.path.basename(image_path))[0] + ".pdf"
                
            output_path = os.path.join(self.app.output_dir, output_filename)
            
            # Get page size
            page_size = self._get_page_size()
            
            # Open image and get dimensions
            img = Image.open(image_path)
            img_width, img_height = img.size
            
            # Create PDF
            c = canvas.Canvas(output_path, pagesize=page_size)
            pdf_width, pdf_height = page_size
            
            # Calculate scaling to fit page while maintaining aspect ratio
            width_ratio = pdf_width / img_width
            height_ratio = pdf_height / img_height
            ratio = min(width_ratio, height_ratio)
            
            # Calculate centered position
            x_offset = (pdf_width - img_width * ratio) / 2
            y_offset = (pdf_height - img_height * ratio) / 2
            
            # Draw image on PDF
            c.drawImage(
                image_path, 
                x_offset, 
                y_offset, 
                width=img_width * ratio, 
                height=img_height * ratio, 
                preserveAspectRatio=True, 
                anchor='c'
            )
            
            c.save()
            return True
            
        except Exception as e:
            raise Exception(f"Error converting {image_path}: {str(e)}")
    
    def convert_multiple_to_pdf(self, image_paths):
        """Convert multiple images to a single PDF"""
        try:
            # Generate output path
            output_filename = f"{self.app.combined_filename.get()}.pdf"
            if not output_filename.endswith('.pdf'):
                output_filename += '.pdf'
                
            output_path = os.path.join(self.app.output_dir, output_filename)
            
            # Get page size
            page_size = self._get_page_size()
            
            # Create PDF
            c = canvas.Canvas(output_path, pagesize=page_size)
            pdf_width, pdf_height = page_size
            
            # Process each image
            for i, image_path in enumerate(image_paths):
                try:
                    # Open image and get dimensions
                    img = Image.open(image_path)
                    img_width, img_height = img.size
                    
                    # Calculate scaling to fit page while maintaining aspect ratio
                    width_ratio = pdf_width / img_width
                    height_ratio = pdf_height / img_height
                    ratio = min(width_ratio, height_ratio)
                    
                    # Calculate centered position
                    x_offset = (pdf_width - img_width * ratio) / 2
                    y_offset = (pdf_height - img_height * ratio) / 2
                    
                    # Draw image on PDF
                    c.drawImage(
                        image_path, 
                        x_offset, 
                        y_offset, 
                        width=img_width * ratio, 
                        height=img_height * ratio, 
                        preserveAspectRatio=True, 
                        anchor='c'
                    )
                    
                    # Update status
                    self.app.root.after(0, lambda i=i, total=len(image_paths): 
                                      self.app.status_var.set(f"Processing image {i+1} of {total}"))
                    
                    # Add a new page if not the last image
                    if i < len(image_paths) - 1:
                        c.showPage()
                        
                except Exception as e:
                    # Log error but continue with next image
                    print(f"Error processing {image_path}: {str(e)}")
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