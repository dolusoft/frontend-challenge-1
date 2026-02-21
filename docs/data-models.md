# Data Models

TypeScript interfaces for the data structures used in this project.

## Core Models

```typescript
/** Flexible timestamp — fields present depend on granularity */
interface ChunkDate {
  year: number
  month: number   // 1-12
  day: number     // 1-31
  hour: number    // 0-23
  minute?: number // 0-59 (present in bucket-level data)
}

/** A single data chunk (one minute of backup data) */
interface Bucket {
  date: ChunkDate
  dataChunkCount: number    // Always 1
  sizeOnDisk: number        // Bytes
  compressedBytes: number   // Bytes (≈ sizeOnDisk)
  uncompressedBytes: number // Bytes
  compressionRatio: number  // uncompressedBytes / compressedBytes
  dataCount: number         // Number of records
}

/** An hourly group containing 60 minute-buckets */
interface ChunkGroup {
  date: ChunkDate           // Hour-level date (no minute field)
  buckets: Bucket[]         // 60 buckets (one per minute)
  dataChunkCount: number    // Sum of all bucket counts
  sizeOnDisk: number        // Sum of all bucket sizes
  compressedBytes: number
  uncompressedBytes: number
  compressionRatio: number  // Calculated from totals
  dataCount: number         // Sum of all bucket record counts
}

/** Full API response for chunk data */
interface SignedFilesResponse {
  groups: ChunkGroup[]      // 24 groups (one per hour)
  dataChunkCount: number    // Total chunks across all groups
  sizeOnDisk: number        // Total size across all groups
  compressedBytes: number
  uncompressedBytes: number
  compressionRatio: number
  dataCount: number         // Total records across all groups
  minDataCount: number      // Minimum dataCount across all buckets
  maxDataCount: number      // Maximum dataCount across all buckets
  minByte: number           // Minimum sizeOnDisk across all buckets
  maxByte: number           // Maximum sizeOnDisk across all buckets
}
```

## Operation Models

```typescript
/** Download URL for a single chunk file */
interface DownloadFile {
  fileId: string
  fileName: string          // Format: chunk_YYYY_MM_DD_HH_mm.dat
  downloadUrl: string       // Time-limited signed URL
  expirationDate: string    // ISO 8601 date string
  fileSize: number          // Bytes
}

/** Result of a delete operation */
interface DeleteResult {
  processedFileIds: string[] // Successfully deleted file IDs
  failedFileIds: string[]    // Failed file IDs (empty on full success)
  status: string             // "completed" | "partial" | "failed"
  additionalInfo: string     // Human-readable summary
}
```

## Request Models

```typescript
/** Request body for download-urls and delete endpoints */
interface ChunkRequest {
  dates: ChunkDate[]        // List of chunk timestamps to operate on
}
```
