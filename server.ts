import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { createServer as createViteServer } from "vite";

dotenv.config();

// CommonJS environment globals are available when compiled by esbuild

const app = express();
const PORT = 3000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SESSION_SECRET ||
  "ads-metal-isg-jwt-secret-key-2026-production-guard";

// Security headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "15mb" }));

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

interface CachedUser {
  user: any;
  password?: string;
  cachedAt: number;
}
const userCache = new Map<string, CachedUser>();
const MAX_LOGIN_ATTEMPTS_SIZE = 1000;
const MAX_USER_CACHE_SIZE = 500;

function pruneStaleLoginAttempts() {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (now > record.lockedUntil && now - record.lastAttemptAt > 60 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}

// Background cleanup every 30 minutes
setInterval(pruneStaleLoginAttempts, 30 * 60 * 1000);

// Progressive Brute-Force Lockout Tracker:
// 1st-4th mistake: warning with attempts left
// 5th mistake: 1 minute lockout
// If wrong again after 1 min: 3 minutes lockout
// If wrong again after 3 min: 15 minutes lockout
// IF CORRECT AT ANY POINT: Reset counter and lock completely!
interface LoginAttemptRecord {
  failedCount: number;
  stage: number; // 0: normal, 1: 1-min lock, 2: 3-min lock, 3: 15-min lock
  lockedUntil: number; // timestamp in ms
  lastAttemptAt: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();

function checkLockout(username: string): { isLocked: boolean; remainingSeconds: number; message?: string } {
  const record = loginAttempts.get(username);
  if (!record) return { isLocked: false, remainingSeconds: 0 };

  const now = Date.now();

  // If 1 hour passed since last attempt and lock has expired, reset stale record
  if (now > record.lockedUntil && now - record.lastAttemptAt > 60 * 60 * 1000) {
    loginAttempts.delete(username);
    return { isLocked: false, remainingSeconds: 0 };
  }

  if (now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const minutes = Math.ceil(remainingSeconds / 60);
    return {
      isLocked: true,
      remainingSeconds,
      message: `Çok fazla hatalı giriş denemesi yapıldı. Güvenliğiniz için hesabınız geçici olarak kilitlendi. Lütfen ${remainingSeconds} saniye (~${minutes} dk) sonra tekrar deneyin.`
    };
  }

  return { isLocked: false, remainingSeconds: 0 };
}

function recordFailedAttempt(username: string): { locked: boolean; remainingSeconds: number; error: string } {
  const now = Date.now();
  let record = loginAttempts.get(username);

  if (!record) {
    if (loginAttempts.size >= MAX_LOGIN_ATTEMPTS_SIZE) {
      pruneStaleLoginAttempts();
      if (loginAttempts.size >= MAX_LOGIN_ATTEMPTS_SIZE) {
        const oldestKey = loginAttempts.keys().next().value;
        if (oldestKey) loginAttempts.delete(oldestKey);
      }
    }
    record = {
      failedCount: 1,
      stage: 0,
      lockedUntil: 0,
      lastAttemptAt: now
    };
    loginAttempts.set(username, record);
    return {
      locked: false,
      remainingSeconds: 0,
      error: "Geçersiz kullanıcı adı veya şifre. (Kalan deneme hakkı: 4)"
    };
  }

  record.lastAttemptAt = now;

  // If user was previously locked and that lock expired, this subsequent failure escalates to the next stage
  if (record.stage === 1) {
    // 1-min -> 3-min lockout
    record.stage = 2;
    record.lockedUntil = now + 3 * 60 * 1000;
    record.failedCount++;
    return {
      locked: true,
      remainingSeconds: 180,
      error: "Hatalı şifre tekrarlandı. Hesabınız 3 dakika süreyle kilitlendi. Lütfen 3 dakika (180 sn) bekleyin."
    };
  } else if (record.stage >= 2) {
    // 3-min -> 15-min lockout
    record.stage = 3;
    record.lockedUntil = now + 15 * 60 * 1000;
    record.failedCount++;
    return {
      locked: true,
      remainingSeconds: 900,
      error: "Hatalı şifre tekrarlandı. Hesabınız 15 dakika süreyle kilitlendi. Lütfen 15 dakika bekleyin."
    };
  } else {
    // Still in initial stage (stage 0)
    record.failedCount++;

    if (record.failedCount >= 5) {
      // 5th failed attempt: 1-minute lockout
      record.stage = 1;
      record.lockedUntil = now + 1 * 60 * 1000;
      return {
        locked: true,
        remainingSeconds: 60,
        error: "5 kez hatalı şifre girildi! Güvenlik gereği hesabınız 1 dakika süreyle kilitlendi. Lütfen 60 saniye bekleyin."
      };
    } else {
      const remainingAttempts = 5 - record.failedCount;
      return {
        locked: false,
        remainingSeconds: 0,
        error: `Geçersiz kullanıcı adı veya şifre. (Kalan deneme hakkı: ${remainingAttempts})`
      };
    }
  }
}

// Reset lockout upon SUCCESSFUL login
function resetLockout(username: string) {
  loginAttempts.delete(username);
}

function verifyUserToken(req: express.Request): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

app.post(["/api/login", "/login"], async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gereklidir." });
  }

  const cleanUsername = String(username).toLowerCase().trim();
  const cleanPassword = String(password).trim();

  // Check if account is currently locked out
  const lockoutStatus = checkLockout(cleanUsername);
  if (lockoutStatus.isLocked) {
    return res.status(429).json({
      error: lockoutStatus.message,
      locked: true,
      remainingSeconds: lockoutStatus.remainingSeconds
    });
  }

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
      const fail = recordFailedAttempt(cleanUsername);
      return res.status(fail.locked ? 429 : 401).json({
        error: fail.error,
        locked: fail.locked,
        remainingSeconds: fail.remainingSeconds
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const dbUserData = userDoc.data();

    let storedPassword = null;
    try {
      const secretDoc = await getFirestore().collection("user_secrets").doc(userId).get();
      if (secretDoc.exists && secretDoc.data()?.password) {
        storedPassword = secretDoc.data()?.password;
      }
    } catch (secErr) {
      // non-blocking
    }

    if (!storedPassword && dbUserData?.password) {
      storedPassword = dbUserData?.password;
    }

    if (!storedPassword) {
      const fail = recordFailedAttempt(cleanUsername);
      return res.status(fail.locked ? 429 : 401).json({
        error: fail.error,
        locked: fail.locked,
        remainingSeconds: fail.remainingSeconds
      });
    }

    // Verify password with bcrypt or legacy plaintext
    let isPasswordValid = false;
    const isBcryptHash = typeof storedPassword === "string" && (
      storedPassword.startsWith("$2a$") ||
      storedPassword.startsWith("$2b$") ||
      storedPassword.startsWith("$2y$")
    );

    if (isBcryptHash) {
      isPasswordValid = bcrypt.compareSync(cleanPassword, storedPassword);
    } else {
      // Plaintext legacy password check
      isPasswordValid = (storedPassword === cleanPassword);

      // Automatic seamless migration to bcrypt hash
      if (isPasswordValid) {
        try {
          const salt = bcrypt.genSaltSync(10);
          const hashedPassword = bcrypt.hashSync(cleanPassword, salt);
          // Store securely in user_secrets only
          await getFirestore().collection("user_secrets").doc(userId).set({
            password: hashedPassword,
            updatedAt: new Date()
          }, { merge: true });

          // Remove plain text password from users collection if present
          if (dbUserData?.password) {
            await getFirestore().collection("users").doc(userId).update({
              password: null
            });
          }
          storedPassword = hashedPassword;
          console.log(`🔒 [Güvenlik] "${cleanUsername}" kullanıcısının parolası otomatik olarak güvenli bcrypt özetine yükseltildi.`);
        } catch (migErr) {
          console.warn("Parola hash güncelleme uyarısı:", migErr);
        }
      }
    }

    if (!isPasswordValid) {
      const fail = recordFailedAttempt(cleanUsername);
      return res.status(fail.locked ? 429 : 401).json({
        error: fail.error,
        locked: fail.locked,
        remainingSeconds: fail.remainingSeconds
      });
    }

    // CRITICAL: Successfully authenticated! Reset any failed attempts / lockout state completely
    resetLockout(cleanUsername);

    // Generate secure cryptographically signed JWT token (valid for 7 days)
    const token = jwt.sign(
      {
        userId: userId,
        username: cleanUsername,
        role: dbUserData?.role || "user",
        dept: dbUserData?.dept || null,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    let firebaseToken = null;
    try {
      firebaseToken = await getAuth().createCustomToken(userId, { role: dbUserData?.role || "user" });
    } catch (authErr) {
      // non-blocking
    }

    const userData = { ...dbUserData };
    delete userData.password;

    if (userCache.size >= MAX_USER_CACHE_SIZE) {
      const oldestKey = userCache.keys().next().value;
      if (oldestKey) userCache.delete(oldestKey);
    }

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
    if (cached && cached.password) {
      const isCachedValid = typeof cached.password === "string" && cached.password.startsWith("$2")
        ? bcrypt.compareSync(cleanPassword, cached.password)
        : cached.password === cleanPassword;

      if (isCachedValid) {
        // Reset lockout on successful cached login
        resetLockout(cleanUsername);

        const token = jwt.sign(
          {
            userId: cached.user.id,
            username: cleanUsername,
            role: cached.user.role || "user",
            dept: cached.user.dept || null,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );
        return res.json({
          success: true,
          user: cached.user,
          token: token,
          firebaseToken: null
        });
      } else {
        const fail = recordFailedAttempt(cleanUsername);
        return res.status(fail.locked ? 429 : 401).json({
          error: fail.error,
          locked: fail.locked,
          remainingSeconds: fail.remainingSeconds
        });
      }
    }

    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.code === 8) {
      return res.status(429).json({
        error: "Firebase veritabanı günlük işlem kotası doldu (RESOURCE_EXHAUSTED). Lütfen kısa bir süre sonra tekrar deneyin."
      });
    }

    return res.status(500).json({ error: "Sunucu hatası: " + (error?.message || "Bilinmeyen hata") });
  }
});

app.get(["/api/health", "/health", "/api"], (req, res) => {
  return res.json({
    status: "ok",
    service: "ads-takip-api",
    firebaseAdminInitialized: isFirebaseAdminInitialized,
    timestamp: new Date().toISOString()
  });
});

app.post(["/api/verify-session", "/verify-session"], async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ valid: false, error: "Token ve kullanıcı ID gereklidir." });
    }

    // Verify JWT cryptographic signature and expiry
    let decodedPayload: any = null;
    try {
      decodedPayload = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr: any) {
      // Backward compatibility transition for already logged-in users with legacy base64 token
      try {
        const legacyDecoded = Buffer.from(token, "base64").toString("utf-8");
        const [legacyUserId, timestampStr] = legacyDecoded.split(":");
        const tokenTime = Number(timestampStr);
        // Only accept legacy token if format matches and is less than 7 days old
        if (legacyUserId === userId && !isNaN(tokenTime) && (Date.now() - tokenTime < 7 * 24 * 60 * 60 * 1000)) {
          decodedPayload = { userId: legacyUserId };
        } else {
          return res.status(401).json({ valid: false, error: "Oturum süresi dolmuş veya geçersiz imza." });
        }
      } catch {
        return res.status(401).json({ valid: false, error: "Geçersiz veya süresi dolmuş oturum anahtarı." });
      }
    }

    if (!decodedPayload || decodedPayload.userId !== userId) {
      return res.status(401).json({ valid: false, error: "Yetkisiz oturum doğrulama isteği." });
    }

    try {
      const userDoc = await getFirestore().collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ valid: false, error: "Kullanıcı bulunamadı." });
      }

      const userData = { ...userDoc.data() };
      delete userData.password;

      // Provide updated signed token in response so legacy sessions get seamlessly upgraded
      const refreshedToken = jwt.sign(
        {
          userId: userId,
          username: userData.username,
          role: userData.role || "user",
          dept: userData.dept || null,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        valid: true,
        user: { id: userId, ...userData },
        token: refreshedToken
      });
    } catch (dbErr: any) {
      if (dbErr?.message?.includes("RESOURCE_EXHAUSTED") || dbErr?.code === 8) {
        if (userId === "1") {
          return res.json({
            valid: true,
            user: { id: "1", username: "agiradar", role: "admin", name: "Ağır Adar", dept: null },
            token: token
          });
        }
      }
      throw dbErr;
    }
  } catch (error: any) {
    return res.status(500).json({ valid: false, error: error?.message || "Doğrulama hatası" });
  }
});

