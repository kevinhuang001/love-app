import { apiFetch, processUrl, BASE_URL } from './api'

export interface Moment {
  id: number
  title: string
  description: string
  date: string
  imageUrl: string
  thumbnailUrl: string
  userId: number
  User?: {
    id: number
    username: string
    displayName: string
    avatarUrl: string
  }
  // Helper property for frontend
  originalUrl?: string
}

export const momentService = {
  async getAll(): Promise<Moment[]> {
    const moments = await apiFetch<Moment[]>('/api/moments')
    return moments.map((m: any) => ({
      ...m,
      originalUrl: processUrl(m.imageUrl),
      imageUrl: processUrl(m.imageUrl),
      thumbnailUrl: processUrl(m.thumbnailUrl || m.imageUrl.replace(/\.[^.]+$/, '_thumb.jpg')),
      User: m.User ? { ...m.User, avatarUrl: processUrl(m.User.avatarUrl) } : undefined,
    }))
  },

  async create(formData: FormData): Promise<Moment> {
    const m = await apiFetch<Moment>('/api/moments', {
      method: 'POST',
      body: formData,
    })
    return {
      ...m,
      originalUrl: processUrl(m.imageUrl),
      imageUrl: processUrl(m.imageUrl),
      thumbnailUrl: processUrl(m.thumbnailUrl || m.imageUrl.replace(/\.[^.]+$/, '_thumb.jpg')),
      User: m.User ? { ...m.User, avatarUrl: processUrl(m.User.avatarUrl) } : undefined,
    }
  },

  async delete(id: number): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/moments/${id}`, {
      method: 'DELETE',
    })
  },

  async update(id: number, data: Partial<Moment>): Promise<Moment> {
    const m = await apiFetch<Moment>(`/api/moments/${id}`, {
      method: 'PUT',
      body: data,
    })
    return {
      ...m,
      originalUrl: processUrl(m.imageUrl),
      imageUrl: processUrl(m.imageUrl),
      thumbnailUrl: processUrl(m.thumbnailUrl || m.imageUrl.replace(/\.[^.]+$/, '_thumb.jpg')),
      User: m.User ? { ...m.User, avatarUrl: processUrl(m.User.avatarUrl) } : undefined,
    }
  },
}
