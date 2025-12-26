import { b as a } from './index-D_419K7i.js'
const i = {
  async getAll() {
    return a('/api/anniversaries')
  },
  async create(e) {
    return a('/api/anniversaries', { method: 'POST', body: e })
  },
  async update(e, r) {
    return a(`/api/anniversaries/${e}`, { method: 'PUT', body: r })
  },
  async delete(e) {
    return a(`/api/anniversaries/${e}`, { method: 'DELETE' })
  },
}
export { i as a }
//# sourceMappingURL=anniversary.service-D50iqdsx.js.map
