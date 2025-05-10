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

// Micrófono de sistema (botón junto a Load Files)
const systemAudioBtn = document.getElementById('systemAudioBtn') as HTMLButtonElement;
let systemAudioStream: MediaStream | null = null;

// ——————————————
// 3) AudioContext + Analyser
// ——————————————
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize               = 2048;
analyser.minDecibels           = -90;
analyser.maxDecibels           = -10;
analyser.smoothingTimeConstant = 0.85;

// Conectar el <audio> al AudioContext
const audio = document.getElementById('audio') as HTMLAudioElement;
audio.crossOrigin = 'anonymous';
const srcNode = audioCtx.createMediaElementSource(audio);
srcNode.connect(audioCtx.destination);  // el audio de tu <audio> va a los auriculares
srcNode.connect(analyser); 

// ——————————————
// Helper: detectar dispositivo loopback (Stereo Mix, Cable, etc.)
// ——————————————
async function getLoopbackStream(): Promise<MediaStream> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs = devices.filter(d => d.kind === 'audioinput');
  // Busca etiquetas comunes de loopback
  const names = /loopback|stereo mix|what you hear|cable output/i;
  const candidate = inputs.find(d => names.test(d.label));
  if (candidate) {
    console.log('Usando dispositivo loopback:', candidate.label);
    return navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: candidate.deviceId } } });
  }
  alert('No se encontró dispositivo Loopback. Usando entrada por defecto.');
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

// ——————————————
// Captura de audio del sistema
// ——————————————
systemAudioBtn.addEventListener('click', async () => {
  if (systemAudioStream) {
    // Detener captura si ya activa
    systemAudioStream.getTracks().forEach(t => t.stop());
    systemAudioStream = null;
    systemAudioBtn.classList.remove('active');
    return;
  }
  try {
    const stream = await getLoopbackStream();
    systemAudioStream = stream;
    systemAudioBtn.classList.add('active');

    const sysSource = audioCtx.createMediaStreamSource(stream);
    sysSource.connect(analyser);

    if (audioCtx.state === 'suspended') await audioCtx.resume();

    // Crear o reiniciar visualizador con audio del sistema
    vizCtl?.stop();
    vizCtl = createVisualizer(audioCtx, analyser, canvas);
    vizCtl.start();

  } catch (err) {
    console.error('Error capturando audio del sistema:', err);
    alert('No se pudo acceder al audio del sistema.');
  }
});

// ——————————————
// Estado global y control de visual
// ——————————————
let vizCtl: { start: ()=>void; stop: ()=>void; } | null = null;
let queue: string[] = [];
let current = 0;
let playing = false;

// ——————————————
// Íconos Play/Pause
// ——————————————
const playIcon  = '<i data-lucide=\"play\"></i>';
const pauseIcon = '<i data-lucide=\"pause\"></i>';
function updatePlayIcon() {
  playPauseBtn.innerHTML = playing ? pauseIcon : playIcon;
  createIcons({ icons });
}

// ——————————————
// Render cola
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
// Cargar y reproducir pista (auto-avance)
// ——————————————
async function loadTrack(idx: number) {
  if (!queue[idx]) return;
  audio.pause(); vizCtl?.stop(); vizCtl = null;
  audio.src = queue[idx];
  audio.load();
  audio.onended = async () => {
    playing = false;
    updatePlayIcon();
    if (current < queue.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
      current++;
      await loadTrack(current);
    }
  };

  if (audioCtx.state === 'suspended') await audioCtx.resume();
  vizCtl = createVisualizer(audioCtx, analyser, canvas);
  await new Promise<void>(res => audio.addEventListener('canplay', () => res(), { once: true }));
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
// Eventos UI
// ——————————————
// Archivos locales
loadBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'audio/*'; inp.multiple = true;
  inp.onchange = async () => {
    const files = Array.from(inp.files || []);
    queue = files.map(f => URL.createObjectURL(f));
    current = 0;
    renderQueue();
    await loadTrack(current);
  };
  inp.click();
});

// SoundCloud vía proxy
loadScBtn.addEventListener('click', async () => {
  const link = scUrlInput.value.trim();
  if (!link) return alert('Introduce una URL de SoundCloud');
  if (!link.includes('soundcloud.com')) return alert('La URL debe ser de SoundCloud');
  let clean = link;
  try { clean = `${new URL(link).origin}${new URL(link).pathname}`; } catch {}
  queue.push(`/api/sc-stream?url=${encodeURIComponent(clean)}`);
  current = queue.length - 1;
  renderQueue();
  await loadTrack(current);
});

// Mostrar/ocultar cola
queueBtn.addEventListener('click', () => queueEl.classList.toggle('hidden'));

// Play/Pause
playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (playing) {
    audio.pause(); vizCtl?.stop(); playing = false;
  } else {
    audio.play(); vizCtl?.start(); playing = true;
  }
  updatePlayIcon();
});

// Prev/Next
prevBtn.addEventListener('click', async () => { if (current > 0) { current--; await loadTrack(current);} });
nextBtn.addEventListener('click', async () => { if (current < queue.length-1) { current++; await loadTrack(current);} });

// Fullscreen global
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Fullscreen SOLO canvas
canvas.addEventListener('click', () => {
  if (document.fullscreenElement === canvas) {
    document.exitFullscreen();
  } else {
    canvas.requestFullscreen();
  }
});
