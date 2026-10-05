import { createServer } from 'node:http';
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
  await expect(page.getByLabel('服务器地址')).toBeHidden();
  expect(await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily)).toContain(
    'Noto Sans SC',
  );
  await page.getByRole('tab', { name: '创建账号' }).click();
  await page.getByText('服务器设置', { exact: true }).click();
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
  await other.getByText('服务器设置', { exact: true }).click();
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
    create: { width: 1200, height: 800, channels: 3, background: '#6f897a' },
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
  await expect(page.getByText('第几天 · 累计')).toBeVisible();
  await page.getByRole('tab', { name: 'To Do', exact: true }).click();
  await page.getByRole('button', { name: '七夕 · 农历七月初七' }).click();
  await expect(page.getByRole('dialog')).toContainText('农历重复每年按农历换算');
  const font = await page.getByRole('dialog').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font).toContain('Noto Sans SC');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Noto Sans SC"', '提示已保存'))).toBe(
    true,
  );
  await page.getByRole('button', { name: '保存 To Do', exact: true }).click();
  await expect(page.getByText('七夕', { exact: true })).toBeVisible();
  await expect(page.getByText('农历七月初七 · 每年重复', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '完成七夕', exact: true }).click();
  await expect(page.getByText('本次已完成，已更新到下一次', { exact: true })).toBeVisible();
  const toastFont = await page
    .locator('[data-sonner-toast]')
    .last()
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(toastFont).toContain('Noto Sans SC');
  await page.getByRole('tab', { name: '我们', exact: true }).click();
  await page.getByLabel('昵称', { exact: true }).fill('小爱');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('heading', { name: '小爱', exact: true })).toBeVisible();
  // Upload personal avatar and verify both participants see it on existing messages.
  const ownChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '更换头像', exact: true }).click();
  await (
    await ownChooserPromise
  ).setFiles({ name: 'personal.png', mimeType: 'image/png', buffer: image });
  await expect(page.getByText('头像已更新', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '小爱', exact: true })).toBeVisible();
  await expect(
    other.locator('.message-row[data-own="false"] img[alt="小爱的聊天头像"]').first(),
  ).toBeVisible();
  await page.getByRole('tab', { name: '聊天', exact: true }).click();
  await expect(
    page.locator('.message-row[data-own="true"] img[alt="你的聊天头像"]').first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator('.message-row[data-own="true"] img[alt="你的聊天头像"]').first(),
  ).toBeVisible();
  await page.getByRole('tab', { name: '我们', exact: true }).click();
  await page.getByLabel('深色模式').click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  const provider = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        choices: [{ message: { role: 'assistant', content: '你好，我是星星。中文提示正常。' } }],
      }),
    );
  });
  await new Promise<void>((r) => provider.listen(0, '127.0.0.1', r));
  try {
    await page.getByLabel('AI 名称').fill('星星');
    await page.getByRole('button', { name: '保存 AI 名称', exact: true }).click();
    await expect(page.getByText('AI 名称已更新', { exact: true })).toBeVisible();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '更换 AI 头像' }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: 'ai.png', mimeType: 'image/png', buffer: image });
    await expect(page.getByRole('img', { name: 'AI 头像', exact: true })).toBeVisible();
    await page
      .getByLabel('AI 服务 URL')
      .fill(`http://127.0.0.1:${(provider.address() as { port: number }).port}/v1`);
    await page.getByLabel('模型名称').fill('test-model');
    await page.getByLabel('API Key').fill('test-key');
    await page.getByLabel('开启 @星星（兼容 @ai）').click();
    await page.getByRole('button', { name: '保存 AI 配置' }).click();
    await expect(page.getByText('AI 配置已保存', { exact: true })).toBeVisible();
    await page.getByRole('tab', { name: '聊天', exact: true }).click();
    await page.getByRole('textbox', { name: '消息内容' }).fill('@星星 你好');
    await page.getByRole('button', { name: '发送消息' }).click();
    await expect(page.getByText('你好，我是星星。中文提示正常。', { exact: true })).toBeVisible({
      timeout: 16000,
    });
    await expect(page.getByRole('img', { name: '星星的头像', exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('�');
    await expect(page.locator('body')).not.toContainText('Love Notes');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await page.reload();
    await expect(page.getByRole('textbox', { name: '消息内容' })).toBeVisible();
    const navigation = await page.getByRole('navigation', { name: '主导航' }).boundingBox();
    expect(navigation!.height).toBeGreaterThanOrEqual(64);
    await page.screenshot({ path: 'test-results/mobile-chat.png', fullPage: true });
  } finally {
    provider.close();
  }
  await context.close();
});
