import re

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "const translations =" in line:
        start_idx = i
        break

if start_idx != -1:
    end_idx = start_idx
    brace_count = 0
    found_first = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if '{' in line:
            found_first = True
        if found_first and brace_count == 0:
            end_idx = i
            break
    print("".join(lines[start_idx:end_idx+1]))
