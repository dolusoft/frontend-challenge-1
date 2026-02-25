# Backup Data Integrity Dashboard

A single-page application for monitoring, selecting, downloading, and deleting daily backup data chunks — visualized as an interactive time-grid heatmap.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Nuxt | 4 (v4.3+) |
| UI Library | Nuxt UI | 4 (v4.4+) |
| State Management | Pinia | 3 (v3.0+) |
| Language | TypeScript | Required throughout |
| Styling | Tailwind CSS v4 + CSS custom properties | — |

---

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## Project Structure

```
app/
├── assets/css/main.css          # Design tokens (CSS variables)
├── components/
│   ├── AppNavbar.vue            # Sticky top navigation bar
│   ├── AppSidebar.vue           # Fixed left sidebar
│   ├── HeatmapGrid.vue          # Grid wrapper + minute axis labels
│   ├── HeatmapRow.vue           # Single hour row (checkbox + 60 cells + stats)
│   ├── FooterStats.vue          # Totals + color scale legend
│   ├── DownloadModal.vue        # Download confirmation + file list
│   └── DeleteModal.vue          # Delete confirmation + file list + result
├── layouts/
│   └── default.vue              # Sidebar + navbar + content area layout
├── pages/
│   └── index.vue                # Main page (toolbar + grid + modals)
├── stores/
│   └── chunks.ts                # Single Pinia store for all state
└── utils/
    └── formatters.ts            # formatRecords, formatBytes, formatRatio

server/api/
├── chunks.get.ts                # GET  /api/chunks
├── chunks.delete.ts             # DELETE /api/chunks
└── chunks/
    └── download-urls.post.ts    # POST /api/chunks/download-urls

shared/types/
└── index.ts                     # Shared interfaces (client + server)
```

---

## Architecture

### Component Tree

```
index.vue
├── [toolbar]  Select All · Clear · Download(N) · Delete(N)
├── HeatmapGrid
│   ├── [minute axis]  :00  :10  :20  :30  :40  :50
│   └── HeatmapRow × 24
│       ├── [group checkbox]
│       ├── [hour label]   e.g. "3:00"
│       ├── [60 cells]     one per minute
│       └── [row stats]    Records | Size | Ratio
├── FooterStats
│   ├── Total Records · Total Chunks · Size On Disk · Compression
│   └── Less ──●──●──●──●──●──●──●──● More
├── DownloadModal
└── DeleteModal
```

### Why cells are rendered inline in `HeatmapRow`

Each day has **1,440 cells** (24 × 60). Rendering each as a separate Vue component would create 1,440 component instances — significant overhead for event listeners, reactivity tracking, and virtual DOM reconciliation. Instead, cells are plain `<button>` elements rendered with `v-for` inside `HeatmapRow`. This keeps the component tree shallow: 1 store + 24 row components + DOM buttons.

---

## State Management

A single Pinia store (`app/stores/chunks.ts`) owns all application state.

### State

| Field | Type | Purpose |
|---|---|---|
| `data` | `SignedFilesResponse \| null` | Full API response (24 groups × 60 buckets) |
| `loading` | `boolean` | Fetch in progress |
| `error` | `string \| null` | Fetch error message |
| `selectedKeys` | `Set<string>` | Selected bucket identifiers |

### Selection Model

Selected buckets are tracked via a `Set<string>` using `"hour:minute"` keys (e.g., `"3:42"`).

```ts
// O(1) add / remove / lookup — no array scanning across 1,440 items
selectedKeys.add("3:42")
selectedKeys.has("3:42")  // true
selectedKeys.delete("3:42")
```

This gives constant-time performance for every click regardless of how many cells are selected.

### Selection Getters

| Getter | Returns |
|---|---|
| `selectedCount` | Number of selected buckets |
| `isAllSelected` | True when all non-empty buckets are selected |
| `selectedDates` | `ChunkDate[]` — dates of selected buckets |
| `selectedSummary` | `{ count, size, records }` — aggregated stats |
| `isHourFullySelected(h)` | True when all non-empty buckets in hour `h` are selected |
| `isHourPartiallySelected(h)` | True when some (not all) non-empty buckets in hour `h` are selected |

### Post-Delete State Update

When chunks are deleted, the store doesn't refetch from the server. Instead it performs an optimistic update:

