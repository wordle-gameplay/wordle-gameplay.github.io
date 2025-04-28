let WORD_LENGTH = parseInt(localStorage.getItem('wordLength')) || 5;
if (!WORDS_BY_LENGTH[WORD_LENGTH]) {
  WORD_LENGTH = 5;
  localStorage.setItem('wordLength', 5);
}
let WORDS = WORDS_BY_LENGTH[WORD_LENGTH];
let secretWord = ''; // ← сначала пусто
const MAX_GUESSES = 6;
let currentGuess = '';
let currentRow = 0;
const keyColors = {};
let isAnimating = false;


function getRandomWord() {
  WORDS = WORDS_BY_LENGTH[WORD_LENGTH]; // обновляем список слов
  if (!WORDS) {
    throw new Error(`Нет слов для длины ${WORD_LENGTH}`);
  }
  const randomIndex = Math.floor(Math.random() * WORDS.length);
  return WORDS[randomIndex].toLowerCase();
}
// let secretWord = getRandomWord();
// console.log(`Secret word: ${secretWord}`);

const board = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const endgameModal = document.getElementById('endgame-modal');
const endgameTitle = document.getElementById('endgame-title');
const endgameWord = document.getElementById('endgame-word');
const closeEndgame = document.getElementById('close-endgame');
const newGameBtn = document.getElementById('new-game-btn');
const newGameModalBtn = document.getElementById('new-game-modal-btn'); // добавлено
const confettiToggle = document.getElementById('confetti-toggle');

const keysLayout = [
  'q w e r t y u i o p',
  'a s d f g h j k l',
  'enter z x c v b n m backspace'
];

function restoreKeyColors() {
  const keys = document.querySelectorAll('.key');
  keys.forEach(btn => {
    const key = btn.getAttribute('data-key');
    if (keyColors[key]) {
      btn.classList.add(keyColors[key]);
    }
  });
}

function generateKeyboard(swapKeys = false) {
  keyboard.innerHTML = ''; // очищаем перед отрисовкой

  const keysLayout = [
    'q w e r t y u i o p',
    'a s d f g h j k l',
    swapKeys ? 'backspace z x c v b n m enter' : 'enter z x c v b n m backspace'
  ];

  keysLayout.forEach(row => {
    const rowEl = document.createElement('div');
    row.split(' ').forEach(key => {
      const btn = document.createElement('button');
      btn.textContent = key === 'backspace' ? '←' : key;
      btn.classList.add('key');
      if (key === 'enter' || key === 'backspace') btn.classList.add('big');
      btn.setAttribute('data-key', key);
      btn.addEventListener('click', () => {
        btn.classList.add('shadow-flash');
        setTimeout(() => btn.classList.remove('shadow-flash'), 180);
        handleKeyPress({ key });
      });
      rowEl.appendChild(btn);
    });
    keyboard.appendChild(rowEl);
  });

  // 🛠️ Добавляем восстановление цветов клавиш
  restoreKeyColors();
}

document.addEventListener('keydown', handleKeyPress);

document.getElementById('restart-btn').addEventListener('click', () => {
  location.reload(); // полный сброс сцены
});

function handleKeyPress(e) {
  if (isAnimating) return; // 🚫 если анимация — не обрабатывать нажатия
  
  const key = e.key.toLowerCase();
  if (currentRow >= MAX_GUESSES) return;

  if (key === 'enter') {
    if (currentGuess.length < WORD_LENGTH) {
      showMessage('Too short');
      shakeRow(currentRow);
      return;
    }
    if (!WORDS_BY_LENGTH[WORD_LENGTH].includes(currentGuess.toLowerCase())) {
      showMessage('Word not found');
      shakeRow(currentRow);
      return;
    }
    checkGuess();
  }
  else if (key === 'backspace') {
    currentGuess = currentGuess.slice(0, -1);
    updateTiles();
  } else if (/^[a-z]$/.test(key)) {
    if (currentGuess.length < WORD_LENGTH) {
      currentGuess += key;
      updateTiles();
    }
  }
}

function updateTiles() {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const index = currentRow * WORD_LENGTH + i;
    const tile = board.children[index];
    const letter = currentGuess[i];
    tile.textContent = letter || '';
    tile.classList.toggle('filled', !!letter);
    if (i === currentGuess.length - 1 && letter) {
      tile.classList.remove('pop');
      void tile.offsetWidth;
      tile.classList.add('pop');
    }
  }
}

