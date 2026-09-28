/* Core — pure logic only. No DOM, no IndexedDB, no network.
 * Exposed as window.Core in the browser and module.exports in Node. */

const Core = {

  DEFAULT_CATEGORIES: ['Medical', 'Finance', 'Insurance', 'Home', 'Work', 'Other'],

  /** Returns a unique ID using crypto.randomUUID() (available in Node 19+ and modern browsers). */
  generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  },

  /** Returns a fresh empty state at schemaVersion 1. */
  createState() {
    return {
      schemaVersion: 1,
      app: 'docsorter',
      updatedAt: new Date().toISOString(),
      pages: {},
      documents: [],
      inbox: [],
      categories: [...this.DEFAULT_CATEGORIES],
    };
  },

  /**
   * Returns a new Page object with rotation defaulting to 0.
   * @param {object} p
   * @param {string} p.originalName
   * @param {string} p.mime
   * @param {string} p.capturedAt  - local time, no TZ: "YYYY-MM-DDTHH:MM:SS"
   * @param {'exif'|'lastModified'} p.capturedAtSource
   * @param {number} p.width  - pixels (post-EXIF-orientation, pre-user-rotation)
   * @param {number} p.height - pixels (post-EXIF-orientation, pre-user-rotation)
   */
  createPage({ originalName, mime, capturedAt, capturedAtSource, width, height }) {
    return { originalName, mime, capturedAt, capturedAtSource, width, height, rotation: 0 };
  },

  /**
   * Returns a new Document object with a generated ID and ISO timestamps.
   * @param {object} [fields]
   * @param {string} [fields.title='Untitled']
   * @param {string} [fields.category='Other']
   * @param {string} [fields.date='']   - YYYYMMDD
   * @param {string[]} [fields.pageIds=[]]
   */
  createDocument({ title = 'Untitled', category = 'Other', date = '', pageIds = [] } = {}) {
    const now = new Date().toISOString();
    return {
      id: this.generateId(),
      title,
      category,
      date,
      pageIds: [...pageIds],
      createdAt: now,
      updatedAt: now,
    };
  },

  /**
   * Returns true if str is a valid YYYYMMDD date string.
   * Checks format, range, and calendar validity (e.g. rejects Feb 29 on non-leap years).
   * @param {string} str
   */
  isValidDate(str) {
    if (typeof str !== 'string' || !/^\d{8}$/.test(str)) return false;
    const y = +str.slice(0, 4), m = +str.slice(4, 6), d = +str.slice(6, 8);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  },

  /**
   * Validates all state invariants. Returns an array of error strings; empty = valid.
   *
   * Invariants checked:
   *   - Every pageId appears in exactly one place (inbox or one document, never both/twice).
   *   - No dangling ids: every referenced pageId must exist in pages, and every page must
   *     be referenced somewhere.
   *   - Document dates are valid YYYYMMDD (if non-empty).
   *   - Page rotations are one of 0 | 90 | 180 | 270.
   *
   * @param {object} state
   * @returns {string[]}
   */
  validateState(state) {
    const errors = [];
    if (!state || typeof state !== 'object') return ['state must be an object'];

    const pages = state.pages || {};
    const inbox = state.inbox || [];
    const docs  = state.documents || [];

    const seen = new Map(); // pageId → location label

    for (const pid of inbox) {
      if (seen.has(pid)) errors.push(`pageId "${pid}" appears more than once (inbox)`);
      else seen.set(pid, 'inbox');
    }

    for (const doc of docs) {
      for (const pid of (doc.pageIds || [])) {
        if (seen.has(pid)) errors.push(`pageId "${pid}" is in multiple places`);
        else seen.set(pid, `doc:${doc.id}`);
      }
    }

    for (const [pid, loc] of seen) {
      if (!Object.prototype.hasOwnProperty.call(pages, pid)) {
        errors.push(`pageId "${pid}" (in ${loc}) not found in pages`);
      }
    }

    for (const pid of Object.keys(pages)) {
      if (!seen.has(pid)) {
        errors.push(`pageId "${pid}" is in pages but not in inbox or any document`);
      }
    }

    for (const doc of docs) {
      if (doc.date && !this.isValidDate(doc.date)) {
        errors.push(`document "${doc.id}" has invalid date: "${doc.date}"`);
      }
    }

    const validRotations = new Set([0, 90, 180, 270]);
    for (const [pid, page] of Object.entries(pages)) {
      if (!validRotations.has(page.rotation)) {
        errors.push(`page "${pid}" has invalid rotation: ${page.rotation}`);
      }
    }

    return errors;
  },

  /**
   * Returns a new state with pageId/page added to inbox and pages.
   * Does not mutate the input state.
   * @param {object} state
   * @param {string} pageId
   * @param {object} page - from createPage()
   */
  addPageToInbox(state, pageId, page) {
    return {
      ...state,
      updatedAt: new Date().toISOString(),
      pages: { ...state.pages, [pageId]: page },
      inbox: [...state.inbox, pageId],
    };
  },

  /**
   * Runs schema migrations on a state loaded from storage.
   * Returns the state at schemaVersion 1 (current).
   * Throws if the version is unrecognised.
   * @param {object} state
   */
  applyMigrations(state) {
    const v = state && state.schemaVersion;
    if (v === 1) return state;
    throw new Error(`Unsupported schemaVersion: ${v}`);
  },

  /**
   * Formats a Date as a local datetime string "YYYY-MM-DDTHH:MM:SS" with no timezone.
   * Matches the EXIF DateTimeOriginal format and is used for capturedAt values.
   * @param {Date} date
   * @returns {string}
   */
  formatLocalDateTime(date) {
    const p = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
           `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
  },

  /**
   * Sorts an array of [pageId, page] pairs by capturedAt ascending,
   * with originalName (natural sort) as the tiebreaker.
   * Returns a new array; does not mutate the input.
   * @param {Array<[string, object]>} entries
   * @returns {Array<[string, object]>}
   */
  sortPageEntries(entries) {
    return [...entries].sort((a, b) => {
      const ta = a[1].capturedAt, tb = b[1].capturedAt;
      if (ta < tb) return -1;
      if (ta > tb) return  1;
      return a[1].originalName.localeCompare(
        b[1].originalName, undefined, { numeric: true, sensitivity: 'base' }
      );
    });
  },

  /**
   * Returns the inbox pages as sorted [pageId, page] pairs (capturedAt asc, name tiebreaker).
   * @param {object} state
   * @returns {Array<[string, object]>}
   */
  sortedInboxEntries(state) {
    return this.sortPageEntries(
      (state.inbox || []).map(id => [id, state.pages[id]])
    );
  },

  /**
   * Advances a page's rotation by 90° clockwise (0→90→180→270→0).
   * @param {object} state
   * @param {string} pageId
   */
  rotatePage(state, pageId) {
    const page = state.pages[pageId];
    if (!page) throw new Error(`rotatePage: pageId "${pageId}" not found`);
    return {
      ...state,
      updatedAt: new Date().toISOString(),
      pages: { ...state.pages, [pageId]: { ...page, rotation: (page.rotation + 90) % 360 } },
    };
  },

  /**
   * Removes a page from the inbox and the pages map.
   * Caller is responsible for deleting the associated blobs from IndexedDB.
   * @param {object} state
   * @param {string} pageId
   */
  removePageFromInbox(state, pageId) {
    const pages = { ...state.pages };
    delete pages[pageId];
    return {
      ...state,
      updatedAt: new Date().toISOString(),
      pages,
      inbox: state.inbox.filter(id => id !== pageId),
    };
  },

  /**
   * Moves a page from the inbox to the end of a document's pageIds.
   * The page object stays in state.pages unchanged.
   * @param {object} state
   * @param {string} pageId
   * @param {string} docId
   */
  movePageToDocument(state, pageId, docId) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`movePageToDocument: docId "${docId}" not found`);
    const now = new Date().toISOString();
    return {
      ...state,
      updatedAt: now,
      inbox: state.inbox.filter(id => id !== pageId),
      documents: state.documents.map(d =>
        d.id === docId ? { ...d, pageIds: [...d.pageIds, pageId], updatedAt: now } : d
      ),
    };
  },

  /**
   * Adds a new page directly to the end of a document (e.g. captured via camera).
   * @param {object} state
   * @param {string} docId
   * @param {string} pageId
   * @param {object} page - from createPage()
   */
  addPageToDocument(state, docId, pageId, page) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`addPageToDocument: docId "${docId}" not found`);
    const now = new Date().toISOString();
    return {
      ...state,
      updatedAt: now,
      pages: { ...state.pages, [pageId]: page },
      documents: state.documents.map(d =>
        d.id === docId ? { ...d, pageIds: [...d.pageIds, pageId], updatedAt: now } : d
      ),
    };
  },

  /**
   * Inserts a new page immediately after afterId in a document.
   * @param {object} state
   * @param {string} docId
   * @param {string} afterId  - existing pageId to insert after
   * @param {string} newId    - new pageId
   * @param {object} newPage  - from createPage()
   */
  insertAfterInDocument(state, docId, afterId, newId, newPage) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`insertAfterInDocument: docId "${docId}" not found`);
    const idx = doc.pageIds.indexOf(afterId);
    if (idx === -1) throw new Error(`insertAfterInDocument: afterId "${afterId}" not in doc`);
    const newPageIds = [...doc.pageIds];
    newPageIds.splice(idx + 1, 0, newId);
    const now = new Date().toISOString();
    return {
      ...state,
      updatedAt: now,
      pages: { ...state.pages, [newId]: newPage },
      documents: state.documents.map(d =>
        d.id === docId ? { ...d, pageIds: newPageIds, updatedAt: now } : d
      ),
    };
  },

  /**
   * Replaces a page's data in-place (used by Retake — keeps the pageId and its position).
   * Caller is responsible for updating the blobs in IndexedDB.
   * @param {object} state
   * @param {string} pageId
   * @param {object} newPage - from createPage()
   */
  retakePage(state, pageId, newPage) {
    if (!Object.prototype.hasOwnProperty.call(state.pages, pageId)) {
      throw new Error(`retakePage: pageId "${pageId}" not found`);
    }
    return {
      ...state,
      updatedAt: new Date().toISOString(),
      pages: { ...state.pages, [pageId]: newPage },
    };
  },

  /**
   * Removes a page from a document and from the pages map.
   * Caller is responsible for deleting the associated blobs from IndexedDB.
   * @param {object} state
   * @param {string} docId
   * @param {string} pageId
   */
  deletePageFromDocument(state, docId, pageId) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`deletePageFromDocument: docId "${docId}" not found`);
    const pages = { ...state.pages };
    delete pages[pageId];
    const now = new Date().toISOString();
    return {
      ...state,
      updatedAt: now,
      pages,
      documents: state.documents.map(d =>
        d.id === docId ? { ...d, pageIds: d.pageIds.filter(id => id !== pageId), updatedAt: now } : d
      ),
    };
  },

  /**
   * Creates a new document and adds it to state.documents.
   * @param {object} state
   * @param {object} [fields] - passed to createDocument()
   */
  addDocument(state, fields) {
    const doc = this.createDocument(fields);
    return {
      ...state,
      updatedAt: new Date().toISOString(),
      documents: [...state.documents, doc],
    };
  },

  /**
   * Sets a document's pageIds to newPageIds (must contain exactly the same IDs).
   * @param {object} state
   * @param {string} docId
   * @param {string[]} newPageIds
   */
  reorderPages(state, docId, newPageIds) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`reorderPages: docId "${docId}" not found`);
    const existing = new Set(doc.pageIds);
    const incoming = new Set(newPageIds);
    if (existing.size !== incoming.size || ![...existing].every(id => incoming.has(id))) {
      throw new Error('reorderPages: newPageIds must be the same set of pages');
    }
    const now = new Date().toISOString();
    return {
      ...state,
      updatedAt: now,
      documents: state.documents.map(d =>
        d.id === docId ? { ...d, pageIds: [...newPageIds], updatedAt: now } : d
      ),
    };
  },

  /**
   * Reverses the page order of a document.
   * @param {object} state
   * @param {string} docId
   */
  reverseDocPages(state, docId) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`reverseDocPages: docId "${docId}" not found`);
    return this.reorderPages(state, docId, [...doc.pageIds].reverse());
  },

  /**
   * Sorts a document's pages by capturedAt (then originalName as tiebreaker).
   * @param {object} state
   * @param {string} docId
   */
  sortDocPagesByTime(state, docId) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`sortDocPagesByTime: docId "${docId}" not found`);
    const sorted = this.sortPageEntries(doc.pageIds.map(id => [id, state.pages[id]]));
    return this.reorderPages(state, docId, sorted.map(([id]) => id));
  },

  /**
   * Builds the filename stem for a document: {YYYYMMDD}_{Category}_{TitlePascalCase}.
   * Date prefix is omitted if doc.date is empty.
   * Strips characters invalid on Windows/Android (\/:*?"<>|) and collapses whitespace.
   * @param {object} doc
   * @returns {string}
   */
  buildFilename(doc) {
    const INVALID = /[\\/:*?"<>|]/g;

    const rawTitle = (doc.title || '').replace(INVALID, '').replace(/\s+/g, ' ').trim();
    const pascal   = (rawTitle || 'Untitled')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');

    const cat = (doc.category || 'Other').replace(INVALID, '').replace(/\s+/g, '') || 'Other';

    return doc.date ? `${doc.date}_${cat}_${pascal}` : `${cat}_${pascal}`;
  },

  /**
   * Updates a document's title, category, and/or date. All fields optional.
   * Throws if date is non-empty and invalid.
   * @param {object} state
   * @param {string} docId
   * @param {{title?: string, category?: string, date?: string}} fields
   */
  updateDocumentMeta(state, docId, fields = {}) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) throw new Error(`updateDocumentMeta: docId "${docId}" not found`);
    const { title, category, date } = fields;
    if (date !== undefined && date !== '' && !this.isValidDate(date)) {
      throw new Error(`updateDocumentMeta: invalid date "${date}"`);
    }
    const updates = {};
    if (title    !== undefined) updates.title    = title;
    if (category !== undefined) updates.category = category;
    if (date     !== undefined) updates.date     = date;
    const now = new Date().toISOString();
    return {
      ...state,
      updatedAt: now,
      documents: state.documents.map(d =>
        d.id === docId ? { ...d, ...updates, updatedAt: now } : d
      ),
    };
  },

  /**
   * Adds a custom category to state.categories. No-op if already present.
   * @param {object} state
   * @param {string} category
   */
  addCategory(state, category) {
    if (typeof category !== 'string' || !category.trim()) {
      throw new Error('addCategory: category must be a non-empty string');
    }
    const cat = category.trim();
    if (state.categories.includes(cat)) return state;
    return {
      ...state,
      updatedAt: new Date().toISOString(),
      categories: [...state.categories, cat],
    };
  },

};

if (typeof module !== 'undefined') module.exports = Core;
else window.Core = Core;
