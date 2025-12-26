import { apiFetch } from './api'

export interface Message {
  id: number
  content: string
  senderId: number
  createdAt: string
  Sender?: {
    id: number
    username: string
    displayName: string
    avatarUrl: string
  }
}

export const messageService = {
  async getAll(): Promise<Message[]> {
    return apiFetch<Message[]>('/api/messages')
  },

  async create(content: string): Promise<Message> {
    return apiFetch<Message>('/api/messages', {
      method: 'POST',
      body: { content },
    })
  },

  async update(id: number, content: string): Promise<Message> {
    return apiFetch<Message>(`/api/messages/${id}`, {
      method: 'PUT',
      body: { content },
    })
  },

  async delete(id: number): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/messages/${id}`, {
      method: 'DELETE',
    })
  },
}
