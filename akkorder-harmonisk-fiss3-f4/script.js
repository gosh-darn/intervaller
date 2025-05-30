function disableAllLinks() {
  for (let i = 1; i <= 6; i++) {
    const link = document.getElementById(String(i));
    link.style.pointerEvents = 'none';
    link.style.opacity = '0.4';
  }
}

let previousLetter = null;
let currentFilePath = null;
let currentAnswer = null;
let previousAnswer = null;
let isGuessing = false;
let isResetting = false;
const originalText = document.getElementById('feedback').textContent;
const guessedLinks = new Set();

disableAllLinks(); // 🔒 Initially disable all guess buttons

function getRandomFilePath() {
  const letters = 'abcdefghijkl';
  let randomIndex, randomLetter;

  do {
    randomIndex = Math.floor(Math.random() * 6) + 1;
    randomLetter = letters[Math.floor(Math.random() * letters.length)];
  } while (randomIndex === previousAnswer && randomLetter === previousLetter);

  previousAnswer = randomIndex;
  previousLetter = randomLetter;
  currentAnswer = randomIndex;

  currentFilePath = `../lyd-akkorder-harmonisk-fiss3-f4/${String(randomIndex).padStart(2, '0')}${randomLetter}.opus`;

  return currentFilePath;
}


async function playCurrentSound() {
  if (isResetting) return;

  let filePath;
  if (currentAnswer === null) {
    filePath = getRandomFilePath();
    isGuessing = true;
    enableAllLinks();
  } else {
    filePath = currentFilePath;
  }

  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();

    // Fetch the audio file
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();

    // Decode audio data
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    // Create a buffer source
    const source = context.createBufferSource();
    source.buffer = audioBuffer;

    // Create gain node for fade-in
    const gainNode = context.createGain();

    // Connect nodes: source -> gain -> destination
    source.connect(gainNode).connect(context.destination);

    // Start with gain 0 (mute)
    gainNode.gain.setValueAtTime(0, context.currentTime);

    // Ramp up gain to 1 over 0.02 seconds (20 ms fade-in)
    gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.02);

    // Start playback immediately
    source.start();

  } catch (error) {
    console.error('Error playing audio:', error);
  }
}


function showFeedback(message, reset = false) {
  const feedback = document.getElementById('feedback');
  const playButton = document.getElementById('playButton');

  feedback.style.transition = 'none';
  feedback.style.opacity = '1';
  feedback.textContent = message;
  void feedback.offsetWidth;

  const duration = (message === 'Yup' && reset) ? '0.5s' : '2s';
  feedback.style.transition = `opacity ${duration}`;
  feedback.style.opacity = '0';

  if (reset) {
    isResetting = true;
    playButton.classList.add('disabled'); // 🔒 visually disable

    setTimeout(() => {
      feedback.textContent = originalText;
      feedback.style.transition = 'opacity 2s';
      feedback.style.opacity = '1';

      currentAnswer = null;
      isGuessing = false;
      isResetting = false;

      playButton.classList.remove('disabled'); // ✅ re-enable
      guessedLinks.clear();
      enableAllLinks();
    }, 500); // matches 1s fade for Yup
  }
}


function disableLink(id) {
  const link = document.getElementById(id);
  link.style.pointerEvents = 'none';
  link.style.opacity = '0.4';
}

function enableAllLinks() {
  for (let i = 1; i <= 6; i++) {
    const link = document.getElementById(String(i));
    link.style.pointerEvents = 'auto';
    link.style.opacity = '1';
  }
}

document.getElementById('playButton').addEventListener('click', function (event) {
  event.preventDefault();
  playCurrentSound();
});

for (let i = 1; i <= 6; i++) {
  document.getElementById(String(i)).addEventListener('click', function (event) {
    event.preventDefault();
    if (!isGuessing || isResetting) return;

    const guess = parseInt(this.id, 10);
    if (guessedLinks.has(guess)) return;

    guessedLinks.add(guess);
    disableLink(this.id);

    if (guess === currentAnswer) {
      showFeedback('Yup', true);
    } else {
      showFeedback('Nope');
    }
  });
}

document.addEventListener('keydown', function (event) {
  // Don't trigger if user is typing in an input/textarea
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  // Spacebar support
  if (event.code === 'Space') {
    event.preventDefault(); // Prevent scrolling
    playCurrentSound();
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const arrowLink = document.getElementById('arrow');
    if (arrowLink) {
      arrowLink.click();
    }
  }
});
