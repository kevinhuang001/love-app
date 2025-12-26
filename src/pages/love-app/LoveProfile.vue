<template>
  <div class="love-profile p-4 md:p-8 max-w-4xl mx-auto">
    <!-- Header -->
    <header class="mb-10 text-center md:text-left">
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" :style="titleStyle">Profile</h1>
      <p class="text-lg" :style="textStyle">Manage your personal presence</p>
    </header>

    <div class="space-y-8">
      <!-- Section: Personal Presence -->
      <section>
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="account_circle" color="primary" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">My Presence</h2>
        </div>
        <VaCard class="overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
          <VaCardContent class="p-6 md:p-10">
            <div class="flex flex-col md:flex-row gap-10 items-center md:items-start">
              <!-- Avatar Section -->
              <div class="relative group cursor-pointer shrink-0" @click="triggerUpload">
                <div
                  class="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-2xl relative"
                >
                  <VaAvatar :src="avatarPreview || store.pfp" class="w-full h-full" style="--va-avatar-size: 100%" />
                  <div
                    class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <VaIcon name="photo_camera" color="white" size="32px" />
                    <span class="text-white text-xs mt-1 font-bold uppercase tracking-wider">Change</span>
                  </div>
                </div>
                <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileChange" />
              </div>

              <!-- Details Section -->
              <div class="flex-grow w-full space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <VaInput v-model="displayName" label="Display Name" placeholder="Nickname" class="w-full" />
                  <VaInput v-model="store.userName" label="Username (Read-only)" readonly class="w-full opacity-70" />
                </div>
                <VaDateInput v-model="birthday" label="My Birthday" clearable class="w-full" />

                <div v-if="isUploading" class="space-y-2">
                  <div class="flex justify-between text-xs font-bold text-primary">
                    <span>UPLOADING IMAGE</span>
                    <span>{{ uploadProgress }}%</span>
                  </div>
                  <VaProgressBar :model-value="uploadProgress" />
                </div>

                <div
                  class="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-slate-800"
                >
                  <VaButton
                    preset="secondary"
                    color="danger"
                    :disabled="isUploading"
                    class="order-2 sm:order-1"
                    @click="logout"
                  >
                    Sign Out
                  </VaButton>
                  <VaButton :loading="isUploading" icon="check" class="order-1 sm:order-2" @click="updateProfile">
                    Save Changes
                  </VaButton>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>
      </section>

      <!-- Section: Partner Connection -->
      <section v-if="store.partner">
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="favorite" color="primary" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">Partner Connection</h2>
        </div>
        <VaCard
          class="overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-pink-50/30 dark:from-slate-800 dark:to-pink-900/10"
        >
          <VaCardContent class="p-6 md:p-10">
            <div class="flex flex-col md:flex-row items-center gap-8">
              <div class="w-24 h-24 rounded-full overflow-hidden ring-4 ring-pink-100 dark:ring-pink-900/30 shadow-lg">
                <VaAvatar :src="store.partner.avatarUrl" class="w-full h-full" style="--va-avatar-size: 100%" />
              </div>
              <div class="flex-grow text-center md:text-left">
                <h3 class="text-2xl font-black mb-1" :style="titleStyle">
                  {{ store.partner.displayName || store.partner.username }}
                </h3>
                <p class="font-medium mb-4" :style="textStyle">@{{ store.partner.username }}</p>

                <div
                  class="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-pink-100 dark:border-pink-900/30 text-pink-600 dark:text-pink-400 px-5 py-2 rounded-2xl text-sm font-bold shadow-sm"
                >
                  <VaIcon name="cake" size="18px" />
                  <span v-if="store.partner.birthday">
                    {{
                      new Date(store.partner.birthday).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    }}
                  </span>
                  <span v-else>Birthday not set</span>
                </div>
              </div>
              <div class="shrink-0">
                <VaButton
                  preset="secondary"
                  color="danger"
                  size="small"
                  borderless
                  icon="link_off"
                  @click="showUnpairModal = true"
                >
                  Disconnect
                </VaButton>
              </div>
            </div>
          </VaCardContent>
        </VaCard>
      </section>

      <section v-else>
        <div class="flex items-center gap-2 mb-4">
          <VaIcon name="link_off" color="gray" size="20px" />
          <h2 class="text-xl font-bold" :style="cardTitleStyle">No Connection</h2>
        </div>
        <VaCard
          class="border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 shadow-none"
        >
          <VaCardContent class="p-10 text-center">
            <VaIcon name="favorite_border" size="48px" class="text-gray-300 dark:text-gray-600 mb-4" />
            <p class="max-w-md mx-auto" :style="textStyle">
              You haven't paired with anyone yet. Visit the pairing page to invite your partner!
            </p>
          </VaCardContent>
        </VaCard>
      </section>
    </div>

    <!-- Modals remain the same but styled for consistency -->
    <VaModal
      v-model="showUnpairModal"
      title="Dangerous Action"
      ok-text="Disconnect"
      cancel-text="Keep Connection"
      :ok-disabled="unpairConfirmationText !== requiredUnpairText"
      max-width="450px"
      @ok="handleUnpair"
    >
      <div class="py-4 space-y-4">
        <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
          <p class="text-red-700 dark:text-red-400 font-bold mb-2">You are about to disconnect.</p>
          <p class="text-red-600 dark:text-red-300 text-sm">
            This will permanently erase all shared letters, memories, and photos. This cannot be undone.
          </p>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-gray-700 dark:text-gray-300">Type this to confirm:</p>
          <code
            class="block p-3 bg-gray-100 dark:bg-slate-700 rounded-lg text-red-600 dark:text-red-400 font-black text-center select-all"
            >{{ requiredUnpairText }}</code
          >
          <VaInput
            v-model="unpairConfirmationText"
            placeholder="Type exactly as shown above"
            class="w-full mt-2"
            @paste.prevent
          />
        </div>
      </div>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../../stores/user-store'
