// Apple exports a still image and MOV with the same basename. Keep unmatched videos separate.
export function pairLivePhotos(files: File[]): { file: File; liveVideo?: File }[] {
  const base = (f: File) => f.name.replace(/\.[^.]+$/, '').toLocaleLowerCase();
  const paired = new Set<File>();
  const pairs = new Map<File, File>();
  for (const photo of files.filter((f) => /\.(jpe?g|heic|heif)$/i.test(f.name))) {
    const candidates = files.filter((f) => /\.mov$/i.test(f.name) && base(f) === base(photo));
    if (candidates.length === 1 && !paired.has(candidates[0])) {
      pairs.set(photo, candidates[0]);
      paired.add(candidates[0]);
    }
  }
  return files.filter((f) => !paired.has(f)).map((file) => ({ file, liveVideo: pairs.get(file) }));
}
