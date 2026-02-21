# Frontend Challenge — Level 1

## Overview

Build a **Backup Data Integrity** dashboard that visualizes time-series backup data chunks in an interactive heatmap grid. Users can view chunk density, select chunks, and perform download and delete operations.

## Tech Stack (Required)

- **Nuxt 3** (latest)
- **Vue 3** (latest, Composition API)
- **Nuxt UI** (latest)
- **Pinia** (state management)
- **TypeScript**

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

## Page Layout

```
+----------------------------------------------------------+
| Backup Data Integrity                                     |
+----------------------------------------------------------+
| [Select All]                    [Download(0)] [Delete(0)] |
+----------------------------------------------------------+
|                                                           |
| 0:00                              42.3K / 6.00 MB  3.58% |
| [██][██][▓▓][▓▓][▒▒][░░][██]... (60 cells)              |
|                                                           |
| 1:00                              42.5K / 6.01 MB  3.59% |
| [██][▓▓][▓▓][▒▒][░░][██][▓▓]... (60 cells)              |
|                                                           |
| ...  (24 hourly groups, scrollable)                       |
|                                                           |
+----------------------------------------------------------+
| Total: 1.2M records | 1,440 chunks | 167.54 MB           |
| Less [■■■■■■■■] More                                     |
+----------------------------------------------------------+
```

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
| `storage-adapters.json` | Available storage adapters |

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
