<template>
  <div class="px-1 flex flex-col gap-4">

    <!-- ── Loading ─────────────────────────────────────────────── -->
    <div v-if="store.loading" class="flex items-center justify-center py-24">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-muted animate-spin" />
    </div>

    <!-- ── Error ───────────────────────────────────────────────── -->
    <div v-else-if="store.error" class="py-12 text-center text-sm text-red-500">
      {{ store.error }}
    </div>

    <!-- ── Dashboard panel ─────────────────────────────────────── -->
    <div
      v-else-if="store.data"
      class="bg-panel rounded-2xl border border-panel-border overflow-hidden [box-shadow:var(--panel-shadow)]"
    >
      <!-- Toolbar -->
      <div class="flex items-center justify-between px-6 py-3 border-b border-panel-divider">

        <!-- Left: Select All + Clear -->
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 group"
            @click="store.toggleSelectAll()"
          >
            <!-- Custom checkbox indicator -->
            <div
              class="select-toggle"
              :class="{
                'is-full':    store.isAllSelected,
                'is-partial': !store.isAllSelected && store.selectedCount > 0,
              }"
            >
              <svg v-if="store.isAllSelected" viewBox="0 0 10 10" class="check-svg">
                <polyline points="2,5 4.5,7.5 8,2.5" />
              </svg>
              <span v-else-if="store.selectedCount > 0" class="dash" />
            </div>
            <span class="text-xs font-medium text-muted group-hover:text-highlighted transition-colors">
              Select All
            </span>
            <span v-if="store.selectedCount > 0" class="text-xs text-dimmed">
              ({{ store.selectedCount.toLocaleString() }})
            </span>
          </button>

          <button
            v-if="store.selectedCount > 0"
            class="flex items-center gap-1 text-xs text-dimmed hover:text-highlighted transition-colors"
            @click="store.clearSelection()"
          >
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        <!-- Action buttons (visible when selection active) -->
        <div v-if="store.selectedCount > 0" class="flex items-center gap-2">
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            @click="downloadOpen = true"
          >
            Download ({{ store.selectedCount }})
          </UButton>
          <UButton
            size="xs"
            variant="soft"
            color="error"
            @click="deleteOpen = true"
          >
            Delete ({{ store.selectedCount }})
          </UButton>
        </div>
      </div>

      <!-- Heatmap grid -->
      <div class="px-6 py-5">
        <HeatmapGrid />
      </div>

      <!-- Footer statistics -->
      <FooterStats />
    </div>

    <!-- Modals -->
    <DownloadModal v-model:open="downloadOpen" />
    <DeleteModal   v-model:open="deleteOpen" />

  </div>
</template>

<script setup lang="ts">
const store        = useChunksStore()
const downloadOpen = ref(false)
const deleteOpen   = ref(false)

onMounted(() => store.fetchChunks())
</script>

<style scoped>
/* ── Toolbar Select-All toggle ───────────────────────────────── */
.select-toggle {
  width:         15px;
  height:        15px;
  border-radius: 3px;
  border:        1.5px solid var(--panel-border);
  background:    transparent;
  display:       flex;
  align-items:   center;
  justify-content: center;
  transition:    border-color 120ms ease, background 120ms ease;
  flex-shrink:   0;
}

button:hover .select-toggle {
  border-color: rgba(52, 211, 153, 0.6);
}

.select-toggle.is-full {
  background:   rgb(16, 185, 129);
  border-color: rgb(16, 185, 129);
}

.select-toggle.is-partial {
  background:   rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.5);
}

.check-svg {
  width:  9px;
  height: 9px;
  stroke: white;
  stroke-width: 1.8;
  fill:   none;
  stroke-linecap:  round;
  stroke-linejoin: round;
}

.dash {
  display:       block;
  width:         7px;
  height:        1.5px;
  border-radius: 1px;
  background:    rgb(16, 185, 129);
}
</style>
