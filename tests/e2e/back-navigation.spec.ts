import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { captcha, login } from './auth-helper';

test('mobile back dismisses media and sheets before returning to chat; login session remains', async ({
  page,
  request,
}) => {
  const base = 'http://127.0.0.1:3000',
    suffix = Date.now().toString().slice(-8);
  const admin = await request.post(base + '/api/admin/login', {
    data: {
      username: 'admin_master',
      password: 'admin-test-password-123',
      ...(await captcha(request, 'admin')),
    },
  });
  expect(admin.ok()).toBeTruthy();
  const adminHeaders = { Authorization: `Bearer ${(await admin.json()).token}` };
  const account = async (username: string) => {
    const created = await request.post(base + '/api/admin/users', {
      headers: adminHeaders,
      data: {
        username,
        name: username,
        email: username + '@example.test',
        password: 'password123',
        confirmedEmail: true,
      },
    });
    expect(created.status()).toBe(201);
    return (await login(request, { username, password: 'password123' })).json();
  };
  const a = await account('backa' + suffix),
    b = await account('backb' + suffix),
    headers = { Authorization: `Bearer ${a.token}` };
  const invite = await request.post(base + '/api/pairing/invite', { headers, data: {} });
  await request.post(base + '/api/pairing/join', {
    headers: { Authorization: `Bearer ${b.token}` },
    data: { code: (await invite.json()).code },
  });
  await page.addInitScript(
    ({ token, base }) =>
      localStorage.setItem(
        'CapacitorStorage.love.session',
        JSON.stringify({ server: base, token }),
      ),
    { token: a.token, base },
  );
  await page.goto('/');
  const back = () =>
    page.evaluate(async () => {
      // Import the same dispatcher used by the native App plugin. No production test hook.
      const module = await import('/src/lib/back-navigation.ts');
      return module.backNavigation.dispatch();
    });
  await page.getByRole('tab', { name: '回忆', exact: true }).click();
  await page.getByRole('button', { name: '新增回忆' }).click();
  const photo = await sharp({
    create: { width: 640, height: 480, channels: 3, background: '#436358' },
  })
    .withExif({ IFD2: { DateTimeOriginal: '2026:10:09 12:00:00' } })
    .jpeg()
    .toBuffer();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'back.jpg', mimeType: 'image/jpeg', buffer: photo });
  await page.getByLabel('写下这一刻').fill('返回预览测试');
  await expect(page.getByRole('button', { name: '保存回忆', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '保存回忆', exact: true }).click();
  await page.getByRole('button', { name: '查看图片' }).click();
  await expect(page.getByRole('img', { name: '照片大图' })).toBeVisible();
  expect(await back()).toBe(true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: '回忆', exact: true })).toHaveAttribute(
    'data-state',
    'active',
  );
  await page.getByRole('button', { name: '筛选相册', exact: true }).click();
  expect(await back()).toBe(true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await back()).toBe(true);
  await expect(page.getByRole('tab', { name: '聊天', exact: true })).toHaveAttribute(
    'data-state',
    'active',
  );
  expect(await back()).toBe(false); // Native handler minimizes at the root.
  expect(
    await page.evaluate(() => localStorage.getItem('CapacitorStorage.love.session')),
  ).toContain(a.token);
});
