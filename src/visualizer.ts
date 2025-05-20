import Butterchurn from 'butterchurn';
import ButterchurnPresets from 'butterchurn-presets';

const PRESETS = ButterchurnPresets.getPresets();
const PRESET_NAMES = Object.keys(PRESETS);

export function createVisualizer(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode
) {
  // Ajustar tamaño del canvas explícitamente
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const audioCtx = analyser.context as AudioContext;
  const viz = Butterchurn.createVisualizer(audioCtx, canvas, {
    width: canvas.width,
    height: canvas.height,
    pixelRatio: window.devicePixelRatio || 1
  });

  viz.connectAudio(analyser);

  function resize() {
    canvas.width = canvas.clientWidth || 800;
    canvas.height = canvas.clientHeight || 600;
    viz.setRendererSize(canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);

  let raf = 0;
  function loop() {
    viz.render();
    raf = requestAnimationFrame(loop);
  }

  // --- NUEVO: Método para cargar preset aleatorio sin destruir visualizador ---
  function loadRandomPreset() {
    const name = PRESET_NAMES[Math.floor(Math.random() * PRESET_NAMES.length)];
    viz.loadPreset(PRESETS[name], 0.0);
    console.log('🎛️ Nuevo preset cargado:', name);
  }

  return {
    start() {
      if (raf) cancelAnimationFrame(raf);
      loadRandomPreset();
      loop();
    },
    loadRandomPreset,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      viz.disconnectAudio();
      window.removeEventListener('resize', resize);
      const ctx2 = canvas.getContext('2d');
      if (ctx2) {
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
        ctx2.fillStyle = "#000";
        ctx2.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
}
