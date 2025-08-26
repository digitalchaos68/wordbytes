// Word list (6-letter words)
const WORD_LIST = [
  "planet", "bright", "crunch", "glider", "mystery", "flavor", "beacon", "jungle",
  "fossil", "thrive", "quartz", "violet", "wobble", "glisten", "briskly", "jumped",
  "frozen", "closet", "prayer", "guitar"
];

// === BACKGROUND MUSIC ===
let bgMusic = new Audio("sounds/background.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.2;

// === SOUND EFFECTS ===
function playSound(sound) {
  if (isMuted) return;
  const audio = new Audio(`sounds/${sound}.mp3`);
  audio.volume = 0.3;
  audio.play().catch(e => console.log("Audio play failed:", e));
}

// Get today's word (deterministic)
function getTodaysWord() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const day = Math.floor(diff / 86400000);
  return WORD_LIST[day % WORD_LIST.length];
}

const SOLUTION = getTodaysWord().toUpperCase();
const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 6;

let currentRow = 0;
let currentGuess = "";
let gameOver = false;
let gameWon = false;
let streak = parseInt(localStorage.getItem("wordBytesStreak")) || 0;

// DOM Elements
const gameboard = document.getElementById("gameboard");
const shareBtn = document.getElementById("share-btn");
const hintBtn = document.getElementById("hint-btn");
const streakEl = document.getElementById("streak");

// Create gameboard
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

// Keyboard click handlers
document.querySelectorAll('.key').forEach(button => {
  const key = button.textContent;
  button.addEventListener('click', () => onKeyClick(key));
});

function onKeyClick(key) {
  if (gameOver) return;

  const rows = gameboard.children;
  const currentRowEl = rows[currentRow];
  const letters = currentRowEl.children;

  // Start music on first interaction
  if (!bgMusic.isPlaying) {
    bgMusic.play().catch(e => console.log("Music autoplay blocked"));
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
}

function checkGuess() {
  const rows = gameboard.children;
  const currentRowEl = rows[currentRow];
  const letters = currentRowEl.children;
  let solutionArray = SOLUTION.split("");

  // Mark correct (green)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (currentGuess[i] === SOLUTION[i]) {
      letters[i].classList.add("correct");
      solutionArray[i] = null;
    }
  }
  playSound("correct");

  // Mark present (yellow)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (letters[i].classList.contains("correct")) continue;
    const idx = solutionArray.indexOf(currentGuess[i]);
    if (idx !== -1) {
      letters[i].classList.add("present");
      solutionArray[idx] = null;
    } else {
      letters[i].classList.add("absent");
    }
  }

  if (currentGuess === SOLUTION) {
    gameOver = true;
    gameWon = true;
    streak++;
    localStorage.setItem("wordBytesStreak", streak);
    updateStreak();
    playSound("win");
    bgMusic.volume = 0.05;
    setTimeout(() => { bgMusic.volume = 0.2; }, 1000);
    alert(`🎉 You cracked the byte in ${currentRow + 1} ${currentRow === 0 ? 'try' : 'tries'}!\n\nShare your result and challenge your friends! 📲`);
    setTimeout(() => shareBtn.click(), 1000);
  } else if (currentRow >= MAX_ATTEMPTS - 1) {
    gameOver = true;
    gameWon = false;
    streak = 0;
    localStorage.setItem("wordBytesStreak", 0);
    updateStreak();
    playSound("fail");
    alert(`💔 Tough one today! The word was: ${SOLUTION}\n\nThanks for playing! Share your result and come back tomorrow for a new challenge! 🌟`);
    setTimeout(() => shareBtn.click(), 1000);
  }

  if (!gameOver) {
    currentRow++;
    currentGuess = "";
  }
}

function flashMessage(msg) {
  alert(msg);
}

// === DOM ELEMENTS (after creation)
const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const closeModal = document.getElementById("close-modal");
const legendToggle = document.getElementById("legend-toggle");
const legendContent = document.getElementById("legend-content");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const muteBtn = document.getElementById("mute-btn");

// === HELP MODAL ===
if (!localStorage.getItem("wordBytesSeenHelp")) {
  helpModal.style.display = "flex";
  localStorage.setItem("wordBytesSeenHelp", "true");
}
helpBtn.addEventListener("click", () => helpModal.style.display = "flex");
closeModal.addEventListener("click", () => helpModal.style.display = "none");
window.addEventListener("click", (e) => {
  if (e.target === helpModal) helpModal.style.display = "none";
});

