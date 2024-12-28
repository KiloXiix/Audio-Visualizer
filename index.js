const audioUpload = document.getElementById('audio-upload');
const playButton = document.getElementById('play-button');
const canvas = document.getElementById('audio-visualizer');
const ctx = canvas.getContext('2d');

let audioContext, source, analyser, bufferLength, dataArray;
let isPlaying = false;
let audioFile, audioElement;

// Setup Visualizer
function setupVisualizer() {
  canvas.width = 400;
  canvas.height = 400;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(audioContext.destination);
}

// Draw Circular Visualizer
let rotationAngle = 0;

function drawVisualizer() {
  if (!isPlaying) return; // Stop visualizer when audio stops

  requestAnimationFrame(drawVisualizer);

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Save the current canvas state
  ctx.save();

  // Move the origin to the center of the canvas
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.translate(centerX, centerY);

  // Rotate the canvas for the animation effect
  ctx.rotate(rotationAngle);

  // Draw the circular waveform
  ctx.beginPath();
  const radius = 70;  // Increased radius of the circle
  const numBars = bufferLength / 2.5; // Number of frequency bins

  // Loop through each frequency bin and draw it evenly around the full circle
  for (let i = 0; i < numBars; i++) {
    const angle = (i / numBars) * 2 * Math.PI;
    const barHeight = dataArray[i] / 2;
    const x = Math.cos(angle) * (radius + barHeight);
    const y = Math.sin(angle) * (radius + barHeight);
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#03dac6';
  ctx.stroke();

  ctx.restore();
  rotationAngle += 0.01;
}

// Event Listeners
audioUpload.addEventListener('change', (event) => {
  audioFile = event.target.files[0];
  if (audioFile) {
    if (audioElement) {
      // Stop currently playing audio if user uploads a new file
      audioElement.pause();
      audioElement.currentTime = 0;
      isPlaying = false;
      playButton.textContent = 'Play';
    }
    audioElement = new Audio(URL.createObjectURL(audioFile));
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaElementSource(audioElement);
    setupVisualizer();

    // Reset button when audio ends
    audioElement.addEventListener('ended', () => {
      setTimeout(() => {
        isPlaying = false;
        playButton.textContent = 'Play';
      }, 1000); // Wait for 2 seconds (2000 milliseconds)
    });
    
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
  } else {
    audioElement.play();
    isPlaying = true;
    playButton.textContent = 'Pause';
    drawVisualizer();
  }
});
