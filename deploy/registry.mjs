export const repository = 'kevinhuang001/love-app';
export const imageRepository = 'ghcr.io/' + repository;
const validDigest = (s) => /^sha256:[a-f0-9]{64}$/.test(s || '');
export async function latestImage({ request = fetch, arch = process.arch } = {}) {
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
  if (!token) throw new Error('GHCR 未提供公开镜像拉取凭据');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:
      'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json',
  };
  const root = await get(`https://ghcr.io/v2/${repository}/manifests/latest`, headers);
  const digest = root.headers.get('docker-content-digest');
  if (!validDigest(digest)) throw new Error('GHCR 镜像摘要无效');
  let manifest = await root.json(),
    platformDigest = digest;
  if (manifest.manifests) {
    const architecture = arch === 'x64' ? 'amd64' : arch;
    const entry = manifest.manifests.find(
      (x) => x.platform?.os === 'linux' && x.platform.architecture === architecture,
    );
    if (!validDigest(entry?.digest)) throw new Error('GHCR 未提供当前设备架构的镜像');
    platformDigest = entry.digest;
    manifest = await (
      await get(`https://ghcr.io/v2/${repository}/manifests/${platformDigest}`, headers)
    ).json();
  }
  const configDigest = manifest.config?.digest;
  if (!validDigest(configDigest)) throw new Error('GHCR 镜像配置摘要无效');
  const config = await (
    await get(`https://ghcr.io/v2/${repository}/blobs/${configDigest}`, headers)
  ).json();
  const revision = config.config?.Labels?.['org.opencontainers.image.revision'] || '';
  const version = config.config?.Labels?.['org.opencontainers.image.version'] || '';
  return {
    digest,
    platformDigest,
    configDigest,
    revision,
    version,
    image: `${imageRepository}@${digest}`,
  };
}
export function isCurrentImage(local, remote) {
  const digests = new Set([remote.digest, remote.platformDigest, remote.configDigest]);
  if (digests.has(local.Id)) return true;
  if (
    (local.RepoDigests || []).some(
      (x) => x.startsWith(imageRepository + '@') && digests.has(x.split('@')[1]),
    )
  )
    return true;
  const version = local.Config?.Labels?.['org.opencontainers.image.version'];
  if (/^\d+\.\d+\.\d+$/.test(version || '') && version === remote.version) return true;
  // Docker's containerd image store may expose a manifest ID instead of a config ID.
  // Rebuilding the same tested source also changes image metadata, not the software version.
  const revision = local.Config?.Labels?.['org.opencontainers.image.revision'];
  return /^[a-f0-9]{40}$/.test(revision || '') && revision === remote.revision;
}
export function obsoleteImages(images, current) {
  const currentRefs = new Set([current.Id, ...(current.RepoDigests || [])]);
  return images
    .filter((x) => !currentRefs.has(x.Id) && !(x.RepoDigests || []).some((r) => currentRefs.has(r)))
    .filter(
      (x) =>
        (x.RepoTags || []).some((r) => r.startsWith(imageRepository + ':')) ||
        (x.RepoDigests || []).some((r) => r.startsWith(imageRepository + '@')) ||
        x.Config?.Labels?.['org.opencontainers.image.source'] ===
          'https://github.com/' + repository,
    );
}
