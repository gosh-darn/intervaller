let audioContext = null;
let currentSource = null;
let currentGain = null;

let currentTrack = null;   // holds the currently selected audio file index
let previousTrack = null;  // prevent repeats on roll

function getRandomFilePath() {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * 88) + 1;
  } while (randomIndex === previousTrack);

  previousTrack = randomIndex;
  currentTrack = randomIndex;

  return `../lyd-noter/${String(randomIndex).padStart(2, '0')}.opus`;
}

async function playFile(filePath) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Fade out and stop any currently playing audio
    if (currentSource && currentGain) {
      const now = audioContext.currentTime;
      currentGain.gain.cancelScheduledValues(now);
      currentGain.gain.setValueAtTime(currentGain.gain.value, now);
      currentGain.gain.linearRampToValueAtTime(0, now + 0.1);
      currentSource.stop(now + 0.1);
    }

    // Fetch and decode
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.02);

    source.connect(gainNode).connect(audioContext.destination);
    source.start();

    currentSource = source;
    currentGain = gainNode;

  } catch (error) {
    console.error('Error playing audio:', error);
  }
}

function playCurrentSound() {
  if (currentTrack === null) {
    // no file yet → roll one first
    rollAndPlay();
  } else {
    const filePath = `../lyd-noter/${String(currentTrack).padStart(2, '0')}.opus`;
    playFile(filePath);
  }
}

function rollAndPlay() {
  const filePath = getRandomFilePath();
  playFile(filePath);
}

document.getElementById('playButton').addEventListener('click', function (event) {
  event.preventDefault();
  playCurrentSound();
});

document.getElementById('rollButton').addEventListener('click', function (event) {
  event.preventDefault();
  rollAndPlay();
});

// Optional keyboard shortcuts
document.addEventListener('keydown', function (event) {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (event.code === 'Space') {
    event.preventDefault();
    playCurrentSound();
  }
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    rollAndPlay();
  }
});
