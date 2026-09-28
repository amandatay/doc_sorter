const assert = require('node:assert/strict');
const { test } = require('node:test');
const Core = require('../core.js');

// Shared helper — a minimal valid page object
function makePage(overrides = {}) {
  return Core.createPage({
    originalName: 'photo.jpg', mime: 'image/jpeg',
    capturedAt: '2026-09-27T14:00:00', capturedAtSource: 'exif',
    width: 100, height: 200,
    ...overrides,
  });
}

// ── generateId ──────────────────────────────────────────────────────────────

test('generateId returns a non-empty string', () => {
  assert.ok(typeof Core.generateId() === 'string' && Core.generateId().length > 0);
});

test('generateId returns unique values', () => {
  const ids = Array.from({ length: 20 }, () => Core.generateId());
  assert.equal(new Set(ids).size, 20);
});

// ── createState ─────────────────────────────────────────────────────────────

test('createState has correct shape', () => {
  const s = Core.createState();
  assert.equal(s.schemaVersion, 1);
  assert.equal(s.app, 'docsorter');
  assert.deepEqual(s.pages, {});
  assert.deepEqual(s.documents, []);
  assert.deepEqual(s.inbox, []);
  assert.ok(Array.isArray(s.categories) && s.categories.length > 0);
  assert.ok(typeof s.updatedAt === 'string');
});

test('createState passes validateState', () => {
  assert.deepEqual(Core.validateState(Core.createState()), []);
});

// ── isValidDate ─────────────────────────────────────────────────────────────

test('isValidDate accepts valid dates', () => {
  assert.ok(Core.isValidDate('20260927'));
  assert.ok(Core.isValidDate('20000101'));
  assert.ok(Core.isValidDate('20241231'));
  assert.ok(Core.isValidDate('20240229')); // 2024 is a leap year
});

test('isValidDate rejects wrong format', () => {
  assert.ok(!Core.isValidDate('2026-09-27'));
  assert.ok(!Core.isValidDate('2026092'));
  assert.ok(!Core.isValidDate('202609270'));
  assert.ok(!Core.isValidDate('abcdefgh'));
  assert.ok(!Core.isValidDate(''));
  assert.ok(!Core.isValidDate(null));
  assert.ok(!Core.isValidDate(undefined));
});

test('isValidDate rejects out-of-range values', () => {
  assert.ok(!Core.isValidDate('20261300')); // month 13
  assert.ok(!Core.isValidDate('20261232')); // day 32
  assert.ok(!Core.isValidDate('20260900')); // day 0
  assert.ok(!Core.isValidDate('20260001')); // month 0
});

test('isValidDate rejects Feb 29 on non-leap years', () => {
  assert.ok(!Core.isValidDate('20230229')); // 2023 not leap
  assert.ok(!Core.isValidDate('21000229')); // 2100 divisible by 100 but not 400
});

// ── createPage ──────────────────────────────────────────────────────────────

test('createPage sets rotation to 0 and preserves fields', () => {
  const p = makePage();
  assert.equal(p.rotation, 0);
  assert.equal(p.originalName, 'photo.jpg');
  assert.equal(p.capturedAtSource, 'exif');
});

// ── createDocument ──────────────────────────────────────────────────────────

test('createDocument fills in defaults', () => {
  const d = Core.createDocument({});
  assert.equal(d.title, 'Untitled');
  assert.equal(d.category, 'Other');
  assert.equal(d.date, '');
  assert.deepEqual(d.pageIds, []);
  assert.ok(typeof d.id === 'string' && d.id.length > 0);
  assert.ok(typeof d.createdAt === 'string');
});

test('createDocument works with no arguments', () => {
  const d = Core.createDocument();
  assert.equal(d.title, 'Untitled');
});

test('createDocument pageIds is a copy (not a reference)', () => {
  const ids = ['a', 'b'];
  const d = Core.createDocument({ pageIds: ids });
  ids.push('c');
  assert.equal(d.pageIds.length, 2);
});

// ── addPageToInbox ──────────────────────────────────────────────────────────

test('addPageToInbox adds to inbox and pages map', () => {
  const state = Core.createState();
  const id = Core.generateId();
  const next = Core.addPageToInbox(state, id, makePage());
  assert.ok(next.inbox.includes(id));
  assert.ok(next.pages[id]);
  assert.deepEqual(Core.validateState(next), []);
});