function checkGuess() {
  isAnimating = true; // 🚫 блокируем ввод
  const guessArray = currentGuess.split('');
  const secretArray = secretWord.split('');

  guessArray.forEach((letter, i) => {
    const index = currentRow * WORD_LENGTH + i;
    const tile = board.children[index];
    setTimeout(() => {
      tile.classList.add('flip');
      if (letter === secretArray[i]) {
        tile.classList.add('correct');
        updateKeyColor(letter, 'correct');
      } else if (secretArray.includes(letter)) {
        tile.classList.add('present');
        updateKeyColor(letter, 'present');
      } else {
        tile.classList.add('absent');
        updateKeyColor(letter, 'absent');
      }
      tile.classList.remove('filled');
    }, i * 200);
  });

  setTimeout(() => {
    if (currentGuess === secretWord) {
      if (confettiToggle && confettiToggle.checked) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 } });
      }
      endGame(true);
    } else {
      currentGuess = '';
      currentRow++;
      if (currentRow === MAX_GUESSES) {
        endGame(false);
      }
    }
    isAnimating = false; // ✅ разблокируем ввод только после анимации!
  }, WORD_LENGTH * 200 + 100);
}

function endGame(won) {
  document.removeEventListener('keydown', handleKeyPress);
  endgameTitle.textContent = won ? 'You Won!' : 'You Lost!';
  endgameWord.textContent = secretWord.toUpperCase();
  document.getElementById('word-meaning-link').href = `https://www.google.com/search?q=define+${secretWord}`;

  endgameModal.classList.remove('hidden');
  endgameModal.classList.add('fade');

  requestAnimationFrame(() => {
    endgameModal.classList.add('show');
  });
  const modalContent = endgameModal.querySelector('.modal-content');
  modalContent.classList.remove('show');
  void modalContent.offsetWidth; // force reflow
  modalContent.classList.add('show');

  // --- СТАТИСТИКА ---
  const total = parseInt(localStorage.getItem('stat_total') || 0) + 1;
  const lengthSum = parseInt(localStorage.getItem('stat_length_sum') || 0) + WORD_LENGTH;
  localStorage.setItem('stat_total', total.toString());
  localStorage.setItem('stat_length_sum', lengthSum.toString());
  localStorage.setItem('stat_last', secretWord.toUpperCase());

  if (won) {
    const wins = parseInt(localStorage.getItem('stat_wins') || 0) + 1;
    localStorage.setItem('stat_wins', wins.toString());

    // ✅ BEST TRY (наименьшее число попыток)
    const bestTry = parseInt(localStorage.getItem('stat_best_try') || 0);
    if (bestTry === 0 || currentRow + 1 < bestTry) {
      localStorage.setItem('stat_best_try', (currentRow + 1).toString());
    }

    // ✅ STREAKS
    const currentStreak = parseInt(localStorage.getItem('stat_current_streak') || 0) + 1;
    localStorage.setItem('stat_current_streak', currentStreak.toString());

    const maxStreak = parseInt(localStorage.getItem('stat_max_streak') || 0);
    if (currentStreak > maxStreak) {
      localStorage.setItem('stat_max_streak', currentStreak.toString());
    }

  } else {
    localStorage.setItem('stat_losses', (parseInt(localStorage.getItem('stat_losses') || 0) + 1).toString());
    localStorage.setItem('stat_current_streak', '0'); // ❌ сбросить streak
  }
}

function updateKeyColor(letter, status) {
  keyColors[letter] = status; // ← сохраняем в память

  const btn = document.querySelector(`[data-key="${letter}"]`);
  if (!btn) return;

  if (status === 'correct') {
    btn.classList.remove('present', 'absent');
    btn.classList.add('correct');
  } else if (status === 'present') {
    if (!btn.classList.contains('correct')) {
      btn.classList.remove('absent');
      btn.classList.add('present');
    }
  } else if (status === 'absent') {
    if (!btn.classList.contains('present') && !btn.classList.contains('correct')) {
      btn.classList.add('absent');
    }
  }
}

function showMessage(text) {
  const popup = document.getElementById('message-popup');
  popup.textContent = text;
  popup.classList.add('show');
  setTimeout(() => {
    popup.classList.remove('show');
  }, 1500);
}

function shakeRow(row) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = board.children[row * WORD_LENGTH + i];
    tile.classList.add('shake');
    tile.addEventListener('animationend', () => tile.classList.remove('shake'), { once: true });
  }
}