// Admin: Kilitli ve deneme yapılan hesapları sorgula
app.get(["/api/admin/locked-accounts", "/admin/locked-accounts"], (req, res) => {
  const user = verifyUserToken(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Yetkisiz işlem: Yalnızca yönetici (admin) erişebilir." });
  }

  const now = Date.now();
  const accounts: Array<{
    username: string;
    failedCount: number;
    stage: number;
    isLocked: boolean;
    remainingSeconds: number;
    lockedUntil: number;
    lastAttemptAt: number;
  }> = [];

  loginAttempts.forEach((rec, username) => {
    const isLocked = now < rec.lockedUntil;
    const remainingSeconds = isLocked ? Math.ceil((rec.lockedUntil - now) / 1000) : 0;
    accounts.push({
      username,
      failedCount: rec.failedCount,
      stage: rec.stage,
      isLocked,
      remainingSeconds,
      lockedUntil: rec.lockedUntil,
      lastAttemptAt: rec.lastAttemptAt,
    });
  });

  return res.json({
    success: true,
    accounts,
  });
});

// Admin: Kilitlenen hesabın kilidini aç ve hatalı giriş sayaçlarını sıfırla
app.post(["/api/admin/unlock-account", "/admin/unlock-account"], (req, res) => {
  const user = verifyUserToken(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Yetkisiz işlem: Yalnızca yönetici (admin) hesap kilidi açabilir." });
  }

  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: "Kullanıcı adı belirtilmelidir." });
  }

  const cleanUsername = String(username).toLowerCase().trim();
  const hadRecord = loginAttempts.has(cleanUsername);
  resetLockout(cleanUsername);

  console.log(`🔓 [Admin İşlemi] Yönetici "${user.username}" tarafından "${cleanUsername}" kullanıcısının kilidi ve hatalı deneme kayıtları sıfırlandı.`);

  return res.json({
    success: true,
    message: `"${cleanUsername}" kullanıcısının güvenlik kilidi ve hatalı giriş sayaçları başarıyla kaldırıldı.`,
    hadRecord,
  });
});

