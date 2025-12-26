<template>
  <div class="theme-picker space-y-6">
    <!-- Pattern Selection -->
    <div v-if="showPatterns">
      <h4 v-if="patternLabel" class="text-md font-bold mb-3 flex items-center gap-2" :style="textStyle">
        <VaIcon name="grid_view" size="small" />
        {{ patternLabel }}
      </h4>
      <div class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
        <div
          v-for="pattern in BACKGROUND_PATTERNS"
          :key="pattern.name"
          class="h-12 rounded-lg cursor-pointer border-2 transition-all duration-200 hover:scale-110 hover:shadow-md"
          :class="[
            pattern.class,
            modelValue === pattern.name
              ? 'border-primary ring-2 ring-primary/20'
              : isDark
                ? 'border-slate-700'
                : 'border-gray-100',
          ]"
          :title="pattern.name"
          @click="$emit('update:modelValue', pattern.name)"
        ></div>
      </div>
    </div>

    <!-- Color Selection -->
    <div v-if="showColors">
      <h4 v-if="colorLabel" class="text-md font-bold mb-3 flex items-center gap-2" :style="textStyle">
        <VaIcon name="style" size="small" />
        {{ colorLabel }}
      </h4>
      <div class="grid grid-cols-7 sm:grid-cols-10 gap-2">
        <div
          v-for="color in PRESET_COLORS"
          :key="color"
          class="w-8 h-8 rounded-full cursor-pointer transition-all duration-200 hover:scale-125 border-2 shadow-sm"
          :class="
            colorValue === color
              ? 'border-primary scale-125 z-10 shadow-md ring-2 ring-primary/20'
              : 'opacity-90 hover:opacity-100'
          "
          :style="{
            backgroundColor: color,
            borderColor: colorValue === color ? '' : isDark ? 'rgba(255,255,255,0.1)' : 'white',
          }"
          :title="color"
          @click="$emit('update:colorValue', color)"
        ></div>
      </div>
      <div
        class="mt-4 flex items-center gap-4 p-3 rounded-lg border transition-colors duration-200"
        :style="{
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
        }"
      >
        <span class="text-sm font-medium" :style="secondaryTextStyle">Custom Color:</span>
        <VaColorInput :model-value="colorValue" @update:modelValue="$emit('update:colorValue', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BACKGROUND_PATTERNS, PRESET_COLORS } from '../services/constants'
import { useTheme } from '../composables/useTheme'

const { isDark, themeColors, textStyle, secondaryTextStyle } = useTheme()

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  colorValue: {
    type: String,
    default: '',
  },
  showPatterns: {
    type: Boolean,
    default: true,
  },
  showColors: {
    type: Boolean,
    default: true,
  },
  patternLabel: {
    type: String,
    default: 'Background Pattern',
  },
  colorLabel: {
    type: String,
    default: 'Color',
  },
})

defineEmits(['update:modelValue', 'update:colorValue'])
</script>

<style scoped>
.theme-picker {
  max-width: 100%;
}
</style>