function resetGame() {
  document.body.setAttribute('data-word-length', WORD_LENGTH);
  WORDS = WORDS_BY_LENGTH[WORD_LENGTH]; // обновляем список слов
  if (!WORDS || WORDS.length === 0) {
    console.error(`Нет слов для длины ${WORD_LENGTH}`);
    showMessage(`Нет слов для длины ${WORD_LENGTH}`);
    return;
  }

  secretWord = getRandomWord(); // выбираем новое слово
  console.log(`Secret word: ${secretWord}`);

  board.innerHTML = '';
  board.style.gridTemplateColumns = `repeat(${WORD_LENGTH}, 1fr)`;
  const MAX_TILE_SIZE = 60;
  const WIDTH_FACTORS = {
    3: 0.37,
    4: 0.51,
    5: 0.64,
    6: 0.77,
    7: 0.87,
    8: 0.85
  };

  function updateBoardSize() {
    if (WORD_LENGTH >= 3 && WORD_LENGTH <= 8) {
      const factor = WIDTH_FACTORS[WORD_LENGTH] || 0.8;
      const tileSize = Math.min(MAX_TILE_SIZE, Math.floor(window.innerWidth * factor / WORD_LENGTH));
      board.style.gridTemplateColumns = `repeat(${WORD_LENGTH}, ${tileSize}px)`;
      board.style.gridAutoRows = `${tileSize}px`;
      // обновление размера шрифта
      document.documentElement.style.setProperty('--tile-font-size', `${tileSize * 0.6}px`);
    }
  }

  // Начальное применение размеров
  updateBoardSize();

  // Обновление при изменении размера окна
  window.addEventListener('resize', updateBoardSize);
  

  for (let i = 0; i < WORD_LENGTH * MAX_GUESSES; i++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    board.appendChild(tile);
  }

  currentGuess = '';
  currentRow = 0;
  generateKeyboard(document.getElementById('swap-keys-toggle')?.checked);
  endgameModal.classList.add('hidden');
  document.addEventListener('keydown', handleKeyPress);
}

function updateStatsModal() {
  const total = parseInt(localStorage.getItem('stat_total') || 0);
  const wins = parseInt(localStorage.getItem('stat_wins') || 0);
  const losses = parseInt(localStorage.getItem('stat_losses') || 0);
  const lengthSum = parseInt(localStorage.getItem('stat_length_sum') || 0);
  const last = localStorage.getItem('stat_last') || '-';
  const bestTry = parseInt(localStorage.getItem('stat_best_try') || 0);
  const currentStreak = parseInt(localStorage.getItem('stat_current_streak') || 0);
  const maxStreak = parseInt(localStorage.getItem('stat_max_streak') || 0);

  const rate = total ? Math.round((wins / total) * 100) : 0;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-wins').textContent = wins;
  document.getElementById('stat-rate').textContent = rate + '%';
  document.getElementById('stat-best').textContent = bestTry ? `#${bestTry}` : '#0';
  document.getElementById('stat-streak').textContent = currentStreak;
  document.getElementById('stat-maxstreak').textContent = maxStreak;
}

