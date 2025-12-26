<template>
  <div class="love-timeline">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="flex xs12 w-full">
        <div
          class="grid grid-cols-1 md:grid-cols-3 items-center bg-transparent p-4 rounded-lg gap-4 w-full border border-backgroundBorder"
        >
          <div class="flex justify-center md:justify-start">
            <h2 class="text-xl font-bold whitespace-nowrap" :style="titleStyle">Our Journey</h2>
          </div>

          <div class="flex justify-center w-full">
            <!-- View Mode (Grouping) Toggles -->
            <VaButtonToggle
              v-model="viewMode"
              :options="[
                { label: 'Day', value: 'day' },
                { label: 'Week', value: 'week' },
                { label: 'Month', value: 'month' },
                { label: 'Year', value: 'year' },
              ]"
              size="medium"
              color="primary"
              preset="secondary"
              border-color="primary"
              class="justify-center"
            />
          </div>

          <div class="flex justify-center md:justify-end">
            <VaButton icon="add_a_photo" round @click="openAddModal">Add Memories</VaButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div v-if="loading" class="flex justify-center p-8">
      <VaProgressCircle indeterminate />
    </div>

    <div
      v-else-if="moments.length === 0"
      class="text-center p-12 text-gray-400 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700"
    >
      <VaIcon name="collections" size="large" color="secondary" class="mb-2" />
      <p>No memories yet. Start capturing your journey!</p>
    </div>

    <div v-else>
      <!-- Loop through groups for both views to maintain consistency -->
      <div v-for="(group, key) in groupedMoments" :key="key" class="mb-8">
        <!-- Group Header (Sticky) -->
        <div class="flex items-center gap-4 mb-6 sticky top-0 z-10 py-3" :style="stickyHeaderStyle">
          <div class="h-px bg-gray-200 dark:bg-slate-800 flex-grow"></div>
          <h3
            class="text-lg font-bold whitespace-nowrap px-6 py-2 rounded-full shadow-sm border border-gray-100 dark:border-slate-700"
            :style="bubbleStyle"
          >
            {{ group.title }}
          </h3>
          <div class="h-px bg-gray-200 dark:bg-slate-800 flex-grow"></div>
        </div>

        <!-- GALLERY VIEW -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2">
          <div
            v-for="item in group.items"
            :key="item.id"
            class="gallery-item relative group overflow-hidden rounded-xl shadow-sm cursor-pointer bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
            style="padding-bottom: 100%; height: 0"
            @click="openImage(item)"
          >
            <img
              :src="item.thumbnailUrl"
              class="absolute top-0 left-0 w-full h-full object-cover transform transition duration-500 group-hover:scale-110"
              loading="lazy"
              @error="(e) => handleImageError(e, item.originalUrl)"
            />

            <!-- Avatar Overlay (Top Left) -->
            <div class="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <VaAvatar
                v-if="item.User?.avatarUrl"
                :src="item.User.avatarUrl"
                size="small"
                class="shadow-md border-2 border-white"
              />
              <VaAvatar
                v-else-if="item.userId === store.id && store.pfp"
                :src="store.pfp"
                size="small"
                class="shadow-md border-2 border-white"
              />
              <VaAvatar v-else size="small" color="primary" class="shadow-md border-2 border-white">
                {{
                  item.User?.displayName?.charAt(0) || (item.userId === store.id ? store.displayName?.charAt(0) : '?')
                }}
              </VaAvatar>
            </div>

            <!-- Date Tag -->
            <div class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div
                class="bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-100 dark:border-white/10 shadow-sm"
              >
                <p class="text-gray-800 dark:text-gray-200 text-[10px] font-bold">
                  {{ new Date(item.date).toLocaleDateString() }}
                </p>
              </div>
            </div>

            <!-- Overlay -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3"
            >
              <p v-if="item.description" class="text-white font-medium text-sm line-clamp-2 mb-1 drop-shadow-md">
                {{ item.description }}
              </p>
              <div class="flex justify-between items-end">
                <div />
                <VaButton
                  icon="delete"
                  flat
                  color="danger"
                  size="small"
                  round
                  class="bg-white/20 hover:bg-white/40 text-white"
                  @click.stop="deleteMoment(item.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <VaModal v-model="showImageModal" hide-default-actions no-padding class="image-preview-modal">
      <div
        class="relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] w-full max-w-[95vw] md:max-w-4xl"
      >
        <!-- Image Area -->
        <div
          class="bg-black flex items-center justify-center relative flex-grow overflow-hidden group min-h-[40vh] md:min-h-[50vh]"
        >
          <img
            :src="currentImage?.thumbnailUrl"
            class="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain"
            @error="(e) => handleImageError(e, currentImage?.originalUrl)"
          />

          <button
            class="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 backdrop-blur-sm"
            @click="showImageModal = false"
          >
            <VaIcon name="close" size="small" />
          </button>
        </div>

        <!-- Info Area -->
        <div class="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
          <div class="flex items-center gap-3">
            <VaAvatar
              v-if="currentImage?.User?.avatarUrl"
              size="small"
              :src="currentImage.User.avatarUrl"
              class="flex-shrink-0"
            />
            <VaAvatar
              v-else-if="String(currentImage?.userId) === String(store.id) && store.pfp"
              size="small"
              :src="store.pfp"
              class="flex-shrink-0"
            />
            <VaAvatar
              v-else-if="String(currentImage?.userId) !== String(store.id) && store.partner?.avatarUrl"
              size="small"
              :src="processUrl(store.partner.avatarUrl)"
              class="flex-shrink-0"
            />
            <VaAvatar v-else size="small" color="primary" class="flex-shrink-0">
              {{
                currentImage?.User?.displayName?.charAt(0) ||
                (String(currentImage?.userId) === String(store.id)
                  ? store.displayName?.charAt(0)
                  : store.partner?.displayName?.charAt(0) || '?')
              }}
            </VaAvatar>
            <div class="flex-grow min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <p class="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
                  {{
                    currentImage?.User?.displayName ||
                    (String(currentImage?.userId) === String(store.id)
                      ? store.displayName
                      : store.partner?.displayName || 'Unknown User')
                  }}
                </p>
                <span class="text-xs text-gray-400">•</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{
                  currentImage ? new Date(currentImage.date).toLocaleString() : ''
                }}</span>
              </div>

              <div v-if="!isEditing" class="flex flex-col md:flex-row items-start justify-between gap-3">
                <p class="text-gray-700 dark:text-gray-300 text-sm leading-snug whitespace-pre-wrap flex-grow">
                  {{ currentImage?.description || 'No description' }}
                </p>
                <div class="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-start">
                  <VaButton
                    v-if="canEdit"
                    icon="edit"
                    size="small"
                    round
                    color="primary"
                    preset="secondary"
                    @click="startEdit"
                  />
                  <VaButton
                    v-if="canEdit"
                    icon="delete"
                    size="small"
                    round
                    color="danger"
                    preset="secondary"
                    @click="deleteFromModal"
                  />
                </div>
              </div>

              <div v-else class="flex flex-col gap-3 mt-2">
                <VaInput v-model="editDate" type="datetime-local" label="Date Taken" class="w-full text-sm" />
                <div class="flex flex-col md:flex-row gap-3 items-end md:items-start">
                  <VaInput
                    v-model="editDescription"
                    type="textarea"
                    autosize
                    class="w-full text-sm"
                    placeholder="Add a description..."
                  />
                  <div class="flex flex-row md:flex-col gap-2 shrink-0">
                    <VaButton icon="check" size="small" round color="success" :loading="isSaving" @click="saveEdit" />
                    <VaButton icon="close" size="small" round flat color="secondary" @click="cancelEdit" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VaModal>

    <!-- Add Photos Modal (Multi-upload) -->
    <VaModal
      v-model="showAddModal"
      title="Upload Memories"
      :ok-text="isUploading ? 'Uploading...' : 'Upload'"
      :cancel-disabled="isUploading"
      :ok-disabled="isUploading || newMoment.images.length === 0"
      size="large"
      @ok="handleUpload"
    >
      <div class="flex flex-col gap-6">
        <VaAlert color="info" outline class="mb-0">
          <template #icon>
            <VaIcon name="info" />
          </template>
          Select one or more photos to upload.
        </VaAlert>

        <VaInput
          v-model="newMoment.description"
          label="Description / Story"
          placeholder="What was happening in these photos?"
          type="textarea"
          :rows="3"
          class="w-full"
        />

        <div>
          <label class="va-title mb-2 block text-gray-600">Photos</label>
          <VaFileUpload v-model="newMoment.images" type="gallery" file-types="image/*" dropzone multiple />
        </div>

        <div v-if="isUploading" class="text-center">
          <VaProgressBar :model-value="uploadProgress" />
          <p class="text-sm text-gray-500 mt-2">
            Uploading {{ uploadCount }} / {{ newMoment.images.length }} photos...
          </p>
        </div>
      </div>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useUserStore } from '../../stores/user-store'
