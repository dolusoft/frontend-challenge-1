<template>
  <div class="heatmap-grid select-none">

    <!-- ── Minute axis header ──────────────────────────────────── -->
    <div class="axis-row">
      <!-- Aligns with: checkbox (16px) + gap (10px) + label (40px) + gap (10px) -->
      <div class="axis-prefix" />

      <div class="axis-marks">
        <span
          v-for="mark in minuteMarks"
          :key="mark"
          class="axis-mark"
          :style="{ left: `${(mark / 60) * 100}%` }"
        >
          :{{ String(mark).padStart(2, '0') }}
        </span>
      </div>

      <!-- Aligns with stats column -->
      <div class="axis-stats-spacer" />
    </div>

    <!-- ── Hour rows ───────────────────────────────────────────── -->
    <div class="rows-container">
      <HeatmapRow
        v-for="group in store.data!.groups"
        :key="group.date.hour"
        :group="group"
        :min-data-count="store.data!.minDataCount"
        :max-data-count="store.data!.maxDataCount"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
const store = useChunksStore()

const minuteMarks = [0, 10, 20, 30, 40, 50]
</script>

<style scoped>
/* ── Axis header ─────────────────────────────────────────────── */
.axis-row {
  display:     flex;
  align-items: center;
  gap:         10px;
  padding:     0 4px;
  margin-bottom: 8px;
}

/* checkbox (16) + gap (10) + label (40) = 66px */
.axis-prefix {
  flex-shrink: 0;
  width: 66px;
}

.axis-marks {
  flex:     1;
  position: relative;
  height:   14px;
}

.axis-mark {
  position:    absolute;
  transform:   translateX(-50%);
  font-size:   9px;
  font-family: ui-monospace, monospace;
  color:       var(--ui-text-dimmed);
  line-height: 1;
  top:         50%;
  margin-top:  -5px;
  user-select: none;
}

/* stats spacer: width matches .row-stats in HeatmapRow */
.axis-stats-spacer {
  flex-shrink: 0;
  width: 195px;
}

/* ── Rows ────────────────────────────────────────────────────── */
.rows-container {
  display:        flex;
  flex-direction: column;
  gap:            4px;
}
</style>
