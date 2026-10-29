# Progress

## Current milestone: Folders (status: Done — awaiting device test)
## Next milestone: —

## Log

### 20261029 — Folders (schema v2)
- **Did**: Folders feature. Data model: `folders: [{id, name, documentIds[], createdAt, updatedAt}]` added to state, schemaVersion 1→2 with migration. Core: `createFolder`, `addFolder`, `renameFolder`, `deleteFolder`, `moveDocumentToFolder`; `deleteDocument` now also removes the doc from any folder; `validateState` checks folder invariants. 24 new unit tests (117 total). UI: second FAB (📁, above +) creates a folder via prompt; folder section headers show name + doc count + ⋮; ⋮ on folder → rename/delete with undo; ⋮ on doc card → "Move to folder" picker sheet (shows folders + Unfiled, checkmark on current); docs indented under their folder; "Unfiled" section divider shown when folders exist. sw.js CACHE_VERSION → 14.
- **Files**: `core.js`, `tests/core.test.js`, `index.html`, `sw.js`, `docs/PROGRESS.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md`, `docs/MANIFEST_SCHEMA.md`
- **Tested**: `node --test` → 117/117.
- **Next**: Manual checklist below, then device test.

### Manual test checklist — Folders + UI polish 20261029

#### Migration (existing data)
- [ ] Open app with existing documents → app loads, all existing documents visible and intact
- [ ] Settings → Schema version shows "2"

#### Folders
- [ ] Tap 📁 FAB (above + button) → prompt appears for folder name
- [ ] Enter a name → folder section header appears in the list with the name and "(0)"
- [ ] Tap ⋮ on the folder header → action sheet: Rename folder / Delete folder
- [ ] Tap Rename → prompt shows current name; change it → header name updates
- [ ] Tap ⋮ on a document card → "Move to folder" option visible
- [ ] Tap "Move to folder" → picker sheet shows folder name + Unfiled option with checkmarks
- [ ] Tap a folder in the picker → document moves under that folder section (indented card)
- [ ] Folder header count updates (e.g. "(1)")
- [ ] Tap "Move to folder" on an already-filed doc → current folder has ✓; tap another folder → doc moves
- [ ] Tap "Unfiled" in picker → doc returns to Unfiled section
- [ ] Unfiled section divider only appears when at least one folder exists and at least one doc is unfiled
- [ ] Tap ⋮ → Delete folder → folder header disappears; its documents appear in Unfiled
- [ ] Undo within 4 s → folder and its documents restored to the folder

#### Delete document
- [ ] Tap ⋮ on doc card → "Delete document"
- [ ] Delete a doc that was in a folder → doc gone; folder count decrements
- [ ] Undo → doc reappears in the folder

#### FAB fix
- [ ] Open a document detail view → 📁 FAB and + FAB are both hidden
- [ ] Press back → both FABs reappear

### 20261029 — UI polish: delete document, remove Inbox tab, FAB fix
- **Did**: (1) Added `Core.deleteDocument` — removes document and all its pages from state; 4 new tests (93 total). (2) Delete document: ⋮ button on each document card opens a doc action sheet with "Delete document"; delete uses same undo-snackbar pattern as page delete (4 s window). (3) Removed Inbox tab from nav; `<nav>` element removed; Inbox screen kept hidden in DOM for share-target import. FAB `bottom` CSS updated (removed 56 px nav offset). (4) Fixed FAB re-appearing when tapping the Documents nav area while inside a document — `showScreen` now checks if detail view is open. (5) Share target now stays on Documents screen instead of switching to hidden Inbox. sw.js CACHE_VERSION → 13.
- **Files**: `core.js`, `tests/core.test.js`, `index.html`, `sw.js`, `docs/PROGRESS.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md`
- **Tested**: `node --test` → 93/93.
- **Next**: Manual checklist below to run on Android.

### Manual test checklist — UI polish 20261029

#### Delete document
- [ ] Open app → document list visible, no bottom nav (Inbox gone)
- [ ] Tap ⋮ on a document card → action sheet slides up with "Delete document"
- [ ] Tap "Delete document" → document disappears from list; "Document deleted." snackbar appears
- [ ] Tap Undo within 4 s → document reappears in the list
- [ ] Let snackbar expire without tapping Undo → document stays deleted, reopen app → still gone

#### FAB fix
- [ ] Open a document → "+" FAB is not visible
- [ ] Go back to document list → "+" FAB reappears in bottom-right

#### Inbox removed
- [ ] No Inbox tab anywhere in the UI

