import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

dashboards = ['AdminDashboard', 'SefDashboard', 'YuklemeciDashboard', 'YukleniciDashboard', 'ModDashboard', 'FeedbacksAdmin']

for d in dashboards:
    # Find const Dashboard = () => {
    # Replace with const Dashboard = React.memo(() => {
    content = re.sub(rf'const {d} = \(\) => {{', rf'const {d} = React.memo(() => {{', content)
    
    # We also need to find where the component ends to add the closing parenthesis.
    # This is tricky with regex, so maybe just doing the definition is fine since it's an arrow function, but we MUST close the parenthesis.
    # Actually, a better approach for memoizing in a single file:
    # just export/declare it as a memo at the end, or wrap it where it is used.
    # It's used inside MainLayout like this: <AdminDashboard />

content = re.sub(r'<FeedbacksAdmin />', r'<MemoFeedbacksAdmin />', content)
content = re.sub(r'<AdminDashboard />', r'<MemoAdminDashboard />', content)
content = re.sub(r'<ModDashboard />', r'<MemoModDashboard />', content)
content = re.sub(r'<SefDashboard />', r'<MemoSefDashboard />', content)
content = re.sub(r'<YuklemeciDashboard />', r'<MemoYuklemeciDashboard />', content)
content = re.sub(r'<YukleniciDashboard />', r'<MemoYukleniciDashboard />', content)

# Now define the memoized versions right before the Routes
memo_defs = """
const MemoFeedbacksAdmin = React.memo(FeedbacksAdmin);
const MemoAdminDashboard = React.memo(AdminDashboard);
const MemoModDashboard = React.memo(ModDashboard);
const MemoSefDashboard = React.memo(SefDashboard);
const MemoYuklemeciDashboard = React.memo(YuklemeciDashboard);
const MemoYukleniciDashboard = React.memo(YukleniciDashboard);
"""
content = content.replace('<Routes>', memo_defs + '\n      <Routes>')

with open('src/App.jsx', 'w') as f:
    f.write(content)
