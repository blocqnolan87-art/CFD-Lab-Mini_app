import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('academy risk exercise controls have unique IDs, separate from simulator controls', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, [], 'every HTML id must be unique for reliable labels and querySelector');
  for (const id of ['riskCapitalAcademy', 'riskPercentAcademy', 'stopDistanceAcademy', 'riskLeverageAcademy']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing academy control: ' + id);
    assert.ok(html.includes("$('" + '#' + id + "')"), 'academy handler must target ' + id);
  }
  for (const id of ['riskCapital', 'riskPercent', 'stopPercent', 'riskLeverage']) {
    assert.ok(html.includes('id="' + id + '"'), 'simulator control remains available: ' + id);
  }
});


test('academy includes accessible gross P&L exercise and eleventh lesson progress range', () => {
  for (const id of ['pnlDirectionAcademy','pnlNotionalAcademy','pnlMoveAcademy','pnlExerciseAcademy','pnlResultAcademy']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing P&L exercise control: ' + id);
  }
  assert.ok(html.includes('n<=11)'), 'lesson storage accepts the current eleventh lesson');
  assert.ok(html.includes('P&L brut illustratif'), 'exercise explains gross result');
  assert.ok(html.includes('aria-live="polite"'), 'result feedback is accessible');
});
