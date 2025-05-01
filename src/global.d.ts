// src/global.d.ts
declare module 'soundcloud-downloader' {
    import { Readable } from 'stream';
    export function download(
      trackUrl: string,
      clientID?: string
    ): Promise<Readable>;
    export function getInfo(
      trackUrl: string,
      clientID?: string
    ): Promise<{ url: string; title?: string }>;
  }
  