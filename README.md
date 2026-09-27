# DocSorter

Turn phone photos of paper documents (medical reports, bills, letters) into ordered,
named PDFs. All processing happens on-device — photos never leave the device.

## Install on Android

1. Open Chrome and visit: `https://<your-github-username>.github.io/doc_sorter/`
2. Tap the three-dot menu → **Add to Home screen**
3. The app installs and works fully offline from that point on.

## Sharing photos directly from Gallery

Once installed, open your Gallery app, select photos, tap Share, and choose **DocSorter**.
The photos land straight in the Inbox.

## Local development

```bash
# Service workers require localhost or HTTPS — never file://
python3 -m http.server 8000
# then open http://localhost:8000

# Unit tests (Node.js built-in test runner)
node --test tests/
```

## Deploy to GitHub Pages

1. Create a repo named `doc_sorter` on GitHub.
2. Push the `main` branch.
3. In repo Settings → Pages → Source: **Deploy from branch** → `main` → `/ (root)`.
4. The app is live at `https://<your-github-username>.github.io/doc_sorter/`.

## Project layout

```
index.html            App shell, all UI, CSS and UI JS
core.js               Pure logic only (grouping, sorting, naming, manifest, migrations)
sw.js                 Service worker: offline cache + share-target handler
manifest.json         PWA manifest (install, icons, share_target)
icons/                App icons (192, 512, maskable)
vendor/               Vendored libs: exifr, jspdf, jszip (pinned versions, added in M2+)
tests/                node --test unit tests for core.js
docs/PROGRESS.md      Build log, current milestone, manual test checklists
docs/DECISIONS.md     Numbered decision records
docs/CHANGELOG.md     User-facing changes
docs/MANIFEST_SCHEMA.md  Data model and bundle format
```
