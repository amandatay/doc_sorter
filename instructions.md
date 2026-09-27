# DocSorter: Product Spec & Build Instructions

This is the source of truth for what to build. `CLAUDE.md` covers how to work.
If something here is ambiguous, ask. Don't guess, and record the answer in `docs/DECISIONS.md`.

---

## 1. Goal
Help one person turn phone photos of paper documents into correctly grouped, correctly
ordered, well-named PDFs. The app must be private (on-device only), work offline, and be
fast to use one-handed on an Android phone.

## 2. Two core flows

**A. Build a new document (primary flow on phone)**
User taps *New document*, then captures pages one at a time with the camera (or adds
from the gallery). Pages append in increasing order by default. The user can reorder,
insert, retake or delete along the way, then name the document and export it.

**B. Sort existing photos (recovery flow)**
User imports a batch of photos already taken. The app proposes document groupings from
capture timestamps. The user confirms, merges, splits or reorders, then names and exports.

Both flows produce the same `Document` object. Viewer, naming and export are shared.

---

## 3. Architecture
- **Delivery**: static files on GitHub Pages, installed to the Android home screen as a PWA.
- **Offline**: a service worker precaches every app file (including `/vendor`). After
  first load, the app works with no connection.
- **Storage**: IndexedDB with two stores:
  - `blobs`: original image blobs + generated thumbnails, keyed by `pageId` / `pageId:thumb`.
  - `state`: the current project (same shape as the bundle manifest, §4).
  On first launch call `navigator.storage.persist()`. Record the result and show it in
  Settings.
- **Libraries (vendored, pinned)**: `exifr` (read DateTimeOriginal), `jsPDF` (PDF export),
  `JSZip` (project bundle).
- **Code split**: `core.js` holds pure, testable logic and never touches the DOM or
  IndexedDB. `index.html` holds UI, storage and I/O glue.
- **Security**: a CSP meta tag that allows only `'self'`, inline scripts/styles,
  `blob:` and `data:` images. No `connect-src` beyond `'self'`.

## 4. Data model
Canonical definition lives in `docs/MANIFEST_SCHEMA.md`. Keep it in sync.

```jsonc
{
  "schemaVersion": 1,
  "app": "docsorter",
  "updatedAt": "2026-09-27T14:03:22+08:00",
  "pages": {
    "<pageId>": {
      "originalName": "IMG_20260927_140322.jpg",
      "mime": "image/jpeg",
      "capturedAt": "2026-09-27T14:03:22",      // local time, no TZ (EXIF has none)
      "capturedAtSource": "exif" | "lastModified",
      "width": 3000, "height": 4000,
      "rotation": 0                              // 0 | 90 | 180 | 270, applied on render/export
    }
  },
  "documents": [
    {
      "id": "<docId>",
      "title": "Blood Test",
      "category": "Medical",
      "date": "20260927",                        // YYYYMMDD, defaults to first page's capture date
      "pageIds": ["<pageId>", "..."],            // order = page order
      "createdAt": "...", "updatedAt": "..."
    }
  ],
  "inbox": ["<pageId>", "..."],                  // imported pages not yet in a document
  "categories": ["Medical", "Finance", "Insurance", "Home", "Work", "Other"]
}
```
Invariants (validate in `core.js`, with tests): every pageId is in exactly one place
(inbox or one document); no dangling ids; `date` matches `^\d{8}$` and is a real date.

## 5. Timestamps
- Read `DateTimeOriginal` from EXIF via exifr. That is the photo's creation time.
- If it's missing, fall back to `File.lastModified` and set `capturedAtSource: "lastModified"`.
  Show a small indicator on those thumbnails.
- Ignore all other EXIF (GPS etc.) in Phase 1. Apply EXIF Orientation only if the browser
  hasn't already. Verify on a real device and record the finding in DECISIONS.md.
- Sort key: `capturedAt`, then `originalName` (natural sort) as the tiebreaker.

## 6. Grouping algorithm (flow B), in `core.js`
1. Sort pages by the sort key.
2. Compute consecutive gaps in seconds.
3. `threshold = max(minGapSeconds, k × median(gaps))`. Defaults: `minGapSeconds = 90`,
   `k = 3`.
4. Start a new group wherever `gap > threshold`.
5. Fewer than 3 photos: return a single group.
6. Return groups plus the threshold used (so the UI can display it).

UI exposes `k` as a **sensitivity slider** (range 1.5–10). Groups re-render live as it
moves. Must have unit tests: empty input, 1–2 photos, identical timestamps, one huge
outlier gap, mixed exif/lastModified sources.

## 7. Phase 1 UI (phone)
Three screens with a bottom nav: **Documents**, **Inbox**, plus a full-screen **Viewer**
opened by tapping any page.

**Documents screen**
- List of documents, each showing first-page thumbnail, filename preview, and page count.
- Big *New document* button.

**Document detail**
- Page grid in order, showing page numbers.
- *Add page (camera)*: `<input type="file" accept="image/*" capture="environment">`,
  appends to the end.
- *Add from gallery*: `<input type="file" accept="image/*" multiple>`. Sort the added
  batch by capture time before appending, because selection order is not reliable.
- Per-page actions: *Insert after* (camera), *Retake* (replace in place, keep position),
  *Rotate*, *Delete*.
- Reordering:
  - **Tap-to-number mode**: tap pages in the desired order and each shows 1, 2, 3…
    *Apply* commits the order. Untapped pages keep their relative order after the tapped ones.
  - Up/down arrows on a page for single nudges.
  - *Reverse order* and *Sort by time* buttons.
- Metadata editor: title, category (with add-custom), date (YYYYMMDD, validated).
  Live filename preview.

