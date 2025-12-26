<template>
  <div class="pairing-container flex justify-center items-center h-screen bg-backgroundPrimary">
    <VaCard class="pairing-card p-5 text-center border border-backgroundBorder">
      <h1 class="display-5 mb-3 text-primary" :style="titleStyle">❤️ Pair with your Partner</h1>
      <p class="mb-4" :style="textStyle">To start your journey, you need to connect with your special someone.</p>

      <VaTabs v-model="activeTab" grow>
        <template #tabs>
          <VaTab name="send">Send Request</VaTab>
          <VaTab name="received">Received Requests</VaTab>
        </template>
      </VaTabs>

      <div v-if="activeTab === 'send'" class="p-4">
        <VaInput v-model="partnerUsername" label="Partner's Username" class="mb-3" />
        <VaButton :disabled="!partnerUsername" class="w-full" @click="sendRequest"> Send Love Request </VaButton>
      </div>

      <div v-if="activeTab === 'received'" class="p-4">
        <div v-if="requests.length === 0" class="text-gray-500">No pending requests.</div>
        <VaList v-else>
          <VaListItem v-for="req in requests" :key="req.id">
            <VaListItemSection avatar>
              <VaAvatar :src="req.Sender?.avatarUrl || undefined">
                {{ !req.Sender?.avatarUrl ? '👤' : '' }}
              </VaAvatar>
            </VaListItemSection>
            <VaListItemSection>
              <VaListItemLabel>{{ req.Sender?.displayName || req.Sender?.username }}</VaListItemLabel>
              <VaListItemLabel caption>wants to pair with you</VaListItemLabel>
            </VaListItemSection>
            <VaListItemSection side>
              <VaButton size="small" color="success" @click="acceptRequest(req.id)">Accept</VaButton>
            </VaListItemSection>
          </VaListItem>
        </VaList>
        <VaButton flat size="small" class="mt-2" @click="fetchRequests">Refresh</VaButton>
      </div>

      <div class="mt-4">
        <VaButton flat color="secondary" @click="logout">Logout</VaButton>
      </div>
    </VaCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../../stores/user-store'
import { useRouter } from 'vue-router'
import { useToast } from 'vuestic-ui'
import { pairingService } from '../../services/pairing.service'

const store = useUserStore()
const router = useRouter()
const { init } = useToast()

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

const activeTab = ref('send')
const partnerUsername = ref('')
const requests = ref<any[]>([])

const sendRequest = async () => {
  try {
    await pairingService.sendRequest(partnerUsername.value)
    init({ message: 'Request sent successfully!', color: 'success' })
    partnerUsername.value = ''
  } catch (e: any) {
    init({ message: e.message || 'Error sending request', color: 'danger' })
  }
}

const fetchRequests = async () => {
  try {
    const data = await pairingService.getRequests()
    requests.value = data
  } catch (e) {
    console.error(e)
  }
}

const acceptRequest = async (requestId: number) => {
  try {
    await pairingService.acceptRequest(requestId)
    init({ message: 'Connected! Redirecting...', color: 'success' })
    await store.checkAuth() // Refresh user to get partnerId
    router.push({ name: 'love-dashboard' })
  } catch (e) {
    init({ message: 'Failed to accept request', color: 'danger' })
  }
}

const logout = () => {
  store.logout()
  router.push({ name: 'login' })
}

onMounted(() => {
  fetchRequests()
})
</script>

<style scoped>
.pairing-card {
  width: 100%;
  max-width: 500px;
}
.bg-pink-50 {
  background-color: #fce7f3;
}
</style>