document.addEventListener('DOMContentLoaded', () => {  
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const colorBlindToggle = document.getElementById('color-blind-toggle');
  const statsBtn = document.getElementById('stats-btn');
  const statsModal = document.getElementById('stats-modal');
  const closeStats = document.getElementById('close-stats');

  document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !endgameModal.classList.contains('hidden')) {
    endgameModal.classList.remove('show');

    endgameModal.addEventListener('transitionend', function handler(ev) {
      if (ev.propertyName === 'opacity') {
        endgameModal.classList.remove('fade');
        endgameModal.classList.add('hidden');
        endgameModal.removeEventListener('transitionend', handler);
        setTimeout(() => location.reload(), 50);
      }
    });
  }
});

  statsBtn.addEventListener('click', () => {
    updateStatsModal();
    statsModal.classList.remove('hidden');
    statsModal.classList.add('fade');
  
    // Позволяет браузеру применить transition
    requestAnimationFrame(() => {
      statsModal.classList.add('show');
    });
  });
  
  closeStats.addEventListener('click', () => {
    statsModal.classList.remove('show');
    statsModal.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity') {
        statsModal.classList.remove('fade');
        statsModal.classList.add('hidden');
        statsModal.removeEventListener('transitionend', handler);
      }
    });
  });

  // Тема
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }

  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('fade');
  
    requestAnimationFrame(() => {
      settingsModal.classList.add('show');
    });
  
    darkModeToggle.checked = document.body.classList.contains('dark');
  });
  
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('show');
    settingsModal.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity') {
        settingsModal.classList.remove('fade');
        settingsModal.classList.add('hidden');
        settingsModal.removeEventListener('transitionend', handler);
      }
    });
  });

  darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark', darkModeToggle.checked);
    localStorage.setItem('theme', darkModeToggle.checked ? 'dark' : 'light');
  });

  colorBlindToggle.addEventListener('change', () => {
    document.body.classList.toggle('color-blind', colorBlindToggle.checked);
    localStorage.setItem('color-blind', colorBlindToggle.checked ? 'true' : 'false');
  });

  if (localStorage.getItem('color-blind') === 'true') {
    document.body.classList.add('color-blind');
    colorBlindToggle.checked = true;
  }

  if (localStorage.getItem('confetti') === 'true') {
    confettiToggle.checked = true;
  }

  confettiToggle.addEventListener('change', () => {
    localStorage.setItem('confetti', confettiToggle.checked ? 'true' : 'false');
  });

  // Закрытие и новая игра
  closeEndgame.addEventListener('click', () => {
    endgameModal.classList.remove('show');
    endgameModal.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity') {
        endgameModal.classList.remove('fade');
        endgameModal.classList.add('hidden');
        endgameModal.removeEventListener('transitionend', handler);
      }
    });
  });
  
  newGameModalBtn.addEventListener('click', () => {
    endgameModal.classList.remove('show');
    endgameModal.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity') {
        endgameModal.classList.remove('fade');
        endgameModal.classList.add('hidden');
        endgameModal.removeEventListener('transitionend', handler);
        setTimeout(() => location.reload(), 50); // чуть позже, чтобы DOM успел отрисовать
      }
    });
  });

  const infoBtn = document.getElementById('info-btn');
  const howtoModal = document.getElementById('howto-modal');
  const closeHowtoBtn = document.getElementById('close-howto');

  infoBtn.addEventListener('click', () => {
    howtoModal.classList.remove('hidden');
    howtoModal.classList.add('fade');
  
    requestAnimationFrame(() => {
      howtoModal.classList.add('show');
    });
  });
  
  closeHowtoBtn.addEventListener('click', () => {
    howtoModal.classList.remove('show');
    howtoModal.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity') {
        howtoModal.classList.remove('fade');
        howtoModal.classList.add('hidden');
        howtoModal.removeEventListener('transitionend', handler);
      }
    });
  });

  const langBtn = document.getElementById('language-btn');
  const langModal = document.getElementById('language-modal');
  const openLangBtn = document.getElementById('language-btn');
  const closeLangBtn = document.getElementById('close-language-modal');

  openLangBtn.addEventListener('click', () => {
    langModal.classList.remove('hidden');
    langModal.classList.add('fade');
  
    requestAnimationFrame(() => {
      langModal.classList.add('show');
    });
  });
  
  closeLangBtn.addEventListener('click', () => {
    langModal.classList.remove('show');
    langModal.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity') {
        langModal.classList.remove('fade');
        langModal.classList.add('hidden');
        langModal.removeEventListener('transitionend', handler);
      }
    });
  });

  const swapToggle = document.getElementById('swap-keys-toggle');
  const savedSwap = localStorage.getItem('swapKeys') === 'true';
  swapToggle.checked = savedSwap;
  generateKeyboard(savedSwap);

  swapToggle.addEventListener('change', () => {
    const swap = swapToggle.checked;
    localStorage.setItem('swapKeys', swap);
    generateKeyboard(swap);
  });

  document.querySelectorAll('.length-btn').forEach(button => {
    button.addEventListener('click', () => {
      const newLength = parseInt(button.textContent);
      if (!WORDS_BY_LENGTH[newLength]) {
        alert(`Нет слов для длины ${newLength}`);
        return;
      }
  
      const settingsModal = document.getElementById('settings-modal');
      const modalContent = settingsModal.querySelector('.modal-content');
  
      settingsModal.classList.remove('show');
  
      settingsModal.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'opacity') {
          settingsModal.classList.remove('fade');
          settingsModal.classList.add('hidden');
          settingsModal.removeEventListener('transitionend', handler);
  
          localStorage.setItem('wordLength', newLength);
          setTimeout(() => location.reload(), 50); // дайте время DOM закрыться
        }
      });
    });
  });

  document.querySelectorAll('.length-btn').forEach(btn => {
    if (parseInt(btn.textContent) === WORD_LENGTH) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  resetGame();

  const resetStatsBtn = document.getElementById('reset-stats-btn');
  resetStatsBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your statistics?")) {
      const statKeys = [
        'stat_total', 'stat_wins', 'stat_losses',
        'stat_length_sum', 'stat_last',
        'stat_best_try', 'stat_current_streak', 'stat_max_streak'
      ];
      statKeys.forEach(key => localStorage.removeItem(key));
      updateStatsModal();
    }
  });
  const titleWord = document.querySelector('.title-word');
  const topControls = document.getElementById('top-controls');

  window.addEventListener('scroll', () => {
    const topControlsBottom = topControls.getBoundingClientRect().bottom;

    if (topControlsBottom < 0) {
      titleWord.classList.add('show');
    } else {
      titleWord.classList.remove('show');
    }
  });
  
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('active');
    });
  });

  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});