import { momentService, type Moment } from '../../services/moment.service'
import { processUrl } from '../../services/api'
import { useToast, useModal } from 'vuestic-ui'

// Types
type ViewMode = 'day' | 'week' | 'month' | 'year'

// State
const store = useUserStore()
const { init: initToast } = useToast()
const { confirm } = useModal()

const titleStyle = computed(() => {
  return {
    color: store.preferences.theme === 'dark' ? '#f3f4f6' : '#111827',
  }
})

const bubbleStyle = computed(() => {
  return {
    backgroundColor: store.preferences.theme === 'dark' ? '#1e293b' : '#ffffff',
    color: store.preferences.theme === 'dark' ? '#f3f4f6' : '#111827',
  }
})

const stickyHeaderStyle = computed(() => {
  return {
    backgroundColor: store.preferences.theme === 'dark' ? '#0f172a' : '#f9fafb',
  }
})

const moments = ref<Moment[]>([])
const loading = ref(false)
const viewMode = ref<ViewMode>('day')

// Helper for local date formatting
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

// Upload State
const showAddModal = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadCount = ref(0)
const newMoment = ref({
  description: '',
  images: [] as File[],
})

// Preview State
const showImageModal = ref(false)
const currentImage = ref<Moment | null>(null)

// Grouping Logic (Reused from Gallery)
const groupedMoments = computed(() => {
  if (!moments.value.length) return {}

  const groups: Record<string, { title: string; items: Moment[]; sortKey: number }> = {}

  moments.value.forEach((moment) => {
    const date = new Date(moment.date)
    let key = ''
    let title = ''
    let sortKey = 0

    if (viewMode.value === 'year') {
      key = date.getFullYear().toString()
      title = key
      sortKey = date.getFullYear()
    } else if (viewMode.value === 'month') {
      key = `${date.getFullYear()}-${date.getMonth()}`
      title = date.toLocaleDateString('default', { month: 'long', year: 'numeric' })
      sortKey = date.getFullYear() * 100 + date.getMonth()
    } else if (viewMode.value === 'week') {
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - date.getDay())
      key = formatDate(startOfWeek)
      title = `Week of ${startOfWeek.toLocaleDateString()}`
      sortKey = startOfWeek.getTime()
    } else {
      // Day
      key = formatDate(date)
      title = date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      sortKey = date.getTime()
    }

    if (!groups[key]) {
      groups[key] = { title, items: [], sortKey }
    }
    groups[key].items.push(moment)
  })

  // Sort groups by date descending
  return Object.entries(groups)
    .sort(([, a], [, b]) => b.sortKey - a.sortKey)
    .reduce(
      (acc, [key, value]) => {
        // Sort items within group by date descending too
        value.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        acc[key] = value
        return acc
      },
      {} as typeof groups,
    )
})

