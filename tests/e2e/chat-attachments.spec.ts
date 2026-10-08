import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import sharp from 'sharp';
import { captcha, login, solveCaptcha } from './auth-helper';

test('mobile AI name completion, multiple photos, visual input and retained login hints', async ({
  page,
  request,
}) => {
  const suffix = Date.now().toString().slice(-8),
    username = 'chata' + suffix;
  const admin = await request.post('http://127.0.0.1:3000/api/admin/login', {
    data: {
      username: 'admin_master',
      password: 'admin-test-password-123',
      ...(await captcha(request, 'admin')),
    },
  });
  expect(admin.ok()).toBeTruthy();
  const adminHeaders = { Authorization: `Bearer ${(await admin.json()).token}` };
  const account = async (username: string) => {
    const response = await request.post('http://127.0.0.1:3000/api/admin/users', {
      headers: adminHeaders,
      data: {
        username,
        name: username,
        email: `${username}@example.test`,
        password: 'password123',
        confirmedEmail: true,
      },
    });
    expect(response.status()).toBe(201);
    const session = await login(request, { username, password: 'password123' });
    expect(session.ok()).toBeTruthy();
    return session.json();
  };
  const self = await account(username),
    partner = await account('chatb' + suffix);
  const headers = { Authorization: `Bearer ${self.token}` };
  const invite = await request.post('http://127.0.0.1:3000/api/pairing/invite', {
    headers,
    data: {},
  });
  expect(invite.ok()).toBeTruthy();
  const joined = await request.post('http://127.0.0.1:3000/api/pairing/join', {
    headers: { Authorization: `Bearer ${partner.token}` },
    data: { code: (await invite.json()).code },
  });
  expect(joined.ok()).toBeTruthy();
  const prompts: any[] = [];
  const provider = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      prompts.push(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          choices: [{ message: { role: 'assistant', content: '两张图片都收到了。' } }],
        }),
      );
    });
  });
  await new Promise<void>((resolve) => provider.listen(0, '127.0.0.1', resolve));
  try {
    await request.patch('http://127.0.0.1:3000/api/ai/profile', {
      headers,
      data: { name: '松子' },
    });
    const config = await request.post('http://127.0.0.1:3000/api/ai/settings', {
      headers,
      data: {
        enabled: true,
        model: 'vision-test',
        apiKey: 'test',
        baseUrl: `http://127.0.0.1:${(provider.address() as { port: number }).port}/v1`,
      },
    });
    expect(config.ok()).toBeTruthy();
    // Exercise the actual login UI so login hints are saved, without injecting a token.
    await page.goto('/');
    await page.getByText('服务器设置', { exact: true }).click();
    await page.getByLabel('服务器地址').fill('http://127.0.0.1:3000');
    await page.getByLabel('用户名', { exact: true }).fill(username);
    await page.getByLabel('密码', { exact: true }).fill('password123');
    await solveCaptcha(page);
    await page.getByRole('button', { name: '进入我们的空间' }).click();
    const composer = page.getByRole('textbox', { name: '消息内容' });
    await expect(composer).toBeVisible();
    await composer.fill('@');
    await expect(page.getByRole('option', { name: '提及 松子' })).toBeVisible();
    await page.getByRole('option', { name: '提及 松子' }).click();
    await expect(composer).toHaveValue('@松子 ');
    await composer.fill('@松');
    await composer.press('Escape');
    await expect(page.getByRole('listbox', { name: '提及助手' })).toHaveCount(0);
    const rename = await request.patch('http://127.0.0.1:3000/api/ai/profile', {
      headers: { Authorization: `Bearer ${partner.token}` },
      data: { name: '星星' },
    });
    expect(rename.ok()).toBeTruthy();
    await expect(composer).toHaveAttribute('placeholder', '发消息，或 @星星');
    await composer.fill('@星');
    await expect(page.getByRole('option', { name: '提及 星星' })).toBeVisible();
    await composer.press('Tab');
    await expect(composer).toHaveValue('@星星 ');
    await composer.fill('@星星 比较这两张图片');
    const photos = await Promise.all(
      ['#395f50', '#bba076', '#223344'].map(async (background, i) => ({
        name: `photo-${i + 1}.png`,
        mimeType: 'image/png',
        buffer: await sharp({ create: { width: 400, height: 300, channels: 3, background } })
          .png()
          .toBuffer(),
      })),
    );
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '添加图片或视频' }).click();
    const picker = await chooser;
    expect(picker.isMultiple()).toBe(true);
    await picker.setFiles(photos);
    await expect(page.getByRole('img', { name: /待发送图片/ })).toHaveCount(3);
    await expect(page.getByRole('button', { name: '发送消息' })).toBeEnabled();
    await page.getByRole('button', { name: '移除附件 3', exact: true }).click();
    await expect(page.getByRole('img', { name: /待发送图片/ })).toHaveCount(2);
    await page.getByRole('button', { name: '发送消息' }).click();
    await expect(page.getByText('两张图片都收到了。', { exact: true })).toBeVisible({
      timeout: 16000,
    });
    await expect(
      page.getByTestId('message-attachments').getByRole('button', { name: '查看图片' }),
    ).toHaveCount(2);
    expect(
      prompts[0].messages[1].content.filter((part: any) => part.type === 'image_url'),
    ).toHaveLength(2);
    await page
      .getByTestId('message-attachments')
      .getByRole('button', { name: '查看图片' })
      .nth(1)
      .click();
    await expect(page.getByRole('img', { name: '照片大图' })).toBeVisible();
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await page.reload();
    await expect(composer).toBeVisible();
    await expect(
      page.getByTestId('message-attachments').getByRole('button', { name: '查看图片' }),
    ).toHaveCount(2);
    await page.getByRole('tab', { name: '我们', exact: true }).click();
    await page.getByRole('button', { name: '退出登录 / 切换服务器', exact: true }).click();
    await page.getByRole('button', { name: '退出登录', exact: true }).click();
    await expect(page.getByLabel('用户名', { exact: true })).toHaveValue(username);
    await expect(page.getByLabel('密码', { exact: true })).toHaveValue('');
    await page.getByText('服务器设置', { exact: true }).click();
    await expect(page.getByLabel('服务器地址')).toHaveValue('http://127.0.0.1:3000');
    expect(
      await page.evaluate(() => localStorage.getItem('CapacitorStorage.love.session')),
    ).toBeNull();
  } finally {
    await new Promise<void>((resolve) => provider.close(() => resolve()));
  }
});
