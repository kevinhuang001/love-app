// Runs inside the downloaded app image with Compose's database credentials.
import * as ui from '@clack/prompts';
import { randomBytes, randomUUID } from 'node:crypto';
import { openDatabase, transaction } from '../apps/server/dist/db.js';
import { createControl } from '../apps/server/dist/control.js';
import { hashPassword, hashToken } from '../apps/server/dist/security.js';
import { seal } from '../apps/server/dist/mail.js';
export async function manage({ env = process.env, prompts = ui } = {}) {
  const db = await openDatabase({
    path: env.DATABASE_URL || env.DATABASE_PATH || '/app/data/love.sqlite',
    provider: env.DATABASE_PROVIDER || undefined,
  });
  const control = await createControl(db, env.MEDIA_SIGNING_SECRET, {}, () => {});
  const ask = async (p) => {
    const v = await p;
    if (prompts.isCancel(v)) throw new Error('已取消操作');
    return v;
  };
  const text = (message, initialValue = '', validate) =>
    ask(prompts.text({ message, initialValue, defaultValue: initialValue, validate }));
  const number = async (message, value, min, max) =>
    Number(
      await text(message, String(value), (v) =>
        /^\d+$/.test(v || String(value)) && Number(v || value) >= min && Number(v || value) <= max
          ? undefined
          : `填写 ${min}–${max} 的整数`,
      ),
    );
  const password = () =>
    ask(
      prompts.password({
        message: '新密码（12–128 字符）',
        validate: (v) => (v.length >= 12 && v.length <= 128 ? undefined : '密码长度为 12–128 字符'),
      }),
    );
  const audit = async (action, details = {}) =>
    db
      .prepare('INSERT INTO audit_logs(createdAt,adminId,action,target,details) VALUES(?,?,?,?,?)')
      .run(new Date().toISOString(), 'terminal', action, '', JSON.stringify(details));
  try {
    await control.bootstrap;
    prompts.intro('Love · 服务器管理');
    const action = await ask(
      prompts.select({
        message: '选择管理操作',
        options: [
          { value: 'policy', label: '注册、邀请码、SMTP、默认容量和日志设置' },
          { value: 'admin', label: '重置管理员密码' },
          { value: 'account', label: '创建用户 / 重置用户密码 / 启停账号' },
          { value: 'quota', label: '调整配对存储容量' },
          { value: 'invites', label: '批量生成注册邀请码' },
          { value: 'exit', label: '返回主菜单' },
        ],
      }),
    );
    if (action === 'exit') return;
    if (action === 'policy') {
      const config = await control.readSettings();
      config.registration = await ask(
        prompts.select({
          message: '注册方式',
          initialValue: config.registration,
          options: [
            { value: 'closed', label: '仅管理员建号' },
            { value: 'email', label: '邮箱注册' },
            { value: 'whitelist', label: '邮箱白名单' },
          ],
        }),
      );
      config.invitationRequired = await ask(
        prompts.confirm({ message: '注册需要邀请码？', initialValue: config.invitationRequired }),
      );
      config.domains = (
        await text('允许的邮箱域名（逗号分隔，留空不限制）', config.domains.join(','))
      )
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean);
      config.defaultQuotaMiB = await number(
        '新配对默认容量（MiB）',
        config.defaultQuotaMiB,
        0,
        1000000,
      );
      config.retentionDays = await number('日志保留天数', config.retentionDays, 7, 90);
      if (await ask(prompts.confirm({ message: '修改 SMTP？', initialValue: false }))) {
        config.smtp.host = await text('SMTP 主机', config.smtp.host);
        config.smtp.port = await number('SMTP 端口', config.smtp.port, 1, 65535);
        config.smtp.security = await ask(
          prompts.select({
            message: 'SMTP 加密',
            initialValue: config.smtp.security,
            options: [
              { value: 'starttls', label: 'STARTTLS' },
              { value: 'tls', label: 'TLS' },
              { value: 'plain', label: '不加密' },
            ],
          }),
        );
        config.smtp.user = await text('SMTP 用户名', config.smtp.user);
        const secret = await ask(prompts.password({ message: 'SMTP 密码（回车保留）' }));
        if (secret) config.smtp.password = seal(secret, env.MEDIA_SIGNING_SECRET);
        config.smtp.from = await text('发件邮箱', config.smtp.from);
        config.smtp.senderName = await text('发件人名称', config.smtp.senderName);
      }
      if (config.registration !== 'closed' && !(config.smtp.host && config.smtp.from))
        throw new Error('开放注册前必须配置 SMTP 主机和发件邮箱');
      if (await ask(prompts.confirm({ message: '保存服务器设置？', initialValue: true }))) {
        // Use the same settings validation as the HTTP administrator API.
        const { validateControlSettings } = await import('../apps/server/dist/control.js');
        validateControlSettings(config);
        await transaction(db, async () => {
          await db
            .prepare(
              "INSERT INTO server_config(key,value) VALUES('control',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            )
            .run(JSON.stringify(config));
          await audit('terminal.settings.updated');
        });
      }
    }
    if (action === 'admin') {
      const admins = await db
        .prepare('SELECT id,username FROM administrators ORDER BY username')
        .all();
      if (!admins.length) throw new Error('请先完成首次部署配置');
      const id = await ask(
        prompts.select({
          message: '选择管理员',
          options: admins.map((v) => ({ value: v.id, label: v.username })),
        }),
      );
      const hash = await hashPassword(await password());
      await transaction(db, async () => {
        await db.prepare('UPDATE administrators SET password=? WHERE id=?').run(hash, id);
        await db.prepare('DELETE FROM admin_sessions WHERE adminId=?').run(id);
        await audit('terminal.admin.password.reset');
      });
    }
    if (action === 'account') {
      const mode = await ask(
        prompts.select({
          message: '账号操作',
          options: [
            { value: 'create', label: '创建已验证用户' },
            { value: 'reset', label: '重置密码' },
            { value: 'disable', label: '停用账号' },
            { value: 'enable', label: '启用账号' },
          ],
        }),
      );
      const name = await text('用户名', '', (v) =>
        /^[a-z0-9_]{3,24}$/.test(v) ? undefined : '3–24 位小写字母、数字或下划线',
      );
      if (mode === 'create') {
        const email = await text('用户邮箱', '', (v) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : '填写有效邮箱',
        );
        if (
          !(await ask(
            prompts.confirm({
              message: '已通过其他方式确认此用户拥有该邮箱？',
              initialValue: false,
            }),
          ))
        )
          return;
        const display = await text('用户昵称', name, (v) =>
            v.trim().length >= 1 && v.length <= 40 ? undefined : '昵称长度为 1–40 字符',
          ),
          hash = await hashPassword(await password());
        await db
          .prepare(
            'INSERT INTO users(id,username,name,password,email,verifiedAt) VALUES(?,?,?,?,?,?)',
          )
          .run(randomUUID(), name, display, hash, email.toLowerCase(), new Date().toISOString());
      } else {
        const user = await db.prepare('SELECT id FROM users WHERE username=?').get(name);
        if (!user) throw new Error('账号不存在');
        const hash = mode === 'reset' ? await hashPassword(await password()) : null;
        await transaction(db, async () => {
          if (hash) await db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, user.id);
          else
            await db
              .prepare('UPDATE users SET disabled=? WHERE id=?')
              .run(mode === 'disable' ? 1 : 0, user.id);
          await db.prepare('DELETE FROM sessions WHERE userId=?').run(user.id);
        });
      }
      await audit('terminal.account.' + mode, { username: name });
    }
    if (action === 'quota') {
      const pairs = await db
        .prepare('SELECT c.id,u.name FROM couples c JOIN users u ON u.coupleId=c.id ORDER BY c.id')
        .all();
      const ids = [...new Set(pairs.map((v) => v.id))];
      if (!ids.length) throw new Error('目前没有配对');
      const id = await ask(
        prompts.select({
          message: '选择配对',
          options: ids.map((id) => ({
            value: id,
            label:
              pairs
                .filter((v) => v.id === id)
                .map((v) => v.name)
                .join(' / ') +
              ' · ' +
              id,
          })),
        }),
      );
      const current = await db
        .prepare('SELECT quotaMiB FROM couple_limits WHERE coupleId=?')
        .get(id);
      const quota = await number(
        '容量上限（MiB，0 禁止新增上传）',
        current?.quotaMiB ?? (await control.readSettings()).defaultQuotaMiB,
        0,
        1000000,
      );
      await db
        .prepare(
          'INSERT INTO couple_limits VALUES(?,?) ON CONFLICT(coupleId) DO UPDATE SET quotaMiB=excluded.quotaMiB',
        )
        .run(id, quota);
      await audit('terminal.quota.updated', { coupleId: id, quotaMiB: quota });
    }
    if (action === 'invites') {
      const count = await number('生成数量', 10, 1, 200),
        maxUses = await number('每码可用次数', 1, 1, 10000),
        days = await number('有效天数（0 不过期）', 30, 0, 3650),
        label = await text('批次备注', '终端生成', (v) =>
          v.length <= 60 ? undefined : '备注最多 60 字符',
        );
      const expires = days ? Date.now() + days * 86400000 : 0,
        codes = [];
      await transaction(db, async () => {
        for (let i = 0; i < count; i++) {
          const code = randomBytes(18).toString('base64url');
          await db
            .prepare(
              'INSERT INTO registration_invites(id,hash,label,maxUses,expires,createdAt) VALUES(?,?,?,?,?,?)',
            )
            .run(randomUUID(), hashToken(code), label, maxUses, expires, new Date().toISOString());
          codes.push(code);
        }
        await audit('terminal.invites.created', { count });
      });
      prompts.note(codes.join('\n'), '邀请码 · 仅显示一次，请保存');
    }
    prompts.outro('管理操作已完成');
  } finally {
    await control.close();
    await db.close();
  }
}
if (process.argv[1]?.endsWith('/manage-server.mjs')) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('请从 ./love 的交互菜单运行服务器管理。');
    process.exitCode = 1;
  } else
    try {
      await manage();
    } catch (e) {
      ui.log.error(e.message);
      process.exitCode = 1;
    }
}
