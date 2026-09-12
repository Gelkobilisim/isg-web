import re

with open('src/i18n.js', 'r') as f:
    content = f.read()

# I will find 'tr: {' and 'en: {' and just inject it at the beginning of each.
tr_idx = content.find("tr: {")
en_idx = content.find("en: {")

tr_insert = """
    kritik: "Kritik",
    yuksek: "Yüksek",
    orta: "Orta",
    dusuk: "Düşük",
"""

en_insert = """
    kritik: "Critical",
    yuksek: "High",
    orta: "Medium",
    dusuk: "Low",
"""

# Let's just fix the bad injected parts first.
bad_part1 = """    // Priorities raw
    kritik: "Kritik",
    yuksek: "Yüksek",
    orta: "Orta",
    dusuk: "Düşük",
    
    // Priorities raw
    kritik: "Critical",
    yuksek: "High",
    orta: "Medium",
    dusuk: "Low",
    
"""
content = content.replace(bad_part1, "")

# Now inject properly
content = content.replace("tr: {", "tr: {" + tr_insert)
content = content.replace("en: {", "en: {" + en_insert)

with open('src/i18n.js', 'w') as f:
    f.write(content)
