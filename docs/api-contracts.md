# API Contracts

Your Nuxt server routes should implement the following endpoints using the mock data provided in `mock-data/`.

## 1. Get Chunk Data

```
GET /api/chunks
```

Returns all chunk data for the day.

**Response:** Contents of `mock-data/signedfiles.json`

**Response Structure:**
```json
{
  "groups": [
    {
      "date": { "year": 2026, "month": 2, "day": 20, "hour": 0 },
      "buckets": [
        {
          "date": { "year": 2026, "month": 2, "day": 20, "hour": 0, "minute": 0 },
          "dataChunkCount": 1,
          "sizeOnDisk": 130384,
          "compressedBytes": 130384,
          "uncompressedBytes": 1929006,
          "compressionRatio": 14.79,
          "dataCount": 918
        }
      ],
      "dataChunkCount": 60,
      "sizeOnDisk": 6290848,
      "compressedBytes": 6290848,
      "uncompressedBytes": 89889236,
      "compressionRatio": 14.29,
      "dataCount": 42300
    }
  ],
  "dataChunkCount": 1440,
  "sizeOnDisk": 175677468,
  "compressedBytes": 175670992,
  "uncompressedBytes": 2510444484,
  "compressionRatio": 14.29,
  "dataCount": 1179026,
  "minDataCount": 579,
  "maxDataCount": 1688,
  "minByte": 89808,
  "maxByte": 209888
}
```

**Key points:**
- `groups` array has 24 entries (one per hour, 0:00-23:00)
- Each group has 60 `buckets` (one per minute)
- Each bucket represents a single data chunk
- `minDataCount` and `maxDataCount` are used for color mapping

---

## 2. Get Download URLs

```
POST /api/chunks/download-urls
```

Returns secure download URLs for the selected chunks.

**Request Body:**
```json
{
  "dates": [
    { "year": 2026, "month": 2, "day": 20, "hour": 0, "minute": 0 },
    { "year": 2026, "month": 2, "day": 20, "hour": 0, "minute": 1 },
    { "year": 2026, "month": 2, "day": 20, "hour": 0, "minute": 2 }
  ]
}
```

**Response:**
```json
[
  {
    "fileId": "f1",
    "fileName": "chunk_2026_02_20_00_00.dat",
    "downloadUrl": "https://storage.example.com/signed/chunk_2026_02_20_00_00.dat?token=abc&expires=1740400000",
    "expirationDate": "2026-02-22T00:00:00Z",
    "fileSize": 130384
  }
]
```

**Implementation note:** Generate the response dynamically from the request body. For each date in the request, create a download entry with:
- `fileName`: `chunk_YYYY_MM_DD_HH_mm.dat`
- `fileSize`: Look up the matching bucket's `sizeOnDisk` from signedfiles data, or use a random value in range 89808-209888
- `downloadUrl`: Any placeholder URL is fine
- `expirationDate`: Any future date

---

## 3. Delete Chunks

```
DELETE /api/chunks
```

Deletes the selected chunks.

**Request Body:**
```json
{
  "dates": [
    { "year": 2026, "month": 2, "day": 20, "hour": 0, "minute": 0 },
    { "year": 2026, "month": 2, "day": 20, "hour": 0, "minute": 1 }
  ]
}
```

**Response:**
```json
{
  "processedFileIds": ["f1", "f2"],
  "failedFileIds": [],
  "status": "completed",
  "additionalInfo": "2 files deleted successfully"
}
```

**Implementation note:** Return a success response with the number of files matching the dates array length. You do NOT need to actually modify the mock data — this is a mock API.

---

## Number Formatting Guidelines

When displaying data in the UI, use human-readable formats:

| Data | Format | Example |
|------|--------|---------|
| Record counts | Abbreviated | 42.3K, 1.2M |
| File sizes | Human-readable | 380.00 KB, 6.00 MB, 167.54 MB |
| Compression ratio | Percentage | 3.58%, 14.85% |
| Chunk counts | Comma-separated | 1,440 |
