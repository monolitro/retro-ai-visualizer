// api/sc-stream.ts
// @ts-ignore
import scdl from 'soundcloud-downloader';

const CLIENT_ID = '2t9loNQH90kzJcsFCODdigxfp325aq4z';

export default async function handler(req: any, res: any) {
  // 1) Parámetro
  const url = Array.isArray(req.query.url)
    ? req.query.url[0]
    : req.query.url;
  if (!url) {
    res.status(400).send('Missing ?url= parameter');
    return;
  }

  try {
    // 2) Cabeceras CORS + tipo + desactivar cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    // 3) Descarga el stream original de SC y lo pipea
    const stream = await scdl.download(url /*, { clientID: CLIENT_ID }*/ );
    stream.on('error', err => {
      console.error('Stream error:', err);
      res.end();
    });
    stream.pipe(res);
  } catch (err) {
    console.error('SC-stream handler error:', err);
    res.status(500).send('Failed to resolve SoundCloud URL');
  }
}
