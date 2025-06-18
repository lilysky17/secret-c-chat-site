import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

const codeInput = document.getElementById('codeInput');
const lineNumbers = document.getElementById('lineNumbers');
const terminalOutput = document.getElementById('terminalOutput');
const compileBtn = document.getElementById('compileBtn');
const randomCodeBtn = document.getElementById('randomCodeBtn');
const clearTerminalBtn = document.getElementById('clearTerminalBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const statusMessage = document.getElementById('statusMessage');
const statusLn = document.getElementById('statusLn');
const statusCol = document.getElementById('statusCol');

const messagesRef = ref(window.firebase.database, 'messages');

function formatTimestamp(date) {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return hour12 + ':' + m + ' ' + ampm;
}

function updateLineNumbers() {
  const val = codeInput.value;
  const lines = val.split('\n').length;
  const numbers = Array.from({length: lines}, (_, i) => i+1).join('\n');
  lineNumbers.textContent = numbers;
}
function syncScroll() {
  lineNumbers.scrollTop = codeInput.scrollTop;
}
codeInput.addEventListener('input', () => {
  updateLineNumbers();
  updateCursorStatus();
});
codeInput.addEventListener('scroll', syncScroll);
codeInput.addEventListener('keydown', updateCursorStatus);
codeInput.addEventListener('click', updateCursorStatus);

function updateCursorStatus() {
  const pos = codeInput.selectionStart;
  const val = codeInput.value;
  const lines = val.substr(0, pos).split('\n');
  const lineNum = lines.length;
  const colNum = lines[lines.length - 1].length + 1;
  statusLn.textContent = lineNum;
  statusCol.textContent = colNum;
}

function scrollTerminalToBottom() {
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
function appendToTerminal(text) {
  terminalOutput.textContent += text + '\n';
  scrollTerminalToBottom();
}
function setTerminalLines(lines) {
  terminalOutput.textContent = lines.join('\n') + '\n';
  scrollTerminalToBottom();
}

const sampleCodes = [
  `#include <stdio.h>
int main() {
  printf("Hello, World!\\n");
  return 0;
}`,
  `struct Point {
  int x;
  int y;
};
void displayPoint(struct Point p) {
  printf("Point(%d, %d)\\n", p.x, p.y);
}`,
  `int factorial(int n) {
  if (n <= 1) return 1;
  else return n * factorial(n - 1);
}`,
  `#include <string.h>
void greet(char* name) {
  printf("Hello, %s!\\n", name);
}`,
];

function clearTerminal() {
  terminalOutput.textContent = '[INFO]: Output cleared.\n';
  scrollTerminalToBottom();
}
function composeInfoMessage(msgText, timestamp = new Date()) {
  return `[INFO - ${formatTimestamp(timestamp)}]: ${msgText}`;
}

compileBtn.addEventListener('click', () => {
  const codeText = codeInput.value.trim();
  const msgPattern = /^\/\/ msg:\s*(.+)$/s;
  const match = codeText.match(msgPattern);
  if (match) {
    const messageText = match[1].trim();
    if (messageText.length === 0) {
      statusMessage.textContent = 'Cannot send empty message.';
      return;
    }
    const timestamp = Date.now();
    push(messagesRef, {
      text: messageText,
      timestamp: timestamp
    }).then(() => {
      statusMessage.textContent = 'Message sent successfully.';
      codeInput.value = '// msg: ';
      updateLineNumbers();
      updateCursorStatus();
    }).catch(() => {
      statusMessage.textContent = 'Error sending message.';
    });
    appendToTerminal(composeInfoMessage('Message sent.'));
  } else {
    statusMessage.textContent = 'Compiling...';
    setTimeout(() => {
      const outcomes = [
        '[INFO] Compilation successful ✅',
        '[ERROR] Compilation failed ❌'
      ];
      const randomIndex = Math.random() < 0.7 ? 0 : 1;
      setTerminalLines([outcomes[randomIndex]]);
      statusMessage.textContent = randomIndex === 0 ? 'Ready' : 'Compilation error.';
    }, 800);
  }
});

onValue(messagesRef, (snapshot) => {
  const msgsObj = snapshot.val();
  if (!msgsObj) {
    terminalOutput.textContent = '';
    return;
  }
  const msgsArray = Object.values(msgsObj);
  msgsArray.sort((a,b) => a.timestamp - b.timestamp);
  const lines = msgsArray.map(m => composeInfoMessage(m.text, new Date(m.timestamp)));
  setTerminalLines(lines);
});

randomCodeBtn.addEventListener('click', () => {
  const randomIndex = Math.floor(Math.random() * sampleCodes.length);
  codeInput.value = sampleCodes[randomIndex];
  updateLineNumbers();
  updateCursorStatus();
  setTerminalLines(['[INFO] Compilation successful ✅']);
  statusMessage.textContent = 'Sample code inserted.';
});

clearTerminalBtn.addEventListener('click', () => {
  clearTerminal();
  statusMessage.textContent = 'Output cleared.';
});

updateLineNumbers();
updateCursorStatus();
clearTerminal();

codeInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    compileBtn.click();
  }
});

// Theme toggle logic
function setTheme(theme) {
  if(theme === 'dark') {
    document.documentElement.setAttribute('data-theme','dark');
    themeToggleBtn.setAttribute('aria-pressed','true');
    themeToggleBtn.textContent = 'Light Mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggleBtn.setAttribute('aria-pressed','false');
    themeToggleBtn.textContent = 'Dark Mode';
  }
  localStorage.setItem('cEditorTheme', theme);
}
const savedTheme = localStorage.getItem('cEditorTheme');
if(savedTheme) {
  setTheme(savedTheme);
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}
themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if(currentTheme === 'dark') { setTheme('light'); }
  else { setTheme('dark'); }
});
