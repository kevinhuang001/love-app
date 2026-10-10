import { open } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

// Motion Photo 1.0 uses Container Item Length; older Google/Samsung exports use MicroVideoOffset.
export function motionVideoLength(xmp: string): number | null {
  const attribute = (tag: string, name: string) =>
    new RegExp(`\\b[\\w-]+:${name}\\s*=\\s*["']([^"']+)["']`, 'i').exec(tag)?.[1];
  const enabled = /\b[\w-]+:MotionPhoto\s*=\s*["'](-?\d+)["']/i.exec(xmp)?.[1];
  if (enabled !== undefined && enabled !== '1') return null;
  for (const tag of xmp.match(/<[^>]+>/g) || []) {
    if (
      attribute(tag, 'Semantic') === 'MotionPhoto' &&
      /^video\//.test(attribute(tag, 'Mime') || '')
    ) {
      const length = Number(attribute(tag, 'Length'));
      return Number.isSafeInteger(length) && length > 8 ? length : null;
    }
  }
  const legacy =
    /\b[\w-]+:MicroVideoOffset\s*=\s*["'](\d+)["']/i.exec(xmp)?.[1] ||
    /<[\w-]+:MicroVideoOffset>\s*(\d+)\s*<\//i.exec(xmp)?.[1];
  const length = Number(legacy);
  return Number.isSafeInteger(length) && length > 8 ? length : null;
}
export async function extractMotionVideo(
  source: string,
  destination: string,
  signal?: AbortSignal,
) {
  const file = await open(source, 'r');
  let size: number, length: number | null;
  try {
    size = (await file.stat()).size;
    const head = Buffer.alloc(Math.min(size, 4 * 1048576));
    await file.read(head, 0, head.length, 0);
    length = motionVideoLength(head.toString('latin1'));
    if (!length || length >= size) return false;
    const header = Buffer.alloc(12);
    await file.read(header, 0, header.length, size - length);
    if (header.toString('ascii', 4, 8) !== 'ftyp' || header.readUInt32BE(0) < 8) return false;
  } finally {
    await file.close();
  }
  await pipeline(
    createReadStream(source, { start: size! - length!, end: size! - 1 }),
    createWriteStream(destination, { flags: 'wx' }),
    { signal },
  );
  return true;
}