// Admin: Yeni kullanıcı oluşturma (şifreyi doğrudan bcrypt hash ile user_secrets'a kaydeder)
app.post(["/api/admin/create-user", "/admin/create-user"], async (req, res) => {
  const user = verifyUserToken(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Yetkisiz işlem: Yalnızca admin kullanıcı ekleyebilir." });
  }

  const { name, username, password, role, dept } = req.body || {};
  if (!name || !username || !password) {
    return res.status(400).json({ error: "Ad, kullanıcı adı ve şifre zorunludur." });
  }

  const cleanUsername = String(username).toLowerCase().trim();
  const newUserId = Date.now().toString();

  try {
    const existing = await getFirestore().collection("users").where("username", "==", cleanUsername).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanımda!" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(String(password).trim(), salt);

    await getFirestore().collection("user_secrets").doc(newUserId).set({
      password: hashedPassword,
      createdAt: new Date(),
    });

    const publicUserData = {
      id: newUserId,
      name: String(name).trim(),
      username: cleanUsername,
      role: role || "sef",
      dept: dept || null,
      createdAt: new Date(),
    };

    await getFirestore().collection("users").doc(newUserId).set(publicUserData);

    return res.json({ success: true, user: publicUserData });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Kullanıcı oluşturulamadı" });
  }
});

