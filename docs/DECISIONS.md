# Decisions

## D001 — No build step; classic script tags (20260927)
- **Context**: Need simple deployment to GitHub Pages with no CI pipeline. App must also open via `file://` in Phase 2.
- **Decision**: Vanilla JS with classic `<script>` tags. No bundler, no TypeScript, no ES modules.
- **Alternatives**: Vite (too much tooling overhead); ES modules (fail over `file://`).
- **Consequences**: No tree-shaking. Vendored libraries must be UMD/IIFE builds. Acceptable for this app's scale.

## D002 — On-device only; vendored libraries (20260927)
- **Context**: Privacy is a hard requirement — photos of medical/financial documents must never leave the device.
- **Decision**: No backend, no analytics, no CDN at runtime. All dependencies vendored in `/vendor` at pinned versions.
- **Alternatives**: CDN links for libraries (rejected: network dependency and privacy risk).
- **Consequences**: Slightly larger first load; vendor files must be updated manually.

## D003 — IndexedDB for blob storage (20260927)
- **Context**: App needs to store potentially hundreds of full-resolution photos offline.
- **Decision**: IndexedDB with two object stores: `blobs` (images + thumbnails) and `state` (manifest).
- **Alternatives**: Cache API (less suited to structured key-value data); localStorage (5 MB limit, synchronous only).
- **Consequences**: Requires async API throughout; must call `navigator.storage.persist()` to reduce eviction risk.

## D005 — node --test invocation (20260927)
- **Context**: CLAUDE.md originally listed `node --test tests/` as the test command. This fails with "Cannot find module" on Node 26 because the directory path is interpreted as a module, not a glob.
- **Decision**: Use `node --test` with no arguments; Node auto-discovers `**/*.test.js` files.
- **Alternatives**: `node --test 'tests/**/*.test.js'` (also works, but no-arg form is simpler and more portable).
- **Consequences**: Updated CLAUDE.md command accordingly.

## D004 — Timestamp source: EXIF DateTimeOriginal → lastModified fallback (20260927)
- **Context**: Grouping and ordering depend on accurate capture times.
- **Decision**: Read `DateTimeOriginal` via exifr. If missing, fall back to `File.lastModified` and set `capturedAtSource: "lastModified"` on the page.
- **Alternatives**: Rely solely on `lastModified` (unreliable — changes on file copy); filename parsing (inconsistent across devices).
- **Consequences**: Pages without EXIF get a visual indicator. Sort order may be wrong for those pages if timestamps are inaccurate.