1. **Bucket fields zeroed** — `dataCount`, `sizeOnDisk`, `compressedBytes`, `uncompressedBytes` set to `0`
2. **Group aggregates recalculated** — `dataCount`, `sizeOnDisk`, `compressedBytes`, `uncompressedBytes`, `dataChunkCount`, `compressionRatio` summed from remaining buckets
3. **Root aggregates recalculated** — same fields at the `SignedFilesResponse` level
4. **Color scale bounds updated** — `minDataCount` and `maxDataCount` recomputed from all non-zero buckets

This means the heatmap, row stats, footer stats, and color gradient all update reactively without a network round-trip.

---

## Design System

### Layout

```
┌─────────────────────────────────────────────────┐
│  Navbar  (sticky, full width, z-50)             │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │   Content area                       │
│ (260px)  │   ml-[292px]  (sidebar + 32px gap)   │
│ fixed    │                                      │
└──────────┴──────────────────────────────────────┘
```

Defined in `app/layouts/default.vue`. The sidebar is fixed-position so the content area scrolls independently.

### Design Tokens

All colors are defined as CSS custom properties in `app/assets/css/main.css`. Components use semantic Tailwind classes — no hardcoded hex values in any `.vue` file.

```css
/* Surfaces */
--canvas         /* Page background  — oklch(96% 0 0)   */
--panel          /* Card background  — #ffffff           */
--panel-border   /* Card border      — oklch(91% 0 0)   */
--panel-divider  /* Internal divider — oklch(93.5% 0 0) */
--panel-hover    /* Row hover tint   — oklch(97% 0 0)   */
```

```css
/* Heatmap color scale */
--heat-0   /* Empty cell  — very faint green */
--heat-1   /* Lowest data density            */
--heat-2
--heat-3
--heat-4
--heat-5
--heat-6
--heat-7
--heat-8   /* Highest data density           */
```

All nine levels use the **OKLch color space** for perceptually uniform brightness steps. Lightness decreases from `91%` (level 1) to `31%` (level 8), chroma peaks in the middle for natural-looking saturation.

### Color Level Calculation

```ts
function levelFor(dataCount: number): number {
  if (dataCount === 0) return 0                         // empty → --heat-0
  if (maxDataCount === minDataCount) return 8           // edge case: single value
  const level = Math.round(
    ((dataCount - minDataCount) / (maxDataCount - minDataCount)) * 7
  ) + 1
  return Math.clamp(level, 1, 8)                        // always 1–8
}
```

Linear interpolation between the day's minimum and maximum `dataCount` across all 1,440 buckets.

---

## Features

### 1. Heatmap Grid

- **24 rows**, one per hour, in the order returned by the API
- **60 cells per row**, one per minute
- Each cell's background is `var(--heat-N)` where N is computed from `dataCount`
- Empty cells (`dataCount === 0`) show `--heat-0` and are **not selectable** — cursor changes to `default`, click is a no-op
- Hovering a cell scales it vertically (`scaleY(1.3)`) for quick identification
- A **minute axis header** (`:00  :10  :20  :30  :40  :50`) aligns with the cell grid via a fixed-width prefix spacer

### 2. Selection

Three levels of selection:

| Interaction | Scope | Behavior |
|---|---|---|
| Click a cell | Single bucket | Toggle on/off. Green ring (`box-shadow: 0 0 0 2px rgb(16,185,129)`) marks selected state |
| Click hour checkbox | 60 cells in that hour | Toggle all non-empty buckets in the row |
| Click Select All | All 1,440 cells | Toggle all non-empty buckets in the dataset |
| Click Clear | All selected | Clear entire selection |

The hour checkbox shows three visual states:
- **Empty** — nothing selected in this hour
- **Dash (—)** — some cells selected (partial)
- **Checkmark (✓)** — all non-empty cells selected (full)

### 3. Toolbar

Visible only when data is loaded. Located at the top of the dashboard panel.

```
[ ✓ Select All (42) ]  [ ✕ Clear ]              [ Download (42) ]  [ Delete (42) ]
└── always visible ──┘  └─ selection > 0 ──┘    └──── selection > 0 ─────────────┘
```

### 4. Download Operation

