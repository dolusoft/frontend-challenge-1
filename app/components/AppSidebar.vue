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
  </aside>
</template>
