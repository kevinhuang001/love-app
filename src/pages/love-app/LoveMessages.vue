<template>
  <div class="love-messages flex flex-col relative overflow-hidden h-full min-h-screen">
    <!-- Theme Button -->
    <div class="absolute top-4 right-4 z-30">
      <VaButton icon="palette" round size="small" class="opacity-80 hover:opacity-100" @click="openThemeModal" />
    </div>

    <div
      ref="messagesContainer"
      class="messages-container flex-grow w-full overflow-y-auto"
      :class="containerClass"
      :style="containerStyle"
    >
      <div class="flex flex-col p-4 pb-24">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'message-wrapper',
            msg.Sender?.username === store.userName ? 'my-message-wrapper' : 'other-message-wrapper',
          ]"
        >
          <VaAvatar
            v-if="msg.Sender?.username !== store.userName"
            :src="msg.Sender?.avatarUrl"
            size="small"
            class="mr-2 mb-1"
          />

          <div
            :class="['message-bubble group', msg.Sender?.username === store.userName ? 'my-message' : 'other-message']"
            :style="
              msg.Sender?.username === store.userName ? { backgroundColor: store.preferences.noteBubbleColor } : {}
            "
          >
            <div
              class="message-text"
              :style="
                msg.Sender?.username === store.userName && isColorLight(store.preferences.noteBubbleColor)
                  ? { color: '#333' }
                  : {}
              "
            >
              {{ msg.content }}
            </div>
            <div class="message-info flex items-center justify-end gap-2 mt-1">
              <div class="message-time text-[0.65rem] opacity-70">
                {{ new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </div>

              <!-- Edit/Delete Actions (Inline for mobile compatibility) -->
              <div v-if="msg.Sender?.username === store.userName" class="flex gap-2 opacity-60">
                <VaIcon
                  name="edit"
                  size="small"
                  class="cursor-pointer hover:text-white"
                  style="font-size: 14px"
                  @click.stop="startEdit(msg)"
                />
                <VaIcon
                  name="delete"
                  size="small"
                  class="cursor-pointer hover:text-red-200"
                  style="font-size: 14px"
                  @click.stop="deleteMessage(msg.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area-wrapper fixed bottom-0 left-0 w-full px-4 pb-4 z-[100] pointer-events-none">
      <div
        class="input-area px-3 rounded-2xl pointer-events-auto bg-transparent"
        :style="{
          minHeight: '52px',
          maxWidth: '800px',
          margin: '0 auto',
        }"
      >
        <VaInput
          v-model="newMessage"
          :placeholder="editingMessageId ? 'Edit message...' : 'Type a sweet message...'"
          class="flex-grow custom-message-input"
          :style="{
            '--va-input-text-color': '#000000',
            '--va-input-placeholder-color': '#666666',
            '--va-input-container-background-color': 'transparent',
            '--va-input-container-border-color': 'rgba(0,0,0,0.1)',
          }"
          @keyup.enter="sendMessage"
        />
        <VaButton v-if="editingMessageId" icon="close" round flat color="secondary" @click="cancelEdit" />
        <VaButton :icon="editingMessageId ? 'check' : 'send'" round @click="sendMessage" />
      </div>
    </div>

    <!-- Theme Modal -->
    <VaModal v-model="showThemeModal" title="Customize Chat Background" hide-default-actions max-width="600px">
      <div class="p-4">
        <ThemePicker
          v-model="currentTheme"
          v-model:color-value="currentBubbleColor"
          pattern-label="Select Background Pattern"
          color-label="Bubble Color"
        />
        <div class="flex justify-end gap-2 pt-6">
          <VaButton preset="secondary" @click="showThemeModal = false">Cancel</VaButton>
          <VaButton @click="saveTheme">Save Changes</VaButton>
        </div>
      </div>
    </VaModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useUserStore } from '../../stores/user-store'
import { useTheme } from '../../composables/useTheme'
import { messageService } from '../../services/message.service'
import { useToast, useModal } from 'vuestic-ui'
import ThemePicker from '../../components/ThemePicker.vue'

