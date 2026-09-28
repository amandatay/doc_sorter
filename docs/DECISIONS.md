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

## D007 — EXIF orientation: rely on Chrome auto-correction (20260928)
- **Context**: Android photos often have EXIF Orientation tags. The spec says "apply EXIF Orientation only if the browser hasn't already." Canvas drawImage uses the rendered img element which Chrome auto-corrects.
- **Decision**: Rely on Chrome's auto-correction of EXIF orientation in img elements. The canvas thumbnail is drawn from the auto-corrected img, so it will be correctly oriented. Store `width`/`height` as img.naturalWidth/naturalHeight (post-correction dimensions).
- **Verified 20260928**: Confirmed on real Android device — Chrome auto-corrects EXIF orientation for both portrait and landscape camera photos. No manual rotation needed at import time.
- **Alternatives**: Manually apply EXIF rotation on canvas (complex, requires reading Orientation tag separately). Rejected because Chrome handles this for us.
- **Consequences**: None — orientation is handled correctly by the browser.

## D006 — exifr 7.1.3 lite UMD build (20260928)
- **Context**: Need to read DateTimeOriginal EXIF tag from imported photos to sort and group them accurately.
- **Decision**: exifr 7.1.3, lite UMD build (`lite.umd.cjs`, ~45KB). Reads basic JPEG EXIF. Vendored at `vendor/exifr/exifr.umd.js`.
- **Alternatives**: Full build (~120KB, includes IPTC/XMP) — overkill since we only need DateTimeOriginal. Manual EXIF parsing — unnecessary complexity.
- **Consequences**: Files that exifr can't parse (some edge cases) silently fall back to lastModified with a "~" indicator on the thumbnail. Acceptable.

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
