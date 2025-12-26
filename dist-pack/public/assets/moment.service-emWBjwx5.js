import { b as t, p as a } from './index-D_419K7i.js'
const i = {
  async getAll() {
    return (await t('/api/moments')).map((r) => ({
      ...r,
      originalUrl: a(r.imageUrl),
      imageUrl: a(r.imageUrl),
      thumbnailUrl: a(r.thumbnailUrl || r.imageUrl.replace(/\.[^.]+$/, '_thumb.jpg')),
      User: r.User ? { ...r.User, avatarUrl: a(r.User.avatarUrl) } : void 0,
    }))
  },
  async create(l) {
    const r = await t('/api/moments', { method: 'POST', body: l })
    return {
      ...r,
      originalUrl: a(r.imageUrl),
      imageUrl: a(r.imageUrl),
      thumbnailUrl: a(r.thumbnailUrl || r.imageUrl.replace(/\.[^.]+$/, '_thumb.jpg')),
      User: r.User ? { ...r.User, avatarUrl: a(r.User.avatarUrl) } : void 0,
    }
  },
  async delete(l) {
    return t(`/api/moments/${l}`, { method: 'DELETE' })
  },
  async update(l, r) {
    const e = await t(`/api/moments/${l}`, { method: 'PUT', body: r })
    return {
      ...e,
      originalUrl: a(e.imageUrl),
      imageUrl: a(e.imageUrl),
      thumbnailUrl: a(e.thumbnailUrl || e.imageUrl.replace(/\.[^.]+$/, '_thumb.jpg')),
      User: e.User ? { ...e.User, avatarUrl: a(e.User.avatarUrl) } : void 0,
    }
  },
}
export { i as m }
//# sourceMappingURL=moment.service-emWBjwx5.js.map