**Inbox**
- *Import photos* (gallery, multiple).
- Proposed groups shown as cards, with the sensitivity slider at the top.
- Per group: *Create document* / *Merge with next* / *Split here* (tap between pages).
- **Long-press** enters multi-select, then tap to add pages. Action bar: *New document*,
  *Add to document…*, *Delete*.

**Viewer**
- Pinch to zoom (Pointer Events, `touch-action: none`), max 6×.
- Double-tap toggles fit ↔ 2× centred on the tap point.
- Pan when zoomed. Swipe left/right changes page only when at fit scale.
- Rotate button (persists to the page). Shows a "2 / 5" counter and a close button.

**General**
- An **Undo** snackbar after destructive actions (delete, merge, split, reorder apply).
  Single-level undo is enough.
- Thumbnails (long edge ~400px, JPEG 0.8) are generated on import and stored. The full
  image loads only in the Viewer and at export. Revoke object URLs when done.
- HEIC: if an image can't decode, show a clear message rather than failing silently.

## 8. Naming & export
**Filename**: `{YYYYMMDD}_{Category}_{TitlePascalCase}`, e.g. `20260927_Medical_BloodTest`.
- Strip characters invalid on Windows/Android (`\/:*?"<>|`), collapse whitespace.
- Empty title → `Untitled`. Collisions → suffix `_2`, `_3`.
- Page images: `{basename}_p01.jpg`. Pad to 2 digits, or 3 if there are more than 99 pages.

**PDF export** (jsPDF):
- One page per image. A4, orientation matched to each image after rotation, image fitted
  and centred.
- Downscale to ~2000px long edge, JPEG quality 0.85, to keep file size reasonable.
- Deliver via Web Share API (`navigator.share({ files })`), falling back to download.

**Project bundle** (for future edits):
- `DocSorter_{YYYYMMDD}_{HHMMSS}.zip` containing `manifest.json`, `images/<pageId>.<ext>`
  (originals, unmodified), and `pdf/<basename>.pdf` for each document.
- *Import bundle* restores the full state. Run schema migrations first and validate
  invariants, and refuse clearly if the bundle is invalid.
- The same format is reused as the on-disk folder layout in Phase 2. Don't paint it into
  a phone-only corner.

## 9. Share target (Android)
In `manifest.json`, declare a `share_target` (POST, multipart, `files` accepting `image/*`).
`sw.js` intercepts the POST, stashes the files, and redirects to `./?shared=1`. The app
then imports them into the Inbox. This lets users share from Google Photos / Gallery
straight into the app.

---

## 10. Milestones (Phase 1)
Each milestone needs a plan approved by me first, and ends with PROGRESS.md updated,
CHANGELOG updated, tests passing, and a manual Android checklist written.

| # | Milestone | Acceptance criteria |
|---|-----------|---------------------|
| M0 | Scaffold & deploy | Repo layout per CLAUDE.md; all docs files created from §12 templates; empty app shell with bottom nav; manifest + icons + sw; deployed to GitHub Pages; installs on Android and opens offline. |
| M1 | Data model & storage | `core.js` model helpers, validation and invariants with tests; IndexedDB wrapper; persist() request; state survives app restart. |
| M2 | Import & timestamps | Gallery import; EXIF DateTimeOriginal with lastModified fallback + indicator; thumbnails; 200 photos import without freezing (show progress). |
| M3 | Viewer | Pinch, double-tap, pan, swipe, rotate, counter; smooth on a mid-range Android. |
| M4 | Build-a-document flow | New document; camera capture append; add from gallery (time-sorted); insert after; retake; delete; undo. |
| M5 | Ordering tools | Tap-to-number mode; up/down; reverse; sort by time; long-press multi-select. |
| M6 | Inbox grouping | Algorithm §6 with tests; slider with live regrouping; create / merge / split. |
| M7 | Naming | Metadata editor; YYYYMMDD validation; filename builder in core.js with tests. |
| M8 | Export | PDF via share sheet; bundle export + import round-trip (export → wipe → import = identical state). |
| M9 | Share target & polish | Share-from-Gallery works; storage status in Settings; accessibility labels; README install guide. |

## 11. Phase 2: desktop (DO NOT BUILD YET, context only)
Bulk folder import (for photos transferred via Telegram etc.), a three-panel layout
(Inbox | Documents | Preview), drag-and-drop reordering, keyboard shortcuts,
side-by-side compare, and reading/writing folders on disk via the File System Access API
using the §8 bundle layout. Later ideas: OCR page numbers, auto-crop/deskew,
duplicate detection.

---

## 12. Doc templates (create these files in M0)

**docs/PROGRESS.md**
```markdown
# Progress
## Current milestone: M0 — Scaffold & deploy (status: Planning | In progress | Awaiting device test | Done)

## Log
### YYYYMMDD — <short task title>
- **Did**: what changed and why
- **Files**: files touched
- **Tested**: unit tests run / manual steps
- **Open issues**: anything unresolved
- **Next**: the very next step

## Manual test checklist — <milestone>
- [ ] step … expected result …
```

**docs/DECISIONS.md**
```markdown
# Decisions
## D001 — <title> (YYYYMMDD)
- **Context**: the problem
- **Decision**: what we chose
- **Alternatives**: what we rejected and why
- **Consequences**: trade-offs, follow-ups
```
Seed it with: D001 no build step / classic scripts; D002 on-device only, vendored libs;
D003 IndexedDB for blobs; D004 timestamp source (EXIF DateTimeOriginal → lastModified).

**docs/CHANGELOG.md**: Keep-a-Changelog style, with `## Unreleased` at the top.

**docs/MANIFEST_SCHEMA.md**: the §4 schema with field descriptions, invariants,
bundle layout (§8), and a migration history table.
