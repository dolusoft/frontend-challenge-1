import { defineStore } from 'pinia'
import type { SignedFilesResponse, DownloadFile, DeleteResult } from '#shared/types'

export const useChunksStore = defineStore('chunks', () => {
  // ── State ──────────────────────────────────────────────────────
  const data    = ref<SignedFilesResponse | null>(null)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  /** "hour:minute" keys for selected buckets */
  const selectedKeys = ref<Set<string>>(new Set())

  /** true while a bulk selection operation (select-all / hour toggle) is in progress */
  const isSelecting = ref(false)

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

  async function toggleHour(hour: number) {
    if (!data.value || isSelecting.value) return
    isSelecting.value = true
    await nextTick() // let the spinner render before the DOM update
    const group = data.value.groups.find(g => g.date.hour === hour)
    if (group) {
      const nonEmpty = group.buckets.filter(b => b.dataCount > 0)
      const allSelected = nonEmpty.every(b =>
        selectedKeys.value.has(bucketKey(hour, b.date.minute!))
      )
      const next = new Set(selectedKeys.value)
      for (const bucket of nonEmpty) {
        const key = bucketKey(hour, bucket.date.minute!)
        allSelected ? next.delete(key) : next.add(key)
      }
      selectedKeys.value = next
    }
    isSelecting.value = false
  }

  async function toggleSelectAll() {
    if (!data.value || isSelecting.value) return
    isSelecting.value = true
    await nextTick() // let the spinner render before the DOM update
    if (isAllSelected.value) {
      selectedKeys.value = new Set()
    } else {
      const next = new Set<string>()
      for (const group of data.value.groups)
        for (const bucket of group.buckets)
          if (bucket.dataCount > 0)
            next.add(bucketKey(group.date.hour, bucket.date.minute!))
      selectedKeys.value = next
    }
    isSelecting.value = false
  }

  function clearSelection() {
    selectedKeys.value = new Set()
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
      // O(1) lookup: hour → Set<minute> for deleted entries
      const toDelete = new Map<number, Set<number>>()
      for (const d of datesToDelete) {
        if (!toDelete.has(d.hour)) toDelete.set(d.hour, new Set())
        toDelete.get(d.hour)!.add(d.minute!)
      }

      // Build a new data tree entirely in plain JS — no mutations on the reactive
      // Proxy, so Vue's scheduler is triggered only ONCE (the final assignment).
      const old = data.value

      const newGroups = old.groups.map(g => {
        const deletedMinutes = toDelete.get(g.date.hour)
        if (!deletedMinutes) return g   // hour untouched — reuse same object

        const newBuckets = g.buckets.map(b =>
          deletedMinutes.has(b.date.minute!)
            ? { ...b, dataCount: 0, sizeOnDisk: 0, compressedBytes: 0, uncompressedBytes: 0 }
            : b
        )

        const dataCount         = newBuckets.reduce((s, b) => s + b.dataCount, 0)
        const sizeOnDisk        = newBuckets.reduce((s, b) => s + b.sizeOnDisk, 0)
        const compressedBytes   = newBuckets.reduce((s, b) => s + b.compressedBytes, 0)
        const uncompressedBytes = newBuckets.reduce((s, b) => s + b.uncompressedBytes, 0)
        const dataChunkCount    = newBuckets.filter(b => b.dataCount > 0).length
        return {
          ...g,
          buckets: newBuckets,
          dataCount, sizeOnDisk, compressedBytes, uncompressedBytes, dataChunkCount,
          compressionRatio: compressedBytes === 0 ? 0 : uncompressedBytes / compressedBytes,
        }
      })

      const dataCount         = newGroups.reduce((s, g) => s + g.dataCount, 0)
      const sizeOnDisk        = newGroups.reduce((s, g) => s + g.sizeOnDisk, 0)
      const compressedBytes   = newGroups.reduce((s, g) => s + g.compressedBytes, 0)
      const uncompressedBytes = newGroups.reduce((s, g) => s + g.uncompressedBytes, 0)
      const dataChunkCount    = newGroups.reduce((s, g) => s + g.dataChunkCount, 0)

      let minDataCount = Infinity
      let maxDataCount = 0
      for (const g of newGroups)
        for (const b of g.buckets)
          if (b.dataCount > 0) {
            if (b.dataCount < minDataCount) minDataCount = b.dataCount
            if (b.dataCount > maxDataCount) maxDataCount = b.dataCount
          }

      // Single reactive assignment → one Vue update cycle
      data.value = {
        ...old,
        groups: newGroups,
        dataCount, sizeOnDisk, compressedBytes, uncompressedBytes, dataChunkCount,
        compressionRatio: compressedBytes === 0 ? 0 : uncompressedBytes / compressedBytes,
        minDataCount: minDataCount === Infinity ? 0 : minDataCount,
        maxDataCount,
      }
    }
    clearSelection()
    return result
  }

  return {
    // state
    data, loading, error, selectedKeys, isSelecting,
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
