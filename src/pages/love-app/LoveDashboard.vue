<template>
  <div class="love-dashboard">
    <!-- Hero Section Removed (Merged into Special Dates) -->

    <div class="row">
      <!-- Main Column: Anniversaries & Messages -->
      <div class="flex xs12 flex-col gap-6">
        <!-- Love Timer Card (Hero Section) -->
        <VaCard
          class="mb-4 overflow-hidden min-h-[220px] md:min-h-[300px] flex flex-col justify-center relative border border-backgroundBorder"
          gradient
          :color="isDarkTheme(store.preferences.heroTheme) ? 'backgroundSecondary' : 'backgroundSecondary'"
        >
          <div class="absolute top-4 right-4 z-20">
            <VaButton
              icon="palette"
              flat
              round
              size="small"
              class="bg-white/20 hover:bg-white/40"
              @click="openThemeModal('hero')"
            />
          </div>
          <VaCardContent
            class="relative z-10 p-4 md:p-8 text-center"
            :class="heroBackgroundClass"
            :style="{ color: isDarkTheme(store.preferences.heroTheme) ? '#f3f4f6' : '#111827' }"
          >
            <div v-if="startDateId">
              <h2 class="text-lg md:text-xl font-light mb-2 md:mb-4" :class="heroTitleClass">
                We've been loving each other for
              </h2>
              <div
                class="timer text-3xl sm:text-4xl md:text-6xl font-bold tracking-wider mb-2 md:mb-4 break-words"
                :class="heroTimerClass"
              >
                {{ timeTogether }}
              </div>
              <p class="text-base md:text-lg mb-4 md:mb-6" :class="heroTextClass">
                Since {{ new Date(startDate).toLocaleDateString() }}
              </p>
            </div>

            <div v-else class="py-6 flex flex-col items-center">
              <VaIcon name="favorite_border" size="4rem" color="primary" class="mb-4 opacity-50" />
              <h2 class="text-xl font-bold mb-2" :class="heroTitleClass">When did your story begin?</h2>
              <p class="mb-6 max-w-sm mx-auto" :class="heroTextClass">
                Set your relationship start date to start counting the days of your love journey.
              </p>
              <VaButton icon="settings" @click="router.push({ name: 'love-settings' })">Set Start Date</VaButton>
            </div>

            <div class="flex justify-center gap-8 md:gap-12 mt-2 md:mt-4">
              <div class="flex flex-col items-center">
                <VaAvatar size="large" :src="store.pfp" class="w-12 h-12 md:w-16 md:h-16" />
                <span class="text-xs md:text-sm font-bold mt-2" :class="heroTitleClass">{{
                  store.displayName || store.userName
                }}</span>
              </div>
              <div class="heart-beat text-3xl md:text-4xl text-red-500 self-center">❤️</div>
              <div class="flex flex-col items-center">
                <VaAvatar size="large" :src="store.partner?.avatarUrl" class="w-12 h-12 md:w-16 md:h-16" />
                <span class="text-xs md:text-sm font-bold mt-2" :class="heroTitleClass">{{
                  store.partner?.displayName || store.partner?.username || 'Partner'
                }}</span>
              </div>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Dynamic Content Sections -->
        <template v-for="section in store.preferences.dashboardOrder" :key="section">
          <UpcomingDates
            v-if="section === 'dates'"
            :anniversaries="filteredAnniversaries"
            @add="openAddModal"
            @edit="openEditModal"
            @delete="deleteAnniversary"
          />

          <MemoriesCarousel v-if="section === 'memories'" :images="randomImages" />

          <LoveNotes v-if="section === 'notes'" :messages="latestMessages" @openTheme="openThemeModal('note')" />
        </template>
      </div>

      <!-- Right Column: Quick Nav (Removed) -->
      <!-- <div class="flex xs12 md4"> -->
      <!-- Quick Love Section Removed as requested -->
      <!-- </div> -->
    </div>

    <!-- Delete Confirmation Modal -->
    <VaModal
      v-model="showDeleteConfirmModal"
      title="Delete Special Date?"
      message="Are you sure you want to remove this date? This cannot be undone."
      ok-text="Yes, delete it"
      cancel-text="Cancel"
      @ok="confirmDelete"
    />

    <!-- Add/Edit Anniversary Modal -->
    <VaModal
      v-model="showAddModal"
      :title="editingAnniversaryId ? 'Edit Special Date' : 'Add Special Date'"
      ok-text="Save Date"
      cancel-text="Cancel"
      @ok="saveAnniversary"
    >
      <div class="py-2 flex flex-col gap-5">
        <!-- Content for general anniversaries -->
        <div v-if="newAnniversary.type !== 'birthday'" class="flex flex-col gap-4">
          <VaInput
            v-model="newAnniversary.title"
            label="Title"
            placeholder="e.g. First Date"
            :disabled="newAnniversary.type === 'start_date'"
            class="w-full"
          />
          <VaDateInput
            v-model="newAnniversary.date"
            label="Date"
            :clearable="newAnniversary.type !== 'start_date'"
            :disabled="newAnniversary.type === 'start_date'"
            class="w-full"
          />
          <VaInput
            v-model="newAnniversary.description"
            label="Description (Optional)"
            type="textarea"
            :rows="3"
            placeholder="Write a sweet note..."
            :disabled="newAnniversary.type === 'start_date'"
            class="w-full"
          />
        </div>

        <!-- Color selection -->
        <div class="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
          <label class="va-title mb-3 block text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider"
            >Card Theme Color</label
          >
          <div class="flex flex-wrap gap-3 justify-center sm:justify-start">
            <div
              v-for="color in PRESET_COLORS"
              :key="color"
              class="w-9 h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 border-2 shadow-sm"
              :class="
                newAnniversary.color === color
                  ? 'border-gray-800 dark:border-white scale-110 ring-2 ring-gray-200 dark:ring-slate-600 ring-offset-1 dark:ring-offset-slate-800'
                  : 'border-white dark:border-slate-700 opacity-80 hover:opacity-100'
              "
              :style="{ backgroundColor: color }"
              @click="newAnniversary.color = color"
            ></div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Custom Color:</span>
            <VaColorInput v-model="newAnniversary.color" />
          </div>
        </div>
      </div>
    </VaModal>

    <!-- Edit Start Date Modal -->
    <VaModal
      v-model="showEditStartDateModal"
      title="Customize Start Date"
      ok-text="Update"
      cancel-text="Cancel"
      @ok="saveStartDate"
    >
      <div class="py-2 flex flex-col gap-5">
        <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {{
            isEditingStartDateFromCard
              ? 'Update the color of your relationship milestone.'
              : 'Set the day your love story began.'
          }}
        </p>

        <div v-if="!isEditingStartDateFromCard" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VaDateInput v-model="newStartDate" label="Date" class="w-full" />
          <VaTimeInput v-model="newStartDate" label="Time" class="w-full" />
        </div>

        <div class="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
          <label class="va-title mb-3 block text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider"
            >Card Theme Color</label
          >
          <div class="flex flex-wrap gap-3 justify-center sm:justify-start">
            <div
              v-for="color in PRESET_COLORS"
              :key="color"
              class="w-9 h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 border-2 shadow-sm"
              :class="
                startDateColor === color
                  ? 'border-gray-800 dark:border-white scale-110 ring-2 ring-gray-200 dark:ring-slate-600 ring-offset-1 dark:ring-offset-slate-800'
                  : 'border-white dark:border-slate-700 opacity-80 hover:opacity-100'
              "
              :style="{ backgroundColor: color }"
              @click="startDateColor = color"
            ></div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Custom Color:</span>
            <VaColorInput v-model="startDateColor" />
          </div>
        </div>
      </div>
    </VaModal>
    <!-- Theme Modal -->
    <VaModal
      v-model="showThemeModal"
      :title="activeThemeSection === 'hero' ? 'Customize Hero Theme' : 'Customize Love Notes Theme'"
      ok-text="Save Changes"
      max-width="600px"
      @ok="saveTheme"
    >
      <div class="py-4 px-2">
        <ThemePicker
          v-model="currentTheme"
          v-model:color-value="currentCardColor"
          :show-colors="activeThemeSection === 'note'"
          :pattern-label="activeThemeSection === 'hero' ? 'Hero Background Pattern' : 'Notes Background Pattern'"
          color-label="Note Card Color"
        />
      </div>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
