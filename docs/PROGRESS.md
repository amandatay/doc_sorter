# Progress

## Current milestone: M3+M4 — Viewer + Build-a-document (status: In progress — awaiting device test)

## Log

### 20260928 — M3+M4 viewer + build-a-document
- **Did**: Full-screen image viewer (M3) with Pointer Events pinch-zoom/pan/swipe/double-tap, rotate button (persists via Core.rotatePage), page counter, close button. Documents screen (M4): card list, New document FAB, document detail sub-screen with page grid, per-page action sheet (Rotate/Insert after/Retake/Delete), Add via camera, Add from gallery (time-sorted batch), undo snackbar (4 s). Core additions: rotatePage, removePageFromInbox, addDocument, movePageToDocument, addPageToDocument, insertAfterInDocument, retakePage, deletePageFromDocument — all with unit tests (63 total, all passing). sw.js CACHE_VERSION → 5.
- **Files**: `core.js`, `tests/core.test.js`, `index.html`, `sw.js`, `docs/PROGRESS.md`, `docs/CHANGELOG.md`
- **Tested**: `node --test` → 63/63. Manual checklist below to run on Android.
- **Open issues**: Viewer rotation for 90°/270° images uses a CSS scale approximation — verify on device that portrait photos look correct.
- **Next**: M5 — Reordering tools (tap-to-number, up/down arrows, reverse, sort-by-time).

### 20260928 — M2 import & timestamps
- **Did**: Gallery import (multiple files). EXIF DateTimeOriginal via exifr 7.1.3 lite, with lastModified fallback and "~" badge on thumbnails. Thumbnail generation (canvas, 400px long edge, JPEG 0.8). Progress bar during import (yields every file to stay responsive). HEIC/unsupported format error alert. Inbox renders thumbnails sorted by capturedAt. `sortPageEntries`, `sortedInboxEntries`, `formatLocalDateTime` added to core.js. 40 unit tests (all passing).
- **Files**: `core.js`, `tests/core.test.js`, `index.html`, `sw.js` (CACHE_VERSION → 3), `vendor/exifr/exifr.umd.js`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`
- **Tested**: `node --test` → 40/40. Manual checklist below to run on Android.
- **Open issues**: D007 (EXIF orientation) needs verification on real device.
- **Next**: M3 — Viewer (pinch, pan, swipe, rotate).

### 20260927 — M1 data model & storage
- **Did**: Added all Core model helpers (`createState`, `createPage`, `createDocument`, `addPageToInbox`, `validateState`, `isValidDate`, `applyMigrations`) with full invariant checking. Added IndexedDB wrapper (`DB`) with `state` and `blobs` stores. App now loads/saves state on startup and calls `navigator.storage.persist()`. Settings bottom sheet shows persistence status and storage estimate. 30 unit tests, all passing.
- **Files**: `core.js`, `tests/core.test.js`, `index.html`, `sw.js` (CACHE_VERSION → 2), `docs/PROGRESS.md`, `docs/CHANGELOG.md`
- **Tested**: `node --test` → 30/30. Manual checklist below to run on Android.
- **Open issues**: None.
- **Next**: M2 — Import & timestamps.

### 20260927 — M0 scaffold
- **Did**: Created repo layout per CLAUDE.md. App shell with bottom nav (Documents / Inbox). PWA manifest with `share_target` declared. Service worker precaching all app files. Placeholder solid-color icons. All doc templates seeded.
- **Files**: `index.html`, `core.js`, `sw.js`, `manifest.json`, `icons/`, `vendor/.gitkeep`, `tests/core.test.js`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/MANIFEST_SCHEMA.md`, `README.md`
- **Tested**: `node --test` passes (1 smoke test). Manual checklist below to run on Android.
- **Open issues**: Icons are solid-color placeholders — replace with a real icon before M9.
- **Next**: M1 — Data model & storage.

## Manual test checklist — M3+M4