### 20260929 — M8 PDF export fix (save to Downloads)
- **Did**: Fixed blank PDF export. Root causes: (1) canvas.toDataURL() silently failed on Android Chrome in a PWA context — switched to FileReader.readAsDataURL() reading the blob directly from IndexedDB (D011). (2) Web Share API caused blank pages in Android PDF viewers — switched to `<a download>` saving directly to Downloads folder (D010). Both fixes confirmed working on device. sw.js CACHE_VERSION → 11.
- **Files**: `index.html`, `sw.js`, `docs/PROGRESS.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md`
- **Tested**: `node --test` → 89/89. PDF export confirmed on device 20260929.
- **Next**: M9 share target — needs device test (receive shared photos from Gallery).

### 20260928 — M8+M9 PDF export + share target (initial)
- **Did**: PDF export (📄 button in document detail) — jsPDF 2.5.2 UMD min, respects stored rotation, A4 with 10mm margins. Share target (M9): sw.js now reads FormData files from POST, stashes each as a Response in `docsorter-share-queue` cache, redirects to app; app drains queue on startup when `?shared=1` in URL and imports to inbox. No new core.js functions needed. sw.js CACHE_VERSION → 9.
- **Files**: `index.html`, `sw.js`, `vendor/jspdf/jspdf.umd.min.js`, `docs/PROGRESS.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md`
- **Tested**: `node --test` → 89/89. Manual checklist below to run on Android.
- **Next**: Fix blank PDF pages (see 20260929 entry above).

### 20260928 — M5+M7 reorder + naming
- **Did**: Reorder toolbar (Reverse, Sort by time, Tap-to-number mode with Apply/Cancel/Undo). Move up/down in per-page action sheet. Metadata editor sheet (✎ button): title, category chips with custom option, YYYYMMDD date with live validation, live filename preview. Core additions: reorderPages, reverseDocPages, sortDocPagesByTime, buildFilename, updateDocumentMeta, addCategory — 89 unit tests, all passing. sw.js CACHE_VERSION → 6. M6 (inbox grouping) skipped per user request.
- **Files**: `core.js`, `tests/core.test.js`, `index.html`, `sw.js`, `docs/PROGRESS.md`, `docs/CHANGELOG.md`
- **Tested**: `node --test` → 89/89. Manual checklist below to run on Android.
- **Next**: M8+M9 — PDF export + share target.

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

## Manual test checklist — M8+M9

### PDF export (M8)
- [ ] Open a document with at least 2 pages → 📄 button visible in the header
- [ ] Tap 📄 → progress overlay appears showing "Page 1 of N…"
- [ ] Progress completes → Android share sheet opens with a PDF file
- [ ] Save PDF to Files app → open it → all pages present, correct orientation, readable
- [ ] Rotate a page in the viewer, then export → rotated page appears correctly in the PDF
- [ ] Try exporting an empty document → alert says "no pages to export" (no crash)

### Share target (M9)
- [ ] Open Google Photos (or Gallery) → select 2–3 photos → tap Share → DocSorter appears in the share sheet
- [ ] Tap DocSorter → app opens on the Inbox screen and the shared photos appear as imported thumbnails
- [ ] Confirm photos are fully imported (thumbnails visible, no errors)
- [ ] Share a single photo → same result

## Manual test checklist — M5+M7

### Reordering (M5)
- [ ] Open a document with 3+ pages → reorder toolbar visible below Camera/Gallery buttons
- [ ] Tap "↕ Reorder" → toolbar switches to "X/Y tapped" status + Apply / Cancel buttons
- [ ] Tap pages in desired order → each shows a large centred number; un-tapped pages dim
- [ ] Tap a numbered page again → number disappears (deselected)
- [ ] Tap Apply → pages reordered (tapped first in tap order, then remaining in original order); undo snackbar appears
- [ ] Tap Undo in snackbar → original order restored
- [ ] Tap Cancel in reorder mode → order unchanged, mode exits
- [ ] Tap "⇅ Reverse" → page order reversed; undo snackbar appears
- [ ] Tap "⏱ By time" → pages sorted by capture time; undo snackbar appears
- [ ] Tap ⋮ on a page → action sheet shows Move up and Move down (Move up disabled on first page, Move down disabled on last)
- [ ] Tap Move up / Move down → page moves one step; no snackbar needed

### Metadata editor (M7)
- [ ] Open a document → header shows ✎ button next to title
- [ ] Tap ✎ → metadata sheet slides up with Title, Category, Date, filename preview
- [ ] Type a title → filename preview updates live
- [ ] Tap a category chip → chip highlights, filename preview updates
- [ ] Tap "+ Custom" → prompt appears; enter a category name → it appears as a chip
- [ ] Type 8 digits in Date (e.g. 20260928) → no error shown, filename updates
- [ ] Type an invalid date (e.g. 20261399) → red error message appears; Save is blocked
- [ ] Clear date field → no error; filename omits date prefix
- [ ] Tap Save → sheet closes; header title updates; document card in list updates

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
