const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add state variables for editing
const stateInsertionPoint = "const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sef', dept: DEPARTMENTS[0] });";
const stateReplacement = stateInsertionPoint + `
    const [editingUserId, setEditingUserId] = useState(null);
    const [editUserForm, setEditUserForm] = useState({ username: '', password: '', name: '' });
`;
code = code.replace(stateInsertionPoint, stateReplacement);

// 2. Add handleUpdateUser function after handleDeleteUser
const handleCreateUserEnd = "    const handleDeleteUser = async (id) => {";
const handleUpdateUserCode = `    const handleUpdateUser = async (id) => {
      if (!editUserForm.username || !editUserForm.password || !editUserForm.name) return;
      await updateDoc(doc(db, "users", id), {
          username: editUserForm.username,
          password: editUserForm.password,
          name: editUserForm.name
      });
      setEditingUserId(null);
    };

    const handleDeleteUser = async (id) => {`;
code = code.replace(handleCreateUserEnd, handleUpdateUserCode);

// 3. Replace the filteredUsers.map loop to support editing
const originalMapStart = `{filteredUsers.map(u => {`;
const originalMapEnd = `                  );
                })}
              </div>`;

const mapSubstringToReplace = code.substring(
    code.indexOf(originalMapStart),
    code.indexOf(originalMapEnd) + originalMapEnd.length
);

const newMapCode = `{filteredUsers.map(u => {
                    const isEditing = editingUserId === u.id;
                    const canEdit = currentUser.role === 'admin' || currentUser.username === 'agiradar' || currentUser.username === 'agiradarsahin';
                    return (
                    <div key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 border rounded-xl hover:bg-gray-50 dark:bg-gray-900 transition-colors gap-3">
                      {isEditing ? (
                         <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input type="text" value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} className="border rounded-md p-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Ad Soyad" />
                            <input type="text" value={editUserForm.username} onChange={e => setEditUserForm({...editUserForm, username: e.target.value})} className="border rounded-md p-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Kullanıcı Adı" />
                            <input type="text" value={editUserForm.password} onChange={e => setEditUserForm({...editUserForm, password: e.target.value})} className="border rounded-md p-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Şifre" />
                         </div>
                      ) : (
                         <div>
                           <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{u.name} <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">@{u.username}</span></p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.role === 'sef' ? \`Şef - \${u.dept}\` : u.role}</p>
                         </div>
                      )}
                      
                      <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
                          {isEditing ? (
                              <>
                                <button onClick={() => handleUpdateUser(u.id)} className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md text-sm font-bold flex items-center"><Save className="w-4 h-4 mr-1"/> Kaydet</button>
                                <button onClick={() => setEditingUserId(null)} className="text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md text-sm font-bold">İptal</button>
                              </>
                          ) : (
                              <>
                                {canEdit && <button onClick={() => { setEditingUserId(u.id); setEditUserForm({ username: u.username, password: u.password, name: u.name }); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-md"><Edit className="w-4 h-4"/></button>}
                                {u.id !== "1" && <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><Trash2 className="w-4 h-4"/></button>}
                              </>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>`;

code = code.replace(mapSubstringToReplace, newMapCode);

// 4. Update the Users tab permission so agiradar can see it even if they aren't admin.
const buttonCheckOld = "{currentUser.role === 'admin' && <button onClick={() => { navigate('/'); setAdminSystemMode('users');";
const buttonCheckNew = "{(currentUser.role === 'admin' || currentUser.username === 'agiradar' || currentUser.username === 'agiradarsahin') && <button onClick={() => { navigate('/'); setAdminSystemMode('users');";
code = code.replace(buttonCheckOld, buttonCheckNew);

fs.writeFileSync('src/App.jsx', code);
