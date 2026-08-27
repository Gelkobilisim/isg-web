const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add imports
code = code.replace(
  'import { initializeFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";',
  'import { initializeFirestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";\nimport { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";'
);

// 2. Initialize storage
code = code.replace(
  'const db = initializeFirestore(app, { experimentalForceLongPolling: true });',
  'const db = initializeFirestore(app, { experimentalForceLongPolling: true });\nconst storage = getStorage(app);'
);

// 3. update createTask
const oldCreateTask = `const createTask = useCallback(async (dept, priority, desc, deadlineHours, imgUrl) => {
    const taskId = Date.now().toString();
    const newTask = {
      id: taskId, dept, priority, desc, status: 'acik', 
      createdAt: formatDate(new Date()), timestamp: Date.now(), 
      deadlineHours, imgUrl: imgUrl || '', modNote: ''
    };
    await setDoc(doc(db, "tasks", taskId), newTask);
  }, []);`;

const newCreateTask = `const createTask = useCallback(async (dept, priority, desc, deadlineHours, imgUrl) => {
    const taskId = Date.now().toString();
    let finalImgUrl = imgUrl || '';
    if (imgUrl && imgUrl.startsWith('data:image')) {
      const storageRef = ref(storage, \`tasks/\${taskId}.jpg\`);
      await uploadString(storageRef, imgUrl, 'data_url');
      finalImgUrl = await getDownloadURL(storageRef);
    }
    const newTask = {
      id: taskId, dept, priority, desc, status: 'acik', 
      createdAt: formatDate(new Date()), timestamp: Date.now(), 
      deadlineHours, imgUrl: finalImgUrl, modNote: ''
    };
    await setDoc(doc(db, "tasks", taskId), newTask);
  }, []);`;
code = code.replace(oldCreateTask, newCreateTask);

fs.writeFileSync('src/App.jsx', code);
