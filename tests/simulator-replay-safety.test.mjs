import test from 'node:test';
import assert from 'node:assert/strict';
import { createReplay, parseOhlcCsv } from '../src/simulator-engine.mjs';

const validBars = [
  { time: '2026-01-01T00:00:00Z', open: 10, high: 12, low: 9, close: 11 },
  { time: '2026-01-01T01:00:00Z', open: 11, high: 13, low: 10, close: 12 },
  { time: '2026-01-01T02:00:00Z', open: 12, high: 14, low: 11, close: 13 }
];

test('replay is stepwise and does not expose mutable source or internal bars', () => {
  const source = validBars.map(bar => ({ ...bar }));
  const replay = createReplay(source);
  assert.equal(replay.position(), 1);
  assert.deepEqual(replay.current(), source[0]);
  source[1].close = 999; // modifying the imported array cannot leak future information
  const shown = replay.next();
  assert.equal(shown.close, 12);
  shown.close = 777; // returned bars are detached snapshots too
  assert.equal(replay.current().close, 12);
  assert.equal(replay.next().close, 13);
  assert.equal(replay.hasNext(), false);
  assert.equal(replay.next(), null);
});

test('replay rejects inconsistent OHLC and non-increasing timestamps', () => {
  assert.throws(() => createReplay([
    { open: 10, high: 9, low: 8, close: 9 },
    { open: 9, high: 10, low: 8, close: 9 }
  ]), /Cohérence OHLC/);
  assert.throws(() => createReplay([
    { ...validBars[0] },
    { ...validBars[0] }
  ]), /strictement croissantes/);
});

test('CSV import rejects impossible candles before replay', () => {
  const rows = ['time,open,high,low,close'];
  for (let i = 0; i < 20; i++) {
    const hour = String(i).padStart(2, '0');
    rows.push(`2026-01-01T${hour}:00:00Z,10,12,9,11`);
  }
  rows[1] = '2026-01-01T00:00:00Z,10,9,8,9';
  assert.throws(() => parseOhlcCsv(rows.join('\n')), /Cohérence OHLC/);
});

test('CSV import rejects duplicate OHLC headers instead of choosing one silently', () => {
  const rows = ['time,open,high,low,close,Close'];
  for (let i = 0; i < 20; i++) {
    const hour = String(i).padStart(2, '0');
    rows.push(`2026-01-01T${hour}:00:00Z,10,12,9,11,999`);
  }
  assert.throws(() => parseOhlcCsv(rows.join('\\n')), /Colonne ambiguë ou dupliquée : CLOSE/);
});
