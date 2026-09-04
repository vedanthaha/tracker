import os
import re

directories = [
    'src/layouts',
    'src/pages',
    'src/components'
]

def replace_colors_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # 1. Replace rgba(240,237,232, 0.XX) with color-mix
    def repl_rgba(match):
        opacity_str = match.group(1)
        opacity = float(opacity_str)
        percent = int(opacity * 100)
        return f'color-mix(in srgb, var(--foreground) {percent}%, transparent)'
        
    content = re.sub(r'rgba\(240,237,232,\s*(0\.\d+)\)', repl_rgba, content)
    
    # 2. Replace rgba(0,0,0, 0.XX) with color-mix
    def repl_rgba_black(match):
        opacity_str = match.group(1)
        opacity = float(opacity_str)
        percent = int(opacity * 100)
        return f'color-mix(in srgb, var(--background) {percent}%, transparent)'
        
    content = re.sub(r'rgba\(0,0,0,\s*(0\.\d+)\)', repl_rgba_black, content)

    # 3. Replace background: "#141414"
    content = content.replace('"#141414"', '"var(--surface-elevated)"')
    content = content.replace('"#050508"', '"var(--background)"')
    content = content.replace('"#0c0c0c"', '"var(--background)"')
    content = content.replace('rgba(5,5,8,0.9)', 'color-mix(in srgb, var(--background) 90%, transparent)')

    # Leave graph data colors like #d4a853, #6fcf8a untouched.
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                replace_colors_in_file(os.path.join(root, file))

print("Done")
