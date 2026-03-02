<template>
  <div class="px-1 flex flex-col gap-4">

    <!-- ── Skeleton ────────────────────────────────────────────── -->
    <div
      v-if="store.loading"
      class="bg-panel rounded-2xl border border-panel-border overflow-hidden [box-shadow:var(--panel-shadow)]"
    >
      <!-- Toolbar -->
      <div class="flex items-center px-6 py-3 border-b border-panel-divider gap-2">
        <USkeleton class="w-[15px] h-[15px] rounded-sm flex-shrink-0" />
        <USkeleton class="w-[72px] h-3 rounded-full" />
      </div>

      <!-- Grid -->
      <div class="px-6 py-5">
        <!-- Minute axis row -->
        <div class="flex items-center gap-[10px] px-1 mb-1.5">
          <div class="w-[66px] flex-shrink-0" />
          <USkeleton class="flex-1 h-[10px] rounded-full" />
          <div class="w-[195px] flex-shrink-0" />
        </div>

        <!-- 24 hour rows -->
        <div class="flex flex-col gap-[2px]">
          <div
            v-for="i in 24"
            :key="i"
            class="flex items-center gap-[10px] px-1 py-[2px]"
          >
            <USkeleton class="w-4 h-4 rounded-sm flex-shrink-0" />
            <USkeleton class="w-[40px] h-[11px] rounded-full flex-shrink-0" />
            <USkeleton class="flex-1 h-4 rounded" />
            <USkeleton class="w-[195px] h-[11px] rounded-full flex-shrink-0" />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-[14px] border-t border-panel-divider">
        <div class="flex items-center gap-8">
          <div v-for="i in 4" :key="i" class="flex flex-col gap-[3px]">
            <USkeleton class="w-16 h-[10px] rounded-full" />
            <USkeleton class="w-12 h-[15px] rounded" />
          </div>
        </div>
        <USkeleton class="w-[148px] h-4 rounded" />
      </div>
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
      <!-- Panel header -->
      <div class="flex items-center justify-between px-6 pt-4 pb-3.5 border-b border-panel-divider">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold text-highlighted tracking-tight">
              Daily Backup Chunks
            </h2>
            <span class="text-[11px] font-medium text-dimmed bg-panel-divider rounded-full px-2 py-0.5">
              {{ dataDate }}
            </span>
          </div>
          <p class="text-xs text-muted mt-0.5">
            24 h × 60 min grid — darker cells mean more records backed up in that minute
          </p>
        </div>
        <UTooltip
          text="Select chunks using cells or row checkboxes, then use the toolbar to download or permanently delete them."
          :ui="{ content: 'max-w-[220px] text-center' }"
        >
          <UButton
            icon="i-heroicons-information-circle"
            variant="ghost"
            color="neutral"
            size="xs"
          />
        </UTooltip>
      </div>

      <!-- Toolbar -->
      <div class="flex items-center justify-between px-6 py-3 border-b border-panel-divider">

        <!-- Left: Select All + Clear -->
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 group"
            :disabled="store.isSelecting"
            @click="store.toggleSelectAll()"
          >
            <!-- Spinner while bulk-selecting -->
            <UIcon
              v-if="store.isSelecting"
              name="i-heroicons-arrow-path"
              class="w-[15px] h-[15px] text-muted animate-spin flex-shrink-0"
            />
            <!-- Normal checkbox indicator -->
            <div
              v-else
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
            <span v-if="store.selectedCount > 0 && !store.isSelecting" class="text-xs text-dimmed">
              ({{ store.selectedCount.toLocaleString() }})
            </span>
          </button>

          <button
            v-if="store.selectedCount > 0"
            class="flex items-center gap-1 text-xs text-dimmed hover:text-highlighted transition-colors disabled:pointer-events-none disabled:opacity-40"
            :disabled="store.isSelecting"
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
            :disabled="store.isSelecting"
            @click="downloadOpen = true"
          >
            Download ({{ store.selectedCount }})
          </UButton>
          <UButton
            size="xs"
            variant="soft"
            color="error"
            :disabled="store.isSelecting"
            @click="deleteOpen = true"
          >
            Delete ({{ store.selectedCount }})
          </UButton>
        </div>
      </div>

      <!-- Heatmap grid — overlay while bulk-selecting -->
      <div class="relative px-6 py-5">
        <HeatmapGrid :class="{ 'opacity-40 pointer-events-none': store.isSelecting }" />
        <Transition name="fade">
          <div
            v-if="store.isSelecting"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-panel border border-panel-border [box-shadow:var(--panel-shadow)]">
              <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 text-muted animate-spin" />
              <span class="text-xs text-muted">Updating…</span>
            </div>
          </div>
        </Transition>
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

const dataDate = computed(() => {
  if (!store.data?.groups.length) return ''
  const { year, month, day } = store.data.groups[0].date
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
})

onMounted(() => store.fetchChunks())
</script>

<style scoped>
/* ── Loading overlay transition ──────────────────────────────── */
.fade-enter-active,
.fade-leave-active { transition: opacity 120ms ease; }
.fade-enter-from,
.fade-leave-to      { opacity: 0; }

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
