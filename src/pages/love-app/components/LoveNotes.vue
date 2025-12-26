<template>
  <div class="love-notes-section">
    <div class="flex justify-center items-center mb-6">
      <h3 class="text-2xl font-black tracking-tight" :style="titleStyle">Love Notes</h3>
    </div>
    <div
      class="p-6 rounded-lg shadow-sm text-center relative transition-all duration-500 overflow-hidden min-h-[150px]"
      :class="backgroundClass"
    >
      <div class="relative z-10">
        <div class="absolute top-2 right-2">
          <VaButton icon="palette" flat round size="small" @click="$emit('openTheme')" />
        </div>

        <div v-if="messages.length > 0" class="flex flex-row gap-4 px-2 justify-center flex-wrap">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="p-4 rounded-xl shadow-inner relative max-w-[200px] min-w-[200px] flex-shrink-0 backdrop-blur-sm snap-center transform transition hover:-translate-y-1 hover:shadow-lg border border-gray-100 dark:border-slate-700"
            :style="{
              backgroundColor:
                store.preferences.noteCardColor || (store.preferences.theme === 'dark' ? '#1e293b' : '#ffffff'),
            }"
          >
            <VaIcon name="format_quote" class="absolute top-2 left-2 text-gray-400 text-2xl opacity-50" />
            <p
              class="italic text-sm px-4 py-2 font-serif min-h-[60px] flex items-center justify-center text-center line-clamp-3"
              :style="{ color: isColorLight(store.preferences.noteCardColor || '#ffffff') ? '#1f2937' : '#f3f4f6' }"
            >
              {{ msg.content }}
            </p>
            <div
              class="mt-2 text-right text-xs font-bold border-t pt-2"
              :style="{
                color: isColorLight(store.preferences.noteCardColor || '#ffffff') ? '#4b5563' : '#d1d5db',
                borderColor: isColorLight(store.preferences.noteCardColor || '#ffffff') ? '#e5e7eb' : '#374151',
              }"
            >
              <div v-if="store.preferences.showNoteDate" class="text-[10px] font-normal opacity-75 mb-0.5">
                {{ new Date(msg.createdAt).toLocaleString() }}
              </div>
              <span v-if="store.preferences.showNoteAuthor"
                >- {{ msg.Sender?.displayName || msg.Sender?.username }}</span
              >
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 bg-opacity-60 dark:bg-opacity-40 rounded-xl backdrop-blur-sm border border-gray-100 dark:border-slate-700"
        >
          <VaIcon name="edit_note" size="3rem" class="text-gray-400 dark:text-gray-500 mb-2 opacity-60" />
          <p class="text-gray-600 dark:text-gray-300 mb-3 font-medium">No messages yet. Send a love note!</p>
          <VaButton size="small" round icon="send" @click="router.push({ name: 'love-messages' })">
            Send Note
          </VaButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../../stores/user-store'
import { useRouter } from 'vue-router'

const store = useUserStore()

const titleStyle = computed(() => {
  return {
    color: store.preferences.theme === 'dark' ? '#f3f4f6' : '#111827',
  }
})
const router = useRouter()

defineProps<{
  messages: any[]
}>()

defineEmits(['openTheme'])

const isColorLight = (color: string) => {
  if (!color) return true
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

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

const backgroundClass = computed(() => {
  const baseClass = store.preferences.noteTheme
  return isDarkTheme(baseClass) ? `${baseClass} text-white` : baseClass
})
</script>
