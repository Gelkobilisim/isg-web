with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const updateTaskStatus = useCallback(" in line:
        start = i
        brace_count = 0
        found = False
        for j in range(start, len(lines)):
            brace_count += lines[j].count('{') - lines[j].count('}')
            if '{' in lines[j]:
                found = True
            if found and brace_count == 0:
                print("".join(lines[j-20:j+5]))
                break
        break
