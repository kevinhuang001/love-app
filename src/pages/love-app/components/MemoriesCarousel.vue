<template>
  <div class="p-0">
    <div class="flex justify-center items-center mb-6">
      <h3 class="text-2xl font-black tracking-tight" :style="titleStyle">Sweet Memories</h3>
    </div>

    <div v-if="images.length > 0" class="carousel-container rounded-xl overflow-hidden bg-backgroundPrimary">
      <VaCarousel
        :items="images"
        indicators
        infinite
        autoscroll
        :autoscroll-interval="4000"
        height="350px"
        color="backgroundPrimary"
      >
        <template #default="{ item }">
          <div class="w-full h-full flex items-center justify-center bg-backgroundPrimary relative">
            <VaImage :src="item.thumbnailUrl || item.imageUrl" class="w-full h-full" fit="contain" />
            <div
              v-if="item.title"
              class="absolute bottom-0 left-0 right-0 bg-black/30 text-white p-3 text-center backdrop-blur-md border-t border-white/10"
            >
              <p class="font-black text-sm tracking-wide">{{ item.title }}</p>
            </div>
          </div>
        </template>
      </VaCarousel>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-16 bg-backgroundPrimary rounded-xl border-2 border-dashed border-backgroundBorder"
    >
      <VaIcon name="photo_library" size="4rem" color="secondary" class="mb-4 opacity-20" />
      <p class="text-gray-500 dark:text-gray-400 mb-6 font-bold tracking-tight">Capture your best moments together</p>
      <VaButton
        icon="add_a_photo"
        preset="secondary"
        border-color="primary"
        @click="router.push({ name: 'love-timeline' })"
      >
        Upload Memories
      </VaButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '../../../stores/user-store'
import { computed } from 'vue'

const router = useRouter()
const store = useUserStore()

const titleStyle = computed(() => {
  return {
    color: store.preferences.theme === 'dark' ? '#f3f4f6' : '#111827',
  }
})

defineProps<{
  images: any[]
}>()
</script>
