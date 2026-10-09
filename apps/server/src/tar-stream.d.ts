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
  type PackHeader = { name: string; size?: number; mode?: number };
  interface Pack extends Readable {
    entry(header: PackHeader, callback: (error?: Error | null) => void): Writable;
    entry(
      header: PackHeader,
      body: string | Buffer,
      callback?: (error?: Error | null) => void,
    ): Writable;
    finalize(): void;
  }
  const tar: { extract(): Extract; pack(): Pack };
  export default tar;
}
