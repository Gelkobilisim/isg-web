with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const SefDashboard =" in line:
        start = i
        break

for i in range(start, start+200):
    if "return (" in lines[i]:
        print("".join(lines[i:i+60]))
        break
