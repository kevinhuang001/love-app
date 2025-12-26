import { apiFetch } from './api'

export interface Anniversary {
  id: number
  title: string
  date: string
  description: string
  type: 'anniversary' | 'birthday' | 'start_date' | 'other'
  color: string
  userId: number
}

export const anniversaryService = {
  async getAll(): Promise<Anniversary[]> {
    return apiFetch<Anniversary[]>('/api/anniversaries')
  },

  async create(data: Partial<Anniversary>): Promise<Anniversary> {
    return apiFetch<Anniversary>('/api/anniversaries', {
      method: 'POST',
      body: data,
    })
  },

  async update(id: number, data: Partial<Anniversary>): Promise<Anniversary> {
    return apiFetch<Anniversary>(`/api/anniversaries/${id}`, {
      method: 'PUT',
      body: data,
    })
  },

  async delete(id: number): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/anniversaries/${id}`, {
      method: 'DELETE',
    })
  },
}
