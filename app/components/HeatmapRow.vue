<template>
  <div
    class="row"
    :class="{ 'row--has-selection': hasAnySelected }"
  >
    <!-- Group checkbox -->
    <button
      class="row-checkbox"
      :aria-label="`Select all chunks for ${hourLabel}`"
      @click="store.toggleHour(group.date.hour)"
    >
      <div
        class="check-box"
        :class="{
          'is-full':    isFull,
          'is-partial': isPartial && !isFull,
        }"
      >
        <svg v-if="isFull" viewBox="0 0 10 10" class="check-svg">
          <polyline points="2,5 4.5,7.5 8,2.5" />
        </svg>
        <span v-else-if="isPartial" class="dash" />
      </div>
    </button>

    <!-- Hour label -->
    <div class="hour-label">{{ hourLabel }}</div>

    <!-- 60-cell strip -->
    <div class="cells-grid" @mouseleave="hoveredBucket = null">
      <button
        v-for="bucket in group.buckets"
        :key="bucket.date.minute"
        class="cell"
        :class="{
          'is-selected': selectedMinutes.has(bucket.date.minute!),
          'is-empty': bucket.dataCount === 0,
        }"
        :style="{ backgroundColor: `var(--heat-${levelFor(bucket.dataCount)})` }"
        :aria-label="`${hourLabel}:${String(bucket.date.minute!).padStart(2, '0')}, ${bucket.dataCount.toLocaleString()} records`"
        :aria-pressed="selectedMinutes.has(bucket.date.minute!)"
        @mouseenter="showTooltip(bucket, $event)"
        @click="bucket.dataCount > 0 && store.toggleBucket(group.date.hour, bucket.date.minute!)"
      />
    </div>

    <!-- Row stats -->
    <div class="row-stats">
      <div class="stat">
        <span class="stat-val">{{ formatRecords(group.dataCount) }}</span>
        <span class="stat-label">records</span>
      </div>
      <div class="stat-sep" />
      <div class="stat">
        <span class="stat-val">{{ formatBytes(group.sizeOnDisk) }}</span>
        <span class="stat-label">size</span>
      </div>
      <div class="stat-sep" />
      <div class="stat">
        <span class="stat-val">{{ formatRatio(group.compressionRatio) }}</span>
        <span class="stat-label">ratio</span>
      </div>
    </div>

    <!-- Cell tooltip — teleported to <body> to avoid overflow/z-index issues.
         One instance per row (24 total), not per cell (1440). -->
    <Teleport to="body">
      <div
        v-if="hoveredBucket"
        class="chunk-tooltip"
        :style="{ top: `${tooltipY}px`, left: `${tooltipX}px` }"
      >
        <!-- Header: timestamp + selected badge -->
        <div class="ct-header">
          <span class="ct-time">
            {{ String(group.date.hour).padStart(2, '0') }}:{{ String(hoveredBucket.date.minute!).padStart(2, '0') }}
          </span>
          <span v-if="selectedMinutes.has(hoveredBucket.date.minute!)" class="ct-badge">
            Selected
          </span>
        </div>

        <div class="ct-divider" />

        <!-- Data rows -->
        <template v-if="hoveredBucket.dataCount > 0">
          <div class="ct-row">
            <span class="ct-key">Records</span>
            <span class="ct-val">{{ formatRecords(hoveredBucket.dataCount) }}</span>
          </div>
          <div class="ct-row">
            <span class="ct-key">Disk size</span>
            <span class="ct-val">{{ formatBytes(hoveredBucket.sizeOnDisk) }}</span>
          </div>
          <div class="ct-row">
            <span class="ct-key">Compressed</span>
            <span class="ct-val">{{ formatBytes(hoveredBucket.compressedBytes) }}</span>
          </div>
          <div class="ct-row">
            <span class="ct-key">Ratio</span>
            <span class="ct-val">{{ formatRatio(hoveredBucket.compressionRatio) }}</span>
          </div>
        </template>
        <p v-else class="ct-empty">No backup data</p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { ChunkGroup, Bucket } from '#shared/types'

const props = defineProps<{
  group: ChunkGroup
  minDataCount: number
  maxDataCount: number
}>()

const store = useChunksStore()

const hourLabel  = computed(() => `${props.group.date.hour}:00`)
const isFull     = computed(() => store.isHourFullySelected(props.group.date.hour))
const isPartial  = computed(() => store.isHourPartiallySelected(props.group.date.hour))
const hasAnySelected = computed(() => isFull.value || isPartial.value)

// Pre-compute selected minutes for this hour as a plain Set<number>.
// Avoids calling store.isBucketSelected() (string key lookup) twice per cell.
const selectedMinutes = computed<Set<number>>(() => {
  const hour   = props.group.date.hour
  const prefix = `${hour}:`
  const result = new Set<number>()
  for (const key of store.selectedKeys) {
    if (key.startsWith(prefix)) result.add(Number(key.slice(prefix.length)))
  }
  return result
})

function levelFor(dataCount: number): number {
  if (dataCount === 0) return 0
  const { minDataCount, maxDataCount } = props
  if (maxDataCount === minDataCount) return 8
  const level = Math.round(((dataCount - minDataCount) / (maxDataCount - minDataCount)) * 7) + 1
  return Math.min(8, Math.max(1, level))
}

