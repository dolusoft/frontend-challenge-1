<template>
  <UModal
    v-model:open="open"
    title="Delete Chunks"
    :ui="{ body: 'max-h-[520px] overflow-y-auto' }"
  >
    <template #body>
      <!-- Result state (after deletion) -->
      <div v-if="result">
        <div
          class="flex items-start gap-3 rounded-xl p-4"
          :class="result.status === 'completed'
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'"
        >
          <UIcon
            :name="result.status === 'completed' ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            :class="result.status === 'completed' ? 'text-emerald-600' : 'text-red-600'"
          />
          <div>
            <p
              class="text-sm font-medium"
              :class="result.status === 'completed' ? 'text-emerald-700' : 'text-red-700'"
            >
              {{ result.status === 'completed' ? 'Deletion successful' : 'Deletion failed' }}
            </p>
            <p class="text-xs mt-1 text-muted">{{ result.additionalInfo }}</p>
          </div>
        </div>
      </div>

      <!-- Confirmation state -->
      <div v-else class="space-y-4">
        <!-- Warning banner -->
        <div class="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-semibold text-red-700">This action is irreversible</p>
            <p class="text-xs text-red-600/80 mt-1 leading-relaxed">
              The selected chunks will be permanently deleted and cannot be recovered.
            </p>
          </div>
        </div>

        <!-- Summary stats -->
        <div class="grid grid-cols-3 gap-2">
          <div class="rounded-xl bg-panel-divider p-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.07em] text-dimmed mb-1.5">Chunks</p>
            <p class="text-xl font-bold text-highlighted tabular-nums">
              {{ store.selectedSummary.count.toLocaleString() }}
            </p>
          </div>
          <div class="rounded-xl bg-panel-divider p-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.07em] text-dimmed mb-1.5">Total Size</p>
            <p class="text-xl font-bold text-highlighted">
              {{ formatBytes(store.selectedSummary.size) }}
            </p>
          </div>
          <div class="rounded-xl bg-panel-divider p-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.07em] text-dimmed mb-1.5">Records</p>
            <p class="text-xl font-bold text-highlighted">
              {{ formatRecords(store.selectedSummary.records) }}
            </p>
          </div>
        </div>

        <!-- File list -->
        <div class="max-h-36 overflow-y-auto rounded-xl border border-panel-border divide-y divide-panel-divider">
          <div
            v-for="file in selectedFiles"
            :key="file.fileName"
            class="flex items-center justify-between px-3 py-2"
          >
            <span class="font-mono text-xs text-muted">{{ file.fileName }}</span>
            <span class="text-xs text-dimmed ml-4 shrink-0">{{ formatBytes(file.size) }}</span>
          </div>
        </div>

        <!-- Confirmation checkbox -->
        <label
          class="flex items-start gap-3 p-3.5 rounded-xl border border-panel-border cursor-pointer hover:border-red-300 transition-colors"
          for="confirm-delete"
        >
          <input
            id="confirm-delete"
            v-model="confirmed"
            type="checkbox"
            class="mt-0.5 w-4 h-4 rounded accent-red-500 cursor-pointer"
          />
          <span class="text-xs text-muted leading-relaxed select-none">
            I understand this action cannot be undone. The selected
            <strong class="text-highlighted">{{ store.selectedSummary.count.toLocaleString() }} chunks</strong>
            will be permanently deleted.
          </span>
        </label>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex items-center justify-between w-full">
        <!-- Left: cancel/close -->
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          @click="close"
        >
          {{ result ? 'Close' : 'Cancel' }}
        </UButton>

        <!-- Right: delete action (hidden after result) -->
        <UButton
          v-if="!result"
          color="error"
          size="sm"
          :disabled="!confirmed || loading"
          :loading="loading"
          @click="handleDelete"
        >
          Delete {{ store.selectedSummary.count.toLocaleString() }} chunks
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { DeleteResult } from '#shared/types'

const open  = defineModel<boolean>('open', { required: true })
const store = useChunksStore()

const confirmed = ref(false)
const loading   = ref(false)
const result    = ref<DeleteResult | null>(null)

const selectedFiles = computed(() => {
  if (!store.data) return []
  const pad = (n: number) => String(n).padStart(2, '0')
  return store.selectedDates.map(date => {
    const group = store.data!.groups.find(g => g.date.hour === date.hour)
    const bucket = group?.buckets.find(b => b.date.minute === date.minute)
    const fileName = `chunk_${date.year}_${pad(date.month)}_${pad(date.day)}_${pad(date.hour)}_${pad(date.minute!)}.dat`
    return { fileName, size: bucket?.sizeOnDisk ?? 0 }
  })
})

watch(open, (isOpen) => {
  if (!isOpen) {
    confirmed.value = false
    loading.value   = false
    result.value    = null
  }
})

async function handleDelete() {
  if (!confirmed.value) return
  loading.value = true
  try {
    result.value = await store.deleteSelected()
  } catch {
    result.value = {
      processedFileIds: [],
      failedFileIds:    [],
      status:           'failed',
      additionalInfo:   'An unexpected error occurred. Please try again.',
    }
  } finally {
    loading.value = false
  }
}

</script>
