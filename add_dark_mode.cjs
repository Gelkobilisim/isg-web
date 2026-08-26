const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add dark mode state to Context
code = code.replace(
  "const [lang, setLang] = useState(localStorage.getItem('isg_lang') || 'tr');",
  "const [lang, setLang] = useState(localStorage.getItem('isg_lang') || 'tr');\n  const [darkMode, setDarkMode] = useState(localStorage.getItem('isg_dark') === 'true');\n  \n  useEffect(() => {\n    if (darkMode) document.documentElement.classList.add('dark');\n    else document.documentElement.classList.remove('dark');\n    localStorage.setItem('isg_dark', darkMode);\n  }, [darkMode]);"
);

// Add to context provider
code = code.replace(
  "lang, setLang, users, setUsers",
  "lang, setLang, darkMode, setDarkMode, users, setUsers"
);
code = code.replace(
  "currentUser, isFirebaseLoading, lang, users",
  "currentUser, isFirebaseLoading, lang, darkMode, users"
);

// Destructure in components
code = code.replace(
  /lang, setLang, users, setUsers,/g,
  "lang, setLang, darkMode, setDarkMode, users, setUsers,"
);

// Add Moon/Sun icon to imports
code = code.replace(
  "import { Camera, AlertTriangle",
  "import { Moon, Sun, Camera, AlertTriangle"
);

// Add toggle button to Header
code = code.replace(
  "<Globe className=\"w-3.5 h-3.5\" /> <span>{lang === 'tr' ? 'EN' : 'TR'}</span>\n             </button>",
  "<Globe className=\"w-3.5 h-3.5\" /> <span>{lang === 'tr' ? 'EN' : 'TR'}</span>\n             </button>\n             <button onClick={() => setDarkMode(!darkMode)} className=\"hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors\">\n                {darkMode ? <Sun className=\"w-4 h-4\" /> : <Moon className=\"w-4 h-4\" />}\n             </button>"
);

// Add Global Dark Mode classes to App container
code = code.replace(
  "className=\"min-h-screen bg-gray-50 flex flex-col font-sans\"",
  "className=\"min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-200\""
);

// Replace colors in the app for dark mode support
code = code.replace(/bg-white/g, "bg-white dark:bg-gray-800");
code = code.replace(/bg-gray-50 /g, "bg-gray-50 dark:bg-gray-900 ");
code = code.replace(/bg-gray-50"/g, "bg-gray-50 dark:bg-gray-900\"");
code = code.replace(/bg-gray-100 /g, "bg-gray-100 dark:bg-gray-700 ");
code = code.replace(/bg-gray-100"/g, "bg-gray-100 dark:bg-gray-700\"");

code = code.replace(/text-gray-800/g, "text-gray-800 dark:text-gray-100");
code = code.replace(/text-gray-700/g, "text-gray-700 dark:text-gray-200");
code = code.replace(/text-gray-600/g, "text-gray-600 dark:text-gray-300");
code = code.replace(/text-gray-500/g, "text-gray-500 dark:text-gray-400");
code = code.replace(/text-gray-400/g, "text-gray-400 dark:text-gray-500");

code = code.replace(/border-gray-100/g, "border-gray-100 dark:border-gray-700");
code = code.replace(/border-gray-200/g, "border-gray-200 dark:border-gray-700");
code = code.replace(/border-gray-300/g, "border-gray-300 dark:border-gray-600");

fs.writeFileSync('src/App.jsx', code);
