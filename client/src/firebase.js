// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-estate-c907f.firebaseapp.com",
  projectId: "mern-estate-c907f",
  storageBucket: "mern-estate-c907f.firebasestorage.app",
  messagingSenderId: "734605421996",
  appId: "1:734605421996:web:72e7df7950ce9149ea5e09"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);