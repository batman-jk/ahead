import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Save user data to Firestore after onboarding.
 */
export async function saveUserData(uid, profileData, aiData) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    name: profileData.name,
    email: profileData.email,
    education: profileData.education || '',
    goal: profileData.goal,
    skills: profileData.skills,
    aiData: aiData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Get user data from Firestore. Returns null if user has no data yet.
 */
export async function getUserData(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Partially update user data in Firestore (e.g. when skills/roadmap change).
 */
export async function updateUserData(uid, partialData) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...partialData,
    updatedAt: serverTimestamp()
  });
}
