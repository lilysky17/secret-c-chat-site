import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Element references
const codeInput = document.getElementById('codeInput');
const lineNumbers = document.getElementById('lineNumbers');
const terminalOutput = document.getElementById('terminalOutput');
const processBtn = document.getElementById('processBtn');
const generateSampleBtn = document.getElementById('generateSampleBtn');
const clearOutputBtn = document.getElementById('clearOutputBtn');
const quietModeBtn = document.getElementById('quietModeBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const statusMessage = document.getElementById('statusMessage');
const statusLn = document.getElementById('statusLn');
const statusCol = document.getElementById('statusCol');

// Firebase messages reference
const messagesRef = ref(window.firebase.database, 'messages');

// Utility: format timestamp to readable string
function formatTimestamp(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Update line numbers column
function updateLineNumbers() {
  const linesCount = codeInput.value.split('\n').length;
  lineNumbers.textContent = Array.from({length: linesCount}, (_, i) => i+1).join('\n');
}

// Sync line numbers scroll with textarea scroll
function syncScroll() {
  lineNumbers.scrollTop = codeInput.scrollTop;
}

// Update cursor line and column in status bar
function updateCursorStatus() {
  const pos = codeInput.selectionStart;
  const textBefore = codeInput.value.substring(0, pos);
  const lines = textBefore.split('\n');
  statusLn.textContent = lines.length;
  statusCol.textContent = lines[lines.length -1].length + 1;
}

// Scroll terminal output to bottom
function scrollTerminalToBottom() {
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Append line to terminal output
function appendToTerminal(text) {
  terminalOutput.textContent += text + '\n';
  scrollTerminalToBottom();
}

// Replace terminal output lines
function setTerminalLines(lines) {
  terminalOutput.textContent = lines.join('\n') + '\n';
  scrollTerminalToBottom();
}

// Sample C codes for Generate Sample button
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

// Clear terminal output with info message
function clearTerminal() {
  terminalOutput.textContent = '[INFO]: Output cleared.\n';
  scrollTerminalToBottom();
}

// Compose formatted info message with timestamp
function composeInfoMessage(msgText, timestamp = new Date()) {
  return `[INFO - ${formatTimestamp(timestamp)}]: ${msgText}`;
}

// STATE: whether quiet mode is active
let quietModeActive = false;

// Internal buffer of messages received while quiet mode was ON
let bufferedMessages = [];

// Firebase listener unsubscribe callback
let unsubscribeFirebase = null;

// Subscribe to Firebase messages updates, appends to terminal when not quiet
function subscribeToMessages() {
  if(unsubscribeFirebase) return; // Prevent double subscriptions

  unsubscribeFirebase = onValue(messagesRef, (snapshot) => {
    if(quietModeActive) {
      // Buffer messages but do not display
      bufferedMessages = [];
      const msgsObj = snapshot.val();
      if(!msgsObj) return;
      const msgsArray = Object.values(msgsObj);
      msgsArray.sort((a,b) => a.timestamp - b.timestamp);
      bufferedMessages = msgsArray;
      return;
    }
    // Not quiet, display all messages live
    const msgsObj = snapshot.val();
    if(!msgsObj) {
      terminalOutput.textContent = '';
      return;
    }
    const msgsArray = Object.values(msgsObj);
    msgsArray.sort((a,b) => a.timestamp - b.timestamp);
    const lines = msgsArray.map(m => composeInfoMessage(m.text, new Date(m.timestamp)));
    setTerminalLines(lines);
  });
}

// Unsubscribe from Firebase updates
function unsubscribeFromMessages() {
  if(unsubscribeFirebase) {
    unsubscribeFirebase();
    unsubscribeFirebase = null;
  }
}

// On Process button click — send message or simulate compile
processBtn.addEventListener('click', () => {
  const codeText = codeInput.value.trim();
  const msgPattern = /^\/\/ msg:\s*(.+)$/s;
  const match = codeText.match(msgPattern);
  if(match) {
    const messageText = match[1].trim();
    if(messageText.length === 0) {
      statusMessage.textContent = 'Cannot send empty message.';
      return;
    }
    const timestamp = Date.now();
    // Send message to Firebase
    push(messagesRef, {
      text: messageText,
      timestamp: timestamp
    }).then(() => {
      statusMessage.textContent = 'Message sent successfully.';
      codeInput.value = '// msg: ';
      updateLineNumbers();
      updateCursorStatus();
      // If quiet mode OFF append immediately;
      if(!quietModeActive) {
        appendToTerminal(composeInfoMessage('Message sent.'));
      }
      // If quiet mode ON message won't appear until unpaused
    }).catch(() => {
      statusMessage.textContent = 'Error sending message.';
    });
  } else {
    // Simulate normal compilation
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

// Generate Sample button behavior — inserts sample code and clears chat output with fake logs
generateSampleBtn.addEventListener('click', () => {
  const randomIndex = Math.floor(Math.random() * sampleCodes.length);
  codeInput.value = sampleCodes[randomIndex];
  updateLineNumbers();
  updateCursorStatus();
  // Clear terminal with fake logs: e.g. successful compilation message
  setTerminalLines(['[INFO] Compilation successful ✅']);
  statusMessage.textContent = 'Sample code inserted.';
});

// Clear Output button — instantly clears terminal output
clearOutputBtn.addEventListener('click', () => {
  clearTerminal();
  statusMessage.textContent = 'Output cleared.';
});

// Quiet Mode toggle — pauses/resumes message display
quietModeBtn.addEventListener('click', () => {
  quietModeActive = !quietModeActive;
  quietModeBtn.setAttribute('aria-pressed', quietModeActive.toString());
  quietModeBtn.textContent = quietModeActive ? 'Quiet Mode On' : 'Quiet Mode Off';

  if(quietModeActive) {
    // Pause incoming message display
    statusMessage.textContent = 'Quiet Mode Activated. Incoming messages paused.';
    unsubscribeFromMessages();
  } else {
    // Resume listening and dump buffered messages
    statusMessage.textContent = 'Quiet Mode Deactivated. Loading buffered messages...';
    subscribeToMessages();
    if(bufferedMessages.length > 0) {
      bufferedMessages.sort((a,b) => a.timestamp - b.timestamp);
      const lines = bufferedMessages.map(m => composeInfoMessage(m.text, new Date(m.timestamp)));
      setTerminalLines(lines);
      bufferedMessages = [];
    }
  }
});

// Initial subscribe (not quiet)
subscribeToMessages();

// Update line numbers & cursor position handlers
codeInput.addEventListener('input', () => {
  updateLineNumbers();
  updateCursorStatus();
});
codeInput.addEventListener('scroll', syncScroll);
codeInput.addEventListener('keydown', updateCursorStatus);
codeInput.addEventListener('click', updateCursorStatus);

// Keyboard shortcut Ctrl+Enter or Cmd+Enter triggers Process
codeInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    processBtn.click();
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

// Initial setup calls
updateLineNumbers();
updateCursorStatus();
clearTerminal();

                                                        