import { useRouter } from 'vue-router'
import { anniversaryService } from '../../services/anniversary.service'
import { pairingService } from '../../services/pairing.service'
import { useToast } from 'vuestic-ui'

const store = useUserStore()
const router = useRouter()
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

const displayName = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')
const birthday = ref<Date | null>(null)
const birthdayAnniversaryId = ref<number | null>(null)

const showUnpairModal = ref(false)
const unpairConfirmationText = ref('')
const requiredUnpairText = computed(() => {
  const me = store.displayName || store.userName
  const partner = store.partner?.displayName || store.partner?.username || '对方'
  return `${me}和${partner}解除关系`
})

const handleUnpair = async () => {
  try {
    await pairingService.unpair()
    await store.checkAuth()
    initToast({ message: '关系已解除，共享数据已清空', color: 'success' })
    router.push('/love/pairing')
  } catch (e) {
    initToast({ message: '解除关系失败', color: 'danger' })
  } finally {
    showUnpairModal.value = false
    unpairConfirmationText.value = ''
  }
}

onMounted(async () => {
  // Ensure we have the latest user data
  await store.checkAuth()
  displayName.value = store.displayName
  await fetchBirthday()
})

const fetchBirthday = async () => {
  try {
    const anniversaries = await anniversaryService.getAll()
    // Find birthday created by current user
    const bday = anniversaries.find((a: any) => a.type === 'birthday' && a.userId === store.id)
    if (bday) {
      birthday.value = new Date(bday.date)
      birthdayAnniversaryId.value = bday.id
    }
  } catch (e) {
    console.error(e)
  }
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    avatarFile.value = file

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const isUploading = ref(false)
const uploadProgress = ref(0)

const formatDate = (date: Date | null) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const updateProfile = async () => {
  const formData = new FormData()
  formData.append('displayName', displayName.value)
  if (birthday.value) {
    formData.append('birthday', formatDate(birthday.value))
  }

  if (avatarFile.value) {
    formData.append('avatar', avatarFile.value)
  }

  isUploading.value = true
  uploadProgress.value = 0

  try {
    // Pass progress callback
    await store.updateProfile(formData, (percent: number) => {
      uploadProgress.value = percent
    })

    // Refresh user data to update navbar avatar
    await store.checkAuth()
    // Refresh birthday from Anniversary API just in case (or rely on user data if updated)
    await fetchBirthday()

    // Reset
    if (avatarFile.value) {
      avatarFile.value = null
      // Keep preview until refresh? Or update store.pfp will handle it.
      // If store.pfp is updated, we can clear preview to show store.pfp
      avatarPreview.value = ''
    }

    initToast({ message: 'Profile updated!', color: 'success' })
  } catch (e) {
    initToast({ message: 'Failed to update profile', color: 'danger' })
  } finally {
    isUploading.value = false
  }
}

const logout = () => {
  store.logout()
  router.push('/auth/login')
}
</script>
