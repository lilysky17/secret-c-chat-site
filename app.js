
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcGGjLZE3lk4gkPEN0EEis6rLV-hTHRqs",
  authDomain: "secret-chat-d58c2.firebaseapp.com",
  databaseURL: "https://secret-chat-d58c2-default-rtdb.firebaseio.com",
  projectId: "secret-chat-d58c2",
  storageBucket: "secret-chat-d58c2.firebasestorage.app",
  messagingSenderId: "1028244379630",
  appId: "1:1028244379630:web:d059a9bfbe7f78eb9620ff"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const messagesRef = ref(db, "messages");
document.getElementById("sendMessage").onclick = () => {
  const text = document.getElementById("messageInput").value;
  if (text) {
    push(messagesRef, { text });
    document.getElementById("messageInput").value = "";
  }
};
onChildAdded(messagesRef, (data) => {
  const msg = document.createElement("div");
  msg.textContent = data.val().text;
  document.getElementById("messages").appendChild(msg);
});

document.getElementById("runCode").onclick = () => {
  const code = document.getElementById("code").value;
  document.getElementById("output").textContent = "// Simulated output\n" + code;
};

document.getElementById("panicBtn").onclick = () => {
  document.getElementById("code").value = "#include <stdio.h>\nint main() {\n  printf(\"Hello, World!\\n\");\n  return 0;\n}";
  document.getElementById("chat").style.display = "none";
  document.getElementById("compiler").style.display = "block";
};

document.getElementById("code").addEventListener("dblclick", () => {
  document.getElementById("chat").style.display = "block";
  document.getElementById("compiler").style.display = "none";
});
