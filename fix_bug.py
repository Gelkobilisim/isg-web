import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

bug_lines = [
    "const MemoFeedbacksAdmin = React.memo(FeedbacksAdmin);\n",
    "const MemoAdminDashboard = React.memo(AdminDashboard);\n",
    "const MemoModDashboard = React.memo(ModDashboard);\n",
    "const MemoSefDashboard = React.memo(SefDashboard);\n",
    "const MemoYuklemeciDashboard = React.memo(YuklemeciDashboard);\n",
    "const MemoYukleniciDashboard = React.memo(YukleniciDashboard);\n"
]

# Remove the bug lines from wherever they are
new_lines = []
for line in lines:
    if line in bug_lines:
        continue
    new_lines.append(line)

# Find export default function App and insert them right before it
for i, line in enumerate(new_lines):
    if "export default function App" in line:
        for j, bug_line in enumerate(bug_lines):
            new_lines.insert(i + j, bug_line)
        break

with open('src/App.jsx', 'w') as f:
    f.writelines(new_lines)
