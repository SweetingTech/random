"""
File queue management functionality
"""

import os
from tkinter import messagebox

class FileQueueManager:
    """
    Handles the file queue for PDF conversion
    """
    
    def __init__(self, app):
        """Initialize with reference to the main application"""
        self.app = app
    
    def add_to_queue(self, file_type, file_path):
        """Add a file to the queue"""
        if file_path not in [item[0] for item in self.app.file_paths]:
            self.app.file_paths.append((file_path, file_type))
            self.app.queue_list.insert('end', os.path.basename(file_path))
    
    def update_queue_list(self, file_path):
        """Update the queue list by removing a processed file"""
        # Find the index of the file in the list
        filename = os.path.basename(file_path)
        for i in range(self.app.queue_list.size()):
            if self.app.queue_list.get(i) == filename:
                self.app.queue_list.delete(i)
                # Update progress bar
                if self.app.queue_list.size() > 0:  # Prevent division by zero
                    progress = ((self.app.queue_list.size() - i) / self.app.queue_list.size()) * 100
                    self.app.progress_var.set(progress)
                else:
                    self.app.progress_var.set(100)  # Set to 100% if queue is empty
                break
    
    def move_file_up(self):
        """Move the selected file up in the queue"""
        selected = self.app.queue_list.curselection()
        if not selected or selected[0] == 0:
            return
            
        # Get current index and item
        current_idx = selected[0]
        item_text = self.app.queue_list.get(current_idx)
        
        # Get file path from the file list
        file_path = None
        for i, (path, _) in enumerate(self.app.file_paths):
            if os.path.basename(path) == item_text:
                file_path = self.app.file_paths.pop(i)
                break
                
        if file_path:
            # Insert at new position
            self.app.file_paths.insert(current_idx - 1, file_path)
            
            # Update the listbox
            self.app.queue_list.delete(current_idx)
            self.app.queue_list.insert(current_idx - 1, item_text)
            self.app.queue_list.selection_set(current_idx - 1)
    
    def move_file_down(self):
        """Move the selected file down in the queue"""
        selected = self.app.queue_list.curselection()
        if not selected or selected[0] == self.app.queue_list.size() - 1:
            return
            
        # Get current index and item
        current_idx = selected[0]
        item_text = self.app.queue_list.get(current_idx)
        
        # Get file path from the file list
        file_path = None
        for i, (path, _) in enumerate(self.app.file_paths):
            if os.path.basename(path) == item_text:
                file_path = self.app.file_paths.pop(i)
                break
                
        if file_path:
            # Insert at new position
            self.app.file_paths.insert(current_idx + 1, file_path)
            
            # Update the listbox
            self.app.queue_list.delete(current_idx)
            self.app.queue_list.insert(current_idx + 1, item_text)
            self.app.queue_list.selection_set(current_idx + 1)
    
    def remove_selected_file(self):
        """Remove the selected file from the queue"""
        selected = self.app.queue_list.curselection()
        if not selected:
            return
            
        # Get the item text
        current_idx = selected[0]
        item_text = self.app.queue_list.get(current_idx)
        
        # Remove from file_paths
        for i, (path, _) in enumerate(self.app.file_paths):
            if os.path.basename(path) == item_text:
                self.app.file_paths.pop(i)
                break
                
        # Remove from listbox
        self.app.queue_list.delete(current_idx)
    
    def clear_queue(self):
        """Clear all files from the queue"""
        # Clear the file list
        self.app.file_paths = []
        
        # Clear the listbox
        self.app.queue_list.delete(0, 'end')
    
    def show_file_details(self, event):
        """Show details for the selected file"""
        selected = self.app.queue_list.curselection()
        if not selected:
            return
            
        # Get the item text
        current_idx = selected[0]
        item_text = self.app.queue_list.get(current_idx)
        
        # Find the file path
        file_info = None
        for path, file_type in self.app.file_paths:
            if os.path.basename(path) == item_text:
                file_info = (path, file_type)
                break
                
        if file_info:
            path, file_type = file_info
            details = f"File: {path}\nType: {file_type.upper()}\nSize: {os.path.getsize(path) / 1024:.2f} KB"
            messagebox.showinfo("File Details", details)