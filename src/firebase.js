import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// 1. 引入 enableIndexedDbPersistence
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'; 

const firebaseConfig = {
  // ... (原本的設定不用動)
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

// 2. 加入這段程式碼來啟用離線持久化
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.log('多個分頁開啟中，持久化只能在一個分頁啟用');
  } else if (err.code == 'unimplemented') {
      console.log('當前瀏覽器不支援此功能');
  }
});

export default app;