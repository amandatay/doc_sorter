const assert = require('node:assert/strict');
const { test } = require('node:test');
const Core = require('../core.js');

test('Core module exports a non-null object', () => {
  assert.ok(Core !== null && typeof Core === 'object');
});
