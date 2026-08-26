sed -i '/const TimerWrapper/d' src/App.jsx
sed -i '/const \[now, setNow\] = React.useState/d' src/App.jsx
sed -i '/React.useEffect(() => {};/d' src/App.jsx

cat << 'INNER_EOF' > timer_component.js
const TimerWrapper = ({ children }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  return children(now);
};
INNER_EOF

sed -i '/export default function App() {/e cat timer_component.js' src/App.jsx