import { PRESET_COLORS } from '../../services/constants'
import ThemePicker from '../../components/ThemePicker.vue'
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useUserStore } from '../../stores/user-store'
import { useTheme } from '../../composables/useTheme'
import { useRouter } from 'vue-router'
import { useToast } from 'vuestic-ui'
import { anniversaryService, type Anniversary } from '../../services/anniversary.service'
import { momentService } from '../../services/moment.service'
import { messageService } from '../../services/message.service'

// Dynamic components
const UpcomingDates = defineAsyncComponent(() => import('./components/UpcomingDates.vue'))
const MemoriesCarousel = defineAsyncComponent(() => import('./components/MemoriesCarousel.vue'))
const LoveNotes = defineAsyncComponent(() => import('./components/LoveNotes.vue'))

const store = useUserStore()
const { isDarkTheme } = useTheme()
const router = useRouter()
const { init: initToast } = useToast()

const showAddModal = ref(false)
const showEditStartDateModal = ref(false)
const isEditingStartDateFromCard = ref(false)
const editingAnniversaryId = ref<number | null>(null)
const anniversaries = ref<any[]>([])
const newAnniversary = ref({ title: '', date: new Date(), description: '', type: 'other', color: 'primary' })
const startDateStr = ref('')
const startDateId = ref<number | null>(null)
const startDateColor = ref('#3D9209')
const newStartDate = ref(new Date())

