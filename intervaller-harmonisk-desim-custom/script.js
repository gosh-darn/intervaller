function disableAllLinks() {
  for (let i = 1; i <= 16; i++) {
    const link = document.getElementById(String(i));
    link.style.pointerEvents = 'none';
    link.style.opacity = '0.4';
  }
}

let audioContext = null;
let currentSource = null;
let currentGain = null;

let previousLetter = null;
let currentFilePath = null;
let currentAnswer = null;
let previousAnswer = null;
let isGuessing = false;
let isResetting = false;
const originalText = document.getElementById('feedback').textContent;
const guessedLinks = new Set();

disableAllLinks(); // 🔒 Initially disable all guess buttons

function getSelectedFilePath() {
  const letters = 'abcdefghijkl';
  const slider = document.getElementById('slider');
  const letterIndex = parseInt(slider.value, 10) - 1; // 0-based index
  const selectedLetter = letters[letterIndex];

  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * 16) + 1;
  } while (randomIndex === previousAnswer && selectedLetter === previousLetter);

  previousAnswer = randomIndex;
  previousLetter = selectedLetter;
  currentAnswer = randomIndex;

  currentFilePath = `../lyd-intervaller-harmonisk-fiss3-f4/${String(randomIndex).padStart(2, '0')}${selectedLetter}.opus`;

  return currentFilePath;
}



async function playCurrentSound() {
  if (isResetting) return;

  let filePath;
  if (currentAnswer === null) {
    filePath = getSelectedFilePath();
    isGuessing = true;
    enableAllLinks();
  } else {
    filePath = currentFilePath;
  }

  try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Fade out and stop any currently playing audio
      if (currentSource && currentGain) {
        const now = audioContext.currentTime;
        currentGain.gain.cancelScheduledValues(now);
        currentGain.gain.setValueAtTime(currentGain.gain.value, now);
        currentGain.gain.linearRampToValueAtTime(0, now + 0.1); // 100ms fade-out
        currentSource.stop(now + 0.1); // Stop after fade-out
      }

      // Fetch new audio
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.02); // Fade-in

      source.connect(gainNode).connect(audioContext.destination);
      source.start();

      // Track current source and gain
      currentSource = source;
      currentGain = gainNode;

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
  for (let i = 1; i <= 16; i++) {
    const link = document.getElementById(String(i));
    link.style.pointerEvents = 'auto';
    link.style.opacity = '1';
  }
}

document.getElementById('playButton').addEventListener('click', function (event) {
  event.preventDefault();
  playCurrentSound();
});

for (let i = 1; i <= 16; i++) {
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
