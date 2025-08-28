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

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function onKeyClick(key) {
  if (gameOver) return;

  const rows = gameboard.children;
  const currentRowEl = rows[currentRow];
  const letters = currentRowEl.children;

  // Start music on first interaction
  if (!bgMusic.isPlaying) {
    bgMusic.play().catch(e => console.log("Music autoplay blocked"));
    bgMusic.isPlaying = true;

  // 🔍 GA4: Track first interaction → game session start
  gtag('event', 'session_start', {
    'session_number': streak + 1  // approximate
  });

  // 🔍 GA4: Track level start
  gtag('event', 'level_start', {
    'level': getDayOfYear(),  // helper below
    'puzzle_type': 'daily_6letter'
  });

  }

  // Play tap sound
  playSound("tap");

// 🔍 GA4: Track typing engagement
if (key.length === 1 && key >= 'A' && key <= 'Z') {
  gtag('event', 'letter_input', {
    'letter': key,
    'position': currentGuess.length + 1
  });
}

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

// === PHYSICAL KEYBOARD SUPPORT ===
document.addEventListener('keydown', (e) => {
  if (gameOver) return;

  const key = e.key.toUpperCase();

  // Only handle valid inputs
  if (key >= 'A' && key <= 'Z' && key.length === 1) {
    onKeyClick(key);
  } else if (key === 'ENTER') {
    onKeyClick('ENTER');
  } else if (key === 'BACKSPACE' || key === 'DELETE') {
    onKeyClick('⌫');
  }
});



function checkGuess() {
  const rows = gameboard.children;
  const currentRowEl = rows[currentRow];
  const letters = currentRowEl.children;
  let solutionArray = SOLUTION.split("");

// 🔍 GA4: Track attempt
gtag('event', 'guess_submitted', {
  'attempt_number': currentRow + 1,
  'word_guess': currentGuess,
  'is_correct': currentGuess === SOLUTION
});

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

// 🔍 GA4: Track win & streak
gtag('event', 'level_complete', {
  'level': getDayOfYear(),
  'moves': currentRow + 1,
  'hints_used': 0, // we’ll update this if hint was used
  'result': 'win'
});

gtag('event', 'streak_updated', {
  'streak_count': streak
});
    
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

// 🔍 GA4: Track loss
gtag('event', 'level_complete', {
  'level': getDayOfYear(),
  'moves': MAX_ATTEMPTS,
  'result': 'loss'
});

gtag('event', 'streak_reset', {
  'previous_streak': parseInt(localStorage.getItem("wordBytesStreak")) || 0
});


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
  if (streak >= 3) {
  streakEl.textContent = `Streak: ${streak} 🔥`;
} else if (streak >= 7) {
  streakEl.textContent = `Streak: ${streak} 🌟`;
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

  const isWin = gameWon;
  const attempts = currentRow + 1;
  const emojiResult = isWin
    ? `I cracked today’s WordByte in ${attempts} ${attempts === 1 ? 'try' : 'tries'}! 🎉\n\n${grid}`
    : `Tried today’s WordByte — tough one! 💔\n\n${grid}`;

  const shareText = `${emojiResult}\nPlay free: https://wordbytes.app`;

  // Open share menu based on platform
  if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    // Mobile: Use native share
    navigator.share({ title: "WordBytes", text: shareText });
  } else {
    // Desktop: Show custom share modal or open social links
    showShareModal(shareText);
  }

  // 🔍 GA4: Track share (same as before)
  gtag('event', 'share_action', {
    'method': navigator.share ? 'native' : 'social_modal',
    'game_result': isWin ? 'win' : 'loss',
    'streak_at_share': streak
  });
});


function showShareModal(shareText) {
  const modal = document.getElementById('share-modal');
  modal.style.display = 'flex';
  window.currentShareText = shareText; // Store for reuse
}

function closeShareModal() {
  document.getElementById('share-modal').style.display = 'none';
}

function shareOnX() {
  const text = encodeURIComponent(window.currentShareText);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
}

function shareOnFacebook() {
  const url = encodeURIComponent('https://wordbytes.app');
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn() {
  const url = encodeURIComponent('https://wordbytes.app');
  const title = encodeURIComponent("I played WordBytes today!");
  const summary = encodeURIComponent("A fun daily 6-letter word puzzle — free to play!");
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank', 'width=600,height=400');
}

function copyToClipboard() {
  navigator.clipboard.writeText(window.currentShareText).then(() => {
    alert("Result copied! 📲 Paste it anywhere!");
    closeShareModal();
  });
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered: ', reg))
      .catch(err => console.log('SW registration failed: ', err));
  });
}

// === LOAD BANNER AD ===
window.addEventListener('load', () => {
  // Wait a moment for SDK to initialize
  setTimeout(() => {
    if (typeof PropellerAds !== 'undefined' && typeof PropellerAds.show === 'function') {
      console.log("PropellerAds detected. Loading banner...");

      PropellerAds.show('banner', {
        container: document.getElementById('ad-banner-top'),
        zoneId: '9776139',
        callbacks: {
          onAdLoaded: () => {
            console.log("✅ Banner ad loaded!");
            document.getElementById('ad-banner-top').style.height = 'auto';
          },
          onError: (err) => {
            console.error("❌ Banner ad failed:", err);
            document.getElementById('ad-banner-top').innerHTML = '<div class="ad-label">Ad failed to load</div>';
          }
        }
      });
    } else {
      console.warn("PropellerAds not available. Retrying...");
      // Retry after 2 seconds
      setTimeout(() => {
        if (typeof PropellerAds !== 'undefined' && typeof PropellerAds.show === 'function') {
          PropellerAds.show('banner', {
            container: document.getElementById('ad-banner-top'),
            zoneId: '9776139'
          });
        }
      }, 2000);
    }
  }, 1000);
});

// === HINT BUTTON – SHOW AD POPUP & GIVE HINT ON CLOSE ===
hintBtn.addEventListener("click", () => {
  if (gameOver) return;

  // Ask user to confirm they want to watch the ad
  const confirmed = confirm("🎯 Watch a short ad to get a hint? (Close the popup to return)");
  if (!confirmed) return; // If they cancel, do nothing

  // 🔍 GA4: Track intent to watch ad
gtag('event', 'ad_click', {
  'ad_type': 'rewarded_popup',
  'placement': 'hint_button'
});

  // Open ad in popup window
  const adPopup = window.open(
    'https://otieu.com/4/9777670',
    'propeller_ads',
    'width=380,height=600,resizable,scrollbars=yes'
  );

  // Check if popup was blocked
  if (!adPopup) {
    alert("⚠️ Please allow popups to watch the ad.");
    return;
  }

  // Poll every 500ms to detect when popup is closed
  const checkPopup = setInterval(() => {
    if (adPopup.closed) {
      clearInterval(checkPopup); // Stop checking

      // After ad is closed, give the hint
      const randomIndex = Math.floor(Math.random() * WORD_LENGTH);
      const hintLetter = SOLUTION[randomIndex];
      alert(`💡 The word contains the letter '${hintLetter}'.`);

// 🔍 GA4: Track ad completion (user closed popup = assumed view)
gtag('event', 'rewarded_ad_viewed', {
  'reward': 'hint_letter',
  'value': 1
});

// 🔍 GA4: Track hint used
gtag('event', 'hint_used', {
  'hint_type': 'letter_hint',
  'source': 'ad'
});


    }
  }, 500);
});

// Detect install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  gtag('event', 'pwa_install_prompt', {
    'outcome': 'shown'
  });
});

// Detect actual install
window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_installed');
});