const audioUpload = document.getElementById('audio-upload');
const playButton = document.getElementById('play-button');
const canvas = document.getElementById('audio-visualizer');
const timeline = document.getElementById('audio-timeline');
const ctx = canvas.getContext('2d');

let audioContext, source, analyser, bufferLength, dataArray;
let isPlaying = false;
let audioFile, audioElement;
let animationFrameId;

// Setup Visualizer
function setupVisualizer() {
  canvas.width = 320;
  canvas.height = 320;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(audioContext.destination);
}

// Draw Record Disc Visualizer
let rotationAngle = 0;
function drawVisualizer() {
  if (!isPlaying) return;
  animationFrameId = requestAnimationFrame(drawVisualizer);
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Center
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotationAngle);

  // Draw record disc base
  ctx.beginPath();
  ctx.arc(0, 0, 100, 0, 2 * Math.PI);
  ctx.fillStyle = '#232323';
  ctx.shadowColor = '#03dac6';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw grooves
  for (let r = 70; r < 100; r += 5) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(98,0,234,0.12)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Draw center label
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, 2 * Math.PI);
  ctx.fillStyle = '#03dac6';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, 2 * Math.PI);
  ctx.fillStyle = '#121212';
  ctx.fill();

  // Draw circular waveform
  ctx.save();
  ctx.rotate(-rotationAngle); // Keep waveform upright
  ctx.beginPath();
  const radius = 100;
  const maxBarHeight = 50; // Maximum bar height so waveform fits inside the disc
  const numBars = bufferLength / 2.5;
  for (let i = 0; i < numBars; i++) {
    const angle = (i / numBars) * 2 * Math.PI;
    let barHeight = dataArray[i] / 2.2;
    if (barHeight > maxBarHeight) barHeight = maxBarHeight;
    const x = Math.cos(angle) * (radius + barHeight);
    const y = Math.sin(angle) * (radius + barHeight);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#03dac6';
  ctx.shadowColor = '#03dac6';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
  rotationAngle += 0.012;
}

// Timeline update
function updateTimeline() {
  if (audioElement && audioElement.duration) {
    timeline.max = audioElement.duration;
    timeline.value = audioElement.currentTime;
  }
}

// Event Listeners
audioUpload.addEventListener('change', (event) => {
  audioFile = event.target.files[0];
  if (audioFile) {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      isPlaying = false;
      playButton.textContent = 'Play';
      cancelAnimationFrame(animationFrameId);
    }
    audioElement = new Audio(URL.createObjectURL(audioFile));
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaElementSource(audioElement);
    setupVisualizer();

    audioElement.addEventListener('ended', () => {
      setTimeout(() => {
        isPlaying = false;
        playButton.textContent = 'Play';
        cancelAnimationFrame(animationFrameId);
      }, 1000);
    });

    audioElement.addEventListener('timeupdate', updateTimeline);
    audioElement.addEventListener('loadedmetadata', updateTimeline);
    timeline.value = 0;
    timeline.max = 1;
  }
});

playButton.addEventListener('click', () => {
  if (!audioFile) {
    alert('Please upload an audio file first.');
    return;
  }
  if (isPlaying) {
    audioElement.pause();
    isPlaying = false;
    playButton.textContent = 'Play';
    cancelAnimationFrame(animationFrameId);
  } else {
    audioElement.play();
    isPlaying = true;
    playButton.textContent = 'Pause';
    drawVisualizer();
  }
});

timeline.addEventListener('input', (e) => {
  if (audioElement && audioElement.duration) {
    audioElement.currentTime = e.target.value;
    updateTimeline();
  }
});
