import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# We need to find where the component ends and add a closing parenthesis.
# Currently they end like:
#   };
# 
# But wait, there are multiple `};` in the file.
# We can just revert the memo patch for the component definitions, and only use `React.memo` for the Memo-prefixed versions.

content = content.replace("const FeedbacksAdmin = React.memo(() => {", "const FeedbacksAdmin = () => {")
content = content.replace("const AdminDashboard = React.memo(() => {", "const AdminDashboard = () => {")
content = content.replace("const ModDashboard = React.memo(() => {", "const ModDashboard = () => {")
content = content.replace("const SefDashboard = React.memo(() => {", "const SefDashboard = () => {")
content = content.replace("const YuklemeciDashboard = React.memo(() => {", "const YuklemeciDashboard = () => {")
content = content.replace("const YukleniciDashboard = React.memo(() => {", "const YukleniciDashboard = () => {")

with open('src/App.jsx', 'w') as f:
    f.write(content)