// === LEGEND TOGGLE ===
legendToggle.addEventListener("click", () => {
  const isExpanded = legendToggle.getAttribute("aria-expanded") === "true";
  legendContent.style.display = isExpanded ? "none" : "block";
  legendToggle.setAttribute("aria-expanded", !isExpanded);
  legendToggle.textContent = !isExpanded ? "🎯 Color Guide (Tap to show)" : "🎯 Color Guide (Tap to hide)";
});
legendContent.style.display = "block";
legendToggle.setAttribute("aria-expanded", "true");

// === STREAK ===
function updateStreak() {
  streakEl.textContent = `Streak: ${streak} 🔥`;
  if (streak > 0) {
    streakEl.style.transform = 'scale(1.2)';
    streakEl.style.transition = 'transform 0.2s';
    setTimeout(() => streakEl.style.transform = 'scale(1)', 300);
  }
}
updateStreak();

// === DARK MODE ===
const isDarkMode = localStorage.getItem("wordBytesDarkMode") === "true";
if (isDarkMode) {
  document.body.classList.add("dark-mode");
  darkModeToggle.textContent = "☀️";
}
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("wordBytesDarkMode", isDark);
  darkModeToggle.textContent = isDark ? "☀️" : "🌙";
});

// === MUTE TOGGLE ===
let isMuted = localStorage.getItem("wordBytesMuted") === "true";
if (isMuted) muteBtn.textContent = "🔇";
muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  localStorage.setItem("wordBytesMuted", isMuted);
  if (isMuted) bgMusic.pause();
  else bgMusic.play().catch(e => console.log("Music play failed:", e));
});

// === SPLASH SCREEN ===
const splashScreen = document.getElementById("splash-screen");
window.addEventListener('load', () => {
  setTimeout(() => {
    splashScreen.classList.add('fade-out');
    setTimeout(() => splashScreen.style.display = 'none', 1000);
  }, 1500);
});

// === SMART SHARE BUTTON ===
shareBtn.addEventListener("click", () => {
  const rows = gameboard.children;
  let grid = "";
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const letters = rows[i].children;
    let row = "";
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (letters[j].classList.contains("correct")) row += "🟦";
      else if (letters[j].classList.contains("present")) row += "🟨";
      else if (letters[j].classList.contains("absent")) row += "⬛";
      else row += "⬜";
    }
    if (row.trim()) grid += row + "\n";
  }

  const message = gameWon
    ? `I cracked today’s WordByte in ${currentRow + 1} ${currentRow === 0 ? 'try' : 'tries'}! 🎉\n\n${grid}\nPlay free: https://wordbytes.app`
    : `Tried today’s WordByte — tough one! 💔\nCan you do better?\n\n${grid}\nGive it a try: https://wordbytes.app`;

  if (navigator.share) {
    navigator.share({ title: "WordBytes", text: message }).catch(() => console.log("Share canceled"));
  } else if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    navigator.clipboard.writeText(message).then(
      () => alert("Result copied! 📲 Paste it to share!"),
      () => prompt("Copy to share:", message)
    );
  }
});

// === PROPELLER ADS ===
window.addEventListener('load', () => {
  console.log("PropellerAds loaded?", typeof PropellerAds !== 'undefined');
  if (typeof PropellerAds !== 'undefined' && typeof PropellerAds.init === 'function') {
    PropellerAds.init({ zoneId: '9775971', type: 'rewarded' });
  } else {
    setTimeout(() => {
      if (typeof PropellerAds !== 'undefined' && typeof PropellerAds.init === 'function') {
        PropellerAds.init({ zoneId: '9775971', type: 'rewarded' });
      } else {
        console.error("PropellerAds not available");
      }
    }, 1000);
  }
});

// Hint button
hintBtn.addEventListener("click", () => {
  if (gameOver) return;
  if (typeof PropellerAds !== 'undefined' && typeof PropellerAds.show === 'function') {
    PropellerAds.show('rewarded', {
      callbacks: {
        onAdStarted: () => console.log("Ad started"),
        onAdRewarded: () => {
          const randomIndex = Math.floor(Math.random() * WORD_LENGTH);
          const hintLetter = SOLUTION[randomIndex];
          alert(`🎯 Hint: The word contains '${hintLetter}'`);
        },
        onAdSkipped: () => alert("You need to watch the full ad to get a hint."),
        onError: (err) => {
          console.error("Ad error:", err);
          alert("Ad not available. Try again later.");
        }
      }
    });
  } else {
    alert("Ad system loading... Please wait a few seconds and try again.");
  }
});

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered: ', reg))
      .catch(err => console.log('SW registration failed: ', err));
  });
}