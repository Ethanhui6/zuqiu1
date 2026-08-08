import assert from 'node:assert/strict';
import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync(new URL('../data/events/career-events.json', import.meta.url), 'utf8'));
const events = Array.isArray(raw) ? raw : raw.events;
const finance = JSON.parse(fs.readFileSync(new URL('../data/events/finance.json', import.meta.url), 'utf8'));
const requiredCategories = ['教练', '队友', '经纪人', '转会', '合同', '媒体', '粉丝', '家庭', '朋友', '训练', '伤病', '恢复', '国家队', '奖项', '商业', '赞助', '金钱', '生活', '纪律', '休赛期', '退役'];
const requiredPositions = ['GK', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'LW', 'ST'];
const visibleText = event => [event.title, event.conflict, event.location, ...(event.participants || []), ...(event.observations || []), ...(event.choices || []).flatMap(choice => [choice.label, choice.hint, choice.successText, choice.failureText])].filter(Boolean).join('|');
const normalize = value => String(value).toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
assert.ok(events.length >= 500, `only ${events.length} career events`);
assert.deepEqual(requiredCategories.filter(category => category !== '金钱' && !events.some(event => event.category === category)), []);
assert.ok(finance.length >= 24 && finance.every(event => event.category === 'finance' && event.description && event.choices?.length >= 3), 'money event pack is missing');
for (const event of events) {
  assert.ok(event.id && event.title && event.conflict && event.location && event.participants?.length && event.choices?.length >= 3, event.id);
  assert.equal(new Set(event.choices.map(choice => choice.label)).size, event.choices.length, `${event.id} choices repeat`);
  assert.ok(event.choices.every(choice => choice.successText && choice.failureText), `${event.id} lacks divergent outcomes`);
}
assert.equal(new Set(events.map(event => event.title)).size, events.length, 'event titles repeat');
assert.equal(new Set(events.map(event => event.conflict)).size, events.length, 'event conflicts repeat');
const text = events.map(visibleText);
assert.equal(new Set(text.map(normalize)).size, text.length, 'visible event copy repeats');
assert.ok(new Set(events.flatMap(event => event.choices.map(choice => choice.risk))).size >= 10, 'event risks are not dynamic');
for (const position of requiredPositions) assert.ok(events.filter(event => event.positions?.includes(position)).length >= 8, `${position} specialist event coverage is missing`);
assert.ok(!text.some(value => /EventWeight|transferInterest|fatigue\s*[+-]\s*\d|随机种子/i.test(value)), 'technical fields leaked into event copy');
console.log(JSON.stringify({ status: 'PASS', events: events.length, categories: new Set(events.map(event => event.category)).size, positions: requiredPositions.length, uniqueTitles: new Set(events.map(event => event.title)).size, uniqueVisibleCopy: new Set(text.map(normalize)).size, dynamicRiskValues: new Set(events.flatMap(event => event.choices.map(choice => choice.risk))).size }, null, 2));
