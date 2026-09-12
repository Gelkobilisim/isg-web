import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Add loading="lazy" and decoding="async" to img tags if not present
content = re.sub(r'<img(?![^>]*loading=)([^>]*)>', r'<img loading="lazy" decoding="async"\1>', content)

with open('src/App.jsx', 'w') as f:
    f.write(content)
