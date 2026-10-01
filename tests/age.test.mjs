import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DAY, addUtcMonths, getAgeParts, createModel, getSnapshot } from '../age-core.mjs';
import { buildMessage } from '../scripts/generate-shortcut-message.mjs';
import { buildDashboard } from '../scripts/generate-terminal-page.mjs';
const data = JSON.parse(await readFile(new URL('../shortcut-data.json', import.meta.url), 'utf8'));
const model = createModel(data);
const date = value => new Date(value);
const plain = value => value.replace(/\u001B(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001B\\))/g, '');

test('birth instant and one second before', () => {
  assert.equal(getSnapshot(model, new Date(model.birth - 1000)).age, null);
  assert.deepEqual(getSnapshot(model, model.birth).age, { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
});
test('birthday rolls over at the birth instant, not midnight', () => {
  const before = getSnapshot(model, date('2026-07-24T16:40:59Z'));
  const after = getSnapshot(model, date('2026-07-24T16:41:00Z'));
  assert.equal(before.age.years, 1);
  assert.equal(before.nextBirthday.age, 2);
  assert.equal(after.age.years, 2);
  assert.equal(after.nextBirthday.age, 3);
  assert.equal(after.nextMilestone.age, 5);
});
test('month ends clamp without shifting later anchors', () => {
  const start = date('2024-01-31T16:41:00Z');
  assert.equal(addUtcMonths(start, 1).toISOString(), '2024-02-29T16:41:00.000Z');
  assert.equal(addUtcMonths(start, 2).toISOString(), '2024-03-31T16:41:00.000Z');
  assert.equal(getAgeParts(start, date('2024-03-30T16:41:00Z')).months, 1);
  assert.equal(getAgeParts(date('2024-02-29T16:41:00Z'), date('2025-03-29T16:41:00Z')).days, 0);
});
test('elapsed time stays independent of DST offsets', () => {
  const start = date('2026-03-08T01:30:00-06:00');
  const end = date('2026-03-08T03:30:00-05:00');
  assert.equal(getAgeParts(start, end).hours, 1);
});
test('adulthood reaches 100 percent and no longer reports a future milestone', () => {
  const before = getSnapshot(model, new Date(model.adulthood - 1));
  assert.equal(before.daysToAdult, 1);
  assert.equal(before.adultReached, false);
  for (const now of [model.adulthood, new Date(+model.adulthood + DAY)]) {
    const snapshot = getSnapshot(model, now);
    assert.equal(snapshot.progress, 1);
    assert.equal(snapshot.daysToAdult, 0);
    assert.equal(snapshot.adultReached, true);
    assert.equal(snapshot.nextMilestone, null);
  }
});
test('configuration fails clearly for invalid dates and milestones', () => {
  assert.throws(() => createModel({ ...data, birthIso: 'oops' }), /birthIso/);
  assert.throws(() => createModel({ ...data, milestoneYears: [2, 1] }), /Milestone/);
  assert.throws(() => createModel({ ...data, adulthoodIso: data.birthIso }), /adulthood/);
});
test('generated outputs handle pre-birth, birthday, leap day and post-adulthood', () => {
  for (const instant of ['2024-01-01T12:00:00Z', '2026-07-24T16:41:00Z', '2028-02-29T16:41:00Z', '2042-07-24T16:41:00Z', '2050-12-31T23:59:59Z']) {
    const now = date(instant);
    const message = buildMessage(now);
    const terminal = plain(buildDashboard(now));
    assert.match(message, /Generated:/);
    assert.match(terminal, /Generated/);
    assert.doesNotMatch(message + terminal, /NaN|undefined|null/);
    for (const line of terminal.trimEnd().split('\n')) assert.ok(Array.from(line).length <= 78, `${instant}: line exceeds 78 columns: ${line}`);
    if (now < model.birth) assert.match(message, /not born yet/);
    if (now >= model.adulthood) {
      assert.match(message, /All planned milestones reached/);
      assert.match(terminal, /All planned milestones reached/);
    }
  }
});
