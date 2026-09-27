# Manifest Schema

## Current schema version: 1

Canonical definition of the DocSorter state format.
Applies to both the in-memory state (IndexedDB `state` store) and the project bundle (ZIP file).

## Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | integer | Schema version. Current: 1. |
| `app` | string | Always `"docsorter"`. |
| `updatedAt` | ISO 8601 string | Timestamp of last modification. |
| `pages` | object | Map of `pageId → Page`. |
| `documents` | array | Ordered list of Document objects. |
| `inbox` | array | pageIds of pages not yet assigned to a document. |
| `categories` | array | Available category strings. Default: `["Medical","Finance","Insurance","Home","Work","Other"]`. |

## Page object

| Field | Type | Description |
|-------|------|-------------|
| `originalName` | string | Original filename from the device. |
| `mime` | string | MIME type, e.g. `"image/jpeg"`. |
| `capturedAt` | string | Local capture time, no timezone: `"YYYY-MM-DDTHH:MM:SS"`. |
| `capturedAtSource` | `"exif"` \| `"lastModified"` | Source of `capturedAt`. |
| `width` | integer | Image width in pixels (before rotation). |
| `height` | integer | Image height in pixels (before rotation). |
| `rotation` | `0` \| `90` \| `180` \| `270` | Clockwise rotation applied on render and export. |

## Document object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique document ID. |
| `title` | string | User-given title. |
| `category` | string | One of the values in `categories`. |
| `date` | string | `YYYYMMDD`; defaults to the first page's capture date. |
| `pageIds` | array | Ordered list of pageIds making up this document. |
| `createdAt` | ISO 8601 string | When the document was created. |
| `updatedAt` | ISO 8601 string | When the document was last modified. |

## Invariants (validated in core.js, covered by tests)

- Every `pageId` in `pages` appears in exactly one place: `inbox` or one `documents[*].pageIds`.
- No dangling ids: every id in `inbox` and `documents[*].pageIds` must exist in `pages`.
- `date` matches `/^\d{8}$/` and is a valid calendar date.
- `rotation` is one of `0`, `90`, `180`, `270`.

## Bundle layout (ZIP)

```
DocSorter_{YYYYMMDD}_{HHMMSS}.zip
├── manifest.json            ← this schema
├── images/
│   └── {pageId}.{ext}      ← original images, unmodified
└── pdf/
    └── {basename}.pdf      ← one PDF per document
```

`{basename}` is `{YYYYMMDD}_{Category}_{TitlePascalCase}` (see §8 of instructions.md).

## Migration history

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2026-09-27 | Initial schema |
