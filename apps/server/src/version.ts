import { SCHEMA_VERSION } from './migrations.js';
// Keep in sync with package.json; schema migrations have their own independent version.
export const APPLICATION_VERSION = '2.9.3';
export function assertBackupVersion(
  applicationVersion: unknown,
  schemaVersion: unknown,
  targetVersion = APPLICATION_VERSION,
  targetSchemaVersion = SCHEMA_VERSION,
) {
  const parse = (value: unknown) => {
    if (typeof value !== 'string' || !/^\d+\.\d+\.\d+$/.test(value))
      throw new Error('备份软件版本无效');
    const parts = value.split('.').map(Number);
    if (parts.some((n) => !Number.isSafeInteger(n))) throw new Error('备份软件版本无效');
    return parts;
  };
  const source = parse(applicationVersion),
    target = parse(targetVersion);
  if (!Number.isSafeInteger(schemaVersion) || Number(schemaVersion) < 1)
    throw new Error('备份数据库版本无效');
  for (let i = 0; i < 3; i++) {
    if (source[i] > target[i]) throw new Error('备份软件版本高于当前软件，不支持导入');
    if (source[i] < target[i]) break;
  }
  if (Number(schemaVersion) > targetSchemaVersion)
    throw new Error('备份数据库版本高于当前软件，不支持导入');
}
