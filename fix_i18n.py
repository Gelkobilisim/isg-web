import re

with open('src/i18n.js', 'r') as f:
    content = f.read()

# Add translation for priorities
tr_add = """    // Yüklemeci Panel"""
tr_new = """    // Priorities raw
    kritik: "Kritik",
    yuksek: "Yüksek",
    orta: "Orta",
    dusuk: "Düşük",
    
    // Yüklemeci Panel"""

en_add = """    // Yüklemeci Panel"""
en_new = """    // Priorities raw
    kritik: "Critical",
    yuksek: "High",
    orta: "Medium",
    dusuk: "Low",
    
    // Yüklemeci Panel"""

content = content.replace(tr_add, tr_new)
content = content.replace(en_add, en_new)

with open('src/i18n.js', 'w') as f:
    f.write(content)
