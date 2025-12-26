<template>
  <div class="profile-dropdown-wrapper">
    <VaDropdown v-model="isShown" :offset="[9, 0]" class="profile-dropdown" stick-to-edges>
      <template #anchor>
        <VaButton preset="secondary" color="textPrimary">
          <span class="profile-dropdown__anchor min-w-max flex items-center">
            <slot />
            <VaAvatar :key="store.pfp" :size="32" color="warning" :src="store.pfp || undefined" class="ml-2">
              <span v-if="!store.pfp">👤</span>
            </VaAvatar>
          </span>
        </VaButton>
      </template>
      <VaDropdownContent
        class="profile-dropdown__content md:w-60 px-0 py-4 w-full"
        :style="{ '--hover-color': hoverColor }"
      >
        <VaList>
          <VaListItem class="menu-item px-4 text-base cursor-pointer h-8" @click="goToProfile">
            <VaIcon name="account_circle" class="pr-1" color="secondary" />
            Profile
          </VaListItem>
          <VaListSeparator class="mx-3 my-2" />
          <VaListItem class="menu-item px-4 text-base cursor-pointer h-8" @click="handleLogout">
            <VaIcon name="logout" class="pr-1" color="secondary" />
            Logout
          </VaListItem>
        </VaList>
      </VaDropdownContent>
    </VaDropdown>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useColors } from 'vuestic-ui'
import { useUserStore } from '../../../../stores/user-store'
import { useRouter } from 'vue-router'

const { colors, setHSLAColor } = useColors()
const hoverColor = computed(() => setHSLAColor(colors.focus, { a: 0.1 }))
const store = useUserStore()
const router = useRouter()

const isShown = ref(false)

const goToProfile = () => {
  isShown.value = false
  router.push({ name: 'love-profile' })
}

const handleLogout = () => {
  isShown.value = false
  store.logout()
  router.push({ name: 'login' })
}
</script>

<style lang="scss">
.profile-dropdown {
  cursor: pointer;

  &__content {
    .menu-item:hover {
      background: var(--hover-color);
    }
  }

  &__anchor {
    display: inline-block;
  }
}
</style>
