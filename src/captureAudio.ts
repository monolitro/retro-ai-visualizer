// src/captureAudio.ts
/**
 * Captura el audio del sistema usando VB-Audio Virtual Cable.
 * Si no lo encuentra, hace fallback al micrófono por defecto.
 */
export async function getSystemAudioStream(): Promise<MediaStream> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cable = devices.find(d =>
    d.kind === 'audioinput' && /cable/i.test(d.label)
  );
  if (cable) {
    return navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: cable.deviceId } },
      video: false
    });
  }
  // Fallback: micrófono por defecto
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
}