### Viewer (M3)
- [ ] Tap any thumbnail in Inbox → viewer opens full-screen with page counter (e.g. "1 / 5")
- [ ] Swipe left / right at fit scale → navigates between pages
- [ ] Pinch to zoom in → image scales up (max 6×); swipe no longer navigates
- [ ] Pan when zoomed — image moves, stays within bounds
- [ ] Double-tap → zooms to 2×; double-tap again → returns to fit
- [ ] Tap rotate button (↻) → image rotates 90° CW; counter still shows correct page
- [ ] Close viewer (✕) → returns to Inbox with thumbnail showing new rotation
- [ ] Reopen app → rotated thumbnail is still rotated (persisted to IndexedDB)

### Documents screen (M4)
- [ ] Open Documents tab → "No documents yet" placeholder shown, "+" FAB visible
- [ ] Tap "+" FAB → new "Untitled" document created; detail view opens immediately
- [ ] Tap back (←) → returns to document list; card for "Untitled" shown
- [ ] Card shows page count (0 pages initially)

### Document detail (M4)
- [ ] Open a document → Camera and Gallery buttons visible at top
- [ ] Tap Camera → camera opens; take a photo → photo appears as page 1 in grid
- [ ] Tap Gallery → gallery opens; select 3 photos taken out of order → they appear sorted by capture time
- [ ] Page numbers shown in bottom-right corner of each cell
- [ ] Tap a page thumbnail → viewer opens showing only this document's pages
- [ ] Tap "⋮" menu on a page → action sheet appears with Rotate, Insert after, Retake, Delete
- [ ] Rotate from action sheet → thumbnail updates rotation; viewer shows correct rotation
- [ ] Insert after → camera opens; new page inserted after the selected page (not at end)
- [ ] Retake → camera opens; same page position is replaced with new photo
- [ ] Delete → page removed; undo snackbar appears for ~4 s; tap Undo → page restored

## Manual test checklist — M2

- [ ] Open app → tap Inbox tab → "Inbox is empty" placeholder shown, "Import photos" button visible
- [ ] Tap "Import photos" → gallery opens, can select multiple photos
- [ ] Select 3–5 photos → progress bar appears, then thumbnails appear in a grid
- [ ] Thumbnails are sorted by capture time (oldest first)
- [ ] Photos without EXIF data show a "~" badge (test by importing a screenshot)
- [ ] Close app fully → reopen → thumbnails are still there (persisted through IndexedDB)
- [ ] Import 20+ photos → app stays responsive during import, progress counter updates
- [ ] Portrait photos appear upright (not sideways) → confirms EXIF orientation auto-correction (record finding in DECISIONS.md D007)
- [ ] Try importing a HEIC photo (if available) → either imports fine or shows a clear error message

## Manual test checklist — M1

- [ ] Open app → app header ("DocSorter") visible at top with a ⚙ button
- [ ] Tap ⚙ → settings sheet slides up showing Storage persistence, Storage used, Schema version
- [ ] "Storage persistence" shows "Granted" or "Not granted" (not "Checking…")
- [ ] "Storage used" shows a number (e.g. "0.0 MB of 4096 MB")
- [ ] Tap Done or the backdrop → sheet closes
- [ ] Open DevTools (chrome://inspect) → Application → IndexedDB → docsorter → two stores: `state` and `blobs`
- [ ] The `state` store has a record keyed `"current"` with a valid JSON object
- [ ] Close app fully (swipe away) → reopen → app loads, no errors in console
- [ ] Check that the state record in IndexedDB is still there after restart

## Manual test checklist — M0

- [x] Visit `https://amandatay.github.io/doc_sorter/` in Android Chrome → app loads with Documents and Inbox screens
- [x] Browser shows install prompt → install as app → installs successfully (use three-dot menu → "Install app", not "Add to Home screen" shortcut)
- [x] Launch from home screen → opens as standalone (no browser address bar)
- [x] Turn on airplane mode → reopen app → still loads (offline cache working)
- [x] Tap **Inbox** in bottom nav → Inbox screen shown; tap **Documents** → Documents screen shown
- [ ] No JS errors in `chrome://inspect` DevTools console
- [ ] In DevTools → Application → Service Workers: SW is registered and active
