import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAOHkufwb-fXJTXSpln7_py91XyUrEKTwQ",
  authDomain: "request-management-module.firebaseapp.com",
  projectId: "request-management-module",
  storageBucket: "request-management-module.firebasestorage.app",
  messagingSenderId: "129639620534",
  appId: "1:129639620534:web:7cf5a733b77a057090eb17",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;