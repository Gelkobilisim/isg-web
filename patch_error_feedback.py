import re

with open('src/components/ErrorBoundary.jsx', 'r') as f:
    content = f.read()

target = """      await addDoc(collection(db, "feedbacks"), {
          text: "[SİSTEM ÇÖKME RAPORU]\\n" + this.state.feedbackText + "\\n\\nHata Detayı: " + this.state.error?.message,
          userId: savedUserId,
          userRole: localStorage.getItem('isg_notification_role') || 'Bilinmiyor',
          userDept: localStorage.getItem('isg_notification_dept') || 'Bilinmiyor',
          timestamp: Date.now(),
          status: 'new'
      });
      this.setState({ submitted: true, isSubmitting: false });
    } catch (err) {"""

new_target = """      const addPromise = addDoc(collection(db, "feedbacks"), {
          text: "[SİSTEM ÇÖKME RAPORU]\\n" + this.state.feedbackText + "\\n\\nHata Detayı: " + this.state.error?.message,
          userId: savedUserId,
          userRole: localStorage.getItem('isg_notification_role') || 'Bilinmiyor',
          userDept: localStorage.getItem('isg_notification_dept') || 'Bilinmiyor',
          timestamp: Date.now(),
          status: 'new'
      });
      
      await Promise.race([
          addPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Bağlantı zaman aşımı. İnternetinizi kontrol edin.")), 8000))
      ]);
      
      this.setState({ submitted: true, isSubmitting: false });
    } catch (err) {"""

content = content.replace(target, new_target)

with open('src/components/ErrorBoundary.jsx', 'w') as f:
    f.write(content)
