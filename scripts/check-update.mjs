// Read registry metadata without pulling layers or stopping the running application.
const repository = 'kevinhuang001/love-app';
export async function checkUpdate(currentId, { request = fetch, arch = process.arch } = {}) {
  const get = async (url, headers = {}) => {
    const response = await request(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`GHCR 更新检查失败 (${response.status})`);
    return response;
  };
  const token = (
    await (
      await get(`https://ghcr.io/token?service=ghcr.io&scope=repository:${repository}:pull`)
    ).json()
  ).token;
  if (!token) throw new Error('GHCR 未提供拉取凭据，请确认官方镜像公开可访问');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:
      'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json',
  };
  const root = await get(`https://ghcr.io/v2/${repository}/manifests/latest`, headers);
  const digest = root.headers.get('docker-content-digest');
  if (!/^sha256:[a-f0-9]{64}$/.test(digest || '')) throw new Error('GHCR 镜像校验摘要无效');
  let manifest = await root.json();
  if (manifest.manifests) {
    const architecture = arch === 'x64' ? 'amd64' : arch === 'arm64' ? 'arm64' : arch;
    const platform = manifest.manifests.find(
      (entry) => entry.platform?.os === 'linux' && entry.platform.architecture === architecture,
    );
    if (!platform || !/^sha256:[a-f0-9]{64}$/.test(platform.digest))
      throw new Error('GHCR 未提供当前设备架构的镜像');
    manifest = await (
      await get(`https://ghcr.io/v2/${repository}/manifests/${platform.digest}`, headers)
    ).json();
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(manifest.config?.digest || ''))
    throw new Error('GHCR 镜像配置摘要无效');
  return manifest.config.digest === currentId ? '' : `ghcr.io/${repository}@${digest}`;
}
if (process.argv[1]?.endsWith('/check-update.mjs')) {
  try {
    const image = await checkUpdate(process.argv[2]);
    if (image) console.log(image);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
