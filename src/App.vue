<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useUserStore } from './stores/user-store'
import { onMounted, watch } from 'vue'
import { useColors } from 'vuestic-ui'

const store = useUserStore()
const { applyPreset } = useColors()

const applyTheme = (theme: string) => {
  applyPreset(theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

onMounted(() => {
  document.title = store.preferences.appName
  applyTheme(store.preferences.theme)
})

watch(
  () => store.preferences.theme,
  (newTheme) => {
    applyTheme(newTheme)
  },
)
</script>

<style lang="scss">
#app {
  font-family: 'Inter', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 20rem;
}
</style>
