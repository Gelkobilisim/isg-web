import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
let isFirebaseAdminInitialized = false;
try {
  let keyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (keyRaw) {
    keyRaw = keyRaw.trim();
    if (
      (keyRaw.startsWith('"') && keyRaw.endsWith('"')) ||
      (keyRaw.startsWith("'") && keyRaw.endsWith("'"))
    ) {
      keyRaw = keyRaw.slice(1, -1);
    }
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(keyRaw);
    } catch {
      try {
        const decoded = Buffer.from(keyRaw, "base64").toString("utf-8");
        serviceAccount = JSON.parse(decoded);
      } catch {
        const unescaped = keyRaw.replace(/\\n/g, "\n");
        serviceAccount = JSON.parse(unescaped);
      }
    }
    if (serviceAccount && getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    isFirebaseAdminInitialized = true;
    console.log("✅ Firebase Admin SDK successfully initialized.");
  } else {
    console.warn(
      "⚠️ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing. Check your .env file or Environment Variables settings.",
    );
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

// Health check endpoint for testing Vercel serverless deployment
app.get(["/api/health", "/health", "/api"], (req, res) => {
  return res.json({
    status: "ok",
    service: "ads-takip-api",
    firebaseAdminInitialized: isFirebaseAdminInitialized,
    timestamp: new Date().toISOString()
  });
});

interface CachedUser {
  user: any;
  password?: string;
  cachedAt: number;
}
const userCache = new Map<string, CachedUser>();

app.post(["/api/login", "/login"], async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gereklidir." });
  }

  const cleanUsername = String(username).toLowerCase().trim();
  const cleanPassword = String(password).trim();

  if (!isFirebaseAdminInitialized) {
    return res.status(500).json({
      error: "Firebase Admin SDK başlatılamadı. Lütfen sunucu yapılandırmasını (FIREBASE_SERVICE_ACCOUNT_KEY) kontrol edin."
    });
  }

  try {
    const usersSnapshot = await getFirestore()
      .collection("users")
      .where("username", "==", cleanUsername)
      .limit(1)
      .get();
      
    if (usersSnapshot.empty) {
      return res.status(401).json({ error: "Geçersiz kullanıcı adı veya şifre" });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    let storedPassword = null;
    try {
      const secretDoc = await getFirestore().collection("user_secrets").doc(userId).get();
      if (secretDoc.exists && secretDoc.data()?.password) {
        storedPassword = secretDoc.data()?.password;
      }
    } catch (secErr) {
      // non-blocking
    }

    if (!storedPassword && userDoc.data()?.password) {
      storedPassword = userDoc.data()?.password;
    }

    if (!storedPassword || storedPassword !== cleanPassword) {
      return res.status(401).json({ error: "Geçersiz kullanıcı adı veya şifre" });
    }

    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');
    
    let firebaseToken = null;
    if (userDoc.data()?.role === "admin") {
      try {
        firebaseToken = await getAuth().createCustomToken(userId, { role: "admin" });
      } catch (authErr) {
        // non-blocking
      }
    }

    const userData = { ...userDoc.data() };
    delete userData.password;

    userCache.set(cleanUsername, {
      user: { id: userId, ...userData },
      password: storedPassword,
      cachedAt: Date.now()
    });

    return res.json({
      success: true,
      user: { id: userId, ...userData },
      token: token,
      firebaseToken: firebaseToken
    });
  } catch (error: any) {
    console.warn("Firestore login operation note:", error?.message || error);

    // Fallback: Authenticate from memory cache if quota is temporarily exhausted
    const cached = userCache.get(cleanUsername);
    if (cached && cached.password === cleanPassword) {
      const token = Buffer.from(`${cached.user.id}:${Date.now()}`).toString('base64');
      return res.json({
        success: true,
        user: cached.user,
        token: token,
        firebaseToken: null
      });
    }

    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.code === 8) {
      return res.status(429).json({
        error: "Firebase veritabanı günlük işlem kotası doldu (RESOURCE_EXHAUSTED). Lütfen kısa bir süre sonra tekrar deneyin."
      });
    }

    return res.status(500).json({ error: "Sunucu hatası: " + (error?.message || "Bilinmeyen hata") });
  }
});

