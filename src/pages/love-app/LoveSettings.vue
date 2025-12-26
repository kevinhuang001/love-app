<template>
  <div class="love-settings p-4 md:p-8 max-w-4xl mx-auto">
    <!-- Header -->
    <header class="mb-10 text-center md:text-left">
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" :style="titleStyle">Settings</h1>
      <p class="text-lg" :style="textStyle">Personalize your love journey experience</p>
    </header>

    <div class="space-y-8">
      <!-- Section: Appearance -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="palette" color="primary" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">Appearance</h2>
        </div>
        <VaCard class="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
          <VaCardContent class="p-6">
            <p class="text-sm mb-6" :style="textStyle">Choose how the application looks to you.</p>
            <div class="flex flex-col sm:flex-row gap-4">
              <VaButton
                :preset="store.preferences.theme === 'light' ? 'primary' : 'secondary'"
                icon="light_mode"
                class="flex-1"
                @click="store.updatePreferences({ theme: 'light' })"
              >
                Light Mode
              </VaButton>
              <VaButton
                :preset="store.preferences.theme === 'dark' ? 'primary' : 'secondary'"
                icon="dark_mode"
                class="flex-1"
                @click="store.updatePreferences({ theme: 'dark' })"
              >
                Dark Mode
              </VaButton>
            </div>
          </VaCardContent>
        </VaCard>
      </section>

      <!-- Section: App Branding -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="branding_watermark" color="primary" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">App Branding</h2>
        </div>
        <VaCard class="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
          <VaCardContent class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <VaInput v-model="appEmoji" label="App Icon (Emoji)" placeholder="e.g. ❤️" class="w-full" />
              <VaInput v-model="appName" label="App Display Name" placeholder="e.g. Our Love Journey" class="w-full" />
            </div>
            <div class="mt-6 flex justify-end">
              <VaButton icon="save" @click="saveAppIdentity">Update Branding</VaButton>
            </div>
          </VaCardContent>
        </VaCard>
      </section>

      <!-- Section: Relationship Milestone -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="favorite" color="primary" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">Relationship Milestone</h2>
        </div>
        <VaCard class="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
          <VaCardContent class="p-6">
            <p class="text-sm mb-6" :style="textStyle">The day you two started this beautiful journey together.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <VaDateInput v-model="newStartDate" label="Anniversary Date" class="w-full" />
              <VaTimeInput v-model="newStartDate" label="Exact Time" class="w-full" />
            </div>
            <div class="mt-6 flex justify-end">
              <VaButton icon="calendar_today" :loading="isSavingDate" @click="saveStartDate"
                >Update Start Date</VaButton
              >
            </div>
          </VaCardContent>
        </VaCard>
      </section>

      <!-- Section: Dashboard Configuration -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="dashboard" color="primary" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">Dashboard Layout</h2>
        </div>
        <VaCard class="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
          <VaCardContent class="p-6">
            <p class="text-sm mb-6" :style="textStyle">
              Arrange the sections of your dashboard in your preferred order.
            </p>
            <div class="space-y-2">
              <div
                v-for="(sectionId, index) in dashboardOrder"
                :key="sectionId"
                class="flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-opacity-80 group"
                :style="itemBgStyle"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 flex items-center justify-center rounded shadow-sm group-hover:text-primary transition-colors"
                    :style="itemIconBgStyle"
                  >
                    <VaIcon :name="availableSections.find((s) => s.id === sectionId)?.icon" size="18px" />
                  </div>
                  <span class="font-semibold text-sm" :style="cardTitleStyle">{{
                    availableSections.find((s) => s.id === sectionId)?.name
                  }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <VaButton
                    icon="keyboard_arrow_up"
                    flat
                    size="small"
                    color="primary"
                    :disabled="index === 0"
                    @click="moveSection(index, 'up')"
                  />
                  <VaButton
                    icon="keyboard_arrow_down"
                    flat
                    size="small"
                    color="primary"
                    :disabled="index === dashboardOrder.length - 1"
                    @click="moveSection(index, 'down')"
                  />
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <VaButton icon="sort" @click="saveDashboardOrder">Apply New Order</VaButton>
            </div>
          </VaCardContent>
        </VaCard>
      </section>

      <!-- Section: Content Preferences -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="tune" color="primary" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">Content Preferences</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Photo Carousel -->
          <VaCard class="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            <VaCardContent class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <VaIcon name="photo_library" size="18px" />
                <h3 class="font-bold" :style="cardTitleStyle">Memories Carousel</h3>
              </div>
              <div class="space-y-6">
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm" :style="textStyle">Photos count</span>
                    <span class="text-sm font-bold text-primary">{{ carouselLimit }}</span>
                  </div>
                  <VaSlider v-model="carouselLimit" :min="3" :max="15" :step="1" />
                </div>
                <div class="flex justify-end">
                  <VaButton size="small" preset="secondary" @click="saveCarouselSettings">Save Carousel</VaButton>
                </div>
              </div>
            </VaCardContent>
          </VaCard>

          <!-- Love Notes -->
          <VaCard class="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            <VaCardContent class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <VaIcon name="edit_note" size="18px" />
                <h3 class="font-bold" :style="cardTitleStyle">Love Notes</h3>
              </div>
              <div class="space-y-6">
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm" :style="textStyle">Max notes shown</span>
                    <span class="text-sm font-bold text-primary">{{ noteLimit }}</span>
                  </div>
                  <VaSlider v-model="noteLimit" :min="1" :max="10" :step="1" />
                </div>
                <div class="flex flex-wrap gap-x-6 gap-y-3">
                  <VaSwitch v-model="showNoteDate" label="Show Date" size="small" />
                  <VaSwitch v-model="showNoteAuthor" label="Show Author" size="small" />
                </div>
                <div class="flex justify-end">
                  <VaButton size="small" preset="secondary" @click="saveNoteSettings">Save Notes</VaButton>
                </div>
              </div>
            </VaCardContent>
          </VaCard>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../../stores/user-store'
import { anniversaryService, type Anniversary } from '../../services/anniversary.service'
import { useToast } from 'vuestic-ui'

const store = useUserStore()
const { init: initToast } = useToast()

const titleStyle = computed(() => {
  return {
    color: store.preferences.theme === 'dark' ? '#f3f4f6' : '#111827',
  }
})

const textStyle = computed(() => {
  return {
    color: store.preferences.theme === 'dark' ? '#94a3b8' : '#4b5563',
  }
})

const cardTitleStyle = computed(() => {
  return {
    color: store.preferences.theme === 'dark' ? '#e2e8f0' : '#1f2937',
  }
})

const itemBgStyle = computed(() => {
  return {
    backgroundColor: store.preferences.theme === 'dark' ? '#1e293b' : '#ffffff',
    borderColor: store.preferences.theme === 'dark' ? '#334155' : '#e5e7eb',
  }
})

const itemIconBgStyle = computed(() => {
  return {
    backgroundColor: store.preferences.theme === 'dark' ? '#334155' : '#f3f4f6',
    color: store.preferences.theme === 'dark' ? '#94a3b8' : '#4b5563',
  }
})

// Dashboard Ordering
const dashboardOrder = ref([...store.preferences.dashboardOrder])
const availableSections = [
  { id: 'dates', name: 'Upcoming Dates', icon: 'event' },
  { id: 'memories', name: 'Sweet Memories', icon: 'photo_library' },
  { id: 'notes', name: 'Love Notes', icon: 'edit_note' },
]

const moveSection = (index: number, direction: 'up' | 'down') => {
  const newOrder = [...dashboardOrder.value]
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex >= 0 && targetIndex < newOrder.length) {
    ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    dashboardOrder.value = newOrder
  }
}

