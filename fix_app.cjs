const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove states from AdminDashboard
code = code.replace(
    "    const [showLogoutModal, setShowLogoutModal] = useState(false);\n    const [logoutCountdown, setLogoutCountdown] = useState(5);\n",
    ""
);

// 2. Remove useEffect from AdminDashboard
const useEffectToRemove = `    useEffect(() => {
      let timer;
      if (showLogoutModal && logoutCountdown > 0) {
        timer = setTimeout(() => setLogoutCountdown(logoutCountdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }, [showLogoutModal, logoutCountdown]);\n\n`;
code = code.replace(useEffectToRemove, "");

// 3. Insert states and useEffect into App component
const appStart = "  const [selectedYuklemeDate, setSelectedYuklemeDate] = useState(null);";
const newAppState = appStart + `
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(5);

  useEffect(() => {
    let timer;
    if (showLogoutModal && logoutCountdown > 0) {
      timer = setTimeout(() => setLogoutCountdown(logoutCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showLogoutModal, logoutCountdown]);
`;

code = code.replace(appStart, newAppState);

fs.writeFileSync('src/App.jsx', code);
