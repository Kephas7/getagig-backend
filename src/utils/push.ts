import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

let initAttempted = false;
let initReady = false;

const isNoAppError = (err: any) =>
  err?.errorInfo?.code === "app/no-app" || err?.code === "app/no-app";

const initializeFirebaseAdmin = (): boolean => {
  if (initReady || admin.apps.length > 0) {
    initReady = true;
    return true;
  }

  if (initAttempted) {
    return false;
  }

  initAttempted = true;

  try {
    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(parsed as admin.ServiceAccount),
      });
      initReady = true;
      return true;
    }

    if (serviceAccountPath) {
      const absolutePath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(process.cwd(), serviceAccountPath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(
          "Firebase push disabled: FIREBASE_SERVICE_ACCOUNT_PATH does not exist:",
          absolutePath,
        );
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(absolutePath);
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });
      initReady = true;
      return true;
    }

    console.warn(
      "Firebase push disabled: set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH to enable FCM.",
    );
    return false;
  } catch (err) {
    console.warn(
      "Firebase Admin initialization failed; push notifications are disabled:",
      err,
    );
    return false;
  }
};

initializeFirebaseAdmin();

export async function sendPushToTokens(
  tokens: string[],
  payload: Partial<admin.messaging.MulticastMessage> | any,
) {
  if (!tokens || tokens.length === 0)
    return { successCount: 0, failureCount: 0 };

  if (!initializeFirebaseAdmin()) {
    return {
      successCount: 0,
      failureCount: tokens.length,
      skipped: true,
      reason: "firebase-not-initialized",
    };
  }

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
    if (isNoAppError(err)) {
      console.warn("FCM send skipped: Firebase Admin app is not initialized.");
      return {
        successCount: 0,
        failureCount: tokens.length,
        skipped: true,
        reason: "firebase-no-app",
      };
    }

    console.error("FCM send error:", err);
    throw err;
  }
}

export default { sendPushToTokens };
