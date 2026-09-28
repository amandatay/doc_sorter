# Changelog
All notable user-facing changes to DocSorter.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Unreleased

## [M8+M9] — 2026-09-28
### Added
- Export document as PDF (📄 button in document detail header)
- PDF is A4, one page per image, image fitted and centred with 10 mm margins
- Each image downscaled to 2000 px long edge and respects the stored rotation
- Exported via Android share sheet (save to Files, send to WhatsApp, etc.); falls back to download link if share API is unavailable
- Share photos directly into DocSorter from Google Photos / Gallery via the share sheet — photos land in the Inbox automatically

## [M5+M7] — 2026-09-28
### Added
- Reorder toolbar in document detail: Reverse, Sort by time, and Tap-to-number mode
- Tap-to-number mode: tap pages in the desired order (1, 2, 3…), tap again to deselect; Apply commits the new order; Undo available
- Move up / Move down per-page actions in the action sheet
- Undo snackbar for Reverse and Sort by time
- Document metadata editor (✎ button in detail header): set title, category, date (YYYYMMDD with live validation)
- Category chips including "+ Custom" to add your own categories
- Live filename preview in metadata editor (e.g. `20260928_Medical_BloodTest.pdf`)

## [M3+M4] — 2026-09-28
### Added
- Full-screen image viewer: pinch-zoom (up to 6×), pan, swipe left/right, double-tap fit↔2×
- Rotate button in viewer — persists rotation to the page
- Page counter ("2 / 5") and close button in viewer
- Documents screen: card list showing first-page thumbnail, title, and page count
- New document button (FAB)
- Document detail: page grid with page numbers and per-page action menu
- Add page via camera (appends to end)
- Add pages from gallery (batch, sorted by capture time before appending)
- Insert after: capture a new page and insert it after any existing page
- Retake: replace a page's photo in-place (keeps page position)
- Delete page with single-level undo snackbar (4 s to undo)

## [M2] — 2026-09-28
### Added
- Import photos from gallery (multiple at once)
- Thumbnails generated and stored on device (400px, JPEG 0.8)
- Timestamps read from EXIF; files without EXIF show a "~" badge
- Progress bar during import — stays responsive with 200+ photos
- Thumbnails sorted by capture time in the Inbox
- Clear error message if a photo format can't be decoded (e.g. HEIC)

## [M1] — 2026-09-27
### Added
- App header bar with settings button
- Settings panel showing storage persistence status and storage used
- State is now saved to IndexedDB and survives app restarts

## [M0] — 2026-09-27
### Added
- App shell with Documents and Inbox screens and bottom navigation
- PWA manifest: installable on Android home screen
- Service worker: offline-capable after first load
