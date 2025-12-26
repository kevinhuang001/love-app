<template>
  <div class="p-0">
    <div class="relative flex justify-center items-center mb-6">
      <h3 class="text-2xl font-black tracking-tight" :style="titleStyle">Upcoming Special Dates</h3>
      <div class="absolute right-0 hidden md:block">
        <VaButton size="small" round icon="add" preset="secondary" border-color="primary" @click="$emit('add')"
          >Add Date</VaButton
        >
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-if="anniversaries.length === 0"
        class="col-span-full text-center py-8 bg-transparent rounded-lg border-2 border-dashed border-backgroundBorder"
      >
        <VaIcon name="event_busy" size="large" color="secondary" class="mb-2" />
        <p class="text-gray-400 dark:text-gray-500 font-bold tracking-tight">No special dates found.</p>
      </div>
      <VaCard
        v-for="anniversary in anniversaries"
        :key="anniversary.id"
        class="anniversary-card transform transition hover:scale-105 duration-300"
        :color="getCardColor(anniversary)"
        gradient
      >
        <VaCardContent class="relative overflow-hidden" :class="getTextColorClass(getCardColor(anniversary))">
          <div class="flex justify-between items-start z-10 relative">
            <div>
              <div class="text-3xl font-black mb-1 leading-none">
                {{
                  getCountdown(anniversary.date) === 0
                    ? 'Today'
                    : getCountdown(anniversary.date) === 1
                      ? 'Tomorrow'
                      : getCountdown(anniversary.date)
                }}
              </div>
              <div class="text-[10px] uppercase font-bold tracking-widest opacity-80">
                {{
                  getCountdown(anniversary.date) === 0
                    ? 'Celebration'
                    : getCountdown(anniversary.date) === 1
                      ? 'Day Left'
                      : 'Days Left'
                }}
              </div>
            </div>
            <div class="flex gap-2">
              <VaButton
                icon="edit"
                flat
                size="small"
                class="hover:bg-black/10 transition-colors"
                :class="getTextColorClass(getCardColor(anniversary))"
                @click.stop="$emit('edit', anniversary)"
              />
            </div>
          </div>
          <div class="mt-6 z-10 relative">
            <h4 class="font-black text-xl tracking-tight mb-0.5">{{ anniversary.title }}</h4>
            <p class="text-xs font-bold opacity-75">{{ new Date(anniversary.date).toLocaleDateString() }}</p>
          </div>
          <VaButton
            v-if="anniversary.type !== 'start_date' && anniversary.type !== 'birthday'"
            icon="delete"
            flat
            size="small"
            class="absolute bottom-2 right-2 z-10"
            :class="getTextColorClass(getCardColor(anniversary))"
            @click="$emit('delete', anniversary.id)"
          />

          <!-- Background decoration -->
          <VaIcon name="favorite" class="absolute -bottom-4 -right-4 text-9xl opacity-20 transform rotate-12" />
        </VaCardContent>
      </VaCard>
    </div>

    <!-- Add Date Button for Mobile -->
    <div class="mt-6 flex justify-center md:hidden">
      <VaButton round icon="add" @click="$emit('add')">Add Date</VaButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../../stores/user-store'
import { useTheme } from '../../../composables/useTheme'

const store = useUserStore()
const { textStyle } = useTheme()

const titleStyle = textStyle

defineProps<{
  anniversaries: any[]
}>()

defineEmits(['add', 'edit', 'delete'])

const getCardColor = (anniversary: any) => {
  // Use the same storage key logic as LoveDashboard.vue
  const storageKey = anniversary.type === 'start_date' ? 'start_date' : `${anniversary.type}_${anniversary.id}`

  if (store.preferences.cardColors && store.preferences.cardColors[storageKey]) {
    return store.preferences.cardColors[storageKey]
  }

  // Database fallback (if any)
  if (anniversary.color && anniversary.color !== 'primary') return anniversary.color

  // Hardcoded defaults
  switch (anniversary.type) {
    case 'birthday':
      return '#2C82E0'
    case 'anniversary':
      return '#EF476F'
    case 'start_date':
      return '#3D9209'
    default:
      return '#2C82E0'
  }
}

const getTextColorClass = (bgColor: string) => {
  const hexToRgb = (hex: string) => {
    // If color is a named color or invalid hex, default to white text
    if (!hex || !hex.startsWith('#') || hex.length < 7) return { r: 100, g: 100, b: 100 } // Assume medium-dark
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  const { r, g, b } = hexToRgb(bgColor)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  // If light background, use a very dark gray for high contrast
  return luminance > 0.6 ? 'text-gray-900' : 'text-white'
}

const getCountdown = (dateStr: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setFullYear(today.getFullYear())
  target.setHours(0, 0, 0, 0)

  if (target < today) {
    target.setFullYear(today.getFullYear() + 1)
  }

  const diffTime = Math.abs(target.getTime() - today.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 365 || diffDays === 0 ? 0 : diffDays
}
</script>
