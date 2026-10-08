import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { register } from './auth-helper';
test('mobile album exports both ZIP formats and imports a full backup with dates and descriptions', async ({
  page,
  request,
}) => {
  const suffix = Date.now().toString().slice(-8),
    first = await (
      await register(request, { username: 'zipa' + suffix, password: 'password123', name: '小林' })
    ).json(),
    second = await (
      await register(request, { username: 'zipb' + suffix, password: 'password123', name: '小舟' })
    ).json();
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
  await page.getByRole('button', { name: '新增回忆' }).click();
  const picker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '选择照片或视频（可多选）' }).click();
  await (await picker).setFiles({ name: 'camera.jpg', mimeType: 'image/jpeg', buffer: photo });
  await expect(page.getByText('2024-02-29', { exact: true })).toBeVisible();
  await page.getByLabel('写下这一刻').fill('导出后还在的回忆');
  await expect(page.getByRole('button', { name: '保存回忆', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '保存回忆', exact: true }).click();
  await page.getByRole('button', { name: '导出或导入相册' }).click();
  await page.getByLabel('相册导出格式').selectOption('pictures');
  const pictureDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出相册 ZIP' }).click();
  const pictures = await pictureDownload;
  expect(pictures.suggestedFilename()).toContain('photos');
  expect(await pictures.failure()).toBeNull();
  await page.getByLabel('相册导出格式').selectOption('archive');
  const fullDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出相册 ZIP' }).click();
  const full = await fullDownload;
  expect(full.suggestedFilename()).toContain('album');
  expect(await full.failure()).toBeNull();
  const fullPath = await full.path();
  const buffer = await readFile(fullPath!);
  const importPicker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '选择 ZIP 导入相册' }).click();
  await (
    await importPicker
  ).setFiles({ name: 'Love-album.zip', mimeType: 'application/zip', buffer });
  await expect(page.getByText('已导入 1 个回忆', { exact: true })).toBeVisible();
  const repeatPicker = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '选择 ZIP 导入相册' }).click();
  await (
    await repeatPicker
  ).setFiles({ name: 'Love-album.zip', mimeType: 'application/zip', buffer });
  await expect(page.getByText('此导入包已导入，无需重复添加', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.getByTestId('album-item')).toHaveCount(2);
  await expect(page.getByText('导出后还在的回忆', { exact: true })).toHaveCount(2);
  for (const item of await page.getByTestId('album-item').all())
    await expect(item).toHaveAttribute('data-date', '2024-02-29');
});
