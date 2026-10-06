import exifr from 'exifr';
import { validSolarDate } from '@love/calendar';

// Preserve the camera's calendar date, including when the EXIF time has no timezone.
export function captureDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value
    .trim()
    .match(
      /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/,
    );
  if (!match || Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59)
    return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  return validSolarDate(date) ? date : null;
}

export async function imageCaptureDate(exif?: Buffer): Promise<string | null> {
  if (!exif) return null;
  try {
    const tiff = exif.subarray(0, 6).equals(Buffer.from('Exif\0\0')) ? exif.subarray(6) : exif;
    const tags = await exifr.parse(tiff, {
      pick: ['DateTimeOriginal', 'CreateDate'],
      reviveValues: false,
      gps: false,
      xmp: false,
      icc: false,
      iptc: false,
    });
    return captureDate(tags?.DateTimeOriginal) || captureDate(tags?.CreateDate);
  } catch {
    // Missing or broken metadata must not prevent an otherwise valid photo upload.
    return null;
  }
}

export function videoCaptureDate(
  formatTags: Record<string, unknown> = {},
  streamTags: Record<string, unknown> = {},
): string | null {
  const original = captureDate(formatTags['com.apple.quicktime.creationdate']);
  if (original) return original;
  for (const value of [formatTags.creation_time, streamTags.creation_time]) {
    if (!captureDate(value) || typeof value !== 'string' || !/(Z|[+-]\d{2}:?\d{2})$/.test(value))
      continue;
    const timestamp = new Date(value);
    if (!Number.isFinite(timestamp.getTime())) continue;
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(timestamp);
    if (validSolarDate(date) && date !== '1904-01-01') return date;
  }
  return null;
}
