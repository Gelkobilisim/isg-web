import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Wrap YuklemeciDashboard
content = re.sub(
    r'(const YuklemeciDashboard = \(\) => {.*?return \(\n\s*)(<div className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-orange-50/30">)',
    r'\1<AnimatePresence mode="wait"><AnimatedView className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-orange-50/30">',
    content, flags=re.DOTALL
)

# We need a more general approach to replace the outer divs with AnimatedView.
