import tkinter as tk
from tkinter import filedialog, ttk, messagebox
from PIL import Image
from reportlab.lib.pagesizes import letter, A4, legal, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
import os
import threading
import queue
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import tempfile

class PDFConverterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Advanced PDF Converter")
        self.root.geometry("700x500")
        
        # Variables
        self.file_paths = []
        self.output_dir = os.path.expanduser("~/Documents")
        self.task_queue = queue.Queue()
        self.processing = False
        self.page_size = tk.StringVar(value="letter")
        self.quality = tk.IntVar(value=100)
        self.combine_files = tk.BooleanVar(value=False)
        self.combined_filename = tk.StringVar(value="combined_document")
        
        # Create main frame
        self.main_frame = ttk.Frame(root, padding="10")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create tabs
        self.tab_control = ttk.Notebook(self.main_frame)
        
        # Tab 1: Image to PDF
        self.image_tab = ttk.Frame(self.tab_control)
        self.tab_control.add(self.image_tab, text="Image to PDF")
        
        # Tab 2: EPUB to PDF
        self.epub_tab = ttk.Frame(self.tab_control)
        self.tab_control.add(self.epub_tab, text="EPUB to PDF")
        
        self.tab_control.pack(fill=tk.BOTH, expand=True)
        
        # Setup Image Tab
        self.setup_image_tab()
        
        # Setup EPUB Tab
        self.setup_epub_tab()
        
        # Setup common options frame
        self.setup_options_frame()
        
        # Setup queue display and progress
        self.setup_queue_display()
        
        # Start worker thread for processing
        self.worker_thread = threading.Thread(target=self.process_queue, daemon=True)
        self.worker_thread.start()

    def setup_image_tab(self):
        # Image selection frame
        img_select_frame = ttk.LabelFrame(self.image_tab, text="Select Images")
        img_select_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Buttons frame
        img_btn_frame = ttk.Frame(img_select_frame)
        img_btn_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Add select file button
        select_file_btn = ttk.Button(img_btn_frame, text="Select Files", command=self.select_images)
        select_file_btn.pack(side=tk.LEFT, padx=5)
        
        # Add select folder button
        select_folder_btn = ttk.Button(img_btn_frame, text="Select Folder", command=self.select_image_folder)
        select_folder_btn.pack(side=tk.LEFT, padx=5)

    def setup_epub_tab(self):
        # EPUB selection frame
        epub_select_frame = ttk.LabelFrame(self.epub_tab, text="Select EPUB Files")
        epub_select_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Buttons frame
        epub_btn_frame = ttk.Frame(epub_select_frame)
        epub_btn_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Add select file button
        select_epub_btn = ttk.Button(epub_btn_frame, text="Select EPUB Files", command=self.select_epubs)
        select_epub_btn.pack(side=tk.LEFT, padx=5)
        
        # Add select folder button
        select_epub_folder_btn = ttk.Button(epub_btn_frame, text="Select Folder", command=self.select_epub_folder)
        select_epub_folder_btn.pack(side=tk.LEFT, padx=5)

    def setup_options_frame(self):
        # Options frame
        options_frame = ttk.LabelFrame(self.main_frame, text="PDF Options")
        options_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Page size
        size_frame = ttk.Frame(options_frame)
        size_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(size_frame, text="Page Size:").pack(side=tk.LEFT, padx=5)
        size_options = ["letter", "A4", "legal", "tabloid"]
        size_menu = ttk.OptionMenu(size_frame, self.page_size, *size_options)
        size_menu.pack(side=tk.LEFT, padx=5)
        
        # Quality slider for images
        quality_frame = ttk.Frame(options_frame)
        quality_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(quality_frame, text="Image Quality:").pack(side=tk.LEFT, padx=5)
        quality_slider = ttk.Scale(quality_frame, from_=1, to=100, orient=tk.HORIZONTAL, variable=self.quality)
        quality_slider.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        quality_label = ttk.Label(quality_frame, textvariable=self.quality)
        quality_label.pack(side=tk.LEFT, padx=5)
        
        # Output directory
        output_frame = ttk.Frame(options_frame)
        output_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(output_frame, text="Output Directory:").pack(side=tk.LEFT, padx=5)
        self.output_path_var = tk.StringVar(value=self.output_dir)
        output_entry = ttk.Entry(output_frame, textvariable=self.output_path_var, width=40)
        output_entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        output_btn = ttk.Button(output_frame, text="Browse", command=self.select_output_dir)
        output_btn.pack(side=tk.LEFT, padx=5)
        
        # Combine files option
        combine_frame = ttk.Frame(options_frame)
        combine_frame.pack(fill=tk.X, padx=5, pady=5)
        
        combine_check = ttk.Checkbutton(combine_frame, text="Combine all files into a single PDF", 
                                        variable=self.combine_files, 
                                        command=self.toggle_combined_filename)
        combine_check.pack(side=tk.LEFT, padx=5)
        
        # Combined filename entry
        self.combined_filename_frame = ttk.Frame(options_frame)
        self.combined_filename_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(self.combined_filename_frame, text="Combined Filename:").pack(side=tk.LEFT, padx=5)
        combined_entry = ttk.Entry(self.combined_filename_frame, textvariable=self.combined_filename, width=30)
        combined_entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        ttk.Label(self.combined_filename_frame, text=".pdf").pack(side=tk.LEFT)
        
        # Initially hide the combined filename frame
        self.combined_filename_frame.pack_forget()
        
        # Convert button
        convert_btn = ttk.Button(options_frame, text="Convert All Files", command=self.start_conversion)
        convert_btn.pack(padx=5, pady=10)

    def setup_queue_display(self):
        # Queue frame
        queue_frame = ttk.LabelFrame(self.main_frame, text="Conversion Queue")
        queue_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Scrollable list of files
        scrollbar = ttk.Scrollbar(queue_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.queue_list = tk.Listbox(queue_frame, height=10)
        self.queue_list.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.queue_list.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.queue_list.yview)
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(queue_frame, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, padx=5, pady=5)
        
        # Status label
        self.status_var = tk.StringVar(value="Ready")
        status_label = ttk.Label(queue_frame, textvariable=self.status_var)
        status_label.pack(padx=5, pady=5)

    def select_images(self):
        files = filedialog.askopenfilenames(
            title="Select image files",
            filetypes=(
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff"),
                ("All files", "*.*")
            )
        )
        if files:
            for file in files:
                self.add_to_queue("image", file)

    def select_image_folder(self):
        folder = filedialog.askdirectory(title="Select folder with images")
        if folder:
            image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']
            for root, _, files in os.walk(folder):
                for file in files:
                    ext = os.path.splitext(file)[1].lower()
                    if ext in image_extensions:
                        full_path = os.path.join(root, file)
                        self.add_to_queue("image", full_path)

    def select_epubs(self):
        files = filedialog.askopenfilenames(
            title="Select EPUB files",
            filetypes=(
                ("EPUB files", "*.epub"),
                ("All files", "*.*")
            )
        )
        if files:
            for file in files:
                self.add_to_queue("epub", file)

    def select_epub_folder(self):
        folder = filedialog.askdirectory(title="Select folder with EPUB files")
        if folder:
            for root, _, files in os.walk(folder):
                for file in files:
                    if file.lower().endswith('.epub'):
                        full_path = os.path.join(root, file)
                        self.add_to_queue("epub", full_path)

    def select_output_dir(self):
        folder = filedialog.askdirectory(title="Select output directory")
        if folder:
            self.output_dir = folder
            self.output_path_var.set(folder)

    def add_to_queue(self, file_type, file_path):
        if file_path not in [item[1] for item in self.file_paths]:
            self.file_paths.append((file_type, file_path))
            self.queue_list.insert(tk.END, os.path.basename(file_path))

    def toggle_combined_filename(self):
        if self.combine_files.get():
            self.combined_filename_frame.pack(fill=tk.X, padx=5, pady=5, after=self.combined_filename_frame.master.winfo_children()[-2])
        else:
            self.combined_filename_frame.pack_forget()
            
    def start_conversion(self):
        if not self.file_paths:
            messagebox.showinfo("No Files", "Please select files to convert first.")
            return
            
        if not self.processing:
            # Sort files by type for better handling
            image_files = []
            epub_files = []
            
            for file_type, file_path in self.file_paths:
                if file_type == "image":
                    image_files.append(file_path)
                elif file_type == "epub":
                    epub_files.append(file_path)
            
            # Check if we need to combine files
            if self.combine_files.get():
                # Create separate combined tasks for images and epubs
                if image_files:
                    self.task_queue.put(("combined_images", image_files))
                if epub_files:
                    self.task_queue.put(("combined_epub", epub_files))
            else:
                # Add individual file tasks
                for file_type, file_path in self.file_paths:
                    self.task_queue.put((file_type, file_path))
            
            # Clear the file paths list but keep the display
            self.file_paths = []
            
            # Update status
            self.status_var.set("Processing queue...")
            self.processing = True

    def process_queue(self):
        while True:
            if not self.task_queue.empty() and self.processing:
                task = self.task_queue.get()
                file_type = task[0]
                
                try:
                    if file_type == "image":
                        file_path = task[1]
                        # Update status
                        self.root.after(0, lambda: self.status_var.set(f"Converting: {os.path.basename(file_path)}"))
                        self.convert_image_to_pdf(file_path)
                        # Remove from list
                        self.root.after(0, lambda file=file_path: self.update_queue_list(file))
                        
                    elif file_type == "epub":
                        file_path = task[1]
                        # Update status
                        self.root.after(0, lambda: self.status_var.set(f"Converting: {os.path.basename(file_path)}"))
                        self.convert_epub_to_pdf(file_path)
                        # Remove from list
                        self.root.after(0, lambda file=file_path: self.update_queue_list(file))
                        
                    elif file_type == "combined_images":
                        image_files = task[1]
                        # Update status
                        self.root.after(0, lambda: self.status_var.set(f"Creating combined PDF from {len(image_files)} images"))
                        self.convert_multiple_images_to_pdf(image_files)
                        # Remove all files from list
                        for file_path in image_files:
                            self.root.after(0, lambda file=file_path: self.update_queue_list(file))
                            
                    elif file_type == "combined_epub":
                        epub_files = task[1]
                        # Update status
                        self.root.after(0, lambda: self.status_var.set(f"Creating combined PDF from {len(epub_files)} EPUB files"))
                        self.convert_multiple_epubs_to_pdf(epub_files)
                        # Remove all files from list
                        for file_path in epub_files:
                            self.root.after(0, lambda file=file_path: self.update_queue_list(file))
                    
                except Exception as e:
                    self.root.after(0, lambda e=e: messagebox.showerror("Conversion Error", str(e)))
                
                # Mark task as done
                self.task_queue.task_done()
                
                # If queue is empty, reset processing flag
                if self.task_queue.empty():
                    self.root.after(0, self.reset_processing)
            else:
                # Sleep to prevent CPU hogging
                import time
                time.sleep(0.1)

    def update_queue_list(self, file_path):
        # Find the index of the file in the list
        filename = os.path.basename(file_path)
        for i in range(self.queue_list.size()):
            if self.queue_list.get(i) == filename:
                self.queue_list.delete(i)
                # Update progress bar
                progress = ((self.queue_list.size() - i) / self.queue_list.size()) * 100
                self.progress_var.set(progress)
                break

    def reset_processing(self):
        self.processing = False
        self.status_var.set("All conversions completed!")
        self.progress_var.set(100)
        messagebox.showinfo("Conversion Complete", "All files have been converted successfully.")
        # Clear the queue list
        self.queue_list.delete(0, tk.END)
        self.progress_var.set(0)

    def convert_image_to_pdf(self, image_path):
        try:
            # Generate output path
            output_filename = os.path.splitext(os.path.basename(image_path))[0] + ".pdf"
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Get page size
            page_size_dict = {
                "letter": letter,
                "A4": A4,
                "legal": legal,
                "tabloid": (11*inch, 17*inch)  # Define tabloid size manually (11x17 inches)
            }
            page_size = page_size_dict.get(self.page_size.get(), letter)
            
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
            
    def convert_multiple_images_to_pdf(self, image_paths):
        try:
            # Generate output path
            output_filename = f"{self.combined_filename.get()}.pdf"
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Get page size
            page_size_dict = {
                "letter": letter,
                "A4": A4,
                "legal": legal,
                "tabloid": (11*inch, 17*inch)  # Define tabloid size manually (11x17 inches)
            }
            page_size = page_size_dict.get(self.page_size.get(), letter)
            
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
                    self.root.after(0, lambda i=i, total=len(image_paths): 
                                  self.status_var.set(f"Processing image {i+1} of {total}"))
                    
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
            self.root.after(0, lambda: messagebox.showinfo("Success", 
                            f"Combined PDF created successfully at:\n{output_path}"))
            
            return True
            
        except Exception as e:
            raise Exception(f"Error creating combined PDF: {str(e)}")
            
    def convert_multiple_epubs_to_pdf(self, epub_paths):
        try:
            # Generate output path
            output_filename = f"{self.combined_filename.get()}.pdf"
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Get page size
            page_size_dict = {
                "letter": letter,
                "A4": A4,
                "legal": legal,
                "tabloid": (11*inch, 17*inch)  # Define tabloid size manually (11x17 inches)
            }
            page_size = page_size_dict.get(self.page_size.get(), letter)
            
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
                    self.root.after(0, lambda idx=epub_idx, total=len(epub_paths): 
                                  self.status_var.set(f"Processing EPUB {idx+1} of {total}: {epub_title}"))
                    
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
            self.root.after(0, lambda: messagebox.showinfo("Success", 
                            f"Combined PDF created successfully at:\n{output_path}"))
            
            return True
            
        except Exception as e:
            raise Exception(f"Error creating combined PDF: {str(e)}")

    def convert_epub_to_pdf(self, epub_path):
        try:
            # Generate output path
            output_filename = os.path.splitext(os.path.basename(epub_path))[0] + ".pdf"
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Get page size
            page_size_dict = {
                "letter": letter,
                "A4": A4,
                "legal": legal,
                "tabloid": (11*inch, 17*inch)  # Define tabloid size manually (11x17 inches)
            }
            page_size = page_size_dict.get(self.page_size.get(), letter)
            
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


if __name__ == "__main__":
    root = tk.Tk()
    app = PDFConverterApp(root)
    root.mainloop()