import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type Page, type APIRequestContext } from '@playwright/test';
const evidence = async () =>
  JSON.parse(await readFile(resolve('../admin-temp/e2e-auth.json'), 'utf8')) as {
    captcha: Record<string, string>;
    mail: { to: string; text: string }[];
  };
export async function captcha(request: APIRequestContext, purpose = 'login') {
  const response = await request.get(`http://127.0.0.1:3000/api/auth/captcha?purpose=${purpose}`);
  expect(response.ok()).toBeTruthy();
  const r = await response.json();
  return { captchaId: r.id, captcha: (await evidence()).captcha[r.id] };
}
export async function solveCaptcha(page: Page) {
  const image = page.getByRole('button', { name: '刷新图形验证码' });
  await expect(image).toHaveAttribute('data-captcha-id', /\S+/);
  const id = await image.getAttribute('data-captcha-id');
  await page.getByLabel('图形验证码', { exact: true }).fill((await evidence()).captcha[id!]);
}
export async function verifyEmail(page: Page, email: string) {
  await page.getByLabel('邮箱', { exact: true }).fill(email);
  await solveCaptcha(page);
  await page.getByRole('button', { name: '发送邮件验证码' }).click();
  await expect(page.getByLabel('邮件验证码', { exact: true })).toBeVisible();
  const message = (await evidence()).mail.findLast((m) => m.to === email)!;
  await page
    .getByLabel('邮件验证码', { exact: true })
    .fill(message.text.match(/验证码是 (\d{6})/)![1]);
}
export async function register(
  request: APIRequestContext,
  data: { username: string; password: string; name: string },
) {
  const email = `${data.username}@example.test`;
  const response = await request.post('http://127.0.0.1:3000/api/auth/email-code', {
    data: { email, purpose: 'register', ...(await captcha(request, 'register')) },
  });
  expect(response.ok()).toBeTruthy();
  const { verificationId } = await response.json();
  const message = (await evidence()).mail.findLast((m) => m.to === email)!;
  const code = message.text.match(/验证码是 (\d{6})/)![1];
  return request.post('http://127.0.0.1:3000/api/auth/register', {
    data: { ...data, email, verificationId, code },
  });
}
export async function login(
  request: APIRequestContext,
  data: { username: string; password: string },
) {
  return request.post('http://127.0.0.1:3000/api/auth/login', {
    data: { ...data, ...(await captcha(request)) },
  });
}
