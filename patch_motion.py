import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

motion_import = "import { motion, AnimatePresence } from 'motion/react';\n"
for i, line in enumerate(lines):
    if "import { initializeApp" in line:
        lines.insert(i, motion_import)
        break

wrapper = """
const AnimatedView = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);
"""
for i, line in enumerate(lines):
    if "const MainLayout =" in line:
        lines.insert(i, wrapper)
        break

with open('src/App.jsx', 'w') as f:
    f.writelines(lines)
