# Frontend Challenge — Level 1

## Overview

Build a **Backup Data Integrity** dashboard that visualizes time-series backup data chunks in an interactive heatmap grid. Users can view chunk density, select chunks, and perform download and delete operations.

## The Story

A network security appliance (firewall) continuously collects traffic logs. These logs are generated in real time — hundreds, sometimes thousands of records per second. Storing all of this data in a single large file would be problematic for both performance and manageability: the file grows indefinitely, downloading it takes hours, and a single corruption could compromise all the data.

That's why the data is **split into minute-based chunks**. Each chunk stores all records from that minute as a compressed package. This approach provides:

- **Granular management:** Download, delete, or verify only the time range you need
- **Damage isolation:** If one chunk is corrupted, only 1 minute of data is affected — the rest remains intact
- **Parallel processing:** Multiple chunks can be downloaded or verified simultaneously
- **Efficient storage:** Each chunk is independently compressed

This produces **1,440 chunks per day** (24 hours x 60 minutes). As a security administrator, you need to monitor the integrity of these chunks: Which hours had heavy traffic? Are there any gaps? Do you need to download or delete specific chunks?

Your task is to build a dashboard that displays the entire day's chunks as a **calendar-style heatmap** — similar in concept to [GitHub's contribution graph](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/viewing-contributions-on-your-profile), but organized by hours and minutes instead of months and days. Since each chunk maps to a specific minute within a specific hour, the data naturally lends itself to a **time-grid visualization** — think of how a calendar shows days within months, but here you're showing minutes within hours. This time-based structure is key to making the data intuitive at a glance.

Darker cells represent high-traffic periods, lighter cells represent low traffic, and empty cells indicate minutes with no data. The administrator can select chunks and perform bulk operations: download or delete.

**The UI design is entirely up to you.** Use Nuxt UI components creatively to build a clean, functional interface. We want to see your design thinking, not a copy of an existing layout.

## Tech Stack (Required)

| Technology | Version |
|-----------|---------|
| **Nuxt** | 4 (latest, v4.3+) |
| **Nuxt UI** | 4 (latest, v4.4+) |
| **Pinia** | 3 (latest, v3.0+) |
| **TypeScript** | Required |

## What You Need to Build

A single-page application with the following features:

### 1. Chunk Visualization Grid

Display backup data chunks as a color-coded heatmap grid, organized by hourly time groups.

- **24 rows** — one per hour (0:00 through 23:00)
- **60 cells per row** — one per minute within that hour
- Cell background color reflects **data density** (darker = more data, lighter = less)
- Empty cells (no data) appear very faint or transparent

Each hourly group shows:
- Time label (e.g., "0:00", "1:00")
- Inline statistics: record count, disk size, compression ratio
- Group selection checkbox

### 2. Color Mapping

- Use a single green-tone color palette with **8 gradient levels**
- Map each chunk's `dataCount` value to a color level using **linear scaling** between `minDataCount` and `maxDataCount`
- Show a "Less → More" gradient scale in the footer

### 3. Chunk Selection

- **Click a cell** → toggle selection (show checkmark on selected cells)
- **Group checkbox** → select/deselect all chunks in that hour
- **Select All toggle** → select/deselect all visible chunks
- Action buttons show selected count: `Download(3)`, `Delete(5)`
- Buttons are disabled when no chunks are selected

### 4. Download Operation

- Click "Download" button with chunks selected
- Call the download-urls API endpoint
- Display results in a modal: file name, size, and download link for each file

### 5. Delete Operation

- Click "Delete" button with chunks selected
- Show confirmation modal with:
  - Warning message: "This action is irreversible"
  - Summary: chunk count, total size, record count
  - File list with details
  - Confirmation checkbox: "I understand this action cannot be undone"
  - Delete button (disabled until checkbox is checked)
- Call the delete API endpoint
- Show result (success/failure)

### 6. Footer Statistics

Display at the bottom of the page:
- Total Records (e.g., "1.2M")
- Total Chunks (e.g., "1,440")
- Size On Disk (e.g., "167.54 MB")
- Color scale indicator (Less → More)

## API Contracts

See [docs/api-contracts.md](docs/api-contracts.md) for full endpoint documentation.

**Summary of endpoints you need to implement as Nuxt server routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chunks` | Get all chunk data for the day |
| POST | `/api/chunks/download-urls` | Get download URLs for selected chunks |
| DELETE | `/api/chunks` | Delete selected chunks |

Your server routes should serve the mock data from the `mock-data/` directory.

## Data Models

See [docs/data-models.md](docs/data-models.md) for TypeScript interface definitions.

## Mock Data

The `mock-data/` directory contains realistic sample data:

| File | Description |
|------|-------------|
| `signedfiles.json` | Full day of chunk data (24 groups, 1440 chunks) |
| `download-urls.json` | Sample download URL response |
| `delete-result.json` | Sample delete result response |

You can regenerate mock data by running:
```bash
node generate-mock-data.mjs
```

## Rules

1. **Start from scratch** — Fork this repo, create a new Nuxt project inside it
2. **No UI copy** — You will NOT see the original application. Build your own design using Nuxt UI
3. **Mock API required** — Implement Nuxt server routes (`server/api/`) that serve the mock data
4. **TypeScript required** — All code must be TypeScript
5. **Git history matters** — Make meaningful commits showing your progress
6. **README** — Add a brief explanation of your architectural decisions

## Evaluation Criteria

| Criteria | Weight | What We Look For |
|----------|--------|------------------|
| **Code Quality** | 30% | Clean components, TypeScript usage, Composition API patterns |
| **Functionality** | 30% | All features working correctly, edge cases handled |
| **UI/UX** | 20% | Responsive grid, clear visual feedback, good interactions |
| **Architecture** | 20% | Component structure, state management, API layer separation |

## Submission

1. Fork this repository
2. Create your Nuxt project and implement the features
3. Push your work to your fork
4. Share your fork URL with us

## Time Expectation

This challenge is designed to take approximately **3-4 days** (working 4-6 hours per day).

---

Good luck!

---

## Implementation Notes

### Architectural Decisions

**State Management**
Single Pinia store (`app/stores/chunks.ts`). Selected buckets tracked with `Set<string>` via `"hour:minute"` keys → O(1) toggle/lookup across 1,440 cells.

**Component Structure**
`index.vue → HeatmapGrid → HeatmapRow (×24)`. Cells rendered inline in `HeatmapRow`, not as separate components — avoids 1,440 Vue component instances.

**Color Scale**
8-level green gradient (`--heat-1…8`) as CSS custom properties. Level = `Math.round(((v-min)/(max-min))*7)+1`, clamped 1–8. `--heat-0` for empty cells.

**Design Tokens**
All colors in `app/assets/css/main.css` via CSS variables. Components use semantic Tailwind classes (`bg-canvas`, `bg-panel`, etc.) — no hardcoded colors in component files.

**API Layer**
Three Nuxt server routes (`server/api/`). GET reads `mock-data/signedfiles.json` async. POST/DELETE generate dynamic responses from request body.

**Shared Types**
`shared/types/index.ts` consumed by both server routes and client via `#shared/types` alias — end-to-end type safety.

**Layout**
Fixed sidebar (260px) + sticky navbar + `ml-[292px]` content area, defined in `app/layouts/default.vue`.
