// src/main.ts

import './styles/retro.css';
import { createIcons, icons } from 'lucide';
import { createVisualizer } from './visualizer';

// 1) Inicializar Lucide
createIcons({ icons });

// 2) Referencias al DOM
const scUrlInput    = document.getElementById('scUrlInput')   as HTMLInputElement;
const loadScBtn     = document.getElementById('loadScBtn')    as HTMLButtonElement;
const loadBtn       = document.getElementById('loadBtn')      as HTMLButtonElement;
const queueBtn      = document.getElementById('queueBtn')     as HTMLButtonElement;
const playPauseBtn  = document.getElementById('playPauseBtn') as HTMLButtonElement;
const prevBtn       = document.getElementById('prevBtn')      as HTMLButtonElement;
const nextBtn       = document.getElementById('nextBtn')      as HTMLButtonElement;
const queueEl       = document.getElementById('queue')        as HTMLUListElement;
const fullscreenBtn = document.getElementById('fullscreenBtn')as HTMLButtonElement;
const canvas        = document.getElementById('canvas')       as HTMLCanvasElement;

// 3) AudioContext + AnalyserNode
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

// 5) Iconos Play/Pause
const playIcon  = '<i data-lucide="play"></i>';
const pauseIcon = '<i data-lucide="pause"></i>';
function updatePlayIcon() {
  playPauseBtn.innerHTML = playing ? pauseIcon : playIcon;
  createIcons({ icons });
}

// 6) Renderizar cola
function renderQueue() {
  queueEl.innerHTML = '';
  queue.forEach((_, i) => {
    const li = document.createElement('li');
    li.textContent = `Track ${i + 1}`;
    if (i === current) li.classList.add('active');
    queueEl.appendChild(li);
  });
}

// 7) Cargar y reproducir pista, con listeners de debug
async function loadTrack(idx: number) {
  if (!queue[idx]) return;
  audio.pause();

  // Creamos el nuevo elemento Audio
  audio = new Audio(queue[idx]);
  audio.crossOrigin = 'anonymous';

  // 🚨 Listeners de depuración
  audio.addEventListener('error', e => {
    console.error('Audio error event:', e);
  });
  audio.addEventListener('stalled', () => {
    console.warn('Audio stalled');
  });
  audio.addEventListener('suspend', () => {
    console.warn('Audio suspended');
  });

  // Conectar al analyser
  const srcNode = audioCtx.createMediaElementSource(audio);
  srcNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  // Crear visualizador la primera vez
  if (!vizCtl) {
    vizCtl = createVisualizer(audioCtx, analyser, canvas);
  }

  // Reactivar contexto si está suspendido
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  // Esperar a canplay
  await new Promise<void>(r =>
    audio.addEventListener('canplay', () => r(), { once: true })
  );

  // Intentar reproducir y capturar errores de play()
  try {
    await audio.play();
  } catch (err) {
    console.error('audio.play() rejected:', err);
  }

  playing = true;
  vizCtl.start();
  updatePlayIcon();
  renderQueue();
}

// 8) Load local files
loadBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'audio/*';
  inp.multiple = true;
  inp.onchange = () => {
    queue = Array.from(inp.files || []).map(f => URL.createObjectURL(f));
    current = 0;
    renderQueue();
    loadTrack(0);
  };
  inp.click();
});

// 9) Load SoundCloud URL
loadScBtn.addEventListener('click', async () => {
  let link = scUrlInput.value.trim();
  if (!link) {
    alert('Introduce una URL de SoundCloud');
    return;
  }
  if (!link.includes('soundcloud.com')) {
    alert('La URL debe ser de SoundCloud');
    return;
  }
  // Limpiar parámetros UTM
  try {
    const u = new URL(link);
    link = `${u.origin}${u.pathname}`;
  } catch {}
  const proxyUrl = `/api/sc-stream?url=${encodeURIComponent(link)}`;
  queue.push(proxyUrl);
  current = queue.length - 1;
  renderQueue();
  await loadTrack(current);
});

// 10) Toggle queue
queueBtn.addEventListener('click', () => {
  queueEl.classList.toggle('hidden');
});

// 11) Play/Pause
playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (playing) {
    audio.pause();
    vizCtl?.stop();
  } else {
    audio.play();
    vizCtl?.start();
  }
  playing = !playing;
  updatePlayIcon();
});

// 12) Prev/Next
prevBtn.addEventListener('click', () => {
  if (current > 0) loadTrack(--current);
});
nextBtn.addEventListener('click', () => {
  if (current < queue.length - 1) loadTrack(++current);
});

// 13) Auto-advance
audio.addEventListener('ended', () => {
  if (current < queue.length - 1) {
    loadTrack(++current);
  } else {
    playing = false;
    vizCtl?.stop();
    updatePlayIcon();
  }
});

// 14) Fullscreen botón
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// 15) Fullscreen click en canvas
canvas.addEventListener('click', () => {
  canvas.requestFullscreen?.();
});
