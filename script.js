// Word list (6-letter words)
const WORD_LIST = [
  "planet", "bright", "crunch", "glider", "mystery", "flavor", "beacon", "jungle",
  "fossil", "thrive", "quartz", "violet", "wobble", "glisten", "briskly", "jumped",
  "frozen", "closet", "prayer", "guitar"
];

// === BACKGROUND MUSIC ===
let bgMusic = new Audio("sounds/background.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.2; // Low volume, just beneath gameplay sounds

// Start music on first user interaction (required by browsers)
function startMusic() {
  if (!isMuted && !bgMusic.playing) {
    bgMusic.play().catch(e => console.log("Music play failed:", e));
  }
}

// Pause music
function pauseMusic() {
  bgMusic.pause();
}

// Resume music
function resumeMusic() {
  if (!isMuted) {
    bgMusic.play().catch(e => console.log("Music play failed:", e));
  }
}

// === SOUND EFFECTS ===
function playSound(sound) {
  const audio = new Audio(`sounds/${sound}.mp3`);
  audio.volume = 0.3;
  audio.play().catch(e => console.log("Audio play failed:", e));
}

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

function updateStreak() {
  streakEl.textContent = `Streak: ${streak} 🔥`;
  if (streak > 0) {
    streakEl.style.transform = 'scale(1.2)';
    streakEl.style.transition = 'transform 0.2s';
    setTimeout(() => {
      streakEl.style.transform = 'scale(1)';
    }, 300);
  }
}

// Call it once at start
updateStreak();

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

// Keyboard keys (now includes ENTER and BACKSPACE)
const KEYS = [
  'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
  'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
  'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'
];

function onKeyClick(key) {
  if (gameOver) return;

  const rows = gameboard.children;
  const currentRowEl = rows[currentRow];
  const letters = currentRowEl.children;

  // Start background music on first interaction
  if (!bgMusic.isPlaying) {
    bgMusic.play().catch(e => console.log("Music autoplay blocked — user must interact first"));
    bgMusic.isPlaying = true;
  }

  // Play tap sound
  playSound("tap");

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

  // No need to update Submit button — it's gone!
}

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
  // Play correct letter sound
  playSound("correct");

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
    playSound("win");

    // Fade out music
    bgMusic.volume = 0.05;
    setTimeout(() => { bgMusic.volume = 0.2; }, 1000);

    alert(`🎉 You cracked the byte in ${currentRow + 1} ${currentRow === 0 ? 'try' : 'tries'}!\n\nShare your result and challenge your friends! 📲`);

    // Auto-trigger share after win
    setTimeout(() => {
      shareBtn.click();
    }, 1000);

  } else if (currentRow >= MAX_ATTEMPTS - 1) {
    gameOver = true;
    streak = 0;
    localStorage.setItem("wordBytesStreak", 0);
    updateStreak();
    playSound("fail");

    alert(`💔 Tough one today! The word was: ${SOLUTION}\n\nThanks for playing! Share your result and come back tomorrow for a new challenge! 🌟`);

    // Auto-trigger share after loss
    setTimeout(() => {
      shareBtn.click();
    }, 1000);

  }

  // Only move to next row if game is not over
  if (!gameOver) {
    currentRow++;
    currentGuess = "";
  }
}

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


// Enhanced share (uses Web Share API if available)
shareBtn.addEventListener("click", () => {
  const rows = gameboard.children;
  let result = `WordBytes ${streak} 🔥\n\n`;

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
  result += `\nPlay free: https://wordbytes.app`;

  // Try Web Share API (mobile)
  if (navigator.share) {
    navigator.share({
      title: "WordBytes",
      text: result
    }).catch(err => console.log("Share canceled", err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(result)
      .then(() => {
        alert("Result copied! 📲 Paste it to share!");
      })
      .catch(() => {
        alert("Copy failed. Please share manually.");
      });
  }
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

// === Attach click events to static HTML keyboard ===
document.querySelectorAll('.key').forEach(button => {
  const key = button.textContent;

  button.addEventListener('click', () => {
    onKeyClick(key);
  });
});



// === DARK MODE TOGGLE ===
const darkModeToggle = document.getElementById("dark-mode-toggle");

// Check saved preference
const isDarkMode = localStorage.getItem("wordBytesDarkMode") === "true";
if (isDarkMode) {
  document.body.classList.add("dark-mode");
  darkModeToggle.textContent = "☀️";
}

// Toggle mode
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("wordBytesDarkMode", isDark);
  darkModeToggle.textContent = isDark ? "☀️" : "🌙";
});

// === MUTE TOGGLE ===
const muteBtn = document.getElementById("mute-btn");

// Check saved preference
let isMuted = localStorage.getItem("wordBytesMuted") === "true";
if (isMuted) {
  muteBtn.textContent = "🔇";
}

// Toggle mute
muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  localStorage.setItem("wordBytesMuted", isMuted);

  // Pause or resume background music
  if (isMuted) {
    bgMusic.pause();
  } else {
    bgMusic.play().catch(e => console.log("Music play failed:", e));
  }

});

// Update playSound to respect mute
function playSound(sound) {
  if (isMuted) return; // Don't play if muted
  const audio = new Audio(`sounds/${sound}.mp3`);
  audio.volume = 0.3;
  audio.play().catch(e => console.log("Audio play failed:", e));
}

