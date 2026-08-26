# 1. Define TimerWrapper outside App
sed -i '/export default function App() {/i \
const TimerWrapper = ({ children }) => {\
  const [now, setNow] = React.useState(Date.now());\
  React.useEffect(() => {\
    const timer = setInterval(() => setNow(Date.now()), 60000);\
    return () => clearInterval(timer);\
  }, []);\
  return children(now);\
};\
' src/App.jsx

# 2. Remove now and setNow from App
sed -i '/const \[now, setNow\] = useState(Date.now());/d' src/App.jsx
sed -i '/const timer = setInterval(() => setNow(Date.now()), 60000);/,+3d' src/App.jsx