const store = useUserStore()
const { isColorLight } = useTheme()
const { init: initToast } = useToast()
const { confirm } = useModal()
const messages = ref<any[]>([])
const newMessage = ref('')
const editingMessageId = ref<number | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

const showThemeModal = ref(false)
const currentTheme = ref(store.preferences.noteTheme)
const currentBubbleColor = ref(store.preferences.noteBubbleColor)

const containerClass = computed(() => {
  return store.preferences.noteTheme
})

const containerStyle = computed(() => {
  return {}
})

const openThemeModal = () => {
  currentTheme.value = store.preferences.noteTheme
  currentBubbleColor.value = store.preferences.noteBubbleColor
  showThemeModal.value = true
}

const saveTheme = () => {
  try {
    store.updatePreferences({
      noteTheme: currentTheme.value,
      noteBubbleColor: currentBubbleColor.value,
    })
    showThemeModal.value = false
    initToast({ message: 'Theme updated successfully!', color: 'success' })
  } catch (err) {
    initToast({ message: 'Failed to save background', color: 'danger' })
  }
}

const fetchMessages = async () => {
  try {
    const newMessages = await messageService.getAll()
    if (newMessages.length !== messages.value.length) {
      messages.value = newMessages
      scrollToBottom()
    }
  } catch (e) {
    console.error(e)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  if (editingMessageId.value) {
    // Edit mode
    try {
      await messageService.update(editingMessageId.value, newMessage.value)

      // Optimistic update
      const msgIndex = messages.value.findIndex((m) => m.id === editingMessageId.value)
      if (msgIndex !== -1) {
        messages.value[msgIndex].content = newMessage.value
      }

      newMessage.value = ''
      editingMessageId.value = null
      // fetchMessages(); // No longer needed for immediate feedback
      initToast({ message: 'Message updated', color: 'success' })
    } catch (e) {
      initToast({ message: 'Failed to update message', color: 'danger' })
    }
    return
  }

  try {
    await messageService.create(newMessage.value)
    newMessage.value = ''
    fetchMessages()
  } catch (e) {
    initToast({ message: 'Failed to send message', color: 'danger' })
  }
}

const startEdit = (msg: any) => {
  newMessage.value = msg.content
  editingMessageId.value = msg.id
  // Focus input?
}

const cancelEdit = () => {
  newMessage.value = ''
  editingMessageId.value = null
}

const deleteMessage = async (id: number) => {
  const result = await confirm('Delete this message?')
  if (!result) return
  try {
    await messageService.delete(id)
    fetchMessages()
    initToast({ message: 'Message deleted', color: 'success' })
  } catch (e) {
    initToast({ message: 'Failed to delete message', color: 'danger' })
  }
}

const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior,
      })
    }
  })
}

onMounted(() => {
  fetchMessages()
  scrollToBottom('auto')
  setInterval(fetchMessages, 3000)
})
</script>

<style scoped>
.love-messages {
  width: 100%;
  background: transparent;
}

.messages-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  margin-bottom: 12px;
}

.my-message-wrapper {
  justify-content: flex-end;
}

.other-message-wrapper {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 85%;
  padding: 10px 15px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .message-bubble {
    max-width: 65%;
  }
}

.my-message {
  align-self: flex-end;
  color: white;
  border-bottom-right-radius: 4px;
}

.other-message {
  @apply bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-text {
  word-break: break-word;
  line-height: 1.5;
}

.message-time {
  font-size: 0.65rem;
  opacity: 0.7;
  text-align: right;
  margin-top: 4px;
}

.custom-message-input :deep(input) {
  color: #000000 !important;
  -webkit-text-fill-color: #000000 !important;
}

.custom-message-input :deep(input::placeholder) {
  color: #666666 !important;
  -webkit-text-fill-color: #666666 !important;
}

.custom-message-input :deep(.va-input-wrapper__field) {
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(8px);
}
</style>
