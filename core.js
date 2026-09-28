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

};

if (typeof module !== 'undefined') module.exports = Core;
else window.Core = Core;