// Actions
const fetchMoments = async () => {
  loading.value = true
  try {
    moments.value = await momentService.getAll()
  } catch (e) {
    console.error('Failed to fetch moments', e)
    initToast({ message: 'Failed to load memories', color: 'danger' })
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  newMoment.value = { description: '', images: [] }
  uploadProgress.value = 0
  uploadCount.value = 0
  showAddModal.value = true
}

const handleUpload = async () => {
  if (newMoment.value.images.length === 0) return

  isUploading.value = true
  uploadCount.value = 0
  const total = newMoment.value.images.length
  let success = 0

  try {
    for (const originalFile of newMoment.value.images) {
      // Extract date from ORIGINAL file before any conversion
      const date = await getDateFromExif(originalFile)
      // console.log(`Extracted date for ${originalFile.name}: ${formatDateTime(date)}`)

      let file = originalFile
      const formData = new FormData()
      formData.append('description', newMoment.value.description)

      // Handle HEIC files from mobile
      if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        try {
          // console.log(`Converting HEIC file: ${file.name}`)
          const heic2any = (await import('heic2any')).default
          const blob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.7,
          })
          const convertedBlob = Array.isArray(blob) ? blob[0] : blob
          file = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: file.lastModified,
          })
          // console.log(`Converted ${originalFile.name} to ${file.name}`)
        } catch (heicError) {
          console.error('HEIC conversion failed', heicError)
        }
      }

      // Check file size (limit to 30MB)
      if (file.size > 30 * 1024 * 1024) {
        initToast({ message: `File ${file.name} is too large (>30MB). Skipping.`, color: 'warning' })
        continue
      }

      formData.append('date', formatDateTime(date))
      formData.append('image', file)

      try {
        await momentService.create(formData)
        success++
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err)
        initToast({ message: `Failed to upload ${file.name}: ${err.message || 'Unknown error'}`, color: 'danger' })
      }

      uploadCount.value = success
      uploadProgress.value = Math.round((success / total) * 100)
    }

    if (success > 0) {
      initToast({ message: `Successfully added ${success} memories!`, color: 'success' })
      showAddModal.value = false
      fetchMoments()
    } else {
      initToast({ message: 'No photos were uploaded successfully', color: 'danger' })
    }
  } catch (e: any) {
    console.error(e)
    initToast({ message: `Upload error: ${e.message || 'Unknown error'}`, color: 'danger' })
  } finally {
    isUploading.value = false
  }
}

