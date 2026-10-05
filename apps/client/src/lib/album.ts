export type AlbumOptions = {
  sort: 'date_desc' | 'date_asc' | 'uploaded_desc';
  view: 'grid' | 'compact' | 'timeline';
  type: 'all' | 'image' | 'video';
  owner: 'all' | 'mine' | 'partner';
  from: string;
  to: string;
};
export const albumDefaults: AlbumOptions = {
  sort: 'date_desc',
  view: 'grid',
  type: 'all',
  owner: 'all',
  from: '',
  to: '',
};
export function loadAlbumOptions(key: string): AlbumOptions {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    if (!v) return { ...albumDefaults };
    return {
      sort: ['date_desc', 'date_asc', 'uploaded_desc'].includes(v.sort)
        ? v.sort
        : albumDefaults.sort,
      view: ['grid', 'compact', 'timeline'].includes(v.view) ? v.view : albumDefaults.view,
      type: ['all', 'image', 'video'].includes(v.type) ? v.type : 'all',
      owner: ['all', 'mine', 'partner'].includes(v.owner) ? v.owner : 'all',
      from: typeof v.from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.from) ? v.from : '',
      to: typeof v.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.to) ? v.to : '',
    };
  } catch {
    return { ...albumDefaults };
  }
}
