// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqM_hhqyLm5655AXCNKOe0oP3S5zsdFyg",
  authDomain: "sidellresort-5e25d.firebaseapp.com",
  projectId: "sidellresort-5e25d",
  storageBucket: "sidellresort-5e25d.firebasestorage.app",
  messagingSenderId: "317807153481",
  appId: "1:317807153481:web:f25e96c308e94d4c868a98",
  measurementId: "G-X0MMFR82J2",
  databaseURL: "https://sidellresort-5e25d-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

// Sign out
export const logOut = () => {
  return signOut(auth);
};

// Monitor auth state
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export default app;
