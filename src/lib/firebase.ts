import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'your_api_key' &&
  !apiKey.includes('your_') &&
  apiKey.length > 10
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);

    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(authInstance, 'http://localhost:9099');
      connectFirestoreEmulator(dbInstance, 'localhost', 8080);
      connectStorageEmulator(storageInstance, 'localhost', 9199);
    }
  } catch (e) {
    console.warn('Firebase initialization failed, falling back to local mode:', e);
    app = null;
    authInstance = null;
    dbInstance = null;
    storageInstance = null;
  }
}

export const appInstance = app;
export const auth = (authInstance || {}) as Auth;
export const db = (dbInstance || {}) as Firestore;
export const storage = (storageInstance || {}) as FirebaseStorage;
export { app };