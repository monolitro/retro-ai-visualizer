// api/sc-stream.ts
// @ts-ignore
import scdl from 'soundcloud-downloader';
import { VercelRequest, VercelResponse } from '@vercel/node';

const CLIENT_ID = '2t9loNQH90kzJcsFCODdigxfp325aq4z';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const urlParam = req.query.url;
  const trackUrl =
    Array.isArray(urlParam) ? urlParam[0] : urlParam;
  if (!trackUrl) {
    res.status(400).send('Missing ?url= parameter');
    return;
  }

  try {
    // 1) Cabeceras CORS + tipo de contenido + disable cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    // 2) Descarga el stream y lo pipea al cliente
    const stream = await scdl.download(trackUrl, CLIENT_ID);
    stream.on('error', err => {
      console.error('SC stream error:', err);
      try { res.end(); } catch {}
    });
    stream.pipe(res);
  } catch (err) {
    console.error('SC‐stream handler error:', err);
    res.status(500).send('Failed to resolve SoundCloud URL');
  }
}