const saveDashboardOrder = () => {
  store.updatePreferences({ dashboardOrder: dashboardOrder.value })
  initToast({ message: 'Dashboard layout updated!', color: 'success' })
}

// App Identity
const appName = ref(store.preferences.appName || 'Our Love Journey')
const appEmoji = ref(store.preferences.appEmoji || '❤️')

// Start Date
const newStartDate = ref(new Date())
const startDateId = ref<number | null>(null)
const isSavingDate = ref(false)

// Carousel
const carouselLimit = ref(store.preferences.carouselLimit || 5)

// Note
const noteLimit = ref(store.preferences.noteLimit || 1)
const showNoteDate = ref(store.preferences.showNoteDate !== false) // Default true
const showNoteAuthor = ref(store.preferences.showNoteAuthor !== false) // Default true

const fetchStartDate = async () => {
  try {
    const data = await anniversaryService.getAll()
    const start = data.find((a: any) => a.type === 'start_date')
    if (start) {
      newStartDate.value = new Date(start.date)
      startDateId.value = start.id
    }
  } catch (e) {
    console.error(e)
  }
}

const formatDateTime = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

const saveAppIdentity = () => {
  store.updatePreferences({ appName: appName.value, appEmoji: appEmoji.value })
  initToast({ message: 'App identity updated!', color: 'success' })
}

const saveStartDate = async () => {
  isSavingDate.value = true
  const payload: Partial<Anniversary> = {
    title: 'Start Date',
    date: formatDateTime(newStartDate.value),
    type: 'start_date',
    description: 'The day we started our journey',
  }

  try {
    if (startDateId.value) {
      await anniversaryService.update(startDateId.value, payload)
      initToast({ message: 'Relationship start date updated!', color: 'success' })
    } else {
      const res = await anniversaryService.create(payload)
      startDateId.value = res.id
      initToast({ message: 'Relationship start date set!', color: 'success' })
    }
  } catch (e: any) {
    initToast({ message: 'Failed to update date', color: 'danger' })
  } finally {
    isSavingDate.value = false
  }
}

const saveCarouselSettings = () => {
  store.updatePreferences({ carouselLimit: carouselLimit.value })
  initToast({ message: 'Carousel settings saved!', color: 'success' })
}

const saveNoteSettings = () => {
  store.updatePreferences({
    noteLimit: noteLimit.value,
    showNoteDate: showNoteDate.value,
    showNoteAuthor: showNoteAuthor.value,
  })
  initToast({ message: 'Display options saved!', color: 'success' })
}

onMounted(() => {
  fetchStartDate()
})
</script>

<style lang="scss" scoped>
.love-settings {
  // Custom spacing tweaks if needed
}
</style>
