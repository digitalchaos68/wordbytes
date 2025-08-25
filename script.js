// Word list (6-letter words)
const WORD_LIST = [
  "planet", "bright", "crunch", "glider", "mystery", "flavor", "beacon", "jungle",
  "fossil", "thrive", "quartz", "violet", "wobble", "glisten", "briskly", "jumped",
  "frozen", "closet", "prayer", "guitar"
];

// Get today's word (deterministic)
function getTodaysWord() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const day = Math.floor(diff / 86400000); // ms per day
  return WORD_LIST[day % WORD_LIST.length];
}

const SOLUTION = getTodaysWord().toUpperCase();
const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 6;

let currentRow = 0;
let currentGuess = "";
let gameOver = false;
let streak = parseInt(localStorage.getItem("wordBytesStreak")) || 0;

// DOM
const gameboard = document.getElementById("gameboard");
const keyboard = document.getElementById("keyboard");
const shareBtn = document.getElementById("share-btn");
const hintBtn = document.getElementById("hint-btn");
const streakEl = document.getElementById("streak");

// Create board
for (let i = 0; i < MAX_ATTEMPTS; i++) {
  const row = document.createElement("div");
  row.classList.add("row");
  for (let j = 0; j < WORD_LENGTH; j++) {
    const letter = document.createElement("div");
    letter.classList.add("letter");
    row.appendChild(letter);
  }
  gameboard.appendChild(row);
}

// Keyboard keys
const KEYS = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

// Render keyboard
KEYS.forEach(key => {
  const button = document.createElement("div");
  button.classList.add("key");
  button.textContent = key;
  button.addEventListener("click", () => onKeyClick(key));
  keyboard.appendChild(button);
});

function onKeyClick(key) {
  if (gameOver) return;

  const rows = gameboard.children;
  const currentRowEl = rows[currentRow];
  const letters = currentRowEl.children;

  if (key === "ENTER") {
    if (currentGuess.length !== WORD_LENGTH) {
      flashMessage("Not enough letters!");
      return;
    }
    checkGuess();
  } else if (key === "⌫") {
    currentGuess = currentGuess.slice(0, -1);
    letters[currentGuess.length].textContent = "";
  } else if (currentGuess.length < WORD_LENGTH) {
    currentGuess += key;
    letters[currentGuess.length - 1].textContent = key;
  }
  updateSubmitButton();
}



// Enable/disable Submit button based on input
function updateSubmitButton() {
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = currentGuess.length !== WORD_LENGTH;
}

// Call it every time the guess changes
document.addEventListener("keydown", () => {
  updateSubmitButton();
});

// Also call it when typing via keyboard
KEYS.forEach(key => {
  const button = document.createElement("div");
  button.classList.add("key");
  button.textContent = key;
  button.addEventListener("click", () => {
    onKeyClick(key);
    updateSubmitButton(); // Update button state
  });
  keyboard.appendChild(button);
});



function checkGuess() {
  const rows = gameboard.children;
  const currentRowEl = rows[currentRow];
  const letters = currentRowEl.children;
  let feedback = "";

  let solutionArray = SOLUTION.split("");

  // First pass: mark correct (green)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (currentGuess[i] === SOLUTION[i]) {
      letters[i].classList.add("correct");
      feedback += "🟦";
      solutionArray[i] = null; // mark used
    }
  }

  // Second pass: mark present (yellow)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (letters[i].classList.contains("correct")) continue;
    const idx = solutionArray.indexOf(currentGuess[i]);
    if (idx !== -1) {
      letters[i].classList.add("present");
      feedback += "🟨";
      solutionArray[idx] = null;
    } else {
      letters[i].classList.add("absent");
      feedback += "⬛";
    }
  }

  if (currentGuess === SOLUTION) {
    gameOver = true;
    streak++;
    localStorage.setItem("wordBytesStreak", streak);
    updateStreak();
    setTimeout(() => alert("You cracked the byte! 🎉"), 300);
  } else if (currentRow >= MAX_ATTEMPTS - 1) {
    gameOver = true;
    streak = 0;
    localStorage.setItem("wordBytesStreak", 0);
    updateStreak();
    alert(`Game over! The word was: ${SOLUTION}`);
  }

  currentRow++;
  currentGuess = "";
}

function updateStreak() {
  streakEl.textContent = `Streak: ${streak} 🔥`;
}

updateStreak();

// Share result
shareBtn.addEventListener("click", () => {
  const rows = gameboard.children;
  let result = `WordBytes ${streak}\n`;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const letters = rows[i].children;
    let row = "";
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (letters[j].classList.contains("correct")) row += "🟦";
      else if (letters[j].classList.contains("present")) row += "🟨";
      else if (letters[j].classList.contains("absent")) row += "⬛";
      else row += "⬜";
    }
    if (row.trim()) result += row + "\n";
  }
  result += `https://wordbytes.app`;

  navigator.clipboard.writeText(result).then(() => {
    alert("Result copied! Paste it anywhere to share 📲");
  });
});

// Hint button (simulate rewarded ad)
hintBtn.addEventListener("click", () => {
  if (gameOver) return;
  // In real app: trigger Propeller Ads rewarded video
  alert("🎯 [Ad would play] → Here's a hint: The word contains the letter '" + SOLUTION[Math.floor(Math.random() * SOLUTION.length)] + "'");
});

function flashMessage(msg) {
  alert(msg);
}

// Keyboard support
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onKeyClick("ENTER");
  else if (e.key === "Backspace") onKeyClick("⌫");
  else {
    const key = e.key.toUpperCase();
    if (/[A-Z]/.test(key) && key.length === 1) onKeyClick(key);
  }
});
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered: ', reg))
      .catch(err => console.log('SW registration failed: ', err));
  });
}
// === How to Play Modal ===
const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const closeModal = document.getElementById("close-modal");

// Show modal on first visit only
if (!localStorage.getItem("wordBytesSeenHelp")) {
  helpModal.style.display = "flex";
  localStorage.setItem("wordBytesSeenHelp", "true");
}

helpBtn.addEventListener("click", () => {
  helpModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  helpModal.style.display = "none";
});

// Close modal if clicked outside
window.addEventListener("click", (e) => {
  if (e.target === helpModal) {
    helpModal.style.display = "none";
  }
});

// === Collapsible Legend ===
const legendToggle = document.getElementById("legend-toggle");
const legendContent = document.getElementById("legend-content");

legendToggle.addEventListener("click", () => {
  const isExpanded = legendToggle.getAttribute("aria-expanded") === "true";
  legendContent.style.display = isExpanded ? "none" : "block";
  legendToggle.setAttribute("aria-expanded", !isExpanded);
  legendToggle.textContent = !isExpanded ? "🎯 Color Guide (Tap to show)" : "🎯 Color Guide (Tap to hide)";
});

// Initialize legend visibility
legendContent.style.display = "block";
legendToggle.setAttribute("aria-expanded", "true");