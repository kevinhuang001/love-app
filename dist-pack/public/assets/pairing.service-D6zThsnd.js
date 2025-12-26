import { b as a } from './index-D_419K7i.js'
const t = {
  async sendRequest(i) {
    await a('/api/pairing/request', { method: 'POST', body: JSON.stringify({ username: i }) })
  },
  async getRequests() {
    return a('/api/pairing/requests')
  },
  async acceptRequest(i) {
    await a('/api/pairing/accept', { method: 'POST', body: JSON.stringify({ requestId: i }) })
  },
  async unpair() {
    await a('/api/pairing/unpair', { method: 'POST' })
  },
}
export { t as p }
//# sourceMappingURL=pairing.service-D6zThsnd.js.map
