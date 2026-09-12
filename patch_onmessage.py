import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

new_code = """  useEffect(() => {
    let unsubMessage = () => {};
    if (messaging) {
      try {
        unsubMessage = onMessage(messaging, (payload) => {
          console.log("Ön planda mesaj alındı: ", payload);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(payload.notification.title, {
              body: payload.notification.body,
              icon: '/adsmetal_logo.jpg'
            });
          }
        });
      } catch (err) {
        console.error("onMessage init error", err);
      }
    }
"""

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "  useEffect(() => {" in line and "if (messaging) {" in lines[i+1]:
        start_idx = i
    if start_idx != -1 and i > start_idx and "    const handleSnapErr" in line:
        end_idx = i - 1
        break

if start_idx != -1 and end_idx != -1:
    lines[start_idx:end_idx+1] = [new_code]
    with open('src/App.jsx', 'w') as f:
        f.writelines(lines)
    print("Patched onMessage.")
else:
    print("Could not find start/end indices for onMessage")
