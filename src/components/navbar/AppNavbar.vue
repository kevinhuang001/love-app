<template>
  <VaNavbar class="app-layout-navbar py-2 px-0">
    <template #left>
      <div class="left">
        <Transition v-if="isMobile" name="icon-fade" mode="out-in">
          <VaIcon
            color="primary"
            :name="isSidebarMinimized ? 'menu' : 'close'"
            size="24px"
            style="margin-top: 3px"
            @click="isSidebarMinimized = !isSidebarMinimized"
          />
        </Transition>
        <RouterLink to="/" aria-label="Visit home page" class="flex items-center gap-1 sm:gap-2 overflow-hidden">
          <span class="app-navbar__emoji flex-shrink-0">{{ userStore.preferences.appEmoji }}</span>
          <span class="app-navbar__title font-bold text-primary truncate sm:whitespace-nowrap">{{
            userStore.preferences.appName
          }}</span>
        </RouterLink>
      </div>
    </template>
    <template #right>
      <AppNavbarActions class="app-navbar__actions" :is-mobile="isMobile" />
    </template>
  </VaNavbar>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGlobalStore } from '../../stores/global-store'
import { useUserStore } from '../../stores/user-store'
import AppNavbarActions from './components/AppNavbarActions.vue'

defineProps({
  isMobile: { type: Boolean, default: false },
})

const GlobalStore = useGlobalStore()
const userStore = useUserStore()

const { isSidebarMinimized } = storeToRefs(GlobalStore)
</script>

<style lang="scss" scoped>
.va-navbar {
  z-index: 2;

  @media screen and (max-width: 950px) {
    .left {
      width: 100%;
    }

    .app-navbar__actions {
      display: flex;
      justify-content: space-between;
    }
  }
}

.left {
  display: flex;
  align-items: center;
  margin-left: 1rem;
  min-width: 0; // Allow content to shrink
  flex: 1;
  overflow: hidden;

  @media screen and (max-width: 600px) {
    margin-left: 0.5rem;

    & > * {
      margin-right: 0.4rem;
    }
  }

  & > * {
    margin-right: 1rem;
  }

  & > *:last-child {
    margin-right: 0;
  }
}

.app-navbar__logo {
  transition: all 0.3s ease;
}

.app-navbar__emoji {
  font-size: clamp(1.1rem, 4.5vw, 1.75rem);
  line-height: 1;
  user-select: none;
}

.app-navbar__title {
  font-size: clamp(0.75rem, 3.5vw, 1.25rem);
  max-width: clamp(80px, 45vw, 400px);
  transition: all 0.3s ease;
}

.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: transform 0.5s ease;
}

.icon-fade-enter,
.icon-fade-leave-to {
  transform: scale(0.5);
}
</style>
