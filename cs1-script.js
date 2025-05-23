let currentAnswer = null;
let previousAnswer = null;
let isGuessing = false;
let isResetting = false;
const originalText = document.getElementById('feedback').textContent;
const guessedLinks = new Set();

function getRandomFilePath() {
  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * 12) + 1;
  } while (randomIndex === previousAnswer);

  previousAnswer = randomIndex;
  currentAnswer = randomIndex;

  return `lyd/${String(randomIndex).padStart(2, '0')}.flac`;
}

function playCurrentSound() {
  if (isResetting) return; // Prevent action while resetting
  if (currentAnswer === null) {
    const filePath = getRandomFilePath();
    const audio = new Audio(filePath);
    audio.play();
    isGuessing = true;
  } else {
    const filePath = `lyd/${String(currentAnswer).padStart(2, '0')}.flac`;
    const audio = new Audio(filePath);
    audio.play();
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
  for (let i = 1; i <= 12; i++) {
    const link = document.getElementById(String(i));
    link.style.pointerEvents = 'auto';
    link.style.opacity = '1';
  }
}

document.getElementById('playButton').addEventListener('click', function (event) {
  event.preventDefault();
  playCurrentSound();
});

for (let i = 1; i <= 12; i++) {
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
