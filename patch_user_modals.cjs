const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Insert new state variables
const stateInsertionPoint = "const [editUserForm, setEditUserForm] = useState({ username: '', password: '', name: '' });";
const stateReplacement = stateInsertionPoint + `
    const [showUpdateUserModal, setShowUpdateUserModal] = useState(false);
    const [userToUpdate, setUserToUpdate] = useState(null);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteUserCountdown, setDeleteUserCountdown] = useState(5);
`;
code = code.replace(stateInsertionPoint, stateReplacement);

// 2. Insert new useEffect for deleteUserCountdown
const effectInsertionPoint = "    useEffect(() => {\n      let timer;\n      if (showDeleteModal && deleteCountdown > 0) {";
const effectReplacement = `    useEffect(() => {
      let timer;
      if (showDeleteUserModal && deleteUserCountdown > 0) {
        timer = setTimeout(() => setDeleteUserCountdown(deleteUserCountdown - 1), 1000);
      }
      return () => clearTimeout(timer);
    }, [showDeleteUserModal, deleteUserCountdown]);

` + effectInsertionPoint;
code = code.replace(effectInsertionPoint, effectReplacement);

// 3. Replace handleUpdateUser and handleDeleteUser
const oldHandlers = `    const handleUpdateUser = async (id) => {
      if (!editUserForm.username || !editUserForm.password || !editUserForm.name) return;
      await updateDoc(doc(db, "users", id), {
          username: editUserForm.username,
          password: editUserForm.password,
          name: editUserForm.name
      });
      setEditingUserId(null);
    };

    const handleDeleteUser = async (id) => {
      if(id === "1") return; 
      if(window.confirm(t('confirm_delete_user') || 'Delete user?')) { await deleteDoc(doc(db, "users", id)); }
    };`;

const newHandlers = `    const handleUpdateUserClick = (id) => {
      setUserToUpdate(id);
      setShowUpdateUserModal(true);
    };

    const confirmUpdateUser = async () => {
      if (!userToUpdate || !editUserForm.username || !editUserForm.password || !editUserForm.name) return;
      await updateDoc(doc(db, "users", userToUpdate), {
          username: editUserForm.username,
          password: editUserForm.password,
          name: editUserForm.name
      });
      setShowUpdateUserModal(false);
      setUserToUpdate(null);
      setEditingUserId(null);
    };

    const handleDeleteUserClick = (id) => {
      if(id === "1") return; 
      setUserToDelete(id);
      setDeleteUserCountdown(5);
      setShowDeleteUserModal(true);
    };

    const confirmDeleteUser = async () => {
      if (!userToDelete || deleteUserCountdown > 0) return;
      await deleteDoc(doc(db, "users", userToDelete));
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    };`;

code = code.replace(oldHandlers, newHandlers);

// 4. Update button clicks in JSX
code = code.replace(
  '<button onClick={() => handleUpdateUser(u.id)} className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md text-sm font-bold flex items-center">',
  '<button onClick={() => handleUpdateUserClick(u.id)} className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md text-sm font-bold flex items-center">'
);

code = code.replace(
  '<button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">',
  '<button onClick={() => handleDeleteUserClick(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">'
);

// 5. Add Modals at the end of the return statement (near showDeleteModal)
const modalsInsertionPoint = "{showDeleteModal && (";
const newModals = `{showUpdateUserModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
                Hesabı Güncelle
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Kullanıcı bilgilerini güncellemek istediğinize emin misiniz? Yanlış değişiklikler yetkili hesapların erişimini etkileyebilir.
              </p>
              <div className="flex space-x-3 justify-end">
                <button onClick={() => { setShowUpdateUserModal(false); setUserToUpdate(null); }} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  İptal
                </button>
                <button onClick={confirmUpdateUser} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md">
                  Onayla ve Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteUserModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
              <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2" />
                Kullanıcıyı Sil
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Bu hesabı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex space-x-3 justify-end">
                <button onClick={() => { setShowDeleteUserModal(false); setUserToDelete(null); }} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  İptal
                </button>
                <button onClick={confirmDeleteUser} disabled={deleteUserCountdown > 0} className={\`px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors \${deleteUserCountdown > 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}\`}>
                  {deleteUserCountdown > 0 ? \`Sil (\${deleteUserCountdown})\` : 'Evet, Kalıcı Olarak Sil'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        ` + modalsInsertionPoint;

code = code.replace(modalsInsertionPoint, newModals);

fs.writeFileSync('src/App.jsx', code);
console.log("Patched successfully!");