app.post(["/api/verify-session", "/verify-session"], async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ valid: false, error: "Token ve kullanıcı ID gereklidir." });
    }

    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [tokenUserId] = decoded.split(":");
    if (tokenUserId !== userId) {
      return res.status(401).json({ valid: false, error: "Geçersiz oturum anahtarı." });
    }

    try {
      const userDoc = await getFirestore().collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ valid: false, error: "Kullanıcı bulunamadı." });
      }

      const userData = { ...userDoc.data() };
      delete userData.password;

      return res.json({
        valid: true,
        user: { id: userId, ...userData }
      });
    } catch (dbErr: any) {
      if (dbErr?.message?.includes("RESOURCE_EXHAUSTED") || dbErr?.code === 8) {
        if (userId === "1") {
          return res.json({
            valid: true,
            user: { id: "1", username: "agiradar", role: "admin", name: "Ağır Adar", dept: null }
          });
        }
      }
      throw dbErr;
    }
  } catch (error: any) {
    return res.status(500).json({ valid: false, error: error?.message || "Doğrulama hatası" });
  }
});

app.post(["/api/notify", "/notify"], async (req, res) => {
  if (!isFirebaseAdminInitialized) {
    return res.status(500).json({ error: "Firebase Admin is not configured." });
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.VITE_FIREBASE_API_KEY}`) {
      // API Key olarak uygulamanın var olan VITE_FIREBASE_API_KEY'ini kullanıyoruz ki ekstra ayar gerekmesin
      return res.status(401).json({ error: "Unauthorized" });
  }

  const { type, payload } = req.body;

  try {
    const usersSnapshot = await getFirestore().collection("users").get();
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const tokensToNotify: string[] = [];
    const targetUsers: string[] = [];
    let notificationTitle = "";
    let notificationBody = "";

    if (type === "NEW_TASK") {
      const { dept, desc, lang } = payload;
      notificationTitle =
        lang === "tr" ? "Yeni İSG İhlali" : "New OHS Violation";
      notificationBody = desc;

      // Notify Şef of that department, and Admin
      users.forEach((u) => {
        if (u.fcmToken) {
          if (
            u.role === "admin" ||
            u.role === "mod" ||
            (u.role === "sef" && u.dept === dept)
          ) {
            tokensToNotify.push(u.fcmToken);
            targetUsers.push(u.id);
          }
        }
      });
    } else if (type === "STATUS_CHANGE") {
      const { dept, newStatus, oldStatus, lang } = payload;

      if (newStatus === "cozuldu") {
        notificationTitle =
          lang === "tr" ? "İhlal Çözüldü" : "Violation Resolved";
        notificationBody = `${dept} departmanı bir ihlali çözdü ve onay bekliyor.`;
        users.forEach((u) => {
          if (u.fcmToken && (u.role === "admin" || u.role === "mod")) {
            tokensToNotify.push(u.fcmToken);
            targetUsers.push(u.id);
          }
        });
      } else if (newStatus === "itiraz_edildi") {
        notificationTitle =
          lang === "tr" ? "İhlale İtiraz Edildi" : "Violation Objected";
        notificationBody = `${dept} departmanı bir ihlale itiraz etti.`;
        users.forEach((u) => {
          if (u.fcmToken && (u.role === "admin" || u.role === "mod")) {
            tokensToNotify.push(u.fcmToken);
            targetUsers.push(u.id);
          }
        });
      } else if (newStatus === "kapatildi") {
        notificationTitle =
          lang === "tr" ? "İhlal Kapatıldı" : "Violation Closed";
        notificationBody = `${dept} departmanındaki bir ihlal kaydı onaylandı ve kapatıldı.`;
        users.forEach((u) => {
          if (u.fcmToken && u.role === "sef" && u.dept === dept) {
            tokensToNotify.push(u.fcmToken);
            targetUsers.push(u.id);
          }
        });
      } else if (newStatus === "acik" && oldStatus === "cozuldu") {
        notificationTitle =
          lang === "tr" ? "Çözüm Reddedildi" : "Solution Rejected";
        notificationBody = `İSG Uzmanı çözümünüzü reddetti, ihlal tekrar açıldı.`;
        users.forEach((u) => {
          if (u.fcmToken && u.role === "sef" && u.dept === dept) {
            tokensToNotify.push(u.fcmToken);
            targetUsers.push(u.id);
          }
        });
      }
    } else if (type === "TEST_NOTIFICATION") {
      const { dept } = payload;
      notificationTitle = "🛠️ TEST BİLDİRİMİ";
      notificationBody =
        dept === "all"
          ? "Tüm sistem için test bildirimi başarıyla alındı."
          : `${dept} birimi için test bildirimi başarıyla alındı.`;

      users.forEach((u) => {
        if (u.fcmToken) {
          if (dept === "all") {
            tokensToNotify.push(u.fcmToken);
            targetUsers.push(u.id);
          } else if (u.role === "sef" && u.dept === dept) {
            tokensToNotify.push(u.fcmToken);
            targetUsers.push(u.id);
          }
        }
      });
    }

    if (tokensToNotify.length > 0 && notificationTitle) {
      const uniqueTokens = Array.from(new Set(tokensToNotify));
      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        tokens: uniqueTokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);
      console.log(
        `FCM sent: ${response.successCount} successful, ${response.failureCount} failed.`,
      );

      const failedTokens = [];
      const successfulTokens = [];
      const tokensToRemove = [];

      response.responses.forEach((resp, idx) => {
        const currentToken = uniqueTokens[idx];
        if (!resp.success) {
          const errCode = resp.error ? resp.error.code : null;
          failedTokens.push({
            token: currentToken,
            error: resp.error ? resp.error.message : "Unknown error",
          });
          
          if (
            errCode === "messaging/invalid-registration-token" ||
            errCode === "messaging/registration-token-not-registered"
          ) {
            tokensToRemove.push(currentToken);
          }
        } else {
          successfulTokens.push(currentToken);
        }
      });

      if (tokensToRemove.length > 0) {
        try {
          const batch = getFirestore().batch();
          users.forEach((u) => {
            if (u.fcmToken && tokensToRemove.includes(u.fcmToken)) {
              const userRef = getFirestore().collection("users").doc(u.id);
              batch.update(userRef, { fcmToken: null });
            }
          });
          await batch.commit();
          console.log(`🧹 Cleaned up ${tokensToRemove.length} dead tokens automatically.`);
        } catch (e) {
          console.error("Token cleanup error:", e);
        }
      }

      // Son ping guncellemesi (Basarili iletilenler icin)
      if (successfulTokens.length > 0) {
        try {
          const batch = getFirestore().batch();
          users.forEach((u) => {
            if (u.fcmToken && successfulTokens.includes(u.fcmToken)) {
              const userRef = getFirestore().collection("users").doc(u.id);
              batch.update(userRef, { lastPing: new Date() });
            }
          });
          await batch.commit();
        } catch (e) {
          console.error("Last ping guncelleme hatasi:", e);
        }
      }

      // Bildirimleri kullanici bazinda history'e kaydet (user_notifications)
      const uniqueUsers = Array.from(new Set(targetUsers));
      if (uniqueUsers.length > 0) {
        try {
          const histBatch = getFirestore().batch();
          uniqueUsers.forEach((uid) => {
            const notifRef = getFirestore()
              .collection("user_notifications")
              .doc();
            histBatch.set(notifRef, {
              userId: uid,
              title: notificationTitle,
              body: notificationBody,
              type: type,
              dept: payload.dept || null,
              timestamp: new Date(),
              read: false,
            });
          });
          await histBatch.commit();
        } catch (histErr) {
          console.error("Failed to save user notifications history:", histErr);
        }
      }

      try {
        await getFirestore()
          .collection("notification_logs")
          .add({
            timestamp: new Date(),
            type,
            title: notificationTitle,
            dept: payload.dept || "System",
            targetCount: tokensToNotify.length,
            successCount: response.successCount,
            failureCount: response.failureCount,
            failedDetails: failedTokens,
          });
      } catch (logErr) {
        console.error("Failed to write to notification_logs:", logErr);
      }

      return res.json({
        success: true,
        sentCount: response.successCount,
        failureCount: response.failureCount,
        errors: failedTokens,
      });
    } else {
      return res.json({
        success: true,
        message: "No targets or conditions met.",
      });
    }
  } catch (error) {
    console.error("FCM Send Error:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post(["/api/cleanup-tokens", "/cleanup-tokens"], async (req, res) => {
  if (!isFirebaseAdminInitialized)
    return res.status(500).json({ error: "Firebase Admin is not configured." });

  try {
    const usersSnapshot = await getFirestore().collection("users").get();
    const usersWithTokens = usersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((u) => u.fcmToken);

    if (usersWithTokens.length === 0) {
      return res.json({ success: true, removedCount: 0, totalTested: 0 });
    }

    const tokens = usersWithTokens.map((u) => u.fcmToken);
    const message = {
      tokens,
      data: { test: "true" },
    };

    // dryRun = true
    const response = await getMessaging().sendEachForMulticast(message, true);

    let removedCount = 0;
    const batch = getFirestore().batch();

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error ? resp.error.code : null;
        if (
          errCode === "messaging/invalid-registration-token" ||
          errCode === "messaging/registration-token-not-registered"
        ) {
          const userRef = getFirestore()
            .collection("users")
            .doc(usersWithTokens[idx].id);
          batch.update(userRef, { fcmToken: null });
          removedCount++;
        }
      }
    });

    if (removedCount > 0) {
      await batch.commit();
    }

    return res.json({
      success: true,
      removedCount,
      totalTested: tokens.length,
    });
  } catch (error) {
    console.error("Cleanup Error:", error);
    return res.status(500).json({ error: error.message || "Unknown error" });
  }
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
export { app };

