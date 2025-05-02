import Butterchurn from 'butterchurn';
import ButterchurnPresets from 'butterchurn-presets';

export const PRESETS = ButterchurnPresets.getPresets();
export const PRESET_NAMES = Object.keys(PRESETS);

export function createVisualizer(
  audioCtx: AudioContext,
  analyser: AnalyserNode,
  canvas: HTMLCanvasElement
) {
  const viz = Butterchurn.createVisualizer(audioCtx, canvas, {
    width:  canvas.clientWidth,
    height: canvas.clientHeight,
    pixelRatio: window.devicePixelRatio || 1,
  });
  viz.connectAudio(analyser);

  // cargar un preset aleatorio (más psicodélico)
  const name = PRESET_NAMES[Math.floor(Math.random()*PRESET_NAMES.length)];
  viz.loadPreset(PRESETS[name], 0.0);
  console.log('🎛️ Preset cargado:', name);

  window.addEventListener('resize', () =>
    viz.setRendererSize(canvas.clientWidth, canvas.clientHeight)
  );

  let raf = 0;
  function loop() {
    viz.render();
    raf = requestAnimationFrame(loop);
  }
  return {
    start() { if (!raf) loop(); },
    stop()  { cancelAnimationFrame(raf); raf = 0; }
  };
}
