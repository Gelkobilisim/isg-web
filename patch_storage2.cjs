const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 4. update updateTaskStatus
const oldUpdate = `const updateTaskStatus = useCallback(async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);`;

const newUpdate = `const updateTaskStatus = useCallback(async (id, newStatus, chiefNote = '', afterImgUrl = '', modNote = '') => {
    const taskRef = doc(db, "tasks", id);
    let finalAfterImgUrl = afterImgUrl || '';
    if (afterImgUrl && afterImgUrl.startsWith('data:image')) {
      const storageRef = ref(storage, \`tasks/\${id}_after.jpg\`);
      await uploadString(storageRef, afterImgUrl, 'data_url');
      finalAfterImgUrl = await getDownloadURL(storageRef);
    }`;

code = code.replace(oldUpdate, newUpdate);

// Replace afterImgUrl inside the update object
code = code.replace(
  'updateData.afterImgUrl = afterImgUrl;',
  'updateData.afterImgUrl = finalAfterImgUrl;'
);

// 5. update createLoading
const oldCreateLoading = `const createLoading = useCallback(async (plaka, sofor, destCountry, destLocation, destCompany, projectNo, tonnage, not, preImgUrl) => {
    const loadId = Date.now().toString();
    const newLoading = {`;

const newCreateLoading = `const createLoading = useCallback(async (plaka, sofor, destCountry, destLocation, destCompany, projectNo, tonnage, not, preImgUrl) => {
    const loadId = Date.now().toString();
    let finalPreImgUrl = preImgUrl || '';
    if (preImgUrl && preImgUrl.startsWith('data:image')) {
      const storageRef = ref(storage, \`loadings/\${loadId}_pre.jpg\`);
      await uploadString(storageRef, preImgUrl, 'data_url');
      finalPreImgUrl = await getDownloadURL(storageRef);
    }
    const newLoading = {`;

code = code.replace(oldCreateLoading, newCreateLoading);

code = code.replace(
  'preImgUrl: preImgUrl || \'\', postImgUrl: \'\'',
  'preImgUrl: finalPreImgUrl, postImgUrl: \'\''
);

// 6. update finishLoading
const oldFinishLoading = `const finishLoading = useCallback(async (loadId, note, postImgUrl) => {
    const loadRef = doc(db, "loadings", loadId);
    await updateDoc(loadRef, {
      status: 'tamamlandi',
      note: note,
      postImgUrl: postImgUrl || '',
      finishTimestamp: Date.now()
    });
  }, []);`;

const newFinishLoading = `const finishLoading = useCallback(async (loadId, note, postImgUrl) => {
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
code = code.replace(oldFinishLoading, newFinishLoading);

fs.writeFileSync('src/App.jsx', code);
