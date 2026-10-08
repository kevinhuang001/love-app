import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { removeMediaFiles } from './media-storage.js';
import { imageCaptureDate, videoCaptureDate } from './capture-date.js';
function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '',
      errors = '';
    child.stdout.on('data', (chunk) => {
      if (output.length < 100_000) output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      if (errors.length < 10_000) errors += chunk;
    });
    child.on('error', (err) => {
      reject(err);
    });
    child.on('close', (code) => {
      code === 0
        ? resolve(output)
        : reject(new Error(`无法解码媒体 (${command}): ${errors.slice(-300)}`));
    });
  });
}
export async function processMedia(
  source: string,
  mime: string,
  dir: string,
  retainOriginal: boolean,
) {
  const id = randomUUID();
  const original = retainOriginal ? `${id}.source` : '',
    thumbnail = `${id}.thumb.webp`;
  let preview = `${id}.preview.webp`;
  try {
    if (mime.startsWith('image/')) {
      const image = sharp(source, { limitInputPixels: false }).rotate();
      const info = await image.metadata();
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
      await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', source]),
    );
    const stream = metadata.streams.find(
      (item: { codec_type: string }) => item.codec_type === 'video',
    );
    const duration = Number(metadata.format.duration);
    if (!stream || !Number.isFinite(duration) || duration <= 0)
      throw new Error('视频数据无效，无法读取时长');
    preview = `${id}.preview.mp4`;
    await run('ffmpeg', [
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
    ]);
    await run('ffmpeg', [
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
    ]);
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
      ...[original, preview, thumbnail].filter(Boolean).map((name) => join(dir, name)),
    ]);
    throw error;
  }
}
