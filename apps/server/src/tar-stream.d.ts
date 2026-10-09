declare module 'tar-stream' {
  import type { Writable, Readable } from 'node:stream';
  type Header = { name: string; type: string; size: number };
  interface Extract extends Writable {
    on(
      event: 'entry',
      listener: (header: Header, stream: Readable, next: (error?: Error) => void) => void,
    ): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }
  const tar: { extract(): Extract };
  export default tar;
}