const showDeleteConfirmModal = ref(false)
const anniversaryToDelete = ref<number | null>(null)

const randomImages = ref<any[]>([])
const latestMessages = ref<any[]>([])

const showThemeModal = ref(false)
const activeThemeSection = ref<'hero' | 'note'>('note')
const currentTheme = ref('')
const currentCardColor = ref('#ffffff')

const heroBackgroundClass = computed(() => {
  const baseClass = store.preferences.heroTheme
  return isDarkTheme(baseClass) ? `${baseClass} text-white` : baseClass
})

const heroTitleClass = computed(() => {
  return isDarkTheme(store.preferences.heroTheme) ? 'text-gray-100' : 'text-gray-900'
})

const heroTimerClass = computed(() => {
  return isDarkTheme(store.preferences.heroTheme) ? 'text-pink-400' : 'text-primary'
})

const heroTextClass = computed(() => {
  return isDarkTheme(store.preferences.heroTheme) ? 'text-gray-300' : 'text-gray-700'
})

const openThemeModal = (section: 'hero' | 'note') => {
  activeThemeSection.value = section
  if (section === 'hero') {
    currentTheme.value = store.preferences.heroTheme
    currentCardColor.value = '#ffffff' // Not used for hero
  } else {
    currentTheme.value = store.preferences.noteTheme
    currentCardColor.value = store.preferences.noteCardColor || '#ffffff'
  }
  showThemeModal.value = true
}

const saveTheme = () => {
  if (activeThemeSection.value === 'hero') {
    store.updatePreferences({ heroTheme: currentTheme.value })
  } else {
    store.updatePreferences({
      noteTheme: currentTheme.value,
      noteCardColor: currentCardColor.value,
    })
  }
  showThemeModal.value = false
  initToast({ message: 'Theme updated successfully!', color: 'success' })
}

const startDate = computed(() => startDateStr.value)

const filteredAnniversaries = computed(() => {
  const result: any[] = []
  let foundStartDate = false

  // Create a copy of anniversaries, but for start_date, use the settings date
  const processedAnniversaries = anniversaries.value.map((item) => {
    if (item.type === 'start_date' && startDateStr.value) {
      return { ...item, date: startDateStr.value }
    }
    return item
  })

  // Sort by date (nearest first)
  const sorted = [...processedAnniversaries].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  for (const item of sorted) {
    if (item.type === 'start_date') {
      if (!foundStartDate) {
        result.push(item)
        foundStartDate = true
      }
    } else {
      result.push(item)
    }
  }
  return result
})

const timeTogether = ref('')

