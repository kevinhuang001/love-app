import { test, expect } from '@playwright/test';
import { register } from './auth-helper';

test('missing presence settles offline; schedules tick each second; settings fold without losing edits', async ({
  page,
  request,
}) => {
  const suffix = Date.now().toString().slice(-9);
  const a = await (
    await register(request, { username: 'clock' + suffix, name: '小林', password: 'password123' })
  ).json();
  const b = await (
    await register(request, { username: 'time' + suffix, name: '阿宁', password: 'password123' })
  ).json();
  const base = 'http://127.0.0.1:3000',
    headers = { Authorization: `Bearer ${a.token}` };
  const invite = await (
    await request.post(base + '/api/pairing/invite', { headers, data: {} })
  ).json();
  expect(
    (
      await request.post(base + '/api/pairing/join', {
        headers: { Authorization: `Bearer ${b.token}` },
        data: { code: invite.code },
      })
    ).ok(),
  ).toBe(true);
  const local = (stamp: number) => new Date(stamp + 8 * 3600000).toISOString();
  const past = local(Date.now() - 80000),
    future = local(Date.now() + 3600000);
  expect(
    (
      await request.post(base + '/api/anniversaries', {
        headers,
        data: { title: '秒级纪念', date: past.slice(0, 10), time: past.slice(11, 19) },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (
      await request.post(base + '/api/todos', {
        headers,
        data: {
          title: '秒级待办',
          date: future.slice(0, 10),
          time: future.slice(11, 19),
          calendar: 'solar',
          repeat: 'none',
          leapMonth: false,
        },
      })
    ).ok(),
  ).toBe(true);
  // Keep the transport connected, but simulate a missing presence response.
  await page.routeWebSocket('**/socket.io/**', (socket) => {
    const server = socket.connectToServer();
    server.onMessage((message) => {
      if (!String(message).includes('"presence:changed"')) socket.send(message);
    });
    socket.onMessage((message) => server.send(message));
  });
  await page.addInitScript(
    ({ base, token }) =>
      localStorage.setItem(
        'CapacitorStorage.love.session',
        JSON.stringify({ server: base, token }),
      ),
    { base, token: a.token },
  );
  await page.goto('/');
  await expect(page.getByTestId('partner-presence')).toHaveText('正在确认状态…');
  await expect(page.getByTestId('partner-presence')).toHaveText('离线', { timeout: 5000 });
  await expect(page.getByRole('button', { name: '打开空间设置' })).toHaveCount(0);
  await page.getByRole('tab', { name: '纪念日', exact: true }).click();
  const elapsed = page.locator('.date-row').filter({ hasText: '秒级纪念' }).getByTestId('duration');
  const first = Number(await elapsed.getAttribute('data-seconds'));
  expect(first).toBeGreaterThanOrEqual(80);
  await expect
    .poll(async () => Number(await elapsed.getAttribute('data-seconds')))
    .toBeGreaterThan(first);
  await expect(page.locator('.date-row')).toContainText(past.slice(11, 19));
  await page.getByRole('tab', { name: 'To Do', exact: true }).click();
  const countdown = page
    .locator('.todo-item')
    .filter({ hasText: '秒级待办' })
    .getByTestId('duration');
  const remaining = Number(await countdown.getAttribute('data-seconds'));
  expect(remaining).toBeGreaterThan(3500);
  await expect
    .poll(async () => Number(await countdown.getAttribute('data-seconds')))
    .toBeLessThan(remaining);
  await page.getByRole('tab', { name: '我们', exact: true }).click();
  await expect(page.locator('body')).not.toContainText('两个人的生活');
  await expect(page.locator('.settings-section:not([open])')).toHaveCount(0);
  await expect(page.locator('details[data-section="使用条款与免责声明"]')).toContainText(
    '禁止上传、传播违法内容',
  );
  const ai = page.locator('details[data-section="AI 助手"]');
  await expect(page.getByLabel('AI 服务 URL')).toBeVisible();
  await page.getByLabel('AI 服务 URL').fill('https://example.com/v1');
  await ai.locator('summary').click();
  await expect(page.getByLabel('AI 服务 URL')).toBeHidden();
  await ai.locator('summary').click();
  await expect(page.getByLabel('AI 服务 URL')).toHaveValue('https://example.com/v1');
  const account = page.locator('details[data-section="服务器与账号"]');
  await expect(account).toContainText(base);
  await expect(account.getByRole('button', { name: '退出登录 / 切换服务器' })).toBeVisible();
  await page.screenshot({ path: 'test-results/foldable-settings.png', fullPage: true });
});
