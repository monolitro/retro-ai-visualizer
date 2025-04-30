// src/main.ts

import { createIcons, icons } from 'lucide';
import { createVisualizer }   from './visualizer';
import './styles/retro.css'; // ← aquí tus estilos

// 1) Iconos Lucide
createIcons({ icons });

// 2) Referencias al DOM
const loadBtn       = document.getElementById('loadBtn')       as HTMLButtonElement;
const queueBtn      = document.getElementById('queueBtn')      as HTMLButtonElement;
const playPauseBtn  = document.getElementById('playPauseBtn')  as HTMLButtonElement;
const prevBtn       = document.getElementById('prevBtn')       as HTMLButtonElement;
const nextBtn       = document.getElementById('nextBtn')       as HTMLButtonElement;
const queueEl       = document.getElementById('queue')         as HTMLUListElement;
const fullscreenBtn = document.getElementById('fullscreenBtn') as HTMLButtonElement;
const canvas        = document.getElementById('canvas')        as HTMLCanvasElement;

// 3) AudioContext + AnalyserNode
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

// 4) Estado inicial
let vizCtl: any = null;
let audio = new Audio();
let queue: string[] = [];
let current = 0;
let playing = false;

// 5) Play/Pause iconos
const playIcon  = '<i data-lucide="play"></i>';
const pauseIcon = '<i data-lucide="pause"></i>';
function updatePlayIcon() {
  playPauseBtn.innerHTML = playing ? pauseIcon : playIcon;
  createIcons({ icons });
}

// 6) Render cola
function renderQueue() {
  queueEl.innerHTML = '';
  queue.forEach((_, i) => {
    const li = document.createElement('li');
    li.textContent = `Track ${i + 1}`;
    if (i === current) li.classList.add('active');
    queueEl.appendChild(li);
  });
}

// 7) Cargar y reproducir pista
async function loadTrack(idx: number) {
  if (!queue[idx]) return;
  audio.pause();

  audio = new Audio(queue[idx]);
  audio.crossOrigin = 'anonymous';

  const srcNode = audioCtx.createMediaElementSource(audio);
  srcNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  if (!vizCtl) {
    vizCtl = createVisualizer(audioCtx, analyser, canvas);
  }

  if (audioCtx.state === 'suspended') await audioCtx.resume();

  await new Promise<void>(r =>
    audio.addEventListener('canplay', () => r(), { once: true })
  );
  await audio.play();

  playing = true;
  vizCtl.start();
  updatePlayIcon();
  renderQueue();
}

// 8) UI events (load files, controls, fullscreen…)

loadBtn.addEventListener('click', () => { /* … */ });
queueBtn.addEventListener('click', () => { /* … */ });
playPauseBtn.addEventListener('click', () => { /* … */ });
prevBtn.addEventListener('click', () => { /* … */ });
nextBtn.addEventListener('click', () => { /* … */ });
audio.addEventListener('ended', () => { /* … */ });
fullscreenBtn.addEventListener('click', () => { /* … */ });
canvas.addEventListener('click', () => { /* … */ });
