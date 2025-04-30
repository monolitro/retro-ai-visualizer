// src/main.ts
import { createIcons, icons } from 'lucide';
import './styles/retro.css'; 
import { createVisualizer, PRESETS, PRESET_NAMES } from './visualizer';

// 1) Iconos Lucide
createIcons({ icons });

// 2) DOM refs
const loadBtn       = document.getElementById('loadBtn')       as HTMLButtonElement;
const queueBtn      = document.getElementById('queueBtn')      as HTMLButtonElement;
const playPauseBtn  = document.getElementById('playPauseBtn')  as HTMLButtonElement;
const prevBtn       = document.getElementById('prevBtn')       as HTMLButtonElement;
const nextBtn       = document.getElementById('nextBtn')       as HTMLButtonElement;
const queueEl       = document.getElementById('queue')         as HTMLUListElement;
const fullscreenBtn = document.getElementById('fullscreenBtn') as HTMLButtonElement;
const canvas        = document.getElementById('canvas')        as HTMLCanvasElement;

// 3) AudioContext + Analyser
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

// 4) Estado
let vizCtl: { butter: any; start(): void; stop(): void } | null = null;
let audio = new Audio();
let queue: string[] = [];
let current = 0;
let playing = false;

// 5) Play/Pause helper
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

// 7) Cargar y reproducir
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

  // cada pista arranca con preset random
  const choice = PRESET_NAMES[Math.floor(Math.random() * PRESET_NAMES.length)];
  vizCtl.butter.loadPreset(PRESETS[choice], 0.0);

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

// 8) Beat‐loop: preset flash al bajo
const freqData      = new Uint8Array(analyser.frequencyBinCount);
const BEAT_THRESH   = 200;
const MIN_INTERVAL  = 0.15;
let lastBeat = 0;

function beatLoop() {
  analyser.getByteFrequencyData(freqData);
  const bass = freqData.slice(0,5).reduce((a,b)=>a+b,0) / 5;
  const now  = audioCtx.currentTime;

  if (
    vizCtl &&
    bass > BEAT_THRESH &&
    now - lastBeat > MIN_INTERVAL
  ) {
    lastBeat = now;
    const p = PRESET_NAMES[Math.floor(Math.random()*PRESET_NAMES.length)];
    vizCtl.butter.loadPreset(PRESETS[p], 0.1);
  }

  requestAnimationFrame(beatLoop);
}

// 9) UI Events

loadBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'audio/*'; inp.multiple = true;
  inp.onchange = () => {
    queue = Array.from(inp.files||[]).map(f=>URL.createObjectURL(f));
    current = 0;
    renderQueue();
    loadTrack(0);
    beatLoop();
  };
  inp.click();
});

queueBtn.addEventListener('click', () => {
  queueEl.classList.toggle('hidden');
});

playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (playing) {
    audio.pause();
    vizCtl?.stop();
    playing = false;
  } else {
    audio.play();
    vizCtl?.start();
    playing = true;
  }
  updatePlayIcon();
});

prevBtn.addEventListener('click', () => {
  if (current > 0) { current--; loadTrack(current); }
});
nextBtn.addEventListener('click', () => {
  if (current < queue.length - 1) { current++; loadTrack(current); }
});

audio.addEventListener('ended', () => {
  if (current < queue.length - 1) {
    current++;
    loadTrack(current);
  } else {
    playing = false;
    vizCtl?.stop();
    updatePlayIcon();
  }
});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else                              document.exitFullscreen();
});
// 14) Fullscreen al hacer click en el canvas
canvas.addEventListener('click', () => {
  const fsElement = document.fullscreenElement || 
                    // para webkit:
                    (document as any).webkitFullscreenElement;
  if (!fsElement) {
    if (canvas.requestFullscreen)        canvas.requestFullscreen();
    else if ((canvas as any).webkitRequestFullscreen)  (canvas as any).webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen)         document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen)   (document as any).webkitExitFullscreen();
  }
});
