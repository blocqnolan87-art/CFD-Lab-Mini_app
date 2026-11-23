import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeVirtualSession } from '../src/simulator-engine.mjs';

test('corrupt or impossible persisted balances reset to safe virtual defaults', () => {
  for (const balance of [-1, Infinity, NaN, 1_000_001, '100']) {
    const session = sanitizeVirtualSession({ v: 1, balance, position: null, history: [] });
    assert.equal(session.balance, 100);
    assert.equal(session.position, null);
    assert.deepEqual(session.history, []);
  }
});

test('valid zero balance remains valid after a simulated total loss', () => {
  assert.equal(sanitizeVirtualSession({ v: 1, balance: 0, position: null, history: [] }).balance, 0);
});
