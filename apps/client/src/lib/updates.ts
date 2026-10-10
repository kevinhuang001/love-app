import { App } from '@capacitor/app';
import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';

const releaseAPI = 'https://api.github.com/repos/kevinhuang001/love-app/releases/latest';
const Installer = registerPlugin<{
  install(options: { uri: string; sha256: string }): Promise<void>;
}>('AppUpdates');
export type AndroidUpdate = {
  current: string;
  latest: string;
  available: boolean;
  url: string;
  checksumURL: string;
};
export function newerVersion(latest: string, current: string) {
  const parse = (v: string) => /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v)?.slice(1).map(Number);
  const a = parse(latest),
    b = parse(current);
  if (!a || !b) throw new Error('无法识别版本号');
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}
function trustedAsset(url: string) {
  const parsed = new URL(url);
  if (
    parsed.origin !== 'https://github.com' ||
    !parsed.pathname.startsWith('/kevinhuang001/love-app/releases/download/')
  )
    throw new Error('更新文件地址无效');
  return url;
}
export async function checkAndroidUpdate(): Promise<AndroidUpdate> {
  if (Capacitor.getPlatform() !== 'android') throw new Error('请在安卓应用中检查更新');
  const info = await App.getInfo();
  const result = await CapacitorHttp.get({
    url: releaseAPI,
    headers: { Accept: 'application/vnd.github+json' },
    connectTimeout: 20000,
    readTimeout: 20000,
  });
  if (result.status !== 200)
    throw new Error(result.status === 404 ? '还没有可下载的正式版本' : '检查更新失败，请稍后重试');
  const release = result.data;
  if (release.draft || release.prerelease) throw new Error('没有可用的正式版本');
  const apk = release.assets?.find(
    (a: { name: string }) => a.name === `Love-${release.tag_name}.apk`,
  );
  const checksum = release.assets?.find((a: { name: string }) => a.name === `${apk?.name}.sha256`);
  if (!apk || !checksum) throw new Error('最新版本尚未提供正式签名的安卓安装包');
  return {
    current: info.version,
    latest: release.tag_name.replace(/^v/, ''),
    available: newerVersion(release.tag_name, info.version),
    url: trustedAsset(apk.browser_download_url),
    checksumURL: trustedAsset(checksum.browser_download_url),
  };
}
export async function downloadAndroidUpdate(
  update: AndroidUpdate,
  progress: (text: string) => void,
) {
  const checksum = await CapacitorHttp.get({
    url: trustedAsset(update.checksumURL),
    responseType: 'text',
    connectTimeout: 20000,
    readTimeout: 20000,
  });
  const sha256 = String(checksum.data).trim().split(/\s+/)[0];
  if (checksum.status !== 200 || !/^[a-f0-9]{64}$/i.test(sha256))
    throw new Error('安装包校验信息无效');
  const path = `love-update-${update.latest}.apk`;
  const file = await Filesystem.getUri({ directory: Directory.Cache, path });
  const listener = await FileTransfer.addListener('progress', (e) =>
    progress(
      e.contentLength > 0
        ? `下载 ${Math.round((e.bytes / e.contentLength) * 100)}%`
        : `已下载 ${(e.bytes / 1048576).toFixed(1)} MB`,
    ),
  );
  try {
    await FileTransfer.downloadFile({
      url: trustedAsset(update.url),
      path: file.uri,
      progress: true,
      connectTimeout: 20000,
      readTimeout: 0,
    });
    progress('正在校验安装包…');
    await Installer.install({ uri: file.uri, sha256 });
    progress('安装包已校验，请在系统界面确认安装；授权后可再次点击安装');
  } catch (error) {
    await Filesystem.deleteFile({ directory: Directory.Cache, path }).catch(() => {});
    throw error;
  } finally {
    await listener.remove();
  }
}
