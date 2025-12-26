<template>
  <div class="app-navbar-actions">
    <VaButton
      preset="secondary"
      color="primary"
      href="https://github.com/kevinhuang001/love-app"
      target="_blank"
      class="app-navbar-actions__item"
      icon="fa-github"
    />
    <VaButton
      preset="secondary"
      color="primary"
      class="app-navbar-actions__item"
      :icon="store.preferences.theme === 'dark' ? 'light_mode' : 'dark_mode'"
      @click="toggleTheme"
    />
    <ProfileDropdown class="app-navbar-actions__item app-navbar-actions__item--profile mr-1" />
  </div>
</template>

<script lang="ts" setup>
import ProfileDropdown from './dropdowns/ProfileDropdown.vue'
import { useUserStore } from '../../../stores/user-store'

const store = useUserStore()

defineProps({
  isMobile: { type: Boolean, default: false },
})

const toggleTheme = () => {
  const newTheme = store.preferences.theme === 'dark' ? 'light' : 'dark'
  store.updatePreferences({ theme: newTheme })
}
</script>

<style lang="scss">
.app-navbar-actions {
  display: flex;
  align-items: center;

  .va-dropdown__anchor {
    color: var(--va-primary);
    fill: var(--va-primary);
  }

  &__item {
    padding: 0;
    margin-left: 0.25rem;
    margin-right: 0.25rem;

    svg {
      height: 20px;
    }

    &--profile {
      display: flex;
      justify-content: center;
    }

    .va-dropdown-content {
      background-color: var(--va-white);
    }

    @media screen and (max-width: 640px) {
      margin-left: 0;
      margin-right: 0;

      &:first-of-type {
        margin-left: 0;
      }
    }
  }
}
</style>