test('addPageToInbox does not mutate the original state', () => {
  const state = Core.createState();
  const id = Core.generateId();
  Core.addPageToInbox(state, id, makePage());
  assert.ok(!state.inbox.includes(id));
  assert.ok(!state.pages[id]);
});

test('addPageToInbox preserves existing pages', () => {
  let state = Core.createState();
  const id1 = Core.generateId();
  const id2 = Core.generateId();
  state = Core.addPageToInbox(state, id1, makePage());
  state = Core.addPageToInbox(state, id2, makePage());
  assert.equal(state.inbox.length, 2);
  assert.equal(Object.keys(state.pages).length, 2);
});

// ── validateState ───────────────────────────────────────────────────────────

test('validateState rejects null and non-objects', () => {
  assert.ok(Core.validateState(null).length > 0);
  assert.ok(Core.validateState('oops').length > 0);
  assert.ok(Core.validateState(42).length > 0);
});

test('validateState passes for state with pages in inbox', () => {
  let s = Core.createState();
  s = Core.addPageToInbox(s, Core.generateId(), makePage());
  assert.deepEqual(Core.validateState(s), []);
});

test('validateState passes for state with an empty document', () => {
  const s = Core.createState();
  s.documents.push(Core.createDocument({ title: 'Empty doc' }));
  assert.deepEqual(Core.validateState(s), []);
});

test('validateState catches duplicate pageId in inbox', () => {
  const s = Core.createState();
  const id = Core.generateId();
  s.pages[id] = makePage();
  s.inbox.push(id, id); // added twice
  assert.ok(Core.validateState(s).length > 0);
});

test('validateState catches pageId in both inbox and a document', () => {
  const s = Core.createState();
  const id = Core.generateId();
  s.pages[id] = makePage();
  s.inbox.push(id);
  const doc = Core.createDocument({});
  doc.pageIds.push(id);
  s.documents.push(doc);
  assert.ok(Core.validateState(s).length > 0);
});

test('validateState catches dangling id in inbox', () => {
  const s = Core.createState();
  s.inbox.push('ghost-id');
  assert.ok(Core.validateState(s).some(e => e.includes('ghost-id')));
});

test('validateState catches dangling id in document', () => {
  const s = Core.createState();
  const doc = Core.createDocument({});
  doc.pageIds.push('ghost-id');
  s.documents.push(doc);
  assert.ok(Core.validateState(s).length > 0);
});

test('validateState catches page in pages but not referenced anywhere', () => {
  const s = Core.createState();
  const id = Core.generateId();
  s.pages[id] = makePage(); // not added to inbox or any doc
  assert.ok(Core.validateState(s).some(e => e.includes(id)));
});

test('validateState catches invalid rotation', () => {
  const s = Core.createState();
  const id = Core.generateId();
  s.pages[id] = { ...makePage(), rotation: 45 };
  s.inbox.push(id);
  assert.ok(Core.validateState(s).some(e => e.includes('rotation')));
});

test('validateState catches invalid document date', () => {
  const s = Core.createState();
  s.documents.push({ ...Core.createDocument({}), date: '99999999' });
  assert.ok(Core.validateState(s).some(e => e.includes('date')));
});

test('validateState allows empty document date', () => {
  const s = Core.createState();
  s.documents.push(Core.createDocument({ date: '' }));
  assert.deepEqual(Core.validateState(s), []);
});

test('validateState accepts all valid rotations', () => {
  for (const rot of [0, 90, 180, 270]) {
    const s = Core.createState();
    const id = Core.generateId();
    s.pages[id] = { ...makePage(), rotation: rot };
    s.inbox.push(id);
    assert.deepEqual(Core.validateState(s), [], `rotation ${rot} should be valid`);
  }
});

// ── applyMigrations ─────────────────────────────────────────────────────────

test('applyMigrations returns the same object for v1', () => {
  const s = Core.createState();
  assert.equal(Core.applyMigrations(s), s);
});

test('applyMigrations throws on unknown schemaVersion', () => {
  assert.throws(() => Core.applyMigrations({ schemaVersion: 99 }), /schemaVersion/);
});

test('applyMigrations throws on missing schemaVersion', () => {
  assert.throws(() => Core.applyMigrations({}), /schemaVersion/);
});
