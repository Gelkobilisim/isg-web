import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = "{DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{t(d.key)}</option>)}"
new_target = "{DEPARTMENTS.map(d => <option key={d} value={d}>{t(getDeptKey(d))}</option>)}"

content = content.replace(target, new_target)

with open('src/App.jsx', 'w') as f:
    f.write(content)