const getDateFromExif = async (file: File): Promise<Date> => {
  const uploadDate = new Date()
  const modifiedDate = file.lastModified ? new Date(file.lastModified) : uploadDate

  // console.log(`[EXIF] Processing ${file.name} (${file.type}, size: ${file.size})`)

  // Helper for sanity check
  const isReasonableDate = (d: Date) => {
    if (!d || isNaN(d.getTime())) return false
    const now = new Date()
    // Stricter min date to avoid 2001-09-09 (1000000000) and other noise.
    // Most users won't have digital photos before 2010 that are named with Unix timestamps.
    const minDate = new Date('2010-01-01')
    const maxDate = new Date(now.getTime() + 86400000) // 1 day buffer
    return d > minDate && d < maxDate
  }

  // PRIORITY 1: EXIF (Only for images) - Highest priority for photos
  if (file.type.startsWith('image/')) {
    try {
      const module = await import('exifreader')
      const ExifReader = module.default || module

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('EXIF_TIMEOUT')), 2000)
      })

      const tags = await Promise.race([ExifReader.load(file), timeoutPromise])

      // Comprehensive list of date tags across different manufacturers (Apple, Samsung, Huawei, etc.)
      const dateTags = [
        'DateTimeOriginal', // Standard
        'DateTimeDigitized', // Standard
        'DateTime', // Standard
        'DateCreated', // Common in some apps
        'CreateDate', // Common in video/newer cameras
        'ModifyDate', // Fallback modification
        'GPSDateStamp', // Android GPS fallback
        'FileDateTime', // Some specific camera brands
      ]

      for (const tagName of dateTags) {
        const tag = tags[tagName]
        if (tag && tag.description) {
          let dateStr = tag.description

          // Cleanup EXIF date format (YYYY:MM:DD -> YYYY-MM-DD)
          if (dateStr.includes(':') && !dateStr.includes('-')) {
            const parts = dateStr.split(' ')
            if (parts[0]) {
              parts[0] = parts[0].replace(/:/g, '-')
              dateStr = parts.join(' ')
            }
          }

          const d = new Date(dateStr)
          if (isReasonableDate(d)) {
            // console.log(`[EXIF] Success: Found EXIF ${tagName} = ${d.toLocaleString()}`)
            return d
          }
        }
      }

      // Additional check for GPS tags if GPSDateStamp alone didn't work
      if (tags.GPSDateStamp && tags.GPSTimeStamp) {
        const gpsDate = tags.GPSDateStamp.description.replace(/:/g, '-')
        const gpsTime = tags.GPSTimeStamp.description
        const d = new Date(`${gpsDate} ${gpsTime} UTC`)
        if (isReasonableDate(d)) {
          // console.log(`[EXIF] Success: Combined GPS Date/Time = ${d.toLocaleString()}`)
          return d
        }
      }
    } catch (e: any) {
      // console.warn(`[EXIF] EXIF extraction failed or timed out: ${e.message}`)
    }
  }

  // PRIORITY 2: Filename Patterns (Fallback if EXIF fails or is missing)
  // 2.1: 13-digit timestamp (ms)
  const tsMsMatch = file.name.match(/(?:^|\D)(\d{13})(?:\D|$)/)
  if (tsMsMatch) {
    const d = new Date(parseInt(tsMsMatch[1]))
    if (isReasonableDate(d)) {
      // console.log(`[EXIF] Success: Found 13-digit timestamp in ${file.name}: ${d.toLocaleString()}`)
      return d
    }
  }

  // 2.2: 10-digit timestamp (s)
  const tsSMatch = file.name.match(/(?:^|\D)(\d{10})(?:\D|$)/)
  if (tsSMatch) {
    const d = new Date(parseInt(tsSMatch[1]) * 1000)
    if (isReasonableDate(d)) {
      // console.log(`[EXIF] Success: Found 10-digit timestamp in ${file.name}: ${d.toLocaleString()}`)
      return d
    }
  }

  // 2.3: Standard Date Patterns (YYYY-MM-DD, etc.)
  const datePatterns = [
    { regex: /(?:^|\D)(\d{4})[-_](\d{2})[-_](\d{2})(?:\D|$)/, type: 'ymd' },
    { regex: /(?:^|\D)(\d{4})(\d{2})(\d{2})(?:\D|$)/, type: 'ymd_flat' },
    { regex: /(?:^|\D)(\d{2})[-_](\d{2})[-_](\d{4})(?!\d)/, type: 'dmy' },
    { regex: /(?:^|\D)(\d{2})(\d{2})(\d{4})(?!\d)/, type: 'dmy_flat' },
  ]

  for (const p of datePatterns) {
    const match = file.name.match(p.regex)
    if (match) {
      let d: Date | null = null
      if (p.type === 'ymd' || p.type === 'ymd_flat') {
        d = new Date(`${match[1]}-${match[2]}-${match[3]}`)
      } else if (p.type === 'dmy' || p.type === 'dmy_flat') {
        d = new Date(`${match[3]}-${match[2]}-${match[1]}`)
      }

      if (d && isReasonableDate(d)) {
        // console.log(`[EXIF] Success: Found filename date pattern ${p.type} for ${file.name}: ${d.toLocaleString()}`)
        return d
      }
    }
  }

  // PRIORITY 3: File lastModified (Final fallback)
  // console.log(`[EXIF] Fallback: Used file modified date.`)
  return modifiedDate
}

