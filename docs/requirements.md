# Requirements

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
