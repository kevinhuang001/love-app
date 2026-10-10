import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { Share } from '@capacitor/share';
import type { Api } from './api';
export async function exportAlbum(api: Api, progress: (text: string) => void) {
  const result = await api.post<{ url: string; filename: string }>('/api/album/exports', {});
  if (!Capacitor.isNativePlatform()) {
    const link = document.createElement('a');
    link.href = api.url(result.url);
    link.download = result.filename;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return '导出已交给浏览器下载';
  }
  const path = `${Date.now()}-${result.filename}`;
  const file = await Filesystem.getUri({ directory: Directory.Cache, path });
  const listener = await FileTransfer.addListener('progress', (event) => {
    progress(
      event.contentLength > 0
        ? `下载 ${Math.round((event.bytes / event.contentLength) * 100)}%`
        : `已下载 ${(event.bytes / 1024 / 1024).toFixed(1)} MB`,
    );
  });
  try {
    progress('正在准备导出…');
    await FileTransfer.downloadFile({
      url: api.url(result.url),
      path: file.uri,
      progress: true,
      readTimeout: 0,
      connectTimeout: 20_000,
    });
    progress('选择保存或分享位置');
    await Share.share({ title: 'Love 相册', files: [file.uri], dialogTitle: '保存或分享相册 ZIP' });
    return '相册 ZIP 已下载，可通过系统分享保存';
  } catch (error) {
    await Filesystem.deleteFile({ directory: Directory.Cache, path }).catch(() => {});
    throw error;
  } finally {
    await listener.remove();
  }
}
