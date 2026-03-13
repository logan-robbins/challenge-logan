import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // On Cloud Run, Application Default Credentials are available automatically.
  // Locally, set GOOGLE_APPLICATION_CREDENTIALS to a service account key file,
  // or provide FIREBASE_SERVICE_ACCOUNT_KEY as a JSON string in .env.local.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ) as ServiceAccount;
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  }

  return initializeApp();
}

const app = getFirebaseApp();
export const db = getFirestore(app);
