import os
import json
import threading
import tkinter as tk
from tkinter import filedialog, ttk
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

class EpubConverterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("EPUB to JSON Converter")
        self.root.geometry("800x600")
        
        # Variables
        self.queue = []
        self.processing = False
        self.output_folder = os.path.expanduser("~/Documents")
        
        # Create UI
        self.create_ui()
    
    def create_ui(self):
        # Frame for input controls
        input_frame = ttk.Frame(self.root, padding=10)
        input_frame.pack(fill="x")
        
        # Add book/folder buttons
        ttk.Button(input_frame, text="Add Book(s)", command=self.add_books).pack(side="left", padx=5)
        ttk.Button(input_frame, text="Add Folder", command=self.add_folder).pack(side="left", padx=5)
        
        # Output folder selection
        ttk.Button(input_frame, text="Set Output Folder", command=self.set_output_folder).pack(side="left", padx=5)
        self.output_label = ttk.Label(input_frame, text=f"Output: {self.output_folder}")
        self.output_label.pack(side="left", padx=10)
        
        # Queue frame
        queue_frame = ttk.LabelFrame(self.root, text="Conversion Queue", padding=10)
        queue_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Queue treeview
        columns = ("File", "Status")
        self.queue_tree = ttk.Treeview(queue_frame, columns=columns, show="headings")
        
        # Define headings
        for col in columns:
            self.queue_tree.heading(col, text=col)
        
        # Set column widths
        self.queue_tree.column("File", width=500)
        self.queue_tree.column("Status", width=100)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(queue_frame, orient="vertical", command=self.queue_tree.yview)
        self.queue_tree.configure(yscrollcommand=scrollbar.set)
        
        # Pack elements
        scrollbar.pack(side="right", fill="y")
        self.queue_tree.pack(side="left", fill="both", expand=True)
        
        # Control buttons frame
        control_frame = ttk.Frame(self.root, padding=10)
        control_frame.pack(fill="x")
        
        # Progress bar
        self.progress = ttk.Progressbar(control_frame, orient="horizontal", mode="determinate")
        self.progress.pack(fill="x", padx=5, pady=10)
        
        # Control buttons
        ttk.Button(control_frame, text="Start Processing", command=self.start_processing).pack(side="left", padx=5)
        ttk.Button(control_frame, text="Clear Queue", command=self.clear_queue).pack(side="left", padx=5)
    
    def add_books(self):
        files = filedialog.askopenfilenames(
            title="Select EPUB files",
            filetypes=[("EPUB files", "*.epub")]
        )
        for file in files:
            self.add_to_queue(file)
    
    def add_folder(self):
        folder = filedialog.askdirectory(title="Select Folder with EPUB files")
        if folder:
            for root, _, files in os.walk(folder):
                for file in files:
                    if file.lower().endswith('.epub'):
                        full_path = os.path.join(root, file)
                        self.add_to_queue(full_path)
    
    def set_output_folder(self):
        folder = filedialog.askdirectory(title="Select Output Folder")
        if folder:
            self.output_folder = folder
            self.output_label.config(text=f"Output: {self.output_folder}")
    
    def add_to_queue(self, file_path):
        # Check if file is already in queue
        for item_id in self.queue_tree.get_children():
            if self.queue_tree.item(item_id)['values'][0] == file_path:
                return  # Skip if already in queue
        
        # Add to queue
        self.queue.append(file_path)
        self.queue_tree.insert("", "end", values=(file_path, "Pending"))
    
    def clear_queue(self):
        if not self.processing:
            self.queue = []
            for item in self.queue_tree.get_children():
                self.queue_tree.delete(item)
    
    def start_processing(self):
        if self.processing:
            return
        
        if not self.queue:
            return
        
        self.processing = True
        # Reset progress bar
        self.progress["maximum"] = len(self.queue)
        self.progress["value"] = 0
        
        # Start processing thread
        processing_thread = threading.Thread(target=self.process_queue)
        processing_thread.daemon = True
        processing_thread.start()
    
    def process_queue(self):
        for index, epub_file in enumerate(self.queue[:]):
            # Update item status
            item_id = self.queue_tree.get_children()[index]
            self.queue_tree.item(item_id, values=(epub_file, "Processing"))
            self.root.update_idletasks()
            
            try:
                # Generate output filename
                base_name = os.path.splitext(os.path.basename(epub_file))[0]
                output_path = os.path.join(self.output_folder, f"{base_name}.json")
                
                # Convert file
                self.epub_to_json(epub_file, output_path)
                
                # Update status
                self.queue_tree.item(item_id, values=(epub_file, "Completed"))
            except Exception as e:
                # Update with error status
                self.queue_tree.item(item_id, values=(epub_file, f"Error: {str(e)[:20]}..."))
            
            # Update progress
            self.progress["value"] = index + 1
            self.root.update_idletasks()
        
        self.processing = False
    
    def epub_to_json(self, epub_path, json_path):
        book = epub.read_epub(epub_path)
        book_data = {
            "title": book.get_metadata('DC', 'title')[0][0] if book.get_metadata('DC', 'title') else "Unknown Title",
            "author": book.get_metadata('DC', 'creator')[0][0] if book.get_metadata('DC', 'creator') else "Unknown Author",
            "chapters": []
        }
        
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                # Extract headings for chapter names
                chapter_title = soup.find('h1') or soup.find('h2') or soup.find('h3')
                chapter_title = chapter_title.get_text().strip() if chapter_title else "Untitled Chapter"
                # Get cleaned text
                chapter_text = soup.get_text().strip()
                book_data["chapters"].append({
                    "title": chapter_title,
                    "content": chapter_text
                })
        
        # Save JSON file
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(book_data, f, indent=4, ensure_ascii=False)

def main():
    root = tk.Tk()
    app = EpubConverterApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()