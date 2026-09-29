# Decisions

## D010 — PDF export saves to Downloads, not Web Share API (20260929)
- **Context**: M8 PDF export originally used `navigator.share({ files: [pdfFile] })` to open the Android share sheet. PDF was confirmed to save correctly but opened blank in Android PDF viewers when received via the share sheet.
- **Decision**: Save the PDF directly to Downloads via a `<a download>` click. Confirmed working on device.
- **Alternatives**: Web Share API (rejected: blank pages in receiving apps on Android). No obvious workaround found.
- **Consequences**: PDF lands in Downloads folder. User can then open, move, or share it from there. No direct-to-WhatsApp in one step, but reliable.

## D011 — PDF image pipeline: FileReader blob → data URL (20260929)
- **Context**: Three canvas-based approaches all produced blank/near-empty PDFs: (1) blob URL passed to jsPDF, (2) canvas element passed to jsPDF, (3) `canvas.toDataURL()`. All failed on Android Chrome.
- **Decision**: Read the stored JPEG blob from IndexedDB via `FileReader.readAsDataURL()` and pass the resulting data URL to `pdf.addImage()`. No canvas involved.
- **Alternatives**: Canvas approaches (all failed silently on Android). Root cause unknown — likely canvas security/rendering restrictions in a PWA context.
- **Consequences**: PDF export uses full-resolution blobs (no downscaling). File size may be large for multi-page documents; acceptable for Phase 1.

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

## D008 — jsPDF 2.5.2 UMD min build (20260928)
- **Context**: Need to generate PDFs on-device for export. jsPDF is pre-approved in CLAUDE.md.
- **Decision**: jsPDF 2.5.2, UMD minified build (`jspdf.umd.min.js`, ~366 KB). Exposes `window.jspdf`; constructor is `window.jspdf.jsPDF`. Vendored at `vendor/jspdf/jspdf.umd.min.js`.
- **Alternatives**: Full (non-minified) build — larger with no benefit at runtime. ES module build — incompatible with no-bundler constraint (D001).
- **Consequences**: ~366 KB added to first load; precached by service worker so subsequent loads are instant.

## D009 — Share-target file queue via Cache API (20260928)
- **Context**: Android share sheet sends files via POST to the service worker. The SW must stash them somewhere before redirecting to the app, which then reads them.
- **Decision**: Store each shared file as a `Response` in a dedicated `docsorter-share-queue` Cache API cache. Key is `share-item-{timestamp}-{index}`. Custom `X-File-Name` header preserves the original filename. App drains and deletes the queue on startup when `?shared=1` is in the URL.
- **Alternatives**: IndexedDB from sw.js (requires duplicating IDB open logic in sw.js); postMessage to the page (race condition if page not yet loaded).
- **Consequences**: Cache API entries survive if the app crashes before draining — cleared on next startup. The `share-queue` cache is excluded from the activate cleanup loop.

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
