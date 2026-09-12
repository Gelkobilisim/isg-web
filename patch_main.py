import re

with open('src/main.jsx', 'r') as f:
    content = f.read()

target = "import App from './App.jsx'"
new_target = "import App from './App.jsx'\nimport { ErrorBoundary } from './components/ErrorBoundary.jsx'"
content = content.replace(target, new_target)

target2 = "<App />"
new_target2 = "<ErrorBoundary>\n        <App />\n      </ErrorBoundary>"
content = content.replace(target2, new_target2)

with open('src/main.jsx', 'w') as f:
    f.write(content)
