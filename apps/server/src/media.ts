import decodeHEIC from 'heic-decode';
import { extractMotionVideo } from './motion-photo.js';
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rename, rm, copyFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { removeMediaFiles } from './media-storage.js';
import { imageCaptureDate, videoCaptureDate } from './capture-date.js';
function run(command: string, args: string[], signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      signal,
      killSignal: 'SIGKILL',
    });
    let output = '',
      errors = '';
    child.stdout.on('data', (chunk) => {
      if (output.length < 100_000) output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      if (errors.length < 10_000) errors += chunk;
    });
    child.on('error', (err) => {
      if (!signal?.aborted) reject(err);
    });
    child.on('close', (code) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      code === 0
        ? resolve(output)
        : reject(new Error(`无法解码媒体 (${command}): ${errors.slice(-300)}`));
    });
  });
}
async function openImage(source: string) {
  const original = sharp(source, { limitInputPixels: false });
  const info = await original.metadata();
  if (info.format === 'heif' && info.compression === 'hevc') {
    // Prebuilt Sharp includes AVIF but no HEVC decoder. Decode Apple HEIC with libheif WASM.
    const decoded = await decodeHEIC({ buffer: await readFile(source) });
    const image = sharp(Buffer.from(decoded.data), {
      raw: { width: decoded.width, height: decoded.height, channels: 4 },
    });
    return { image, info: { ...info, width: decoded.width, height: decoded.height } };
  }
  return { image: original.rotate(), info };
}
export async function processMedia(
  source: string,
  mime: string,
  dir: string,
  retainOriginal: boolean,
  signal?: AbortSignal,
  pairedVideo?: string,
): Promise<{
  id: string;
  kind: string;
  original: string;
  preview: string;
  thumbnail: string;
  width: number | undefined;
  height: number | undefined;
  duration: number | null;
  capturedDate: string | null;
}> {
  const id = randomUUID();
  const original = retainOriginal ? `${id}.source` : '',
    thumbnail = `${id}.thumb.webp`;
  let preview = `${id}.preview.webp`;
  const extracted = join(dir, `${id}.motion-input.mp4`);
  let liveFiles: string[] = [];
  let motionInput = pairedVideo;
  const pairedOriginal =
    pairedVideo && retainOriginal ? join(dir, `${id}.paired-source`) : undefined;
  try {
    signal?.throwIfAborted();
    if (mime.startsWith('image/')) {
      if (!motionInput && (await extractMotionVideo(source, extracted, signal)))
        motionInput = extracted;
      if (motionInput) {
        if (pairedOriginal) await copyFile(pairedVideo!, pairedOriginal);
        const live = await processMedia(motionInput, 'video/quicktime', dir, false, signal);
        liveFiles = [
          live.preview,
          live.thumbnail,
          ...(retainOriginal ? [`${live.id}.source`] : []),
        ].map((name) => join(dir, name));
        if ((live.duration || 0) > 30) throw new Error('实况视频不得超过 30 秒');
        const { image: photo, info } = await openImage(source);
        const capturedDate = await imageCaptureDate(info.exif);
        await photo
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(join(dir, live.thumbnail));
        if (retainOriginal) {
          if (!pairedVideo) await rename(source, join(dir, `${live.id}.source`));
          else {
            // Preserve both Apple originals in one source bundle, within the existing backup/storage contract.
            const zip = archiver('zip', { zlib: { level: 0 } });
            const done = pipeline(zip, createWriteStream(join(dir, `${live.id}.source`)), {
              signal,
            });
            zip.file(source, {
              name: `photo.${info.format === 'heif' ? 'heic' : info.format || 'jpg'}`,
            });
            // processMedia consumes its input; retain the paired original before video conversion.
            zip.file(pairedOriginal!, { name: 'video.mov' });
            await zip.finalize();
            await done;
            await rm(source);
          }
        } else await rm(source);
        return {
          ...live,
          kind: 'live',
          original: retainOriginal ? `${live.id}.source` : '',
          width: info.width,
          height: info.height,
          capturedDate,
        };
      }
      const { image, info } = await openImage(source);
      const capturedDate = await imageCaptureDate(info.exif);
      if (!['jpeg', 'png', 'webp', 'avif', 'heif'].includes(info.format || ''))
        throw new Error('不支持此图片格式');
      await image
        .clone()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(join(dir, preview));
      await image
        .clone()
        .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 72 })
        .toFile(join(dir, thumbnail));
      signal?.throwIfAborted();
      if (retainOriginal) await rename(source, join(dir, original));
      else await rm(source);
      return {
        id,
        kind: 'image',
        original,
        preview,
        thumbnail,
        width: info.width,
        height: info.height,
        duration: null,
        capturedDate,
      };
    }
    if (!mime.startsWith('video/')) throw new Error('只能上传图片或视频');
    const metadata = JSON.parse(
      await run(
        'ffprobe',
        ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', source],
        signal,
      ),
    );
    const stream = metadata.streams.find(
      (item: { codec_type: string }) => item.codec_type === 'video',
    );
    const duration = Number(metadata.format.duration);
    if (!stream || !Number.isFinite(duration) || duration <= 0)
      throw new Error('视频数据无效，无法读取时长');
    preview = `${id}.preview.mp4`;
    await run(
      'ffmpeg',
      [
        '-nostdin',
        '-xerror',
        '-err_detect',
        'explode',
        '-y',
        '-i',
        source,
        '-map',
        '0:v:0',
        '-map',
        '0:a:0?',
        '-vf',
        "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '27',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        '-movflags',
        '+faststart',
        '-threads',
        '2',
        join(dir, preview),
      ],
      signal,
    );
    await run(
      'ffmpeg',
      [
        '-nostdin',
        '-xerror',
        '-err_detect',
        'explode',
        '-y',
        '-i',
        join(dir, preview),
        '-frames:v',
        '1',
        '-vf',
        'scale=480:-1',
        '-c:v',
        'libwebp',
        join(dir, thumbnail),
      ],
      signal,
    );
    signal?.throwIfAborted();
    if (retainOriginal) await rename(source, join(dir, original));
    else await rm(source);
    return {
      id,
      kind: 'video',
      original,
      preview,
      thumbnail,
      width: stream.width,
      height: stream.height,
      duration,
      capturedDate: videoCaptureDate(metadata.format?.tags, stream.tags),
    };
  } catch (error) {
    await removeMediaFiles([
      source,
      ...liveFiles,
      ...[original, preview, thumbnail].filter(Boolean).map((name) => join(dir, name)),
    ]);
    throw error;
  } finally {
    await removeMediaFiles([
      extracted,
      ...(pairedVideo ? [pairedVideo] : []),
      ...(pairedOriginal ? [pairedOriginal] : []),
    ]);
  }
}
