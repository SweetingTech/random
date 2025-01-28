import tkinter as tk
from tkinter import colorchooser, ttk, messagebox
import os
import math
import webbrowser
import tempfile

class LoadingIconMakerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Loading Icon Maker")
        
        # Default settings
        self.animation_var = tk.StringVar(value="spinner")
        self.size_var = tk.IntVar(value=48)
        self.thickness_var = tk.IntVar(value=4)
        self.speed_var = tk.IntVar(value=750)  # in ms
        self.color_var = "#006D8F"
        
        # Build the GUI
        self.create_widgets()
        
        # For live preview
        self.preview_html = None
        self.temp_dir = tempfile.mkdtemp()
        
    def create_widgets(self):
        # Animation Type Selection
        anim_label = ttk.Label(self.root, text="Animation Type:")
        anim_label.grid(row=0, column=0, padx=5, pady=5, sticky="e")
        anim_combo = ttk.Combobox(self.root, textvariable=self.animation_var, 
                                 values=["spinner", "dots", "bars", "pulse"], state="readonly")
        anim_combo.grid(row=0, column=1, padx=5, pady=5, sticky="w")
        anim_combo.bind('<<ComboboxSelected>>', self.update_preview)

        # Size Scale
        size_label = ttk.Label(self.root, text="Size (px):")
        size_label.grid(row=1, column=0, padx=5, pady=5, sticky="e")
        size_scale = ttk.Scale(self.root, from_=16, to=200, variable=self.size_var, 
                             orient="horizontal", command=self.update_preview_and_label)
        size_scale.grid(row=1, column=1, padx=5, pady=5, sticky="w")
        self.size_display = ttk.Label(self.root, text=str(self.size_var.get()))
        self.size_display.grid(row=1, column=2, padx=5, sticky="w")

        # Thickness Scale
        thick_label = ttk.Label(self.root, text="Thickness (px):")
        thick_label.grid(row=2, column=0, padx=5, pady=5, sticky="e")
        thick_scale = ttk.Scale(self.root, from_=1, to=10, variable=self.thickness_var, 
                              orient="horizontal", command=self.update_preview_and_label)
        thick_scale.grid(row=2, column=1, padx=5, pady=5, sticky="w")
        self.thick_display = ttk.Label(self.root, text=str(self.thickness_var.get()))
        self.thick_display.grid(row=2, column=2, padx=5, sticky="w")

        # Speed Scale
        speed_label = ttk.Label(self.root, text="Speed (ms):")
        speed_label.grid(row=3, column=0, padx=5, pady=5, sticky="e")
        speed_scale = ttk.Scale(self.root, from_=100, to=2000, variable=self.speed_var, 
                              orient="horizontal", command=self.update_preview_and_label)
        speed_scale.grid(row=3, column=1, padx=5, pady=5, sticky="w")
        self.speed_display = ttk.Label(self.root, text=str(self.speed_var.get()))
        self.speed_display.grid(row=3, column=2, padx=5, sticky="w")

        # Color Picker
        color_button = ttk.Button(self.root, text="Select Color", command=self.pick_color)
        color_button.grid(row=4, column=0, padx=5, pady=5, sticky="e")
        self.color_display = ttk.Label(self.root, text=self.color_var, foreground=self.color_var)
        self.color_display.grid(row=4, column=1, padx=5, pady=5, sticky="w")

        # Copy CSS Button
        copy_button = ttk.Button(self.root, text="Copy CSS", command=self.copy_css)
        copy_button.grid(row=5, column=0, columnspan=3, padx=5, pady=10)

        # Preview Button
        preview_button = ttk.Button(self.root, text="Live Preview", command=self.show_preview)
        preview_button.grid(row=6, column=0, columnspan=3, padx=5, pady=5)

    def update_preview_and_label(self, event=None):
        self.size_display.config(text=str(self.size_var.get()))
        self.thick_display.config(text=str(self.thickness_var.get()))
        self.speed_display.config(text=str(self.speed_var.get()))
        self.update_preview()

    def pick_color(self):
        color_code = colorchooser.askcolor(initialcolor=self.color_var)
        if color_code and color_code[1]:
            self.color_var = color_code[1]
            self.color_display.config(text=self.color_var, foreground=self.color_var)
            self.update_preview()

    def get_animation_css(self):
        anim_type = self.animation_var.get()
        size = self.size_var.get()
        thickness = self.thickness_var.get()
        speed = self.speed_var.get()
        color = self.color_var

        if anim_type == "spinner":
            return f"""
.loader {{
  width: {size}px;
  height: {size}px;
  position: relative;
}}

.loader .spinner {{
  width: 100%;
  height: 100%;
  position: absolute;
  animation: rotate {speed}ms linear infinite;
}}

.loader .spinner .path {{
  stroke: {color};
  stroke-width: {thickness};
  stroke-linecap: round;
  stroke-dasharray: 187;
  stroke-dashoffset: 0;
  transform-origin: center;
  animation: dash {speed}ms ease-in-out infinite;
}}

@keyframes rotate {{
  100% {{ transform: rotate(360deg); }}
}}

@keyframes dash {{
  0% {{ stroke-dashoffset: 187; }}
  50% {{ stroke-dashoffset: 46.75; transform: rotate(135deg); }}
  100% {{ stroke-dashoffset: 187; transform: rotate(450deg); }}
}}"""
        elif anim_type == "dots":
            return f"""
.loader {{
  display: flex;
  gap: {thickness * 2}px;
}}

.loader .dot {{
  width: {thickness * 2}px;
  height: {thickness * 2}px;
  background: {color};
  border-radius: 50%;
  animation: scale {speed}ms ease-in-out infinite;
}}

.loader .dot:nth-child(2) {{ animation-delay: {speed/3}ms; }}
.loader .dot:nth-child(3) {{ animation-delay: {speed*2/3}ms; }}

@keyframes scale {{
  0%, 100% {{ transform: scale(1); opacity: 1; }}
  50% {{ transform: scale(0.3); opacity: 0.5; }}
}}"""
        elif anim_type == "bars":
            return f"""
.loader {{
  display: flex;
  gap: {thickness}px;
}}

.loader .bar {{
  width: {thickness * 2}px;
  height: {size}px;
  background: {color};
  animation: stretch {speed}ms ease-in-out infinite;
}}

.loader .bar:nth-child(2) {{ animation-delay: {speed/4}ms; }}
.loader .bar:nth-child(3) {{ animation-delay: {speed/2}ms; }}
.loader .bar:nth-child(4) {{ animation-delay: {speed*3/4}ms; }}

@keyframes stretch {{
  0%, 100% {{ transform: scaleY(1); }}
  50% {{ transform: scaleY(0.3); }}
}}"""
        else:  # pulse
            return f"""
.loader {{
  width: {size}px;
  height: {size}px;
  border: {thickness}px solid {color};
  border-radius: 50%;
  animation: pulse {speed}ms ease-in-out infinite;
}}

@keyframes pulse {{
  0% {{ transform: scale(0.8); opacity: 0.5; }}
  100% {{ transform: scale(1.2); opacity: 0; }}
}}"""

    def get_animation_html(self):
        anim_type = self.animation_var.get()
        
        if anim_type == "spinner":
            return """<svg class="spinner" viewBox="0 0 66 66">
                <circle class="path" fill="none" cx="33" cy="33" r="30"></circle>
            </svg>"""
        elif anim_type == "dots":
            return """<div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>"""
        elif anim_type == "bars":
            return """<div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>"""
        else:  # pulse
            return ""  # The loader div itself is enough for pulse

    def update_preview(self, event=None):
        if not self.preview_html:
            return
            
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #2B3134;
        }}
        {self.get_animation_css()}
    </style>
</head>
<body>
    <div class="loader">
        {self.get_animation_html()}
    </div>
</body>
</html>
"""
        preview_path = os.path.join(self.temp_dir, "preview.html")
        with open(preview_path, 'w') as f:
            f.write(html_content)
            
        # Refresh the page by touching it
        os.utime(preview_path, None)

    def show_preview(self):
        if not self.preview_html:
            preview_path = os.path.join(self.temp_dir, "preview.html")
            self.preview_html = preview_path
            self.update_preview()
            webbrowser.open(f'file://{preview_path}')
        else:
            self.update_preview()

    def copy_css(self):
        """Copy the CSS content to clipboard"""
        css_content = self.get_animation_css()
        try:
            self.root.clipboard_clear()
            self.root.clipboard_append(css_content)
            self.root.update()  # Required for clipboard to work
            messagebox.showinfo("Success", "CSS copied to clipboard!")
        except Exception as e:
            messagebox.showerror("Copy Error", str(e))

def main():
    root = tk.Tk()
    app = LoadingIconMakerGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
