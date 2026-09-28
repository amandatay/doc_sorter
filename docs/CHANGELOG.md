# Changelog
All notable user-facing changes to DocSorter.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Unreleased

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