1. User selects chunks → clicks **Download (N)**
2. `DownloadModal` opens and immediately calls `POST /api/chunks/download-urls`
3. While fetching, a loading spinner is shown
4. On success, a scrollable file list is displayed — each row shows:
   - File name (monospaced): `chunk_2026_02_19_03_42.dat`
   - File size: `176.46 KB`
   - Expiration date
   - Download button (links to signed URL)
5. On error, a red alert message is shown
6. Closing the modal resets all state

### 5. Delete Operation

1. User selects chunks → clicks **Delete (N)**
2. `DeleteModal` opens in **confirmation state**:
   - Red warning banner: *"This action is irreversible"*
   - Summary stats grid: **Chunks** | **Total Size** | **Records**
   - Scrollable file list: file name + size for every chunk to be deleted
   - Confirmation checkbox: *"I understand this action cannot be undone"*
   - Delete button is disabled until the checkbox is checked
3. On confirm, `DELETE /api/chunks` is called
4. On completion, the modal transitions to **result state**:
   - Green card (success) or red card (failure)
   - `additionalInfo` message from the API response
5. In parallel, the store optimistically zeros out the deleted buckets and recalculates all aggregates — the heatmap updates immediately without a page reload

### 6. Footer Statistics

Always visible at the bottom of the dashboard panel. Updates reactively after deletion.

| Stat | Source | Format |
|---|---|---|
| Total Records | `data.dataCount` | `1.2M` (abbreviated) |
| Total Chunks | `data.dataChunkCount` | `1,440` (comma-separated) |
| Size On Disk | `data.sizeOnDisk` | `167.54 MB` |
| Compression | `data.compressionRatio` | `14.29%` |

**Color scale legend** on the right side — 8 swatches from `--heat-1` (Less) to `--heat-8` (More).

---

## API Layer

Three Nuxt server routes under `server/api/`. All share TypeScript types from `shared/types/index.ts` via the `#shared/types` alias — the same interfaces are used on both the server and the client.

### `GET /api/chunks`

Reads `mock-data/signedfiles.json` asynchronously and returns the full `SignedFilesResponse`.

```ts
// server/api/chunks.get.ts
const raw = await readFile(join(process.cwd(), 'mock-data/signedfiles.json'), 'utf-8')
return JSON.parse(raw)
```

### `POST /api/chunks/download-urls`

Accepts `{ dates: ChunkDate[] }`. For each date, generates a `DownloadFile` response dynamically:

- `fileName`: `chunk_YYYY_MM_DD_HH_mm.dat`
- `fileSize`: random value in range `[89,808 – 209,888]` bytes
- `downloadUrl`: placeholder signed URL
- `expirationDate`: 24 hours from request time

### `DELETE /api/chunks`

Accepts `{ dates: ChunkDate[] }`. Returns a `DeleteResult`:

```json
{
  "processedFileIds": ["f1", "f2", "..."],
  "failedFileIds": [],
  "status": "completed",
  "additionalInfo": "N files deleted successfully"
}
```

---

## Type Safety

`shared/types/index.ts` defines all interfaces used across the stack:

```
ChunkDate → Bucket → ChunkGroup → SignedFilesResponse
                                  DownloadFile
                                  DeleteResult
                                  ChunkRequest
```

The `#shared/types` path alias is configured in `nuxt.config.ts` and resolves identically in both server routes and Vue components — no type duplication, no drift.

---

## Number Formatting

All human-readable formatting is centralized in `app/utils/formatters.ts` and auto-imported everywhere:

| Function | Input | Output |
|---|---|---|
| `formatRecords(n)` | `1179026` | `1.2M` |
| `formatBytes(n)` | `175677468` | `167.54 MB` |
| `formatRatio(n)` | `14.29` | `14.29%` |

---

## Edge Cases Handled

| Scenario | Handling |
|---|---|
| Empty cells (`dataCount === 0`) | `levelFor` returns `0` → `--heat-0`; click is a no-op |
| All chunks deleted | `dataChunkCount` → `0`; Select All becomes a no-op; footer shows `0` |
| Hour fully deleted | `isHourFullySelected` returns `false`; checkbox shows empty state |
| `minDataCount === maxDataCount` | `levelFor` returns `8` (all cells same color) |
| API fetch failure | Error message displayed; loading state cleared |
| Delete API failure | Modal shows failure card; grid not mutated |