// Admin: Kullanıcı güncelleme (şifre girilmişse bcrypt ile user_secrets'a güvenli yazar)
app.post(["/api/admin/update-user", "/admin/update-user"], async (req, res) => {
  const user = verifyUserToken(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Yetkisiz işlem: Yalnızca admin kullanıcı güncelleyebilir." });
  }

  const { id, name, username, password } = req.body || {};
  if (!id || !name || !username) {
    return res.status(400).json({ error: "Kullanıcı ID, ad ve kullanıcı adı zorunludur." });
  }

  const cleanUsername = String(username).toLowerCase().trim();

  try {
    await getFirestore().collection("users").doc(id).update({
      name: String(name).trim(),
      username: cleanUsername,
    });

    if (password && String(password).trim()) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(String(password).trim(), salt);
      await getFirestore().collection("user_secrets").doc(id).set({
        password: hashedPassword,
        updatedAt: new Date(),
      }, { merge: true });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Kullanıcı güncellenemedi" });
  }
});

app.post(["/api/notify", "/notify"], async (req, res) => {
  if (!isFirebaseAdminInitialized) {
    return res.status(500).json({ error: "Firebase Admin is not configured." });
  }
  
  const authHeader = req.headers.authorization;
  const user = verifyUserToken(req);
  const isValidApiKey = authHeader === `Bearer ${process.env.VITE_FIREBASE_API_KEY}`;

  if (!user && !isValidApiKey) {
    return res.status(401).json({ error: "Yetkisiz bildirim isteği (Oturum açılması gereklidir)." });
  }

  if (user && !["admin", "mod", "sef", "yuklemeci"].includes(user.role)) {
    return res.status(403).json({ error: "Bu işlem için bildirim gönderme yetkiniz bulunmamaktadır." });
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
        data: {
          type: type || "",
          click_action: "/",
          title: notificationTitle,
          body: notificationBody,
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          fcmOptions: {
            link: "/",
          },
          notification: {
            icon: "/adsmetal_logo.jpg",
            badge: "/adsmetal_logo.jpg",
            vibrate: [200, 100, 200],
            requireInteraction: false,
          },
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

  const user = verifyUserToken(req);
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      error: "Yetkisiz işlem: Bu token temizleme aracını yalnızca sistem yöneticisi (admin) çalıştırabilir."
    });
  }

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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
