import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import { triggerHaptic } from \"./utils/haptics\";\n"
if "import { triggerHaptic }" not in content:
    content = content.replace('import { DICT } from "./i18n";', import_stmt + 'import { DICT } from "./i18n";')

# Patch handleLogin success
target_login_success = """        setCurrentUser(account);
        setLoginErr('');
      } else {"""
new_login_success = """        setCurrentUser(account);
        setLoginErr('');
        triggerHaptic('success');
      } else {"""
content = content.replace(target_login_success, new_login_success)

# Patch handleLogin error
target_login_error = """      } else {
        setLoginErr(t('err_wrong_cred'));
      }"""
new_login_error = """      } else {
        setLoginErr(t('err_wrong_cred'));
        triggerHaptic('error');
      }"""
content = content.replace(target_login_error, new_login_error)

# Patch createTask
target_create = """    await setDoc(doc(db, "tasks", taskId), newTask);"""
new_create = """    await setDoc(doc(db, "tasks", taskId), newTask);
    triggerHaptic('success');"""
content = content.replace(target_create, new_create)

# Patch updateTaskStatus
target_update = """        await updateDoc(taskRef, updates);"""
new_update = """        await updateDoc(taskRef, updates);
        triggerHaptic('success');"""
content = content.replace(target_update, new_update)

# Patch createLoading
target_loading = """    await setDoc(doc(db, "loadings", loadId), newLoad);"""
new_loading = """    await setDoc(doc(db, "loadings", loadId), newLoad);
    triggerHaptic('success');"""
content = content.replace(target_loading, new_loading)

# Patch startLoadingProcess
target_start_loading = """    await updateDoc(loadRef, {
      status: 'islemde',
      startedAtTime: new Date().toISOString()
    });"""
new_start_loading = """    await updateDoc(loadRef, {
      status: 'islemde',
      startedAtTime: new Date().toISOString()
    });
    triggerHaptic('success');"""
content = content.replace(target_start_loading, new_start_loading)

# Patch finishLoading
target_finish_loading = """    await updateDoc(loadRef, {
      status: 'tamamlandi',
      postImgUrl: postImg,
      postNote: postNote,
      finishedAtTime: new Date().toISOString()
    });"""
new_finish_loading = """    await updateDoc(loadRef, {
      status: 'tamamlandi',
      postImgUrl: postImg,
      postNote: postNote,
      finishedAtTime: new Date().toISOString()
    });
    triggerHaptic('success');"""
content = content.replace(target_finish_loading, new_finish_loading)


with open('src/App.jsx', 'w') as f:
    f.write(content)
