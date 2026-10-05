import { test, expect } from '@playwright/test';
import sharp from 'sharp';
test('mobile registration, pairing, realtime chat, media, anniversaries and settings', async ({
  page,
  browser,
  request,
}) => {
  const suffix = Date.now().toString().slice(-9);
  const username = `user${suffix}`,
    partnerName = `partner${suffix}`;
  await page.goto('/');
  await page.getByRole('tab', { name: '创建账号' }).click();
  await page.getByLabel('服务器地址').fill('http://127.0.0.1:3000');
  await page.getByLabel('用户名', { exact: true }).fill(username);
  await page.getByLabel('怎么称呼你').fill('小一');
  await page.getByLabel('密码', { exact: true }).fill('password123');
  await page.getByRole('button', { name: '开始我们的故事' }).click();
  await expect(page.getByRole('heading', { name: '想说的话，都留在这里' })).toBeVisible();
  await page.getByRole('button', { name: '连接另一半' }).click();
  await page.getByRole('button', { name: '生成我的邀请码' }).click();
  const code = await page.locator('.font-mono').innerText();
  const partner = await request.post('http://127.0.0.1:3000/api/auth/register', {
    data: { username: partnerName, password: 'password123', name: '小二' },
  });
  expect(partner.status()).toBe(201);
  const partnerAccount = await partner.json();
  const pairing = await request.post('http://127.0.0.1:3000/api/pairing/join', {
    headers: { Authorization: `Bearer ${partnerAccount.token}` },
    data: { code },
  });
  expect(pairing.ok()).toBeTruthy();
  await expect(page.getByText('已经找到你')).toBeVisible();
  await page.getByRole('tab', { name: '聊天', exact: true }).click();
  await page.getByRole('textbox', { name: '消息内容' }).fill('今天也想见你');
  await page.getByRole('button', { name: '发送消息' }).click();
  await expect(page.getByText('今天也想见你')).toBeVisible();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const other = await context.newPage();
  await other.goto('/');
  await other.getByLabel('服务器地址').fill('http://127.0.0.1:3000');
  await other.getByLabel('用户名', { exact: true }).fill(partnerName);
  await other.getByLabel('密码', { exact: true }).fill('password123');
  await other.getByRole('button', { name: '进入我们的空间' }).click();
  await expect(other.getByText('今天也想见你')).toBeVisible();
  await expect(page.getByText('已读', { exact: true }).first()).toBeVisible();
  await other.getByRole('textbox', { name: '消息内容' }).fill('我也想你');
  await other.getByRole('button', { name: '发送消息' }).click();
  await expect(page.getByText('我也想你')).toBeVisible();
  await page.getByRole('tab', { name: '回忆', exact: true }).click();
  await page.getByRole('button', { name: '新增回忆' }).click();
  const image = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: '#c892a2' },
  })
    .png()
    .toBuffer();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'memory.png', mimeType: 'image/png', buffer: image });
  await page.getByLabel('写下这一刻').fill('一起散步');
  await page.getByRole('button', { name: '保存回忆' }).click();
  await expect(page.getByText('一起散步', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '查看图片' }).click();
  await expect(page.getByRole('img', { name: '照片大图' })).toBeVisible();
  await page.getByRole('button', { name: '关闭' }).click();
  await page.getByRole('tab', { name: '纪念日', exact: true }).click();
  await page.getByRole('button', { name: '新增纪念日' }).click();
  await page.getByLabel('名称', { exact: true }).fill('第一次旅行');
  await page.getByRole('button', { name: '保存纪念日' }).click();
  await expect(page.getByText('第一次旅行', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '编辑第一次旅行' }).click();
  await page.getByLabel('名称', { exact: true }).fill('旅行纪念日');
  await page.getByRole('button', { name: '保存纪念日' }).click();
  await expect(page.getByText('旅行纪念日', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: '我们', exact: true }).click();
  await page.getByLabel('昵称', { exact: true }).fill('小爱');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('heading', { name: '小爱', exact: true })).toBeVisible();
  await page.getByLabel('深色模式').click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByLabel('AI 服务 URL').fill('https://api.example.com/v1');
  await page.getByLabel('模型名称').fill('test-model');
  await page.getByLabel('API Key').fill('test-key');
  await page.getByRole('button', { name: '保存 AI 配置' }).click();
  await expect(page.getByText('AI 配置已保存', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Love Notes');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.reload();
  await expect(page.getByRole('textbox', { name: '消息内容' })).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-chat.png', fullPage: true });
  await context.close();
});
