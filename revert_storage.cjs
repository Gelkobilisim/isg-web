const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Remove import
code = code.replace('import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";\n', '');

// Remove storage init
code = code.replace('const storage = getStorage(app);\n', '');

// Revert createTask
const oldCreateTask = `const createTask = useCallback(async (dept, priority, desc, deadlineHours, imgUrl) => {
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

const newCreateTask = `const createTask = useCallback(async (dept, priority, desc, deadlineHours, imgUrl) => {
    const taskId = Date.now().toString();
    const newTask = {
      id: taskId, dept, priority, desc, status: 'acik', 
      createdAt: formatDate(new Date()), timestamp: Date.now(), 
      deadlineHours, imgUrl: imgUrl || '', modNote: ''
    };
    await setDoc(doc(db, "tasks", taskId), newTask);
  }, []);`;
code = code.replace(oldCreateTask, newCreateTask);

// Revert updateTaskStatus
const oldUpdateTask = `const updateTaskStatus = useCallback(async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);
    let finalAfterImgUrl = afterImgUrl || '';
    if (afterImgUrl && afterImgUrl.startsWith('data:image')) {
      const storageRef = ref(storage, \`tasks/\${id}_after.jpg\`);
      await uploadString(storageRef, afterImgUrl, 'data_url');
      finalAfterImgUrl = await getDownloadURL(storageRef);
    }`;

const newUpdateTask = `const updateTaskStatus = useCallback(async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);`;

code = code.replace(oldUpdateTask, newUpdateTask);
code = code.replace('if (finalAfterImgUrl) updates.afterImgUrl = finalAfterImgUrl;', 'if (afterImgUrl) updates.afterImgUrl = afterImgUrl;');

// Revert createLoading
const oldCreateLoading = `const createLoading = useCallback(async (plaka, sofor, destCountry, destLocation, destCompany, projectNo, tonnage, not, preImgUrl) => {
    const loadId = Date.now().toString();
    let finalPreImgUrl = preImgUrl || '';
    if (preImgUrl && preImgUrl.startsWith('data:image')) {
      const storageRef = ref(storage, \`loadings/\${loadId}_pre.jpg\`);
      await uploadString(storageRef, preImgUrl, 'data_url');
      finalPreImgUrl = await getDownloadURL(storageRef);
    }
    const newLoading = {`;

const newCreateLoading = `const createLoading = useCallback(async (plaka, sofor, destCountry, destLocation, destCompany, projectNo, tonnage, not, preImgUrl) => {
    const loadId = Date.now().toString();
    const newLoading = {`;

code = code.replace(oldCreateLoading, newCreateLoading);
code = code.replace('preImgUrl: finalPreImgUrl, postImgUrl: \'\'', 'preImgUrl: preImgUrl || \'\', postImgUrl: \'\'');

// Revert finishLoading
const oldFinishLoading = `const finishLoading = useCallback(async (loadId, note, postImgUrl) => {
    const loadRef = doc(db, "loadings", loadId);
    let finalPostImgUrl = postImgUrl || '';
    if (postImgUrl && postImgUrl.startsWith('data:image')) {
      const storageRef = ref(storage, \`loadings/\${loadId}_post.jpg\`);
      await uploadString(storageRef, postImgUrl, 'data_url');
      finalPostImgUrl = await getDownloadURL(storageRef);
    }
    await updateDoc(loadRef, {
      status: 'tamamlandi',
      note: note,
      postImgUrl: finalPostImgUrl,
      finishTimestamp: Date.now()
    });
  }, []);`;

const newFinishLoading = `const finishLoading = useCallback(async (loadId, note, postImgUrl) => {
    const loadRef = doc(db, "loadings", loadId);
    await updateDoc(loadRef, {
      status: 'tamamlandi',
      note: note,
      postImgUrl: postImgUrl || '',
      finishTimestamp: Date.now()
    });
  }, []);`;

code = code.replace(oldFinishLoading, newFinishLoading);

fs.writeFileSync('src/App.jsx', code);
