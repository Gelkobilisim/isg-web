import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """        <div className="w-full max-w-4xl flex justify-end items-center gap-3 z-40 mb-6 mt-2 px-2 md:px-0 md:absolute md:top-8 md:right-8 md:mt-0 flex-wrap">
            <PWAInstallButton />"""

replacement = """        <div className="w-full max-w-4xl flex justify-end items-center gap-3 z-40 mb-6 mt-2 px-2 md:px-0 md:absolute md:top-8 md:right-8 md:mt-0 flex-wrap">
            <PWAInstallButton variant="rounded" />"""

content = content.replace(target, replacement)

with open('src/App.jsx', 'w') as f:
    f.write(content)
