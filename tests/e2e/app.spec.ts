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
    await page.getByLabel('开启 @星星').click();
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

test('album batch upload, filters, layouts, fullscreen browsing and pagination', async ({
  page,
  request,
}) => {
  const stamp = Date.now().toString().slice(-9),
    username = `album${stamp}`,
    password = 'password123';
  await page.goto('/');
  const login = await page.getByRole('button', { name: '进入我们的空间' }).boundingBox();
  const server = await page.locator('details.server-disclosure').boundingBox();
  expect(server!.y).toBeGreaterThanOrEqual(login!.y + login!.height);
  await page.getByRole('tab', { name: '创建账号' }).click();
  await page.getByText('服务器设置', { exact: true }).click();
  await page.getByLabel('服务器地址').fill('http://127.0.0.1:3000');
  await page.getByLabel('用户名', { exact: true }).fill(username);
  await page.getByLabel('怎么称呼你').fill('小林');
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByRole('button', { name: '开始我们的故事' }).click();
  await expect(page.getByRole('heading', { name: '想说的话，都留在这里' })).toBeVisible();
  const self = await (
    await request.post('http://127.0.0.1:3000/api/auth/login', { data: { username, password } })
  ).json();
  const peer = await (
    await request.post('http://127.0.0.1:3000/api/auth/register', {
      data: { username: `peer${stamp}`, name: '阿宁', password },
    })
  ).json();
  const headers = { Authorization: `Bearer ${self.token}` },
    peerHeaders = { Authorization: `Bearer ${peer.token}` };
  const invite = await (
    await request.post('http://127.0.0.1:3000/api/pairing/invite', { headers, data: {} })
  ).json();
  await request.post('http://127.0.0.1:3000/api/pairing/join', {
    headers: peerHeaders,
    data: { code: invite.code },
  });
  await expect(page.getByRole('heading', { name: '阿宁', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: '回忆', exact: true }).click();
  await page.getByRole('button', { name: '新增回忆' }).click();
  const image = await sharp({
    create: { width: 900, height: 600, channels: 3, background: '#789684' },
  })
    .png()
    .toBuffer();
  await page.locator('input[type=file]').setInputFiles([
    { name: 'walk1.png', mimeType: 'image/png', buffer: image },
    { name: 'walk2.png', mimeType: 'image/png', buffer: image },
  ]);
  await expect(page.getByText('已选择 2 个文件 · 点击重选')).toBeVisible();
  await page.getByLabel('写下这一刻').fill('周末');
  await page.getByLabel('发生日期').fill('2026-06-15');
  await page.getByRole('button', { name: '保存回忆' }).click();
  await expect(page.getByText('已保存 2 个回忆', { exact: true })).toBeVisible();
  await expect(page.getByTestId('album-item')).toHaveCount(2);
  const own = (await (await request.get('http://127.0.0.1:3000/api/moments', { headers })).json())
    .items[0];
  const peerMedia = await (
    await request.post('http://127.0.0.1:3000/api/media', {
      headers: peerHeaders,
      multipart: { file: { name: 'cafe.png', mimeType: 'image/png', buffer: image } },
    })
  ).json();
  await request.post('http://127.0.0.1:3000/api/moments', {
    headers: peerHeaders,
    data: { title: '咖啡馆', date: '2025-12-01', mediaId: peerMedia.id },
  });
  await request.post('http://127.0.0.1:3000/api/moments', {
    headers,
    data: { title: '山中散步', date: '2026-06-16', mediaId: own.media.id },
  });
  const { spawnSync } = await import('node:child_process');
  const clip = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=0x476958:s=320x240:d=1',
    '-c:v',
    'libx264',
    '-threads',
    '1',
    '-movflags',
    'frag_keyframe+empty_moov',
    '-f',
    'mp4',
    'pipe:1',
  ]);
  expect(clip.status).toBe(0);
  const video = await (
    await request.post('http://127.0.0.1:3000/api/media', {
      headers,
      multipart: { file: { name: 'sea.mp4', mimeType: 'video/mp4', buffer: clip.stdout } },
    })
  ).json();
  await request.post('http://127.0.0.1:3000/api/moments', {
    headers,
    data: { title: '海边视频', date: '2026-07-01', mediaId: video.id },
  });
  await expect(page.getByTestId('album-item')).toHaveCount(5);
  await page.getByLabel('排序方式').selectOption('date_asc');
  await expect(page.getByTestId('album-item').first()).toHaveAttribute('data-date', '2025-12-01');
  await page.getByLabel('排序方式').selectOption('date_desc');
  await expect(page.getByTestId('album-item').first()).toHaveAttribute('data-date', '2026-07-01');
  await page.getByLabel('搜索回忆').fill('周末');
  await expect(page.getByTestId('album-item')).toHaveCount(2);
  await page.getByRole('button', { name: '视频', exact: true }).click();
  await expect(page.getByRole('heading', { name: '没有找到符合条件的回忆' })).toBeVisible();
  await page.getByRole('button', { name: '清除搜索' }).click();
  await expect(page.getByTestId('album-item')).toHaveCount(1);
  await page.getByRole('button', { name: '播放视频：海边视频', exact: true }).click();
  await expect(page.getByRole('dialog').locator('video')).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole('dialog')
        .locator('video')
        .evaluate((v) => (v as HTMLVideoElement).duration),
    )
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '全部', exact: true }).click();
  await page.getByRole('button', { name: '筛选相册', exact: true }).click();
  await page.getByLabel('上传者').selectOption('partner');
  await page.getByLabel('开始日期', { exact: true }).fill('2025-01-01');
  await page.getByLabel('结束日期', { exact: true }).fill('2025-12-31');
  await page.getByRole('button', { name: '应用筛选' }).click();
  await expect(page.getByTestId('album-item')).toHaveCount(1);
  await page.getByRole('button', { name: '查看图片：咖啡馆', exact: true }).click();
  await expect(page.getByRole('button', { name: '下一项回忆' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '编辑回忆' })).toHaveCount(0);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.getByTestId('album-item')).toHaveCount(5);
  await page.getByRole('button', { name: '时间轴查看', exact: true }).click();
  await expect(page.getByRole('heading', { name: /2026 年 7 月/ })).toBeVisible();
  await page.getByRole('button', { name: '网格查看', exact: true }).click();
  await page.getByRole('button', { name: '查看图片：山中散步', exact: true }).click();
  const fullscreen = await page.getByRole('dialog').boundingBox();
  const viewport = page.viewportSize()!;
  expect(fullscreen!.x).toBe(0);
  expect(fullscreen!.y).toBe(0);
  expect(fullscreen!.width).toBe(viewport.width);
  expect(fullscreen!.height).toBe(viewport.height);
  await page.getByRole('button', { name: '放大照片' }).click();
  await expect(page.locator('.album-viewer-media')).toHaveClass(/is-zoomed/);
  await page.getByRole('button', { name: '还原照片' }).click();
  await page.getByRole('dialog').press('ArrowRight');
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: '周末', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '紧凑查看', exact: true }).click();
  await expect(page.locator('.album-grid.is-compact')).toBeVisible();
  // Seed older pages directly; publication above is exercised through the real API and UI.
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync('data/e2e-album.sqlite');
  const user = db.prepare('SELECT id,coupleId FROM users WHERE username=?').get(username)!;
  const insert = db.prepare(
    'INSERT INTO moments(id,coupleId,ownerId,title,mediaId,date) VALUES(?,?,?,?,?,?)',
  );
  for (let i = 0; i < 61; i++)
    insert.run(crypto.randomUUID(), user.coupleId, user.id, `回忆${i}`, own.media.id, '2024-01-01');
  db.close();
  await page.reload();
  await page.getByRole('tab', { name: '回忆', exact: true }).click();
  await expect(page.getByText('66 个回忆', { exact: true })).toBeVisible();
  await expect(page.getByTestId('album-item')).toHaveCount(60);
  await page.getByTestId('album-item').last().getByRole('button').click();
  await page.getByRole('button', { name: '下一项回忆' }).click();
  await expect(page.getByRole('dialog').getByText('61 / 66', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(page.getByTestId('album-item')).toHaveCount(66);
  await page.reload();
  await page.getByRole('tab', { name: '回忆', exact: true }).click();
  await expect(page.getByRole('button', { name: '紧凑查看' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
