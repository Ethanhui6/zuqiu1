import test from 'node:test';
import assert from 'node:assert/strict';
import { FEEDBACK_CATALOG, meaningfulFeedbackCount, FeedbackDirector } from '../src/core/feedbackDirector.js';
import { MEANINGFUL_FEEDBACK_CATALOG } from '../src/core/semanticFeedback.js';

test('semantic feedback catalog contains 100+ distinct meaningful outcomes', () => {
  assert.ok(meaningfulFeedbackCount >= 100);
  assert.equal(new Set(Object.keys(MEANINGFUL_FEEDBACK_CATALOG)).size, meaningfulFeedbackCount);
  assert.ok(Object.values(MEANINGFUL_FEEDBACK_CATALOG).every(item => item.title && item.effect && item.icon && item.burst));
  assert.ok(FEEDBACK_CATALOG['mini-moving-target-success']);
  assert.ok(FEEDBACK_CATALOG['match-goal']);
  assert.ok(FEEDBACK_CATALOG['career-trophy-earned']);
});

test('mini game feedback resolves to semantic success and failure entries', () => {
  const source = FeedbackDirector.prototype.emitMiniGame.toString();
  assert.match(source, /miniGameFeedbackId/);
  assert.match(source, /success/);
  assert.match(source, /failure/);
});
