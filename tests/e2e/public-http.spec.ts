import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { register, solveCaptcha } from './auth-helper';

test('production Web on a non-localhost HTTP origin loads assets, chats and uploads photos', async ({
  page,
  request,
}) => {
  const origin = 'http://public-http.test:3000';
  const failures: string[] = [],
    assetResponses: { url: string; status: number }[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('requestfailed', (request) =>
    failures.push(request.url() + ': ' + request.failure()?.errorText),
  );
  page.on('console', (message) => {
    if (
      /Cross-Origin-Opener-Policy|Origin-Agent-Cluster|Content Security Policy|Refused to|Mixed Content/.test(
        message.text(),
      )
    )
      failures.push(message.text());
  });
  page.on('response', (response) => {
    if (/\.(css|js|svg)(\?|$)/.test(response.url()))
      assetResponses.push({ url: response.url(), status: response.status() });
  });
  const response = await page.goto(origin);
  expect(response!.headers()['content-security-policy']).not.toContain('upgrade-insecure-requests');
  for (const header of [
    'cross-origin-opener-policy',
    'origin-agent-cluster',
    'strict-transport-security',
  ])
    expect(response!.headers()[header]).toBeUndefined();
  expect(await page.evaluate(() => window.isSecureContext)).toBe(false);
  expect(await page.evaluate(() => typeof crypto.randomUUID)).toBe('undefined');
  await expect(page.getByRole('button', { name: '进入我们的空间' })).toBeVisible();
  await page.evaluate(async () => {
    const response = await fetch('/favicon.svg');
    if (!response.ok) throw new Error('Favicon failed to load');
  });
  const stamp = Date.now().toString().slice(-9),
    username = `http${stamp}`,
    password = 'password123';
  const a = await (await register(request, { username, password, name: '公网用户' })).json();
  const b = await (
    await register(request, { username: `httpp${stamp}`, password, name: '另一半' })
  ).json();
  const invite = await request.post('http://127.0.0.1:3000/api/pairing/invite', {
    headers: { Authorization: `Bearer ${a.token}` },
    data: {},
  });
  const join = await request.post('http://127.0.0.1:3000/api/pairing/join', {
    headers: { Authorization: `Bearer ${b.token}` },
    data: await invite.json(),
  });
  expect(join.ok()).toBeTruthy();
  await page.getByText('服务器设置', { exact: true }).click();
  await page.getByLabel('服务器地址').fill(origin);
  await page.getByLabel('用户名', { exact: true }).fill(username);
  await page.getByLabel('密码', { exact: true }).fill(password);
  await solveCaptcha(page);
  await page.getByRole('button', { name: '进入我们的空间' }).click();
  await expect(page.getByText('在线 · 两人对话', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: '消息内容' }).fill('公网 HTTP 聊天正常');
  await page.getByRole('button', { name: '发送消息' }).click();
  await expect(page.getByText('公网 HTTP 聊天正常', { exact: true })).toBeVisible();
  await expect
    .poll(async () => {
      const received = await request.get('http://127.0.0.1:3000/api/messages', {
        headers: { Authorization: `Bearer ${b.token}` },
      });
      return (await received.json()).items.some(
        (message: { content: string }) => message.content === '公网 HTTP 聊天正常',
      );
    })
    .toBe(true);
  const push = await request.post('http://127.0.0.1:3000/api/messages', {
    headers: { Authorization: `Bearer ${b.token}` },
    data: { clientId: crypto.randomUUID(), content: '实时回复正常' },
  });
  expect(push.ok()).toBeTruthy();
  await expect(page.getByText('实时回复正常', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: '回忆', exact: true }).click();
  await page.getByRole('button', { name: '新增回忆' }).click();
  const image = await sharp({
    create: { width: 600, height: 400, channels: 3, background: '#6f897a' },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'public.png', mimeType: 'image/png', buffer: image });
  await page.getByLabel('拍摄日期 · public.png').fill('2026-06-15');
  await page.getByLabel('写下这一刻').fill('公网图片上传正常');
  await page.getByRole('button', { name: '保存回忆' }).click();
  await expect(page.getByText('公网图片上传正常', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '查看图片' }).click();
  const preview = page.getByRole('img', { name: '照片大图' });
  await expect(preview).toBeVisible();
  await expect
    .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  for (const extension of ['.css', '.js', '.svg'])
    expect(
      assetResponses.some((asset) => asset.url.endsWith(extension) && asset.status === 200),
    ).toBe(true);
  expect(
    assetResponses.every((asset) => asset.url.startsWith(origin + '/') && asset.status === 200),
  ).toBe(true);
  expect(failures).toEqual([]);
});
