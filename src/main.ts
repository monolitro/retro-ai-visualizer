import { createIcons, icons } from 'lucide';
import { createVisualizer } from './visualizer';
import './styles/retro.css';

createIcons({ icons });

const scUrlInput   = document.getElementById('scUrlInput') as HTMLInputElement;
const loadScBtn    = document.getElementById('loadScBtn')    as HTMLButtonElement;
const loadBtn      = document.getElementById('loadBtn')      as HTMLButtonElement;
const queueBtn     = document.getElementById('queueBtn')     as HTMLButtonElement;
const playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement;
const prevBtn      = document.getElementById('prevBtn')      as HTMLButtonElement;
const nextBtn      = document.getElementById('nextBtn')      as HTMLButtonElement;
const queueEl      = document.getElementById('queue')        as HTMLUListElement;
const canvas       = document.getElementById('canvas')       as HTMLCanvasElement;

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

let vizCtl: { start(): void; stop(): void } | null = null;
let audio = new Audio();
let queue: string[] = [];
let current = 0;
let playing = false;

const playIcon  = '<i data-lucide="play"></i>';
const pauseIcon = '<i data-lucide="pause"></i>';
function updatePlayIcon() {
  playPauseBtn.innerHTML = playing ? pauseIcon : playIcon;
  createIcons({ icons });
}

function renderQueue() {
  queueEl.innerHTML = '';
  queue.forEach((_, i) => {
    const li = document.createElement('li');
    li.textContent = `Track ${i+1}`;
    if (i === current) li.classList.add('active');
    queueEl.appendChild(li);
  });
}

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

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  await new Promise<void>(res =>
    audio.addEventListener('canplay', () => res(), { once: true })
  );

  await audio.play();
  playing = true;
  vizCtl.start();
  updatePlayIcon();
  renderQueue();
}

loadBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'audio/*';
  inp.multiple = true;
  inp.onchange = () => {
    queue = Array.from(inp.files||[]).map(f => URL.createObjectURL(f));
    current = 0;
    renderQueue();
    loadTrack(0);
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
  } else {
    audio.play();
    vizCtl?.start();
  }
  playing = !playing;
  updatePlayIcon();
});

prevBtn.addEventListener('click', () => {
  if (current > 0) {
    current--;
    loadTrack(current);
  }
});
nextBtn.addEventListener('click', () => {
  if (current < queue.length - 1) {
    current++;
    loadTrack(current);
  }
});

audio.addEventListener('ended', () => {
  vizCtl?.stop();
  setTimeout(() => {
    if (current < queue.length - 1) {
      current++;
      loadTrack(current);
    } else {
      playing = false;
      updatePlayIcon();
    }
  }, 1000);
});

// ** NUEVO ** Load SoundCloud por URL
loadScBtn.addEventListener('click', async () => {
  let link = scUrlInput.value.trim();
  if (!link) {
    return alert('Introduce una URL de SoundCloud');
  }
  if (!link.includes('soundcloud.com')) {
    return alert('La URL debe ser de SoundCloud');
  }
  // elimina parámetros
  try {
    const u = new URL(link);
    link = `${u.origin}${u.pathname}`;
  } catch {}

  // apuntamos al proxy
  const proxyUrl = `/api/sc-stream?url=${encodeURIComponent(link)}`;
  queue.push(proxyUrl);
  current = queue.length - 1;
  renderQueue();
  await loadTrack(current);
});
