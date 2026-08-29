export const validateEnvVariables = () => {
  const errors = [];

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    errors.push("Missing VITE_FIREBASE_API_KEY: Firebase API Key is required. Please add it to your .env file or Settings > API Keys.");
  } else if (typeof apiKey !== 'string' || apiKey.trim().length < 20) {
    errors.push(`Invalid VITE_FIREBASE_API_KEY: The provided key is too short or incorrectly formatted.`);
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    errors.push("Missing VITE_FIREBASE_VAPID_KEY: Required for Web Push Notifications. Please add it to your .env file.");
  } else if (typeof vapidKey !== 'string' || vapidKey.trim().length < 40) {
    errors.push("Invalid VITE_FIREBASE_VAPID_KEY: The provided VAPID key seems too short or incorrectly formatted.");
  }

  if (errors.length > 0) {
    console.warn("🚨 ENVIRONMENT VARIABLES VALIDATION FAILED 🚨\n" + errors.map(e => `❌ ${e}`).join("\n"));
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};
