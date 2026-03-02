<template>
  <header
    class="sticky top-0 z-40 flex items-center h-14 px-6
           bg-panel
           border-b border-panel-border
           [box-shadow:var(--navbar-shadow)]"
  >
    <h1 class="text-sm font-semibold text-highlighted tracking-tight">
      Dashboard
    </h1>
    <UButton
      class="ml-auto"
      variant="ghost"
      color="neutral"
      size="sm"
      :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleDark"
    />
  </header>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
