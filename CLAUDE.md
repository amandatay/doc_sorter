# CLAUDE.md — DocSorter

## What this is
DocSorter (working name) is an offline-first PWA that turns phone photos of paper
documents (medical reports, bills, letters) into ordered, named PDFs. All processing
happens on-device. Photos never leave the device.

The full product spec, data model and milestones are in `instructions.md`.
Read the relevant section before starting any milestone.

## Current phase
**Phase 1: Android phone (Chrome), installed as a PWA from GitHub Pages.**
Phase 2 (desktop) is out of scope until I sign off Phase 1. Do not build Phase 2 features.
The current milestone and status are always in `docs/PROGRESS.md`.

## Session start checklist
1. Read this file, `docs/PROGRESS.md`, and the current milestone in `instructions.md`.
2. Check `docs/DECISIONS.md` before revisiting anything that looks like a settled choice.
3. Run `git status` and `git log --oneline -10` to confirm where things stand.
4. If PROGRESS.md and the code disagree, tell me before doing anything else.

## Workflow: Explore → Plan → Implement → Commit
- **Explore**: read the relevant code and docs. No code changes yet.
- **Plan**: write a short plan (tasks, files touched, test approach, risks). Wait for my
  approval before implementing a milestone. Small fixes within an approved plan don't
  need re-approval.
- **Implement**: one task at a time, in the smallest working increment.
- **Commit**: after each task, with the matching doc updates in the same commit.

## Documentation rules (non-negotiable)
Document often. Stale docs are treated as a bug, same as broken code.
- **After every completed task** (not just every session), append an entry to
  `docs/PROGRESS.md` using the template in that file.
- **Every non-obvious choice**, trade-off, workaround or rejected alternative goes in
  `docs/DECISIONS.md` as a numbered entry.
- **Every user-visible change** goes in `docs/CHANGELOG.md` under `## Unreleased`.
- **Any data model or bundle format change**: update `docs/MANIFEST_SCHEMA.md`, bump
  `schemaVersion`, and write a migration in `core.js` with a test.
- **Code comments**: every function in `core.js` gets a JSDoc block (purpose, params,
  returns, edge cases). Each section of `index.html` starts with a banner comment
  describing what it does and which milestone added it.
- **Never end a turn with code changed and docs not updated.** If context is running
  low, stop coding and update PROGRESS.md with exactly where you stopped and what's next.
- If you notice the docs contradict the code, fix the docs or flag it immediately.

## Hard constraints
- **Privacy**: no backend, no analytics, no telemetry, no runtime network requests other
  than the app's own files. No CDNs at runtime. Third-party libraries are vendored in
  `/vendor`, with name, version and source URL recorded in DECISIONS.md.
- **No build step**: no framework, no bundler, no TypeScript. Vanilla JS with classic
  `<script>` tags. No ES modules, because they fail when opened via `file://`, which
  Phase 2 needs.
- **No new dependency without asking me first.** Current approved list: exifr, jsPDF, JSZip.
- **Relative paths only**: GitHub Pages serves the app under `/<repo-name>/`, so never
  use root-absolute URLs (`/foo`) in HTML, manifest or service worker.
- **Dates**: always `YYYYMMDD` for document dates in the UI, filenames and manifest.
  Machine timestamps (capturedAt, createdAt) are ISO 8601.
- **Mobile-first**: portrait layout, 44px minimum tap targets, usable one-handed,
  smooth with 200+ photos loaded.
- **Service worker**: bump `CACHE_VERSION` in `sw.js` whenever any cached file changes.

## Repo layout
```
index.html            App shell, all UI, CSS and UI JS (inline, sectioned with banners)
core.js               Pure logic only (grouping, sorting, naming, manifest, migrations)
sw.js                 Service worker: offline cache + share-target handler
manifest.json         PWA manifest (install, icons, share_target)
icons/                App icons (192, 512, maskable)
vendor/               Vendored libs: exifr, jspdf, jszip (pinned versions)
tests/                node --test unit tests for core.js
docs/PROGRESS.md      Running build log + current milestone + manual test checklists
docs/DECISIONS.md     Numbered decision records
docs/CHANGELOG.md     User-facing changes
docs/MANIFEST_SCHEMA.md  Data model + project bundle format
README.md             What it is, how to install on Android, how to deploy
```

## Commands
- Local server: `python3 -m http.server 8000` (service workers need localhost or HTTPS,
  not `file://`)
- Unit tests: `node --test` (auto-discovers `**/*.test.js`; `node --test tests/` fails on Node 26)
- Phone testing: deploy to GitHub Pages, or use `chrome://inspect` with USB port forwarding.

## Testing
- All pure logic lives in `core.js` and must have node tests. `core.js` exposes a `Core`
  global in the browser and `module.exports` in Node.
- You cannot test on my phone. For every milestone, write a manual test checklist in
  PROGRESS.md for me to run on Android. A milestone is only marked **Done** after I
  confirm the checklist passed.

## Commits
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- One logical change per commit. Doc updates ride in the same commit as the code.
- Never commit with failing tests.
