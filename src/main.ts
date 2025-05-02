// src/main.ts
import { createIcons, icons } from 'lucide';
import { createVisualizer }   from './visualizer';
import './styles/retro.css';

// ——————————————
// 1) Inicializar iconos Lucide
// ——————————————
createIcons({ icons });

// ——————————————
// 2) Referencias al DOM
// ——————————————
const scUrlInput    = document.getElementById('scUrlInput')   as HTMLInputElement;
const loadScBtn     = document.getElementById('loadScBtn')    as HTMLButtonElement;
const loadBtn       = document.getElementById('loadBtn')      as HTMLButtonElement;
const queueBtn      = document.getElementById('queueBtn')     as HTMLButtonElement;
const playPauseBtn  = document.getElementById('playPauseBtn') as HTMLButtonElement;
const prevBtn       = document.getElementById('prevBtn')      as HTMLButtonElement;
const nextBtn       = document.getElementById('nextBtn')      as HTMLButtonElement;
const queueEl       = document.getElementById('queue')        as HTMLUListElement;
const canvas        = document.getElementById('canvas')       as HTMLCanvasElement;
const fullscreenBtn = document.getElementById('fullscreenBtn') as HTMLButtonElement;

// ——————————————
// 3) AudioContext + Analyser
// ——————————————
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

// ——————————————
// 4) Estado global
// ——————————————
let vizCtl: { start: ()=>void; stop: ()=>void; } | null = null;
let audio = new Audio();                   // inicial dummy
audio.crossOrigin = 'anonymous';
let queue: string[] = [];
let current = 0;
let playing = false;

// ——————————————
// 5) Íconos Play/Pause
// ——————————————
const playIcon  = '<i data-lucide="play"></i>';
const pauseIcon = '<i data-lucide="pause"></i>';
function updatePlayIcon() {
  playPauseBtn.innerHTML = playing ? pauseIcon : playIcon;
  createIcons({ icons });
}

// ——————————————
// 6) Pintar cola
// ——————————————
function renderQueue() {
  queueEl.innerHTML = '';
  queue.forEach((_, i) => {
    const li = document.createElement('li');
    li.textContent = `Track ${i+1}`;
    if (i === current) li.classList.add('active');
    queueEl.appendChild(li);
  });
}

// ——————————————
// 7) Cargar y reproducir pista (con auto-avance)
// ——————————————
async function loadTrack(idx: number) {
  if (!queue[idx]) return;

  // si ya hay audio, lo detenemos y limpiamos visual
  audio.pause();
  vizCtl?.stop();
  vizCtl = null;

  // crear nuevo Audio y enganchar listener 'ended'
  audio = new Audio(queue[idx]);
  audio.crossOrigin = 'anonymous';
  audio.addEventListener('ended', async () => {
    // actualizar estado e icono
    playing = false;
    updatePlayIcon();

    // si hay más pistas...
    if (current < queue.length - 1) {
      // espera 1 segundo
      await new Promise(res => setTimeout(res, 1000));
      // avanza índice y recarga
      current++;
      await loadTrack(current);
    }
  });

  // conectar al Analyser antes de play()
  const srcNode = audioCtx.createMediaElementSource(audio);
  srcNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  // crear visualizador la primera vez
  if (!vizCtl) {
    vizCtl = createVisualizer(audioCtx, analyser, canvas);
  }

  // reanudar AudioContext si está en pausa
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  // esperar a que esté listo
  await new Promise<void>(res => {
    audio.addEventListener('canplay', () => res(), { once: true });
  });

  try {
    await audio.play();
    playing = true;
    vizCtl.start();
    updatePlayIcon();
    renderQueue();
  } catch (err) {
    console.error('audio.play() rechazado:', err);
  }
}

// ——————————————
// 8) Eventos UI
// ——————————————

// A) Archivos locales
loadBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'audio/*';
  inp.multiple = true;
  inp.onchange = async () => {
    const files = Array.from(inp.files || []);
    queue = files.map(f => URL.createObjectURL(f));
    current = 0;
    renderQueue();
    await loadTrack(current);
  };
  inp.click();
});

// B) SoundCloud via proxy
loadScBtn.addEventListener('click', async () => {
  const link = scUrlInput.value.trim();
  if (!link) {
    alert('Introduce una URL de SoundCloud');
    return;
  }
  if (!link.includes('soundcloud.com')) {
    alert('La URL debe ser de SoundCloud');
    return;
  }
  let clean = link;
  try {
    const u = new URL(link);
    clean = `${u.origin}${u.pathname}`;
  } catch {}
  const proxy = `/api/sc-stream?url=${encodeURIComponent(clean)}`;
  queue.push(proxy);
  current = queue.length - 1;
  renderQueue();
  await loadTrack(current);
});

// C) Mostrar/ocultar cola
queueBtn.addEventListener('click', () => {
  queueEl.classList.toggle('hidden');
});

// D) Play/Pause
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

// E) Prev/Next
prevBtn.addEventListener('click', async () => {
  if (current > 0) {
    current--;
    await loadTrack(current);
  }
});
nextBtn.addEventListener('click', async () => {
  if (current < queue.length - 1) {
    current++;
    await loadTrack(current);
  }
});

// G) Fullscreen para TODO
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// H) Fullscreen SOLO canvas
canvas.addEventListener('click', () => {
  if (document.fullscreenElement === canvas) {
    document.exitFullscreen();
  } else {
    canvas.requestFullscreen();
  }
});
