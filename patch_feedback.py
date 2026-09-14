import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;
        setIsSubmittingFeedback(true);
        try {
            await addDoc(collection(db, "feedbacks"), {
                text: feedbackText,
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
                timestamp: serverTimestamp(),
                status: 'new'
            });
            setShowFeedbackModal(false);
            setFeedbackText('');
            alert('Geri bildiriminiz için teşekkürler! Başarıyla iletildi.');
        } catch (error) {
            console.error("Feedback error", error);
            alert('Gönderilirken bir hata oluştu.');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };"""

new_target = """    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;
        setIsSubmittingFeedback(true);
        try {
            const addFeedbackPromise = addDoc(collection(db, "feedbacks"), {
                text: feedbackText,
                userId: currentUser?.id || 'Bilinmiyor',
                userName: currentUser?.name || 'Bilinmiyor',
                userRole: currentUser?.role || 'Bilinmiyor',
                userDept: currentUser?.dept || '',
                timestamp: Date.now(),
                status: 'new'
            });
            
            await Promise.race([
                addFeedbackPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Bağlantı zaman aşımı. İnternetinizi kontrol edin.")), 8000))
            ]);

            setShowFeedbackModal(false);
            setFeedbackText('');
            alert('Geri bildiriminiz için teşekkürler! Başarıyla iletildi.');
        } catch (error) {
            console.error("Feedback error", error);
            alert(`Gönderilirken bir hata oluştu: ${error.message || 'Bağlantı sorunu olabilir.'}`);
        } finally {
            setIsSubmittingFeedback(false);
        }
    };"""

content = content.replace(target, new_target)

with open('src/App.jsx', 'w') as f:
    f.write(content)
