// api/sc-stream.ts
// @ts-ignore: no types available for soundcloud-downloader
import scdl from 'soundcloud-downloader';

const CLIENT_ID = '2t9loNQH90kzJcsFCODdigxfp325aq4z';

export default async function handler(req: any, res: any) {
  // 1) Recuperamos la URL del query (puede venir como array o string)
  const url = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  console.log('📬 SC-STREAM requested for URL:', url);
  if (!url) {
    res.status(400).send('Missing ?url= parameter');
    return;
  }

  try {
    // 2) Cabeceras CORS + tipo MIME + desactivar cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    // 3) Descarga el stream de SoundCloud y lo "pipea" al cliente
    const stream = await scdl.download(url, CLIENT_ID);
    stream.on('error', (err: any) => {
      console.error('Stream error:', err);
      if (!res.writableEnded) res.end();
    });
    stream.pipe(res);
  } catch (err: any) {
    console.error('SC-stream handler error:', err);
    res.status(500).send('Failed to resolve SoundCloud URL');
  }
}
