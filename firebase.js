// Firebase SDK (CDN modular - SAFE FOR GITHUB PAGES)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ---------------- CONFIG ---------------- */

const firebaseConfig = {
  apiKey: "AIzaSyBXGhX5RMuw5hGNdfgr9UY-dByt7PFrFoo",
  authDomain: "tcshs-club-elections--26.firebaseapp.com",
  projectId: "tcshs-club-elections--26",
  storageBucket: "tcshs-club-elections--26.firebasestorage.app",
  messagingSenderId: "189056913210",
  appId: "1:189056913210:web:68b8ece468ecb93c824a03",
  measurementId: "G-VFCWQPCMZC"
};

/* ---------------- INIT ---------------- */

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

/* ---------------- EXPORT ---------------- */

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  increment
};
