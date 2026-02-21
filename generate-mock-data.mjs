/**
 * Mock data generator for frontend-challenge-1
 * Run: node generate-mock-data.mjs
 * Generates realistic backup chunk data based on production patterns.
 */
import { writeFileSync } from 'fs'

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min, max) {
  return min + Math.random() * (max - min)
}

// --- signedfiles response ---
function generateSignedFiles() {
  const groups = []
  let totalDataChunkCount = 0
  let totalSizeOnDisk = 0
  let totalCompressedBytes = 0
  let totalUncompressedBytes = 0
  let totalDataCount = 0
  let globalMinDataCount = Infinity
  let globalMaxDataCount = 0
  let globalMinByte = Infinity
  let globalMaxByte = 0

  // 24 hourly groups for Feb 20, 2026 (UTC hours: Feb 19 21:00 - Feb 20 20:00)
  const hours = []
  // Hours 21-23 of Feb 19 (UTC)
  for (let h = 21; h <= 23; h++) hours.push({ year: 2026, month: 2, day: 19, hour: h })
  // Hours 0-20 of Feb 20 (UTC)
  for (let h = 0; h <= 20; h++) hours.push({ year: 2026, month: 2, day: 20, hour: h })

  for (const hourDate of hours) {
    const buckets = []
    let groupSizeOnDisk = 0
    let groupCompressedBytes = 0
    let groupUncompressedBytes = 0
    let groupDataCount = 0
    let groupDataChunkCount = 0

    // 60 minute-buckets per hour
    for (let m = 0; m < 60; m++) {
      const sizeOnDisk = rand(89808, 209888)
      const compressedBytes = sizeOnDisk
      const compressionRatio = randFloat(13.5, 15.2)
      const uncompressedBytes = Math.round(compressedBytes * compressionRatio)
      const dataCount = rand(579, 1688)

      buckets.push({
        date: { ...hourDate, minute: m },
        dataChunkCount: 1,
        sizeOnDisk,
        compressedBytes,
        uncompressedBytes,
        compressionRatio,
        dataCount,
      })

      groupSizeOnDisk += sizeOnDisk
      groupCompressedBytes += compressedBytes
      groupUncompressedBytes += uncompressedBytes
      groupDataCount += dataCount
      groupDataChunkCount += 1

      if (dataCount < globalMinDataCount) globalMinDataCount = dataCount
      if (dataCount > globalMaxDataCount) globalMaxDataCount = dataCount
      if (sizeOnDisk < globalMinByte) globalMinByte = sizeOnDisk
      if (sizeOnDisk > globalMaxByte) globalMaxByte = sizeOnDisk
    }

    groups.push({
      date: hourDate,
      buckets,
      dataChunkCount: groupDataChunkCount,
      sizeOnDisk: groupSizeOnDisk,
      compressedBytes: groupCompressedBytes,
      uncompressedBytes: groupUncompressedBytes,
      compressionRatio: groupUncompressedBytes / groupCompressedBytes,
      dataCount: groupDataCount,
    })

    totalDataChunkCount += groupDataChunkCount
    totalSizeOnDisk += groupSizeOnDisk
    totalCompressedBytes += groupCompressedBytes
    totalUncompressedBytes += groupUncompressedBytes
    totalDataCount += groupDataCount
  }

  return {
    groups,
    dataChunkCount: totalDataChunkCount,
    sizeOnDisk: totalSizeOnDisk,
    compressedBytes: totalCompressedBytes,
    uncompressedBytes: totalUncompressedBytes,
    compressionRatio: totalUncompressedBytes / totalCompressedBytes,
    dataCount: totalDataCount,
    minDataCount: globalMinDataCount,
    maxDataCount: globalMaxDataCount,
    minByte: globalMinByte,
    maxByte: globalMaxByte,
  }
}

// --- download-urls response ---
function generateDownloadUrls(selectedDates) {
  return selectedDates.map((d, i) => {
    const pad = (n) => String(n).padStart(2, '0')
    const fileName = `chunk_${d.year}_${pad(d.month)}_${pad(d.day)}_${pad(d.hour)}_${pad(d.minute)}.dat`
    const fileSize = rand(89808, 209888)
    return {
      fileId: `f${i + 1}`,
      fileName,
      downloadUrl: `https://storage.example.com/signed/${fileName}?token=mock-token-${i + 1}&expires=1740400000`,
      expirationDate: '2026-02-22T00:00:00Z',
      fileSize,
    }
  })
}

// --- delete response ---
function generateDeleteResult(fileCount) {
  const processedFileIds = Array.from({ length: fileCount }, (_, i) => `f${i + 1}`)
  return {
    processedFileIds,
    failedFileIds: [],
    status: 'completed',
    additionalInfo: `${fileCount} files deleted successfully`,
  }
}

// --- storage-adapters response ---
function generateStorageAdapters() {
  return {
    items: [
      {
        id: 'sa-local-1',
        name: 'Local Storage',
        type: 'local',
        configuration: { path: '/data/backups' },
      },
      {
        id: 'sa-s3-1',
        name: 'AWS S3 Bucket',
        type: 's3',
        configuration: { region: 'eu-west-1', bucket: 'dolusoft-backups' },
      },
      {
        id: 'sa-azure-1',
        name: 'Azure Blob Storage',
        type: 'azure-blob',
        configuration: { container: 'forensic-exports' },
      },
    ],
    totalCount: 3,
  }
}

// Generate all mock data
const signedFiles = generateSignedFiles()

const sampleDates = [
  { year: 2026, month: 2, day: 20, hour: 0, minute: 0 },
  { year: 2026, month: 2, day: 20, hour: 0, minute: 1 },
  { year: 2026, month: 2, day: 20, hour: 0, minute: 2 },
]

const downloadUrls = generateDownloadUrls(sampleDates)
const deleteResult = generateDeleteResult(3)
const storageAdapters = generateStorageAdapters()

// Write files
writeFileSync('mock-data/signedfiles.json', JSON.stringify(signedFiles, null, 2))
writeFileSync('mock-data/download-urls.json', JSON.stringify(downloadUrls, null, 2))
writeFileSync('mock-data/delete-result.json', JSON.stringify(deleteResult, null, 2))
writeFileSync('mock-data/storage-adapters.json', JSON.stringify(storageAdapters, null, 2))

console.log('Mock data generated:')
console.log(`  signedfiles.json: ${signedFiles.groups.length} groups, ${signedFiles.dataChunkCount} chunks`)
console.log(`  download-urls.json: ${downloadUrls.length} files`)
console.log(`  delete-result.json: ${deleteResult.processedFileIds.length} files`)
console.log(`  storage-adapters.json: ${storageAdapters.items.length} adapters`)