const calculateTime = () => {
  if (!startDate.value) return
  const start = new Date(startDate.value).getTime()
  const now = new Date().getTime()
  const diff = now - start

  if (diff < 0) {
    timeTogether.value = 'Not started yet!'
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  timeTogether.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
}

const getCardColor = (anniversary: any) => {
  // Try local storage first (using type_id or type_userId as key)
  const localColors = store.preferences.cardColors || {}
  const storageKey = anniversary.type === 'start_date' ? 'start_date' : `${anniversary.type}_${anniversary.id}`

  if (localColors[storageKey]) {
    return localColors[storageKey]
  }

  // Hardcoded defaults (Ignore database color to keep it strictly local)
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

const fetchAnniversaries = async () => {
  try {
    const data = await anniversaryService.getAll()
    anniversaries.value = data
    const start = data.find((a: any) => a.type === 'start_date')
    if (start) {
      startDateStr.value = start.date
      startDateId.value = start.id
      startDateColor.value = getCardColor(start)
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchRandomImages = async () => {
  try {
    const data = await momentService.getAll()
    // Shuffle and pick N
    const limit = store.preferences.carouselLimit || 5
    randomImages.value = data
      .filter((m: any) => m.imageUrl)
      .sort(() => 0.5 - Math.random())
      .slice(0, limit)
  } catch (e) {
    console.error(e)
  }
}

const fetchLatestMessage = async () => {
  try {
    const data = await messageService.getAll()
    if (data.length > 0) {
      const limit = store.preferences.noteLimit || 1
      // Get last N messages
      latestMessages.value = [...data].reverse().slice(0, limit)
    }
  } catch (e) {
    console.error(e)
  }
}

const openAddModal = () => {
  editingAnniversaryId.value = null
  newAnniversary.value = { title: '', date: new Date(), description: '', type: 'other', color: getRandomColor() }
  showAddModal.value = true
}

const openEditModal = (anniversary: any) => {
  if (anniversary.type === 'start_date') {
    openEditStartDate(anniversary)
    return
  }

  editingAnniversaryId.value = anniversary.id

  // Robust ID comparison
  const isOwner = Number(anniversary.userId) === Number(store.id)

  if (anniversary.type === 'birthday' && !isOwner) {
    // Partner's birthday: only allow color change
    newAnniversary.value = {
      title: anniversary.title,
      date: new Date(anniversary.date),
      description: anniversary.description || '',
      type: anniversary.type,
      color: getCardColor(anniversary),
    }
  } else {
    // User's own items or other types
    newAnniversary.value = {
      title: anniversary.title,
      date: new Date(anniversary.date),
      description: anniversary.description || '',
      type: anniversary.type,
      color: getCardColor(anniversary),
    }
  }
  showAddModal.value = true
}

const getRandomColor = () => {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}

const formatDate = (date: Date | null | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateTime = (date: Date | null | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

const saveAnniversary = async () => {
  if (!newAnniversary.value.title && newAnniversary.value.type !== 'birthday') {
    initToast({ message: 'Please enter a title', color: 'warning' })
    return
  }

  if (!newAnniversary.value.date) {
    initToast({ message: 'Please select a date', color: 'warning' })
    return
  }

  try {
    const payload: any = {
      ...newAnniversary.value,
      date: formatDate(newAnniversary.value.date),
    }

    // Determine if it's a restricted view (like partner's birthday)
    const anniversary = editingAnniversaryId.value
      ? anniversaries.value.find((a) => a.id === editingAnniversaryId.value)
      : null
    const isOwner = anniversary ? Number(anniversary.userId) === Number(store.id) : true

    const isPartnerBirthday = newAnniversary.value.type === 'birthday' && !isOwner

    if (editingAnniversaryId.value) {
      // Save color to localStorage for existing items
      const storageKey =
        newAnniversary.value.type === 'start_date'
          ? 'start_date'
          : `${newAnniversary.value.type}_${editingAnniversaryId.value}`
      const newCardColors = { ...(store.preferences.cardColors || {}) }
      newCardColors[storageKey] = newAnniversary.value.color
      store.updatePreferences({ cardColors: newCardColors })

      if (isPartnerBirthday) {
        // DO NOT send color to backend anymore to keep it local
        // await anniversaryService.update(editingAnniversaryId.value, { color: newAnniversary.value.color })
      } else {
        // Remove color from payload to keep it local
        const restPayload = { ...payload }
        delete restPayload.color
        await anniversaryService.update(editingAnniversaryId.value, restPayload)
      }
      initToast({ message: 'Updated successfully!', color: 'success' })
    } else {
      // Remove color from payload for new anniversaries too
      const restPayload = { ...payload }
      delete restPayload.color
      const created = await anniversaryService.create(restPayload)

      // Save color to localStorage after creation to get the ID
      if (created && created.id) {
        const newCardColors = { ...(store.preferences.cardColors || {}) }
        const storageKey = `${newAnniversary.value.type}_${created.id}`
        newCardColors[storageKey] = newAnniversary.value.color
        store.updatePreferences({ cardColors: newCardColors })
      }

      initToast({ message: 'Added successfully!', color: 'success' })
    }
    showAddModal.value = false
    await fetchAnniversaries()
  } catch (e) {
    initToast({ message: 'Failed to save', color: 'danger' })
  }
}

const openEditStartDate = (anniversary?: any) => {
  isEditingStartDateFromCard.value = !!anniversary
  if (anniversary) {
    // If from card, always sync with settings date but keep the card's color
    newStartDate.value = new Date(startDateStr.value)
    startDateColor.value = getCardColor(anniversary)
    startDateId.value = anniversary.id
  } else {
    // If from Hero section, allow editing both
    newStartDate.value = new Date(startDateStr.value)
    // Use the getCardColor helper even without a full anniversary object for the key
    startDateColor.value = getCardColor({ type: 'start_date' })
  }
  showEditStartDateModal.value = true
}

const saveStartDate = async () => {
  try {
    const localDateTime = formatDateTime(newStartDate.value)

    // Save color to localStorage
    const newCardColors = { ...(store.preferences.cardColors || {}) }
    newCardColors['start_date'] = startDateColor.value
    store.updatePreferences({ cardColors: newCardColors })

    const payload: Partial<Anniversary> = {
      title: 'Start Date',
      date: localDateTime,
      type: 'start_date',
      description: 'The day we started our journey',
      // color is handled locally in updatePreferences
    }

    if (startDateId.value) {
      await anniversaryService.update(startDateId.value, payload)
    } else {
      // If no ID, try to find it first or create it
      const existing = anniversaries.value.find((a) => a.type === 'start_date')
      if (existing) {
        await anniversaryService.update(existing.id, payload)
      } else {
        await anniversaryService.create(payload)
      }
    }

    showEditStartDateModal.value = false
    await fetchAnniversaries()
    initToast({ message: 'Start date updated!', color: 'success' })
  } catch (e: any) {
    // Handle 404 (ID stale) fallback
    if (startDateId.value && e.message?.includes('404')) {
      try {
        await anniversaryService.create({
          title: 'Start Date',
          date: formatDateTime(newStartDate.value),
          type: 'start_date',
          description: 'The day we started our journey',
          // color is handled locally
        })
        await fetchAnniversaries()
        showEditStartDateModal.value = false
        initToast({ message: 'Love start date re-created successfully!', color: 'success' })
        return
      } catch (err) {
        console.error('Failed to re-create start date:', err)
      }
    }
    initToast({ message: 'Failed to update start date', color: 'danger' })
  }
}

const deleteAnniversary = async (id: number) => {
  // We'll use a small custom modal or just use toast for undo if complex,
  // but user asked to use vuestic dialog for deletion confirmation?
  // Actually user said "Delete Upcoming Special Dates DIALOG use vuestic-ui".
  // This likely refers to the "Add/Edit" dialog which is already va-modal.
  // Or maybe the delete confirmation? Let's use va-modal for delete confirmation too.
  anniversaryToDelete.value = id
  showDeleteConfirmModal.value = true
}

const confirmDelete = async () => {
  if (anniversaryToDelete.value) {
    try {
      await anniversaryService.delete(anniversaryToDelete.value)
      fetchAnniversaries()
      initToast({ message: 'Special date deleted', color: 'success' })
    } catch (e) {
      initToast({ message: 'Failed to delete', color: 'danger' })
    }
  }
  showDeleteConfirmModal.value = false
}

onMounted(() => {
  fetchAnniversaries()
  fetchRandomImages()
  fetchLatestMessage()
  setInterval(calculateTime, 1000)
})
</script>

<style scoped>
.timer {
  font-family: 'Inter', sans-serif;
  font-variant-numeric: tabular-nums;
}

.heart-beat {
  animation: heartbeat 1.5s infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.3);
  }
  30% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.3);
  }
  60% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}

.bg-pink-50 {
  background-color: #fff0f5;
}

.anniversary-card {
  position: relative;
  overflow: hidden;
}
</style>
