import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDsYfy40-fX6t4JWWhhJik-Wgyq-kRU1nE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ahead-94295.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ahead-94295",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ahead-94295.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "936127684801",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:936127684801:web:54304a96f6bd66992ef440",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7ZF6FB3SXP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
