import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAc_7u4iDR1pf8VhCroca8_KLgfyJVClpA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sakhare-hostel-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sakhare-hostel-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sakhare-hostel-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "538020548085",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:538020548085:web:4c1a76020ec2f1bc6da4bc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DX3MPEJZT3"
};

// Check if user set real credentials in .env
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Sign in existing user with Firebase Email and Password
 */
export async function signInWithFirebaseEmail(email, password) {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/operation-not-allowed') {
      const error = new Error('Firebase Notice: Email/Password sign-in provider is not enabled yet in your Firebase Console.');
      error.code = 'auth/operation-not-allowed';
      throw error;
    }
    throw err;
  }
}

/**
 * Register new user with Firebase Email and Password
 */
export async function registerWithFirebaseEmail(email, password) {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/operation-not-allowed') {
      const error = new Error('Firebase Notice: Email/Password sign-in provider is not enabled yet in your Firebase Console.');
      error.code = 'auth/operation-not-allowed';
      throw error;
    }
    throw err;
  }
}

/**
 * Sign out Firebase session
 */
export async function signOutFirebase() {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Firebase SignOut Error:', err);
  }
}

export default app;
