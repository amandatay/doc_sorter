# Progress

## Current milestone: M1 — Data model & storage (status: Awaiting device test)

## Log

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
