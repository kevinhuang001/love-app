import { apiFetch } from './api'

export const pairingService = {
  async sendRequest(username: string): Promise<void> {
    await apiFetch('/api/pairing/request', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  },

  async getRequests(): Promise<any[]> {
    return apiFetch('/api/pairing/requests')
  },

  async acceptRequest(requestId: number): Promise<void> {
    await apiFetch('/api/pairing/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    })
  },

  async unpair(): Promise<void> {
    await apiFetch('/api/pairing/unpair', { method: 'POST' })
  },
}
