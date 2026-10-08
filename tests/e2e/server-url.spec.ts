import { test, expect } from '@playwright/test';
import { register, solveCaptcha } from './auth-helper';

test('login accepts a non-localhost HTTP server and reports invalid addresses', async ({
  page,
  request,
}) => {
  const username = `remote${Date.now().toString().slice(-9)}`;
  const account = await register(request, { username, password: 'password123', name: '远程登录' });
  expect(account.status()).toBe(201);
  const remote = 'http://192.0.2.10:3000';
  // Route this documentation-only address to the real test backend; auth is not mocked.
  await page.route(`${remote}/**`, async (route) => {
    const response = await route.fetch({
      url: route.request().url().replace(remote, 'http://127.0.0.1:3000'),
    });
    await route.fulfill({ response });
  });
  await page.goto('/');
  await page.getByText('服务器设置', { exact: true }).click();
  await page.getByLabel('服务器地址').fill('192.168.1.10:3000');
  await expect(page.getByLabel('用户名', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('密码', { exact: true })).toHaveAttribute(
    'placeholder',
    '请先配置服务器地址',
  );
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: '测试连接' }).click();
  await expect(page.getByRole('status')).toContainText('请输入完整的服务器根地址');
  await expect(page.getByRole('button', { name: '进入我们的空间' })).toBeDisabled();
  await page.getByLabel('服务器地址').fill(remote);
  await page.getByRole('button', { name: '测试连接' }).click();
  await expect(page.getByRole('status')).toContainText('连接成功 · Love');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByText('服务器设置', { exact: true }).click();
  await expect(page.getByLabel('服务器地址')).toBeHidden();
  await page.getByLabel('用户名', { exact: true }).fill(username);
  await page.getByLabel('密码', { exact: true }).fill('password123');
  await solveCaptcha(page);
  await expect(page.getByRole('button', { name: '进入我们的空间' })).toBeEnabled();
  await page.getByRole('button', { name: '进入我们的空间' }).click();
  await expect(page.getByText('连接另一半', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('love.server'))).toBe(remote);
});

test('empty server locks credentials with placeholders, stays collapsible and can recover', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('love.server', ' '));
  await page.goto('/');
  for (const name of ['用户名', '密码']) {
    await expect(page.getByLabel(name, { exact: true })).toBeDisabled();
    await expect(page.getByLabel(name, { exact: true })).toHaveAttribute(
      'placeholder',
      '请先配置服务器地址',
    );
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByLabel('服务器地址')).toBeHidden();
  await page.getByText('服务器设置', { exact: true }).click();
  await page.getByRole('button', { name: '测试连接' }).click();
  await expect(page.getByRole('status')).toHaveText('请先配置服务器地址');
  await page.getByLabel('服务器地址').fill('http://127.0.0.1:3000');
  await page.getByRole('button', { name: '测试连接' }).click();
  await expect(page.getByRole('status')).toContainText('连接成功 · Love');
  await page.getByLabel('用户名', { exact: true }).fill('temporary');
  await page.getByLabel('密码', { exact: true }).fill('temporary-password');
  await page.getByLabel('服务器地址').fill('');
  for (const name of ['用户名', '密码']) {
    await expect(page.getByLabel(name, { exact: true })).toBeDisabled();
    await expect(page.getByLabel(name, { exact: true })).toHaveValue('');
    await expect(page.getByLabel(name, { exact: true })).toHaveAttribute(
      'placeholder',
      '请先配置服务器地址',
    );
  }
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('unreachable HTTP server shows a Chinese error and captcha can retry', async ({ page }) => {
  const remote = 'http://192.0.2.11:3000';
  await page.route(`${remote}/**`, (route) => route.abort('connectionrefused'));
  await page.goto('/');
  await page.getByText('服务器设置', { exact: true }).click();
  await page.getByLabel('服务器地址').fill(remote);
  await expect(page.getByRole('alert')).toContainText('无法连接服务器');
  await page.getByRole('button', { name: '测试连接' }).click();
  await expect(page.getByRole('status')).toContainText('连接失败：无法连接服务器');
  await expect(page.getByRole('button', { name: '重新获取' })).toBeEnabled();
  await expect(page.getByRole('button', { name: '刷新图形验证码' })).toBeEnabled();
  await expect(page.getByRole('button', { name: '进入我们的空间' })).toBeDisabled();
  await page.unroute(`${remote}/**`);
  await page.route(`${remote}/**`, async (route) => {
    const response = await route.fetch({
      url: route.request().url().replace(remote, 'http://127.0.0.1:3000'),
    });
    await route.fulfill({ response });
  });
  await page.getByRole('button', { name: '重新获取' }).click();
  await solveCaptcha(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '进入我们的空间' })).toBeEnabled();
});
