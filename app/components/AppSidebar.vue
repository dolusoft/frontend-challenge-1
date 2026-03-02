<template>
  <aside
    class="fixed top-[76px] left-4 bottom-6 w-[260px] z-30 flex flex-col overflow-hidden
           bg-panel rounded-3xl
           border border-panel-border/100
           [box-shadow:var(--sidebar-shadow)]"
  >
    <!-- Brand -->
    <div class="px-5 pt-5 pb-4">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0
                 bg-gradient-to-br from-emerald-400 to-emerald-600
                 shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
        >
          <UIcon name="i-heroicons-shield-check-solid" class="w-[18px] h-[18px] text-white" />
        </div>
        <div class="leading-none">
          <p class="text-sm font-semibold text-highlighted tracking-tight">
            ChunkGuard
          </p>
          <p class="text-[11px] text-dimmed mt-0.5">
            Backup Integrity
          </p>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="h-px mx-4 bg-panel-divider" />

    <!-- Nav label -->
    <div class="px-5 pt-4 pb-1.5">
      <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-dimmed">
        Navigation
      </p>
    </div>

    <!-- Nav items -->
    <nav class="flex-1 px-3">
      <NuxtLink v-slot="{ isActive }" to="/" custom>
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none"
          :class="
            isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'text-muted hover:bg-panel-hover hover:text-highlighted'
          "
        >
          <UIcon
            name="i-heroicons-squares-2x2"
            class="w-[18px] h-[18px] flex-shrink-0"
            :class="isActive ? 'text-emerald-600' : 'text-dimmed'"
          />
          <span class="flex-1 text-left">Dashboard</span>
          <span
            v-if="isActive"
            class="w-1.5 h-1.5 rounded-full bg-emerald-500"
          />
        </button>
      </NuxtLink>
    </nav>

    <!-- Divider -->
    <div class="h-px mx-4 bg-panel-divider" />

    <!-- How it works -->
    <div class="px-4 py-4 space-y-2.5">
      <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-dimmed">
        How it works
      </p>
      <div class="flex items-start gap-2">
        <UIcon name="i-heroicons-table-cells" class="w-3.5 h-3.5 text-dimmed flex-shrink-0 mt-px" />
        <p class="text-[11px] text-muted leading-relaxed">
          Each cell is one backup chunk (1-minute slot). 24 h × 60 min = 1,440 chunks per day.
        </p>
      </div>
      <div class="flex items-start gap-2">
        <UIcon name="i-heroicons-cursor-arrow-ripple" class="w-3.5 h-3.5 text-dimmed flex-shrink-0 mt-px" />
        <p class="text-[11px] text-muted leading-relaxed">
          Click a cell or a row checkbox to select chunks, then download or delete from the toolbar.
        </p>
      </div>
    </div>
  </aside>
</template>
