import { test, expect } from '@playwright/test';
import { captcha, solveCaptcha, verifyEmail } from './auth-helper';
test('administrator enables invitations, downloads a batch and user signs up with verified email', async ({
  page,
  request,
}) => {
  const stamp = Date.now().toString().slice(-9);
  const response = await request.post('http://127.0.0.1:3000/api/admin/login', {
    data: {
      username: 'admin_master',
      password: 'admin-test-password-123',
      ...(await captcha(request, 'admin')),
    },
  });
  expect(response.ok()).toBeTruthy();
  const headers = { Authorization: 'Bearer ' + (await response.json()).token };
  const current = await (
    await request.get('http://127.0.0.1:3000/api/admin/settings', { headers })
  ).json();
  try {
    await page.goto('/#admin');
    await page.getByText('服务器设置', { exact: true }).click();
    await page.getByLabel('服务器地址', { exact: true }).fill('http://127.0.0.1:3000');
    await page.getByLabel('管理员用户名').fill('admin_master');
    await page.getByLabel('管理员密码', { exact: true }).fill('admin-test-password-123');
    await solveCaptcha(page);
    await page.getByRole('button', { name: '进入管理后台', exact: true }).click();
    await page.getByRole('button', { name: '设置', exact: true }).click();
    await page.getByLabel('注册方式').selectOption('email');
    await page.getByLabel('允许注册的邮箱域名').fill('');
    await page.getByRole('checkbox', { name: '注册需要邀请码', exact: true }).check();
    await page.getByRole('button', { name: '保存服务器设置', exact: true }).click();
    await expect(page.getByText('服务器设置已保存', { exact: true })).toBeVisible();
    await page.getByLabel('生成数量').fill('2');
    await page.getByLabel('每码可用次数').fill('1');
    await page.getByLabel('有效天数（0 不过期）').fill('0');
    await page.getByLabel('批次备注').fill('浏览器批次' + stamp);
    await page.getByRole('button', { name: '批量生成邀请码' }).click();
    const field = page.getByRole('textbox', { name: '本次生成的邀请码' });
    await expect(field).toBeVisible();
    const codes = (await field.inputValue()).trim().split('\n');
    expect(codes).toHaveLength(2);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '下载本批邀请码' }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toMatch(/Love-invitation-codes\.(txt|csv)$/);
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const c of stream!) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    expect(codes.every((c) => body.includes(c))).toBeTruthy();
    await page.getByRole('button', { name: '退出管理后台' }).click();
    await page.getByRole('link', { name: '返回用户登录' }).click();
    await page.getByRole('tab', { name: '创建账号', exact: true }).click();
    await expect(page.getByLabel('邀请码', { exact: true })).toBeVisible();
    await page.getByLabel('用户名', { exact: true }).fill('invite' + stamp);
    await page.getByLabel('怎么称呼你').fill('邀请用户');
    await page.getByLabel('密码', { exact: true }).fill('password123');
    await page.getByLabel('邀请码', { exact: true }).fill(codes[0]);
    await verifyEmail(page, 'invite' + stamp + '@example.test');
    await page.getByRole('button', { name: '开始我们的故事' }).click();
    await expect(page.getByText('连接另一半', { exact: true })).toBeVisible();
    const list = await (
      await request.get('http://127.0.0.1:3000/api/admin/registration-invites', { headers })
    ).json();
    expect(
      list
        .filter((v: { label: string }) => v.label === '浏览器批次' + stamp)
        .reduce((sum: number, v: { uses: number }) => sum + v.uses, 0),
    ).toBe(1);
  } finally {
    await request.patch('http://127.0.0.1:3000/api/admin/settings', { headers, data: current });
  }
});
