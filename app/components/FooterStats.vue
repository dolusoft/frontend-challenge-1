<template>
  <div class="footer-stats">
    <!-- Left: summary stats -->
    <div class="stats-group">
      <div v-for="stat in stats" :key="stat.label" class="stat-item">
        <span class="stat-label">{{ stat.label }}</span>
        <span class="stat-value">{{ stat.value }}</span>
      </div>
    </div>

    <!-- Right: color scale legend -->
    <div class="scale-legend">
      <span class="scale-metric">Records / chunk</span>
      <span class="scale-label">Less</span>
      <div class="scale-swatches">
        <div
          v-for="level in 8"
          :key="level"
          class="swatch"
          :style="{ backgroundColor: `var(--heat-${level})` }"
        />
      </div>
      <span class="scale-label">More</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useChunksStore()

const stats = computed(() => {
  const d = store.data
  if (!d) return []
  return [
    { label: 'Total Records',  value: formatRecords(d.dataCount) },
    { label: 'Total Chunks',   value: d.dataChunkCount.toLocaleString() },
    { label: 'Size On Disk',   value: formatBytes(d.sizeOnDisk) },
    { label: 'Compression',    value: formatRatio(d.compressionRatio) },
  ]
})
</script>

<style scoped>
.footer-stats {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  padding:         14px 24px;
  border-top:      1px solid var(--panel-divider);
  gap:             16px;
}

.stats-group {
  display: flex;
  align-items: center;
  gap: 32px;
}

.stat-item {
  display:        flex;
  flex-direction: column;
  gap:            3px;
}

.stat-label {
  font-size:   10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color:       var(--ui-text-dimmed);
}

.stat-value {
  font-size:   15px;
  font-weight: 600;
  color:       var(--ui-text-highlighted);
  font-variant-numeric: tabular-nums;
}

.scale-legend {
  display:     flex;
  align-items: center;
  gap:         8px;
}

.scale-metric {
  font-size:   10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color:       var(--ui-text-dimmed);
  margin-right: 4px;
}

.scale-label {
  font-size:  11px;
  color:      var(--ui-text-dimmed);
}

.scale-swatches {
  display: flex;
  gap:     2px;
}

.swatch {
  width:         14px;
  height:        14px;
  border-radius: 3px;
}
</style>
