import { randomBytes, createHash, scrypt, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, value] = stored.split(':');
  if (!salt || !value) return false;
  const key = (await derive(password, salt, 64)) as Buffer;
  const expected = Buffer.from(value, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export const signMedia = (secret: string, id: string, variant: string, expires: number) =>
  createHmac('sha256', secret).update(`${id}:${variant}:${expires}`).digest('base64url');
export function validSignature(a: string, b: string) {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
