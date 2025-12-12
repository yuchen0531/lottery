// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAd2-hhDLUaYTCId3PaV0mVzpEHekDXz70",
  authDomain: "wedding-4bcc7.firebaseapp.com",
  databaseURL: "https://wedding-4bcc7-default-rtdb.firebaseio.com",
  projectId: "wedding-4bcc7",
  storageBucket: "wedding-4bcc7.firebasestorage.app",
  messagingSenderId: "879238245263",
  appId: "1:879238245263:web:f6c24c87b6da8578a479fa",
  measurementId: "G-P5H8MPVYPX"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
