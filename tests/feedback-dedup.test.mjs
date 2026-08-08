import test from 'node:test';
import assert from 'node:assert/strict';
import { FeedbackDirector } from '../src/core/feedbackDirector.js';

test('identical feedback shares one toast during a rapid repeat', () => {
  const document = { body: { append() {} }, createElement: () => ({ dataset: {}, append() {}, remove() {} }) };
  const director = new FeedbackDirector(document.body);
  const originalDocument = globalThis.document, originalTimeout = globalThis.setTimeout;
  globalThis.document = document; globalThis.setTimeout = () => 0;
  try {
    const first = director.emit('click', '已选择');
    assert.equal(director.emit('click', '已选择'), first);
    assert.equal(director.emit('click', '另一项'), first);
    assert.notEqual(director.emit('save', '另一项'), first);
  } finally { globalThis.document = originalDocument; globalThis.setTimeout = originalTimeout; }
});
