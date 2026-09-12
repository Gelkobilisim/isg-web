import re

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "const SefDashboard =" in line:
        start_idx = i
        break

if start_idx != -1:
    print("".join(lines[start_idx:start_idx+15]))
