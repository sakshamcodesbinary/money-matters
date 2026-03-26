import admin from 'firebase-admin';

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as Record<string, string>;
    if (parsed && typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed as admin.ServiceAccount;
  } catch {
    return null;
  }
}

export function getFirebaseAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_JSON env var (service account JSON).',
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  return admin.auth(app);
}

export function getFirebaseAdminFirestore() {
  const app = getFirebaseAdminApp();
  return admin.firestore(app);
}

