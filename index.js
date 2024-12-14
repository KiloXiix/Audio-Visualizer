const audioUpload = document.getElementById('audio-upload');
const playButton = document.getElementById('play-button');
const subtitleDisplay = document.getElementById('subtitle-display');
const canvas = document.getElementById('audio-visualizer');
const ctx = canvas.getContext('2d');

let audioContext, source, analyser, bufferLength, dataArray;
let isPlaying = false;
let audioFile, audioElement;
let speechRecognition;
let transcription = [];

// Setup Visualizer
function setupVisualizer() {
  canvas.width = 300;
  canvas.height = 300;

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
  const radius = 50;  // Radius of the circle
  const numBars = bufferLength/2.5; // Number of frequency bins

  // Loop through each frequency bin and draw it evenly around the full circle
  for (let i = 0; i < numBars; i++) {
    // Spread the frequency bins evenly around the full circle (360 degrees)
    const angle = (i / numBars) * 2 * Math.PI;  // Full circle for frequency bins

    // Calculate the height of the bar based on frequency data
    const barHeight = dataArray[i] / 2;  // Height of each bar, scaled
    const x = Math.cos(angle) * (radius + barHeight);  // X position based on angle and height
    const y = Math.sin(angle) * (radius + barHeight);  // Y position based on angle and height

    // Draw a line to each point in the circle
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#03dac6';  // Set line color
  ctx.stroke();

  // Restore the original canvas state
  ctx.restore();

  // Increment the rotation angle to animate the circular movement
  rotationAngle += 0.01;  // Adjust the speed of rotation (lower = slower)
}


// Real-Time Speech-to-Text
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Speech Recognition is not supported in this browser.');
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.interimResults = true; // Show results as they are recognized
  speechRecognition.continuous = true; // Keep listening until stopped

  // Append transcription results
  speechRecognition.onresult = (event) => {
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;
    transcription.push(transcript);
    subtitleDisplay.innerText = transcription.slice(-1); // Display last portion
  };

  speechRecognition.onerror = (event) => {
    console.error('Speech Recognition Error:', event.error);
  };
}

// Event Listeners
audioUpload.addEventListener('change', (event) => {
  audioFile = event.target.files[0];
  if (audioFile) {
    audioElement = new Audio(URL.createObjectURL(audioFile));
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaElementSource(audioElement);
    setupVisualizer();
    setupSpeechRecognition();
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
    speechRecognition.stop(); // Stop recognition
  } else {
    audioElement.play();
    isPlaying = true;
    playButton.textContent = 'Pause';
    drawVisualizer();
    speechRecognition.start(); // Start recognition
  }
});