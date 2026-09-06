import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "{(currentUser?.role === 'admin' || currentUser?.role === 'yonetici' || currentUser?.username === 'agiradar' || currentUser?.username === 'agiradarsahin') && <AdminDashboard />}" in line:
        lines[i] = "                 {(currentUser?.role === 'admin' || currentUser?.role === 'yonetici' || currentUser?.username === 'agiradar' || currentUser?.username === 'agiradarsahin') && adminSystemMode === 'feedbacks' ? <FeedbacksAdmin /> : (currentUser?.role === 'admin' || currentUser?.role === 'yonetici' || currentUser?.username === 'agiradar' || currentUser?.username === 'agiradarsahin') ? <AdminDashboard /> : null}\n"
        break

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)