const deleteMoment = async (id: number) => {
  const result = await confirm('Are you sure you want to delete this memory?')
  if (!result) return
  try {
    await momentService.delete(id)
    // Optimistic remove
    moments.value = moments.value.filter((m) => m.id !== id)
    initToast({ message: 'Memory deleted', color: 'success' })
  } catch (e) {
    initToast({ message: 'Failed to delete memory', color: 'danger' })
    fetchMoments() // Revert on fail
  }
}

const openImage = (moment: Moment) => {
  currentImage.value = moment
  showImageModal.value = true
}

const handleImageError = (e: Event, originalUrl?: string) => {
  const img = e.target as HTMLImageElement
  // If thumbnail fails, try loading original URL
  if (originalUrl && img.src !== originalUrl && !img.src.includes('placeholder')) {
    img.src = originalUrl
    return
  }

  if (!img.src.includes('placeholder')) {
    img.src = 'https://via.placeholder.com/300?text=Image+Error'
  }
}

// Edit Logic
const isEditing = ref(false)
const editDescription = ref('')
const editDate = ref('')
const isSaving = ref(false)

const canEdit = computed(() => {
  if (!currentImage.value) return false

  // Debug Log
  // console.log('[Permission Check]', {
  //   storeId: store.id,
  //   imageUser: currentImage.value.User,
  //   imageUserId: (currentImage.value as any).userId,
  // })

  // Fallback check if User object is missing but userId is present
  const uploaderId = currentImage.value.User?.id || currentImage.value.userId

  // Loose comparison for string/number
  return store.id && uploaderId && String(store.id) === String(uploaderId)
})

const startEdit = () => {
  editDescription.value = currentImage.value?.description || ''
  // Convert current date to local datetime-local format (YYYY-MM-DDTHH:mm)
  if (currentImage.value?.date) {
    const d = new Date(currentImage.value.date)
    editDate.value = formatDateTime(d).slice(0, 16)
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const deleteFromModal = async () => {
  if (!currentImage.value) return
  await deleteMoment(currentImage.value.id)
  // If deleted (not found in list), close modal
  if (!moments.value.find((m) => m.id === currentImage.value?.id)) {
    showImageModal.value = false
  }
}

const saveEdit = async () => {
  if (!currentImage.value) return
  isSaving.value = true
  try {
    const updated = await momentService.update(currentImage.value.id, {
      description: editDescription.value,
      date: formatDateTime(new Date(editDate.value)),
    })

    // Update in list
    const idx = moments.value.findIndex((m) => m.id === updated.id)
    if (idx !== -1) {
      // Re-process the URL for the updated item if needed, but here we mostly care about metadata
      moments.value[idx] = {
        ...moments.value[idx],
        description: updated.description,
        date: updated.date,
      }
    }

    // Update current image for modal
    currentImage.value.description = updated.description
    currentImage.value.date = updated.date

    isEditing.value = false
    initToast({ message: 'Updated!', color: 'success' })

    // Refresh to re-sort
    fetchMoments()
  } catch (e) {
    initToast({ message: 'Failed to update', color: 'danger' })
  } finally {
    isSaving.value = false
  }
}

watch(showImageModal, (val) => {
  if (!val) isEditing.value = false
})

onMounted(() => {
  fetchMoments()
})
</script>

<style scoped>
.moment-image {
  transition: transform 0.3s ease;
}
.gallery-item {
  transition: transform 0.2s;
}
</style>
