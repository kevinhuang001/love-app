import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { captcha, login } from './auth-helper';
test('mobile album exports a portable ZIP without import UI and supports photo zoom', async ({
  page,
  request,
}) => {
  const suffix = Date.now().toString().slice(-8);
  const admin = await request.post('http://127.0.0.1:3000/api/admin/login', {
    data: {
      username: 'admin_master',
      password: 'admin-test-password-123',
      ...(await captcha(request, 'admin')),
    },
  });
  expect(admin.ok()).toBeTruthy();
  const headers = { Authorization: `Bearer ${(await admin.json()).token}` };
  const account = async (username: string, name: string) => {
    const created = await request.post('http://127.0.0.1:3000/api/admin/users', {
      headers,
      data: {
        username,
        name,
        email: username + '@example.test',
        password: 'password123',
        confirmedEmail: true,
      },
    });
    expect(created.status()).toBe(201);
    const response = await login(request, { username, password: 'password123' });
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  const first = await account('zipa' + suffix, '小林'),
    second = await account('zipb' + suffix, '小舟');
  const invite = await request.post('http://127.0.0.1:3000/api/pairing/invite', {
    headers: { Authorization: `Bearer ${first.token}` },
    data: {},
  });
  await request.post('http://127.0.0.1:3000/api/pairing/join', {
    headers: { Authorization: `Bearer ${second.token}` },
    data: { code: (await invite.json()).code },
  });
  await page.addInitScript(
    ({ token }) =>
      localStorage.setItem(
        'CapacitorStorage.love.session',
        JSON.stringify({ server: 'http://127.0.0.1:3000', token }),
      ),
    { token: first.token },
  );
  await page.goto('/');
  await page.getByRole('tab', { name: '回忆', exact: true }).click();
  const photo = await sharp({
    create: { width: 600, height: 400, channels: 3, background: '#395f50' },
  })
    .withExif({ IFD2: { DateTimeOriginal: '2024:02:29 12:34:56' } })
    .jpeg()
    .toBuffer();
  // Closing an uploaded draft frees its records/bytes instead of leaving hidden media.
  await page.getByRole('button', { name: '新增回忆' }).click();
  const draftUpload = page.waitForResponse(
    (response) => response.url().endsWith('/api/media') && response.request().method() === 'POST',
  );
  await page
    .locator('input[type=file]')
    .last()
    .setInputFiles({ name: 'cancelled.jpg', mimeType: 'image/jpeg', buffer: photo });
  const cancelled = await (await draftUpload).json();
  await expect(page.getByRole('button', { name: '保存回忆', exact: true })).toBeEnabled();
  const deletion = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/media/' + cancelled.id) &&
      response.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: '取消', exact: true }).click();
  expect((await deletion).status()).toBe(204);
  const afterCancel = await request.get('http://127.0.0.1:3000/api/me', {
    headers: { Authorization: 'Bearer ' + first.token },
  });
  expect((await afterCancel.json()).couple.storageBytes).toBe(0);
  await page.getByRole('button', { name: '新增回忆' }).click();
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '选择照片或视频（可多选）' }).click();
  await (await picker).setFiles({ name: 'camera.jpg', mimeType: 'image/jpeg', buffer: photo });
  await expect(page.getByText('2024-02-29', { exact: true })).toBeVisible();
  await page.getByLabel('写下这一刻').fill('导出后还在的回忆');
  await expect(page.getByRole('button', { name: '保存回忆', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '保存回忆', exact: true }).click();
  await page.getByRole('button', { name: '导出相册' }).click();
  await expect(page.getByText('选择 ZIP 导入相册')).toHaveCount(0);
  await expect(page.getByLabel('相册导出格式')).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出相册 ZIP' }).click();
  const zip = await download;
  expect(zip.suggestedFilename()).toContain('album');
  expect(await zip.failure()).toBeNull();
  expect((await readFile((await zip.path())!)).subarray(0, 2).toString()).toBe('PK');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '查看图片：导出后还在的回忆' }).click();
  const media = page.locator('.album-viewer-media');
  const image = media.locator('img').filter({ visible: true });
  await page.getByRole('button', { name: '放大照片' }).click();
  await expect(image).toHaveCSS('transform', /matrix\(2,/);
  const box = (await media.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2 + 20);
  await page.mouse.up();
  expect(await image.evaluate((el) => getComputedStyle(el).transform)).not.toBe(
    'matrix(2, 0, 0, 2, 0, 0)',
  );
  await page.getByRole('button', { name: '还原照片' }).click();
  await expect(image).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  const cdp = await page.context().newCDPSession(page);
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: cx - 30, y: cy },
      { x: cx + 30, y: cy },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: cx - 60, y: cy },
      { x: cx + 60, y: cy },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(image).toHaveCSS('transform', /matrix\(2,/);
  await page.getByRole('button', { name: '还原照片' }).click();
});
