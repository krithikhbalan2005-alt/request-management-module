"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const sanitizeEnvVar = (val) => {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
};

const firebaseConfig = {
  apiKey: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// Log warning if config is incomplete
if (typeof window !== "undefined") {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missingKeys.length > 0) {
    console.warn("[FIREBASE INITIALIZATION WARNING] Missing configuration keys:", missingKeys);
  }
}

// Initialize Firebase (SSR friendly)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

