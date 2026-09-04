import os
replacements = {
    'Â·': '·',
    'â€”': '-',
    'â€¦': '...',
    'â˜‘': '[v]',
    'â¬¡': '[+]',
    'â† ': '<-',
    'Ã—': 'x',
    'âœ•': 'X',
    'â€¢': '*',
    'Â©': '(c)',
    'â”€': '-',
    'â†”': '<->'
}

def process_dir(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.html')):
                continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for k, v in replacements.items():
                new_content = new_content.replace(k, v)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Fixed {path}')

process_dir('c:/Users/Ved/Documents/tracker/src')
