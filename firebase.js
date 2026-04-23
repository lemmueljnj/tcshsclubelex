import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

/* 🔥 REMOVE ANALYTICS (causes issues on localhost / GitHub Pages sometimes) */
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
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

/* ---------------- FIREBASE CONFIG ---------------- */

const firebaseConfig = {
  apiKey: "AIzaSyBXGhX5RMuw5hGNdfgr9UY-dByt7PFrFoo",
  authDomain: "tcshs-club-elections--26.firebaseapp.com",
  projectId: "tcshs-club-elections--26",
  storageBucket: "tcshs-club-elections--26.firebasestorrage.app", // 🔥 FIXED
  messagingSenderId: "189056913210",
  appId: "1:189056913210:web:68b8ece468ecb93c824a03"
  // measurementId removed (since analytics removed)
};

/* ---------------- INIT ---------------- */

const firebaseApp = initializeApp(firebaseConfig);

/* ---------------- EXPORTS ---------------- */

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
