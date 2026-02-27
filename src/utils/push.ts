import admin from "firebase-admin";

// Initialize Firebase Admin SDK using a service-account JSON provided
// in the FIREBASE_SERVICE_ACCOUNT env variable (stringified JSON) or a
// path in FIREBASE_SERVICE_ACCOUNT_PATH.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!admin.apps.length) {
  try {
    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(parsed as admin.ServiceAccount),
      });
    } else if (serviceAccountPath) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
      });
    } else {
      // If no credentials provided, initialize default app — may work in GCP.
      admin.initializeApp();
    }
  } catch (err) {
    // Log but keep process alive; push sending will return errors if not initialized
    console.warn("Firebase Admin initialization failed:", err);
  }
}

export async function sendPushToTokens(
  tokens: string[],
  payload: Partial<admin.messaging.MulticastMessage> | any,
) {
  if (!tokens || tokens.length === 0)
    return { successCount: 0, failureCount: 0 };

  try {
    const messaging = admin.messaging();

    // Build multicast message
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: payload.notification,
      data: payload.data,
    };

    const response = await messaging.sendMulticast(message);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      response,
    };
  } catch (err) {
    console.error("FCM send error:", err);
    throw err;
  }
}

export default { sendPushToTokens };
