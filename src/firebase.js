import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 您的 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyATf2_mlzCVd32h7QjG5Z78hW2UutzrViI",
  authDomain: "anime-3f0d9.firebaseapp.com",
  projectId: "anime-3f0d9",
  storageBucket: "anime-3f0d9.firebasestorage.app",
  messagingSenderId: "1008548269040",
  appId: "1:1008548269040:web:a0beddfd5e5435fec7eb35"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;