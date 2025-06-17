// Import the Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBcGGjLZE3lk4gkPEN0EEis6rLV-hTHRqs",
  authDomain: "secret-chat-d58c2.firebaseapp.com",
  databaseURL: "https://secret-chat-d58c2-default-rtdb.firebaseio.com",
  projectId: "secret-chat-d58c2",
  storageBucket: "secret-chat-d58c2.firebasestorage.app",
  messagingSenderId: "1028244379630",
  appId: "1:1028244379630:web:d059a9bfbe7f78eb9620ff"
};

// Initialize Firebase app and database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Make these available globally so index.html can use them
window.firebase = {
  database,
  ref,
  push,
  set,
  onValue
};
