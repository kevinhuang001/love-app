declare module 'heic-decode' {
  export default function decode(options: {
    buffer: Buffer;
  }): Promise<{ width: number; height: number; data: Uint8ClampedArray }>;
}
