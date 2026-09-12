import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """    const handleSubmit = (e) => {
        e.preventDefault();
        createTask(formState.dept, formState.priority, formState.subject, formState.desc, 24, imgPreview);
        setFormState({ dept: 'Boyahane', priority: 'yuksek', subject: '', desc: '' });
        setImgPreview(null);
        alert(t('success_created') || "İhlal kaydı oluşturuldu.");
        setActiveTab('review');
    };

    const handleActionSubmit = (e) => {
        e.preventDefault();
        if (actionModal.action === 'approve') { 
            updateTaskStatus(actionModal.taskId, 'kapatildi', modNote, '', '');
        } else if (actionModal.action === 'reject') { 
            updateTaskStatus(actionModal.taskId, 'acik', modNote, '', '');
        }
        setActionModal({ isOpen: false, taskId: null, action: null });
        setModNote('');
    };"""

new_target = """    const handleSubmit = (e) => {
        e.preventDefault();
        createTask(formState.dept, formState.priority, formState.subject, formState.desc, 24, imgPreview);
        setFormState({ dept: 'Boyahane', priority: 'yuksek', subject: '', desc: '' });
        setImgPreview(null);
        toast.success(t('success_created') || "İhlal kaydı başarıyla oluşturuldu.", {
            style: { borderRadius: '12px', background: '#333', color: '#fff' }
        });
        setActiveTab('review');
    };

    const handleActionSubmit = (e) => {
        e.preventDefault();
        if (actionModal.action === 'approve') { 
            updateTaskStatus(actionModal.taskId, 'kapatildi', modNote, '', '');
            toast.success("İşlem onaylandı ve kapatıldı.", {
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            });
        } else if (actionModal.action === 'reject') { 
            updateTaskStatus(actionModal.taskId, 'acik', modNote, '', '');
            toast.error("Yanıt reddedildi ve geri gönderildi.", {
                style: { borderRadius: '12px', background: '#333', color: '#fff' }
            });
        }
        setActionModal({ isOpen: false, taskId: null, action: null });
        setModNote('');
    };"""

content = content.replace(target, new_target)

with open('src/App.jsx', 'w') as f:
    f.write(content)

