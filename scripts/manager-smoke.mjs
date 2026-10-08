// CI verifies the terminal controller inside the actual production image.
import { execFileSync } from 'node:child_process';
const program = `
import assert from 'node:assert/strict';
import {openDatabase} from '/app/apps/server/dist/db.js';
import {hashPassword,verifyPassword} from '/app/apps/server/dist/security.js';
import {manage} from '/app/scripts/manage-server.mjs';
const env={...process.env,DATABASE_PATH:'/tmp/manager-smoke.sqlite',DATABASE_URL:'',DATABASE_PROVIDER:'sqlite',MEDIA_SIGNING_SECRET:'ci-manager-only-private-secret-at-least-32'};
let db=await openDatabase(env.DATABASE_PATH);
await db.prepare('INSERT INTO administrators VALUES(?,?,?,?)').run('admin-id','manager_admin',await hashPassword('old-admin-password-123'),new Date().toISOString());
await db.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').run('old-token','admin-id',Date.now()+999999);
await db.close();
const notes=[];
const prompts={intro(){},outro(){},note(v){notes.push(v)},isCancel:()=>false,select:async p=>p.message==='选择管理操作'?'admin':'admin-id',password:async()=> 'new-admin-password-123'};
await manage({env,prompts});
db=await openDatabase(env.DATABASE_PATH);
assert.ok(await verifyPassword('new-admin-password-123',(await db.prepare('SELECT password FROM administrators').get()).password));
assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM admin_sessions').get()).count,0);await db.close();
await manage({env,prompts:{...prompts,select:async p=>p.message==='选择管理操作'?'invites':'generate',text:async p=>p.defaultValue}});
db=await openDatabase(env.DATABASE_PATH);assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM registration_invites').get()).count,10);assert.equal(notes[0].split('\\n').length,10);assert.ok(!(await db.prepare('SELECT hash FROM registration_invites LIMIT 1').get()).hash.includes(notes[0].split('\\n')[0]));await db.close();
await manage({env,prompts:{...prompts,select:async p=>p.message==='选择管理操作'?'policy':'closed',confirm:async p=>p.message==='注册需要邀请码？'||p.message==='保存服务器设置？',text:async p=>p.defaultValue}});
db=await openDatabase(env.DATABASE_PATH);const config=JSON.parse((await db.prepare("SELECT value FROM server_config WHERE key='control'").get()).value);assert.equal(config.invitationRequired,true);assert.equal(config.registration,'closed');await db.close();
console.log('Production terminal management: password/session revocation, batch invite hashing and server policy verified.');
`;
execFileSync(
  'docker',
  ['run', '--rm', '--entrypoint', 'node', 'love-ci', '--input-type=module', '-e', program],
  { stdio: 'inherit' },
);
