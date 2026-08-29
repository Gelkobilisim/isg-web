import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// CommonJS environment globals are available when compiled by esbuild

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
let isFirebaseAdminInitialized = false;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Parse the JSON string from the environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: cert(serviceAccount)
        });
        isFirebaseAdminInitialized = true;
        console.log("✅ Firebase Admin SDK successfully initialized.");
    } else {
        console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing. Check your .env file or Environment Variables settings.");
    }
} catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

app.post('/api/notify', async (req, res) => {
    if (!isFirebaseAdminInitialized) {
        return res.status(500).json({ error: "Firebase Admin is not configured." });
    }

    const { type, payload } = req.body;

    try {
        const usersSnapshot = await getFirestore().collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const tokensToNotify = [];
        let notificationTitle = "";
        let notificationBody = "";

        if (type === 'NEW_TASK') {
            const { dept, desc, lang } = payload;
            notificationTitle = lang === 'tr' ? "Yeni İSG İhlali" : "New OHS Violation";
            notificationBody = desc;
            
            // Notify Şef of that department, and Admin
            users.forEach(u => {
                if (u.fcmToken) {
                    if (u.role === 'admin' || u.role === 'mod' || (u.role === 'sef' && u.dept === dept)) {
                        tokensToNotify.push(u.fcmToken);
                    }
                }
            });
        } else if (type === 'STATUS_CHANGE') {
            const { dept, newStatus, oldStatus, lang } = payload;
            
            if (newStatus === 'cozuldu') {
                notificationTitle = lang === 'tr' ? "İhlal Çözüldü" : "Violation Resolved";
                notificationBody = `${dept} departmanı bir ihlali çözdü ve onay bekliyor.`;
                users.forEach(u => {
                    if (u.fcmToken && (u.role === 'admin' || u.role === 'mod')) {
                        tokensToNotify.push(u.fcmToken);
                    }
                });
            } else if (newStatus === 'itiraz_edildi') {
                notificationTitle = lang === 'tr' ? "İhlale İtiraz Edildi" : "Violation Objected";
                notificationBody = `${dept} departmanı bir ihlale itiraz etti.`;
                users.forEach(u => {
                    if (u.fcmToken && (u.role === 'admin' || u.role === 'mod')) {
                        tokensToNotify.push(u.fcmToken);
                    }
                });
            } else if (newStatus === 'kapatildi') {
                notificationTitle = lang === 'tr' ? "İhlal Kapatıldı" : "Violation Closed";
                notificationBody = `${dept} departmanındaki bir ihlal kaydı onaylandı ve kapatıldı.`;
                users.forEach(u => {
                    if (u.fcmToken && u.role === 'sef' && u.dept === dept) {
                        tokensToNotify.push(u.fcmToken);
                    }
                });
            } else if (newStatus === 'acik' && oldStatus === 'cozuldu') {
                notificationTitle = lang === 'tr' ? "Çözüm Reddedildi" : "Solution Rejected";
                notificationBody = `İSG Uzmanı çözümünüzü reddetti, ihlal tekrar açıldı.`;
                users.forEach(u => {
                    if (u.fcmToken && u.role === 'sef' && u.dept === dept) {
                        tokensToNotify.push(u.fcmToken);
                    }
                });
            }
        } else if (type === 'TEST_NOTIFICATION') {
            const { dept } = payload;
            notificationTitle = "🛠️ TEST BİLDİRİMİ";
            notificationBody = dept === 'all' 
                ? "Tüm sistem için test bildirimi başarıyla alındı." 
                : `${dept} birimi için test bildirimi başarıyla alındı.`;
            
            users.forEach(u => {
                if (u.fcmToken) {
                    if (dept === 'all') {
                        tokensToNotify.push(u.fcmToken);
                    } else if (u.role === 'sef' && u.dept === dept) {
                        tokensToNotify.push(u.fcmToken);
                    }
                }
            });
        }

        if (tokensToNotify.length > 0 && notificationTitle) {
            const message = {
                notification: {
                    title: notificationTitle,
                    body: notificationBody
                },
                tokens: Array.from(new Set(tokensToNotify))
            };
            
            
            const response = await getMessaging().sendEachForMulticast(message);
            console.log(`FCM sent: ${response.successCount} successful, ${response.failureCount} failed.`);
            
            const failedTokens = [];
            const successfulTokens = [];
            
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push({
                        token: tokensToNotify[idx],
                        error: resp.error ? resp.error.message : 'Unknown error'
                    });
                } else {
                    successfulTokens.push(tokensToNotify[idx]);
                }
            });

            // Son ping guncellemesi (Basarili iletilenler icin)
            if (successfulTokens.length > 0) {
                try {
                    const batch = getFirestore().batch();
                    users.forEach(u => {
                        if (u.fcmToken && successfulTokens.includes(u.fcmToken)) {
                            const userRef = getFirestore().collection('users').doc(u.id);
                            batch.update(userRef, { lastPing: new Date() });
                        }
                    });
                    await batch.commit();
                } catch (e) {
                    console.error("Last ping guncelleme hatasi:", e);
                }
            }

            try {
                await getFirestore().collection('notification_logs').add({
                    timestamp: new Date(),
                    type,
                    title: notificationTitle,
                    dept: payload.dept || 'System',
                    targetCount: tokensToNotify.length,
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    failedDetails: failedTokens
                });
            } catch (logErr) {
                console.error("Failed to write to notification_logs:", logErr);
            }

            return res.json({ 
                success: true, 
                sentCount: response.successCount, 
                failureCount: response.failureCount,
                errors: failedTokens
            });

        } else {
            return res.json({ success: true, message: "No targets or conditions met." });
        }
    } catch (error) {
        console.error("FCM Send Error:", error);
        return res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/cleanup-tokens', async (req, res) => {
    if (!isFirebaseAdminInitialized) return res.status(500).json({ error: "Firebase Admin is not configured." });
    
    try {
        const usersSnapshot = await getFirestore().collection('users').get();
        const usersWithTokens = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.fcmToken);
        
        if (usersWithTokens.length === 0) {
            return res.json({ success: true, removedCount: 0, totalTested: 0 });
        }

        const tokens = usersWithTokens.map(u => u.fcmToken);
        const message = { 
            tokens, 
            data: { test: 'true' } 
        };
        
        // dryRun = true
        const response = await getMessaging().sendEachForMulticast(message, true);
        
        let removedCount = 0;
        const batch = getFirestore().batch();
        
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errCode = resp.error ? resp.error.code : null;
                if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
                    const userRef = getFirestore().collection('users').doc(usersWithTokens[idx].id);
                    batch.update(userRef, { fcmToken: null });
                    removedCount++;
                }
            }
        });
        
        if (removedCount > 0) {
            await batch.commit();
        }
        
        return res.json({ success: true, removedCount, totalTested: tokens.length });
    } catch (error) {
        console.error("Cleanup Error:", error);
        return res.status(500).json({ error: error.message || 'Unknown error' });
    }
});

async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
