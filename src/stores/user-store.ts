import { defineStore } from 'pinia'
import { apiFetch, processUrl, BASE_URL } from '../services/api'

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      id: null as number | null,
      userName: '',
      displayName: '',
      email: '',
      memberSince: '',
      pfp: '',
      partnerId: null as number | null,
      partner: null as any,
      token: localStorage.getItem('token') || '',
      preferences: {
        noteTheme: localStorage.getItem('noteTheme') || 'bg-blue-50',
        noteBubbleColor: localStorage.getItem('noteBubbleColor') || '#ffffff',
        noteCardColor: localStorage.getItem('noteCardColor') || '#ffffff',
        heroTheme: localStorage.getItem('heroTheme') || 'bg-pink-50',
        carouselLimit: Number(localStorage.getItem('carouselLimit')) || 5,
        noteLimit: Number(localStorage.getItem('noteLimit')) || 1,
        showNoteDate: localStorage.getItem('showNoteDate') !== 'false',
        showNoteAuthor: localStorage.getItem('showNoteAuthor') !== 'false',
        appName: localStorage.getItem('appName') || 'Our Love Journey',
        appEmoji: localStorage.getItem('appEmoji') || '❤️',
        theme: localStorage.getItem('theme') || 'light',
        cardColors: JSON.parse(localStorage.getItem('cardColors') || '{}') as Record<string, string>,
        dashboardOrder: JSON.parse(
          localStorage.getItem('dashboardOrder') || '["dates", "memories", "notes"]',
        ) as string[],
      },
    }
  },

  actions: {
    updatePreferences(newPrefs: Partial<typeof this.preferences>) {
      this.preferences = { ...this.preferences, ...newPrefs }
      try {
        if (newPrefs.noteTheme !== undefined) localStorage.setItem('noteTheme', newPrefs.noteTheme)
        if (newPrefs.noteBubbleColor !== undefined) localStorage.setItem('noteBubbleColor', newPrefs.noteBubbleColor)
        if (newPrefs.noteCardColor !== undefined) localStorage.setItem('noteCardColor', newPrefs.noteCardColor)
        if (newPrefs.heroTheme !== undefined) localStorage.setItem('heroTheme', newPrefs.heroTheme)
        if (newPrefs.carouselLimit !== undefined) localStorage.setItem('carouselLimit', String(newPrefs.carouselLimit))
        if (newPrefs.noteLimit !== undefined) localStorage.setItem('noteLimit', String(newPrefs.noteLimit))
        if (newPrefs.showNoteDate !== undefined) localStorage.setItem('showNoteDate', String(newPrefs.showNoteDate))
        if (newPrefs.showNoteAuthor !== undefined)
          localStorage.setItem('showNoteAuthor', String(newPrefs.showNoteAuthor))
        if (newPrefs.appName !== undefined) localStorage.setItem('appName', newPrefs.appName)
        if (newPrefs.appEmoji !== undefined) localStorage.setItem('appEmoji', newPrefs.appEmoji)
        if (newPrefs.theme !== undefined) localStorage.setItem('theme', newPrefs.theme)
        if (newPrefs.cardColors !== undefined) localStorage.setItem('cardColors', JSON.stringify(newPrefs.cardColors))
        if (newPrefs.dashboardOrder !== undefined)
          localStorage.setItem('dashboardOrder', JSON.stringify(newPrefs.dashboardOrder))

        if (newPrefs.appName !== undefined) {
          document.title = newPrefs.appName
        }
      } catch (e) {
        console.error('Failed to save preferences:', e)
      }
    },

    async login(username: string, password: string, captcha: string) {
      try {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password, captcha }),
        })
        if (data.token) {
          this.token = data.token
          this.id = data.user.id
          this.userName = data.user.username
          this.displayName = data.user.displayName
          this.pfp = processUrl(data.user.avatarUrl)
          this.partnerId = data.user.partnerId
          localStorage.setItem('token', data.token)
          return { success: true }
        }
        return { success: false, error: 'Token missing' }
      } catch (e: any) {
        return { success: false, error: e.message }
      }
    },

    async register(username: string, password: string, displayName: string, birthday: string, captcha: string) {
      try {
        await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, password, displayName, birthday, captcha }),
        })
        return { success: true }
      } catch (e: any) {
        return { success: false, error: e.message }
      }
    },

    async updateProfile(formData: FormData, onProgress?: (percent: number) => void) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.withCredentials = true
        const token = localStorage.getItem('token')

        xhr.open('PUT', `${BASE_URL}/api/auth/profile`)
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        if (onProgress && xhr.upload) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              onProgress(Math.round((e.loaded / e.total) * 100))
            }
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch (e) {
              reject(e)
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.error || `Update failed with status ${xhr.status}`))
            } catch (e) {
              reject(new Error(`Update failed with status ${xhr.status}`))
            }
          }
        }

        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })
    },

    async checkAuth() {
      if (!this.token) return false
      try {
        const user = await apiFetch('/api/auth/me')
        this.id = user.id
        this.userName = user.username
        this.displayName = user.displayName
        this.pfp = processUrl(user.avatarUrl)
        this.partnerId = user.partnerId
        this.partner = user.partner ? { ...user.partner, avatarUrl: processUrl(user.partner.avatarUrl) } : null
        return true
      } catch (e) {
        this.logout()
        return false
      }
    },

    logout() {
      this.token = ''
      this.id = null
      this.userName = ''
      this.displayName = ''
      this.pfp = ''
      this.partnerId = null
      this.partner = null
      localStorage.removeItem('token')
    },
  },
})
