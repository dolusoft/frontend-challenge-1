# Mock Data

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
