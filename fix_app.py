import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

# Remove the incorrectly added tags at around line 1320
new_lines = []
for line in lines:
    if "</AnimatedView>" in line or "</AnimatePresence>" in line:
        continue
    new_lines.append(line)

with open('src/App.jsx', 'w') as f:
    f.writelines(new_lines)

