"""
Main GUI implementation for the PDF Converter application.
Contains the PDFConverterApp class which manages the entire user interface.
"""

import os
import tkinter as tk
from tkinter import filedialog, ttk, messagebox
import threading
import queue
import time

from image_converter import ImageConverter
from epub_converter import EPUBConverter
from file_queue_manager import FileQueueManager

class PDFConverterApp:
    """Main application class for the PDF Converter"""
    
    def __init__(self, root):
        """Initialize the application"""
        self.root = root
        self.root.title("Advanced PDF Converter")
        self.root.geometry("700x500")
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Initialize variables
        self.init_variables()
        
        # Create converters
        self.image_converter = ImageConverter(self)
        self.epub_converter = EPUBConverter(self)
        
        # Create queue manager
        self.queue_manager = FileQueueManager(self)
        
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
        
        # Setup tabs and options
        self.setup_image_tab()
        self.setup_epub_tab()
        self.setup_options_frame()
        self.setup_queue_display()
        
        # Start worker thread for processing
        self.worker_thread = threading.Thread(target=self.process_queue, daemon=True)
        self.worker_thread.start()
    
    def init_variables(self):
        """Initialize all variables used by the application"""
        self.file_paths = []
        self.output_dir = os.path.expanduser("~/Documents")
        self.task_queue = queue.Queue()
        self.processing = False
        self.page_size = tk.StringVar(value="letter")
        self.quality = tk.IntVar(value=100)
        self.combine_files = tk.BooleanVar(value=False)
        self.combined_filename = tk.StringVar(value="combined_document")
        self.custom_filename = tk.BooleanVar(value=False)
        self.override_filename = tk.StringVar(value="")
        self.worker_running = True  # Flag to control worker thread
    
    def setup_image_tab(self):
        """Setup the Image to PDF conversion tab"""
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
        """Setup the EPUB to PDF conversion tab"""
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
        """Setup the options section of the UI"""
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
        
        # Custom filename for individual files option
        custom_name_frame = ttk.Frame(options_frame)
        custom_name_frame.pack(fill=tk.X, padx=5, pady=5)
        
        custom_check = ttk.Checkbutton(custom_name_frame, text="Use custom filename for individual files", 
                                      variable=self.custom_filename, 
                                      command=self.toggle_custom_filename)
        custom_check.pack(side=tk.LEFT, padx=5)
        
        # Custom filename entry
        self.custom_filename_frame = ttk.Frame(options_frame)
        self.custom_filename_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(self.custom_filename_frame, text="Filename Pattern:").pack(side=tk.LEFT, padx=5)
        custom_entry = ttk.Entry(self.custom_filename_frame, textvariable=self.override_filename, width=30)
        custom_entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        ttk.Label(self.custom_filename_frame, text=".pdf").pack(side=tk.LEFT)
        
        # Add a helper label
        helper_label = ttk.Label(self.custom_filename_frame, 
                               text="Use {num} for numbering or {name} for original filename")
        helper_label.pack(side=tk.LEFT, padx=5)
        
        # Initially hide the custom filename frame
        self.custom_filename_frame.pack_forget()
        
        # Convert button
        convert_btn = ttk.Button(options_frame, text="Convert All Files", command=self.start_conversion)
        convert_btn.pack(padx=5, pady=10)
    
    def setup_queue_display(self):
        """Setup the queue display area"""
        # Queue frame
        queue_frame = ttk.LabelFrame(self.main_frame, text="Conversion Queue")
        queue_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Control buttons frame
        queue_controls_frame = ttk.Frame(queue_frame)
        queue_controls_frame.pack(fill=tk.X, padx=5, pady=5)
        
        move_up_btn = ttk.Button(queue_controls_frame, text="Move Up", command=self.queue_manager.move_file_up)
        move_up_btn.pack(side=tk.LEFT, padx=5)
        
        move_down_btn = ttk.Button(queue_controls_frame, text="Move Down", command=self.queue_manager.move_file_down)
        move_down_btn.pack(side=tk.LEFT, padx=5)
        
        remove_btn = ttk.Button(queue_controls_frame, text="Remove Selected", command=self.queue_manager.remove_selected_file)
        remove_btn.pack(side=tk.LEFT, padx=5)
        
        clear_btn = ttk.Button(queue_controls_frame, text="Clear All", command=self.queue_manager.clear_queue)
        clear_btn.pack(side=tk.LEFT, padx=5)
        
        # Scrollable list of files
        list_frame = ttk.Frame(queue_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.queue_list = tk.Listbox(list_frame, height=10, selectmode=tk.SINGLE)
        self.queue_list.pack(fill=tk.BOTH, expand=True)
        self.queue_list.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.queue_list.yview)
        
        # Bind double-click to view file details
        self.queue_list.bind('<Double-1>', self.queue_manager.show_file_details)
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(queue_frame, variable=self.progress_var, maximum=100)
        self.progress_bar.pack(fill=tk.X, padx=5, pady=5)
        
        # Status label
        self.status_var = tk.StringVar(value="Ready")
        status_label = ttk.Label(queue_frame, textvariable=self.status_var)
        status_label.pack(padx=5, pady=5)
    
    def select_images(self):
        """Open file dialog to select image files"""
        files = filedialog.askopenfilenames(
            title="Select image files",
            filetypes=(
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff"),
                ("All files", "*.*")
            )
        )
        if files:
            for file in files:
                self.queue_manager.add_to_queue("image", file)
    
    def select_image_folder(self):
        """Open folder dialog to select all images in a folder"""
        folder = filedialog.askdirectory(title="Select folder with images")
        if folder:
            image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']
            for root, _, files in os.walk(folder):
                for file in files:
                    ext = os.path.splitext(file)[1].lower()
                    if ext in image_extensions:
                        full_path = os.path.join(root, file)
                        self.queue_manager.add_to_queue("image", full_path)
    
    def select_epubs(self):
        """Open file dialog to select EPUB files"""
        files = filedialog.askopenfilenames(
            title="Select EPUB files",
            filetypes=(
                ("EPUB files", "*.epub"),
                ("All files", "*.*")
            )
        )
        if files:
            for file in files:
                self.queue_manager.add_to_queue("epub", file)
    
    def select_epub_folder(self):
        """Open folder dialog to select all EPUBs in a folder"""
        folder = filedialog.askdirectory(title="Select folder with EPUB files")
        if folder:
            for root, _, files in os.walk(folder):
                for file in files:
                    if file.lower().endswith('.epub'):
                        full_path = os.path.join(root, file)
                        self.queue_manager.add_to_queue("epub", full_path)
    
    def select_output_dir(self):
        """Open folder dialog to select output directory"""
        folder = filedialog.askdirectory(title="Select output directory")
        if folder:
            self.output_dir = folder
            self.output_path_var.set(folder)
    
    def toggle_combined_filename(self):
        """Toggle visibility of combined filename entry field"""
        if self.combine_files.get():
            self.combined_filename_frame.pack(fill=tk.X, padx=5, pady=5)
            # Disable custom filename if combine files is selected
            if self.custom_filename.get():
                self.custom_filename.set(False)
                self.toggle_custom_filename()
        else:
            self.combined_filename_frame.pack_forget()
            
        # Update the output_dir variable to match what's in the entry field
        self.output_dir = self.output_path_var.get()
    
    def toggle_custom_filename(self):
        """Toggle visibility of custom filename entry field"""
        if self.custom_filename.get():
            self.custom_filename_frame.pack(fill=tk.X, padx=5, pady=5)
            # Disable combine files if custom filename is selected
            if self.combine_files.get():
                self.combine_files.set(False)
                self.toggle_combined_filename()
        else:
            self.custom_filename_frame.pack_forget()
    
    def start_conversion(self):
        """Start the conversion process for all files in the queue"""
        if not self.file_paths:
            messagebox.showinfo("No Files", "Please select files to convert first.")
            return
            
        if not self.processing:
            # Make sure output directory exists
            self.output_dir = self.output_path_var.get()  # Update from the text field
            
            if not os.path.exists(self.output_dir):
                try:
                    os.makedirs(self.output_dir)
                except Exception as e:
                    messagebox.showerror("Error", f"Could not create output directory: {str(e)}")
                    return
                    
            # Sort files by type for better handling
            image_files = []
            epub_files = []
            
            for file_path, file_type in self.file_paths:
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
                for file_path, file_type in self.file_paths:
                    self.task_queue.put((file_type, file_path))
            
            # Clear the file paths list but keep the display
            self.file_paths = []
            
            # Update status
            self.status_var.set("Processing queue...")
            self.processing = True
    
    def process_queue(self):
        """Worker thread function to process the task queue"""
        while self.worker_running:
            try:
                if not self.task_queue.empty() and self.processing:
                    task = self.task_queue.get()
                    file_type = task[0]
                    
                    try:
                        if file_type == "image":
                            file_path = task[1]
                            # Update status
                            self.root.after(0, lambda p=file_path: self.status_var.set(f"Converting: {os.path.basename(p)}"))
                            self.image_converter.convert_to_pdf(file_path)
                            # Remove from list
                            self.root.after(0, lambda fp=file_path: self.queue_manager.update_queue_list(fp))
                            
                        elif file_type == "epub":
                            file_path = task[1]
                            # Update status
                            self.root.after(0, lambda p=file_path: self.status_var.set(f"Converting: {os.path.basename(p)}"))
                            self.epub_converter.convert_to_pdf(file_path)
                            # Remove from list
                            self.root.after(0, lambda fp=file_path: self.queue_manager.update_queue_list(fp))
                            
                        elif file_type == "combined_images":
                            image_files = task[1]
                            # Update status
                            self.root.after(0, lambda n=len(image_files): self.status_var.set(f"Creating combined PDF from {n} images"))
                            self.image_converter.convert_multiple_to_pdf(image_files)
                            # Remove all files from list
                            for file_path in image_files:
                                self.root.after(0, lambda fp=file_path: self.queue_manager.update_queue_list(fp))
                                
                        elif file_type == "combined_epub":
                            epub_files = task[1]
                            # Update status
                            self.root.after(0, lambda n=len(epub_files): self.status_var.set(f"Creating combined PDF from {n} EPUB files"))
                            self.epub_converter.convert_multiple_to_pdf(epub_files)
                            # Remove all files from list
                            for file_path in epub_files:
                                self.root.after(0, lambda fp=file_path: self.queue_manager.update_queue_list(fp))
                        
                    except Exception as e:
                        error_msg = str(e)
                        self.root.after(0, lambda m=error_msg: messagebox.showerror("Conversion Error", m))
                    
                    # Mark task as done
                    self.task_queue.task_done()
                    
                    # If queue is empty, reset processing flag
                    if self.task_queue.empty():
                        self.root.after(0, self.reset_processing)
                
                # Sleep to prevent CPU hogging
                time.sleep(0.05)
            
            except Exception as e:
                # Log any unexpected errors but don't crash the thread
                print(f"Unexpected error in process_queue: {str(e)}")
                time.sleep(1)  # Slow down if we hit unexpected errors
    
    def reset_processing(self):
        """Reset the processing state after queue is completed"""
        self.processing = False
        self.status_var.set("All conversions completed!")
        self.progress_var.set(100)
        messagebox.showinfo("Conversion Complete", "All files have been converted successfully.")
        # Clear the queue list
        self.queue_list.delete(0, tk.END)
        self.progress_var.set(0)
    
    def on_closing(self):
        """Handle window close event properly"""
        # Stop the worker thread
        self.worker_running = False
        
        # Wait for task queue to finish if processing
        if self.processing:
            response = messagebox.askquestion("Exit", 
                                            "Conversions in progress. Are you sure you want to exit?",
                                            icon='warning')
            if response == 'no':
                return
        
        # Destroy the window and exit
        self.root.destroy()