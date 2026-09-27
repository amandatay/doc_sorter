# Progress

## Current milestone: M0 — Scaffold & deploy (status: Awaiting device test)

## Log

### 20260927 — M0 scaffold
- **Did**: Created repo layout per CLAUDE.md. App shell with bottom nav (Documents / Inbox). PWA manifest with `share_target` declared. Service worker precaching all app files. Placeholder solid-color icons. All doc templates seeded.
- **Files**: `index.html`, `core.js`, `sw.js`, `manifest.json`, `icons/`, `vendor/.gitkeep`, `tests/core.test.js`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/CHANGELOG.md`, `docs/MANIFEST_SCHEMA.md`, `README.md`
- **Tested**: `node --test tests/` passes (1 smoke test). Manual checklist below to run on Android.
- **Open issues**: Icons are solid-color placeholders — replace with a real icon before M9.
- **Next**: M1 — Data model & storage.

## Manual test checklist — M0

- [ ] Visit `https://<your-github-username>.github.io/doc_sorter/` in Android Chrome → app loads with Documents and Inbox screens
- [ ] Browser shows install prompt → tap **Add to Home screen** → installs successfully
- [ ] Launch from home screen → opens as standalone (no browser address bar)
- [ ] Turn on airplane mode → reopen app → still loads (offline cache working)
- [ ] Tap **Inbox** in bottom nav → Inbox screen shown; tap **Documents** → Documents screen shown
- [ ] No JS errors in `chrome://inspect` DevTools console
- [ ] In DevTools → Application → Service Workers: SW is registered and active
