// @ts-ignore
import scdl from 'soundcloud-downloader';
export default async function handler(req: any, res: any) {
  const url = Array.isArray(req.query.url)? req.query.url[0] : req.query.url;
  if (!url) return res.status(400).send('Missing ?url=');

  try {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','no-store');
    const stream = await scdl.download(url /*, { clientID: 'TU_CLIENT_ID' }*/);
    stream.pipe(res);
  } catch(err) {
    console.error(err);
    res.status(500).send('SC fetch error');
  }
}
