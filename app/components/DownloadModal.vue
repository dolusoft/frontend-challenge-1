<template>
  <UModal
    v-model:open="open"
    title="Download Chunks"
    :description="`Generating signed URLs for ${store.selectedCount} selected chunk${store.selectedCount !== 1 ? 's' : ''}`"
    :ui="{ body: 'max-h-[440px] overflow-y-auto' }"
  >
    <template #body>
      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-3 py-10">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-muted animate-spin" />
        <p class="text-xs text-muted">Generating download URLs…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-xl bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-900 p-4">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- File list -->
      <div v-else-if="files.length" class="space-y-1.5">
        <div
          v-for="file in files"
          :key="file.fileId"
          class="flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl bg-panel-divider"
        >
          <div class="min-w-0">
            <p class="text-xs font-mono font-medium text-highlighted truncate">
              {{ file.fileName }}
            </p>
            <p class="text-[11px] text-dimmed mt-0.5">
              {{ formatBytes(file.fileSize) }}
              &nbsp;·&nbsp;
              Expires {{ new Date(file.expirationDate).toLocaleDateString() }}
            </p>
          </div>
          <a :href="file.downloadUrl" target="_blank" rel="noopener noreferrer" class="flex-shrink-0">
            <UButton size="xs" variant="soft" color="neutral" icon="i-heroicons-arrow-down-tray">
              Download
            </UButton>
          </a>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex items-center justify-between w-full">
        <p v-if="files.length" class="text-xs text-muted">
          {{ files.length }} file{{ files.length !== 1 ? 's' : '' }} ready
        </p>
        <div v-else />
        <UButton variant="ghost" color="neutral" size="sm" @click="close">
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { DownloadFile } from '#shared/types'

const open  = defineModel<boolean>('open', { required: true })
const store = useChunksStore()

const loading = ref(false)
const error   = ref<string | null>(null)
const files   = ref<DownloadFile[]>([])

watch(open, async (isOpen) => {
  if (!isOpen) {
    // reset on close
    files.value   = []
    error.value   = null
    loading.value = false
    return
  }
  loading.value = true
  error.value   = null
  try {
    files.value = await store.fetchDownloadUrls()
  } catch {
    error.value = 'Failed to generate download URLs. Please try again.'
  } finally {
    loading.value = false
  }
})
</script>
