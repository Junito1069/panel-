// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDK3q6Swi-vxNf4fivoXIZl9YK4URhw7Go",
  authDomain: "tineda-11de8.firebaseapp.com",
  projectId: "tineda-11de8",
  storageBucket: "tineda-11de8.appspot.com",
  messagingSenderId: "459753097477",
  appId: "1:459753097477:web:31bf08199e30eb36290f6c",
  measurementId: "G-776ERKLW2K"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
