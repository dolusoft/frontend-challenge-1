import { defineStore } from 'pinia'
import type { SignedFilesResponse, DownloadFile, DeleteResult } from '#shared/types'

export const useChunksStore = defineStore('chunks', () => {
  // ── State ──────────────────────────────────────────────────────
  const data    = ref<SignedFilesResponse | null>(null)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  /** "hour:minute" keys for selected buckets */
  const selectedKeys = ref<Set<string>>(new Set())

  // ── Getters ────────────────────────────────────────────────────
  const selectedCount = computed(() => selectedKeys.value.size)

  const isAllSelected = computed(() => {
    if (!data.value || selectedKeys.value.size === 0) return false
    return selectedKeys.value.size === data.value.dataChunkCount
  })

  const selectedDates = computed(() => {
    if (!data.value) return []
    const result = []
    for (const group of data.value.groups) {
      for (const bucket of group.buckets) {
        if (selectedKeys.value.has(bucketKey(group.date.hour, bucket.date.minute!))) {
          result.push(bucket.date)
        }
      }
    }
    return result
  })

  const selectedSummary = computed(() => {
    if (!data.value) return { count: 0, size: 0, records: 0 }
    let size = 0, records = 0, count = 0
    for (const group of data.value.groups) {
      for (const bucket of group.buckets) {
        if (selectedKeys.value.has(bucketKey(group.date.hour, bucket.date.minute!))) {
          size    += bucket.sizeOnDisk
          records += bucket.dataCount
          count++
        }
      }
    }
    return { count, size, records }
  })

  // ── Actions ────────────────────────────────────────────────────
  async function fetchChunks() {
    if (data.value) return
    loading.value = true
    error.value   = null
    try {
      data.value = await $fetch<SignedFilesResponse>('/api/chunks')
    } catch {
      error.value = 'Failed to load chunk data.'
    } finally {
      loading.value = false
    }
  }

  function toggleBucket(hour: number, minute: number) {
    const key = bucketKey(hour, minute)
    if (selectedKeys.value.has(key)) selectedKeys.value.delete(key)
    else selectedKeys.value.add(key)
  }

  function toggleHour(hour: number) {
    if (!data.value) return
    const group = data.value.groups.find(g => g.date.hour === hour)
    if (!group) return
    const nonEmpty = group.buckets.filter(b => b.dataCount > 0)
    const allSelected = nonEmpty.every(b =>
      selectedKeys.value.has(bucketKey(hour, b.date.minute!))
    )
    for (const bucket of nonEmpty) {
      const key = bucketKey(hour, bucket.date.minute!)
      allSelected ? selectedKeys.value.delete(key) : selectedKeys.value.add(key)
    }
  }

  function toggleSelectAll() {
    if (!data.value) return
    if (isAllSelected.value) {
      selectedKeys.value.clear()
    } else {
      for (const group of data.value.groups)
        for (const bucket of group.buckets)
          if (bucket.dataCount > 0)
            selectedKeys.value.add(bucketKey(group.date.hour, bucket.date.minute!))
    }
  }

  function clearSelection() {
    selectedKeys.value.clear()
  }

  function isBucketSelected(hour: number, minute: number): boolean {
    return selectedKeys.value.has(bucketKey(hour, minute))
  }

  function isHourFullySelected(hour: number): boolean {
    if (!data.value) return false
    const group = data.value.groups.find(g => g.date.hour === hour)
    if (!group) return false
    const nonEmpty = group.buckets.filter(b => b.dataCount > 0)
    if (nonEmpty.length === 0) return false
    return nonEmpty.every(b => selectedKeys.value.has(bucketKey(hour, b.date.minute!)))
  }

  function isHourPartiallySelected(hour: number): boolean {
    if (!data.value) return false
    const group = data.value.groups.find(g => g.date.hour === hour)
    if (!group) return false
    const nonEmpty = group.buckets.filter(b => b.dataCount > 0)
    const n = nonEmpty.filter(b =>
      selectedKeys.value.has(bucketKey(hour, b.date.minute!))
    ).length
    return n > 0 && n < nonEmpty.length
  }

  async function fetchDownloadUrls(): Promise<DownloadFile[]> {
    return $fetch<DownloadFile[]>('/api/chunks/download-urls', {
      method: 'POST',
      body: { dates: selectedDates.value },
    })
  }

  async function deleteSelected(): Promise<DeleteResult> {
    const datesToDelete = selectedDates.value
    const result = await $fetch<DeleteResult>('/api/chunks', {
      method: 'DELETE',
      body: { dates: datesToDelete },
    })
    if (data.value) {
      // Zero out individual buckets
      const affectedHours = new Set<number>()
      for (const d of datesToDelete) {
        const group = data.value.groups.find(g => g.date.hour === d.hour)
        if (!group) continue
        const bucket = group.buckets.find(b => b.date.minute === d.minute)
        if (!bucket) continue
        bucket.dataCount = 0
        bucket.sizeOnDisk = 0
        bucket.compressedBytes = 0
        bucket.uncompressedBytes = 0
        affectedHours.add(d.hour)
      }

      // Recalculate group-level aggregates for affected hours
      for (const hour of affectedHours) {
        const group = data.value.groups.find(g => g.date.hour === hour)
        if (!group) continue
        group.dataCount        = group.buckets.reduce((s, b) => s + b.dataCount, 0)
        group.sizeOnDisk       = group.buckets.reduce((s, b) => s + b.sizeOnDisk, 0)
        group.compressedBytes  = group.buckets.reduce((s, b) => s + b.compressedBytes, 0)
        group.uncompressedBytes = group.buckets.reduce((s, b) => s + b.uncompressedBytes, 0)
        group.dataChunkCount   = group.buckets.filter(b => b.dataCount > 0).length
        group.compressionRatio = group.compressedBytes === 0
          ? 0
          : group.uncompressedBytes / group.compressedBytes
      }

      // Recalculate root-level aggregates
      data.value.dataCount        = data.value.groups.reduce((s, g) => s + g.dataCount, 0)
      data.value.sizeOnDisk       = data.value.groups.reduce((s, g) => s + g.sizeOnDisk, 0)
      data.value.compressedBytes  = data.value.groups.reduce((s, g) => s + g.compressedBytes, 0)
      data.value.uncompressedBytes = data.value.groups.reduce((s, g) => s + g.uncompressedBytes, 0)
      data.value.dataChunkCount   = data.value.groups.reduce((s, g) => s + g.dataChunkCount, 0)
      data.value.compressionRatio = data.value.compressedBytes === 0
        ? 0
        : data.value.uncompressedBytes / data.value.compressedBytes

      // Update color scale bounds
      const nonZero = data.value.groups
        .flatMap(g => g.buckets)
        .map(b => b.dataCount)
        .filter(c => c > 0)
      data.value.minDataCount = nonZero.length ? Math.min(...nonZero) : 0
      data.value.maxDataCount = nonZero.length ? Math.max(...nonZero) : 0
    }
    clearSelection()
    return result
  }

  return {
    // state
    data, loading, error, selectedKeys,
    // getters
    selectedCount, isAllSelected, selectedDates, selectedSummary,
    // actions
    fetchChunks,
    toggleBucket, toggleHour, toggleSelectAll, clearSelection,
    isBucketSelected, isHourFullySelected, isHourPartiallySelected,
    fetchDownloadUrls, deleteSelected,
  }
})

export function bucketKey(hour: number, minute: number): string {
  return `${hour}:${minute}`
}
