import nodemailer from 'nodemailer';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
export type SMTP = {
  host: string;
  port: number;
  security: 'tls' | 'starttls' | 'plain';
  user: string;
  password: string;
  from: string;
  senderName: string;
};
export type MailMessage = { to: string; subject: string; text: string };
export type MailSender = (config: SMTP, message: MailMessage) => Promise<void>;
export const sendMail: MailSender = async (config, message) => {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.security === 'tls',
    requireTLS: config.security === 'starttls',
    ignoreTLS: config.security === 'plain',
    ...(config.user ? { auth: { user: config.user, pass: config.password } } : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
  try {
    await transport.sendMail({
      from: { name: config.senderName, address: config.from },
      ...message,
    });
  } finally {
    transport.close();
  }
};
export function seal(value: string, secret: string): string {
  const iv = randomBytes(12),
    cipher = createCipheriv(
      'aes-256-gcm',
      createHash('sha256').update(`smtp:${secret}`).digest(),
      iv,
    );
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
}
export function unseal(value: string, secret: string): string {
  if (!value) return '';
  const body = Buffer.from(value, 'base64');
  const cipher = createDecipheriv(
    'aes-256-gcm',
    createHash('sha256').update(`smtp:${secret}`).digest(),
    body.subarray(0, 12),
  );
  cipher.setAuthTag(body.subarray(12, 28));
  return Buffer.concat([cipher.update(body.subarray(28)), cipher.final()]).toString('utf8');
}
