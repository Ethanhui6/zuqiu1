import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EVENT_JUDGEMENT_ANIMATIONS, pickEventJudgementAnimation } from '../src/core/outcomeAnimations.js';

test('phase 9 provides fifty deterministic event judgement feedback variants', () => {
  assert.ok(EVENT_JUDGEMENT_ANIMATIONS.length >= 50);
  assert.equal(new Set(EVENT_JUDGEMENT_ANIMATIONS).size, EVENT_JUDGEMENT_ANIMATIONS.length);
  const samples = Array.from({ length: 100 }, (_, index) => pickEventJudgementAnimation(`event-${index}`));
  assert.ok(samples.every(id => EVENT_JUDGEMENT_ANIMATIONS.includes(id)));
  assert.ok(new Set(samples).size >= 35);
  assert.equal(pickEventJudgementAnimation('same-event'), pickEventJudgementAnimation('same-event'));
});

test('phase 9 inserts a visible rolling verdict before the event result', () => {
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(app, /openEventJudgement\(result,key\)/);
  assert.match(app, /data-event-judgement[\s\S]*data-phase="rolling"/);
  assert.match(app, /data-event-roll/);
  assert.match(app, /RARE SUCCESS/);
  for (const motif of ['ball', 'card', 'pointer', 'lights', 'trail']) assert.match(css, new RegExp(`data-judgement-motif="${motif}"`));
  assert.match(css, /prefers-reduced-motion:reduce/);
});