// ── Tooltip ───────────────────────────────────────────────────
const hoveredBucket = ref<Bucket | null>(null)
const tooltipX      = ref(0)
const tooltipY      = ref(0)

function showTooltip(bucket: Bucket, event: MouseEvent) {
  hoveredBucket.value = bucket
  tooltipX.value = event.clientX
  tooltipY.value = event.clientY
}
</script>

<style scoped>
/* ── Row container ───────────────────────────────────────────── */
.row {
  display:     flex;
  align-items: center;
  gap:         10px;
  padding:     2px 4px;
  border-radius: 6px;
  transition:  background 100ms ease;
}

.row:hover {
  background: var(--panel-hover);
}

/* ── Checkbox ────────────────────────────────────────────────── */
.row-checkbox {
  flex-shrink: 0;
  display:     flex;
  align-items: center;
  justify-content: center;
  width:       16px;
  height:      16px;
  outline:     none;
}

.check-box {
  width:         14px;
  height:        14px;
  border-radius: 3px;
  border:        1.5px solid var(--panel-border);
  background:    transparent;
  display:       flex;
  align-items:   center;
  justify-content: center;
  transition:    border-color 120ms ease, background 120ms ease;
  flex-shrink:   0;
}

.row-checkbox:hover .check-box {
  border-color: rgba(52, 211, 153, 0.6);
}

.check-box.is-full {
  background:   rgb(16, 185, 129);
  border-color: rgb(16, 185, 129);
}

.check-box.is-partial {
  background:   rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.5);
}

.check-svg {
  width:  8px;
  height: 8px;
  stroke: white;
  stroke-width: 1.8;
  fill:   none;
  stroke-linecap:  round;
  stroke-linejoin: round;
}

.dash {
  display:       block;
  width:         6px;
  height:        1.5px;
  border-radius: 1px;
  background:    rgb(16, 185, 129);
}

/* ── Hour label ──────────────────────────────────────────────── */
.hour-label {
  flex-shrink:  0;
  width:        40px;
  text-align:   right;
  font-size:    11px;
  font-family:  ui-monospace, monospace;
  color:        var(--ui-text-muted);
  line-height:  1;
  user-select:  none;
}

/* ── Cell grid ───────────────────────────────────────────────── */
.cells-grid {
  flex:    1;
  display: grid;
  grid-template-columns: repeat(60, 1fr);
  gap:     2px;
}

.cell {
  height:        16px;
  border-radius: 2px;
  cursor:        pointer;
  outline:       none;
  border:        none;
  padding:       0;
  transition:    transform 80ms ease, box-shadow 80ms ease;
  position:      relative;
}

.cell:hover {
  transform: scaleY(1.3);
  z-index:   1;
}

.cell.is-empty {
  cursor: default;
}

.cell.is-selected {
  box-shadow: 0 0 0 2px rgb(16, 185, 129);
  z-index:    2;
}

/* ── Row stats ───────────────────────────────────────────────── */
.row-stats {
  flex-shrink:  0;
  display:      flex;
  align-items:  center;
  gap:          6px;
  width:        195px;
}

.stat {
  display:        flex;
  flex-direction: column;
  align-items:    flex-end;
  gap:            1px;
  flex:           1;
}

.stat-val {
  font-size:    11px;
  font-weight:  600;
  color:        var(--ui-text-highlighted);
  font-variant-numeric: tabular-nums;
  line-height:  1;
  white-space:  nowrap;
}

.stat-label {
  font-size:     9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color:         var(--ui-text-dimmed);
  line-height:   1;
}

.stat-sep {
  width:        1px;
  height:       20px;
  background:   var(--panel-divider);
  flex-shrink:  0;
}

/* ── Cell tooltip ────────────────────────────────────────────── */
.chunk-tooltip {
  position:       fixed;
  z-index:        9999;
  pointer-events: none;
  transform:      translate(-50%, calc(-100% - 10px));

  min-width:     160px;
  padding:       10px 12px;
  border-radius: 10px;
  background:    var(--panel);
  border:        1px solid var(--panel-border);
  box-shadow:    var(--panel-shadow);
}

.ct-header {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  gap:             8px;
  margin-bottom:   7px;
}

.ct-time {
  font-family: ui-monospace, monospace;
  font-size:   13px;
  font-weight: 700;
  color:       var(--ui-text-highlighted);
}

.ct-badge {
  font-size:     10px;
  font-weight:   600;
  padding:       2px 7px;
  border-radius: 999px;
  background:    rgba(16, 185, 129, 0.12);
  color:         rgb(16, 185, 129);
}

.ct-divider {
  height:        1px;
  background:    var(--panel-divider);
  margin-bottom: 7px;
}

.ct-row {
  display:         flex;
  justify-content: space-between;
  align-items:     center;
  gap:             20px;
  padding:         1.5px 0;
}

.ct-key {
  font-size: 11px;
  color:     var(--ui-text-muted);
}

.ct-val {
  font-size:            11px;
  font-weight:          600;
  font-variant-numeric: tabular-nums;
  color:                var(--ui-text-highlighted);
}

.ct-empty {
  font-size:  11px;
  color:      var(--ui-text-dimmed);
  text-align: center;
  padding:    2px 0;
}
</style>
