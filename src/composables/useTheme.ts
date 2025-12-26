import { computed } from 'vue'
import { useUserStore } from '../stores/user-store'

export function useTheme() {
  const store = useUserStore()

  const isDark = computed(() => store.preferences.theme === 'dark')

  const isDarkTheme = (themeName: string) => {
    if (!themeName) return false
    const darkKeywords = [
      '800',
      '900',
      '950',
      'black',
      'indigo-950',
      'rose-950',
      'emerald-950',
      'purple-950',
      'slate-950',
    ]
    return darkKeywords.some((keyword) => themeName.includes(keyword))
  }

  const themeColors = computed(() => {
    if (isDark.value) {
      return {
        background: '#0F172A', // slate-900
        backgroundSecondary: '#1E293B', // slate-800
        text: '#F1F5F9', // slate-100
        textSecondary: '#94A3B8', // slate-400
        border: '#334155', // slate-700
      }
    }
    return {
      background: '#F4F6F8', // Vuestic light background
      backgroundSecondary: '#FFFFFF',
      text: '#111827', // gray-900
      textSecondary: '#4B5563', // gray-600
      border: '#E2E8F0', // slate-200
    }
  })

  // Helper for dynamic styles that can't easily use tailwind classes
  const textStyle = computed(() => ({
    color: themeColors.value.text,
  }))

  const secondaryTextStyle = computed(() => ({
    color: themeColors.value.textSecondary,
  }))

  const cardStyle = computed(() => ({
    backgroundColor: themeColors.value.backgroundSecondary,
    color: themeColors.value.text,
    borderColor: themeColors.value.border,
  }))

  const isColorLight = (color: string) => {
    if (!color) return true
    const hex = color.replace('#', '')
    if (hex.length < 6) return true
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155
  }

  return {
    isDark,
    isDarkTheme,
    isColorLight,
    themeColors,
    textStyle,
    secondaryTextStyle,
    cardStyle,
    theme: computed(() => store.preferences.theme),
  }
}
