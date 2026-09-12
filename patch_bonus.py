import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

new_code = """        const pointsRef = doc(db, "system", "points");
        await updateDoc(pointsRef, updates);
        
        DEPARTMENTS.forEach(async (dept) => {
          if (!deptsWithTasks.has(dept)) {
            try {
              await addDoc(collection(db, "point_logs"), {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                dept: dept,
                points: 20,
                reason: 'Günlük İhlalsizlik Bonusu (Otomatik)',
                adminName: 'Sistem',
                dateStr: formattedToday,
                timestamp: Date.now()
              });
            } catch(e) { console.error(e); }
          }
        });
        
        console.log(`Otomatik Günlük Bonus Dağıtıldı: ${distributed} birime 20 puan eklendi.`);
"""

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const pointsRef = doc(db, \"system\", \"points\");" in line:
        start_idx = i
    if "console.log(`Otomatik Günlük Bonus Dağıtıldı:" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    lines[start_idx:end_idx+1] = [new_code]
    with open('src/App.jsx', 'w') as f:
        f.writelines(lines)
    print("Patched.")
else:
    print("Could not find start/end indices")
