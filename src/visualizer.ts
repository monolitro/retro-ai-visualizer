// src/visualizer.ts
import Butterchurn from 'butterchurn';
import ButterchurnPresets from 'butterchurn-presets';

export const PRESETS = ButterchurnPresets.getPresets();
export const PRESET_NAMES = Object.keys(PRESETS);

export function createVisualizer(
  audioCtx: AudioContext,
  analyser: AnalyserNode,
  canvas: HTMLCanvasElement
) {
  const butter = Butterchurn.createVisualizer(audioCtx, canvas, {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    pixelRatio: window.devicePixelRatio || 1,
  });
  butter.connectAudio(analyser);

  // preset aleatorio inicial
  const init = PRESET_NAMES[Math.floor(Math.random() * PRESET_NAMES.length)];
  butter.loadPreset(PRESETS[init], 0.0);

  // resize
  window.addEventListener('resize', () =>
    butter.setRendererSize(canvas.clientWidth, canvas.clientHeight)
  );

  let raf = 0;
  function loop() {
    butter.render();
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (!raf) loop();
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  return { butter, start, stop };
}
