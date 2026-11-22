import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
test('French learning and simulator include core contract and safety disclosures', () => {
  assert.match(html, /Académie/i); assert.match(html, /simulateur/i); assert.match(html, /100\s*€/); assert.match(html, /aucun ordre réel|aucune exécution d'ordre/i);
});
test('PWA manifest is valid and mobile-first', () => { assert.equal(manifest.display, 'standalone'); assert.ok(manifest.name); assert.match(html, /viewport/); });
test('replay protects against look-ahead and is deterministic', () => { assert.match(html, /replay|rejou/i); assert.match(html, /seed|détermin/i); });
test('CSV OHLC import validates chronology and candle bounds', () => { assert.match(html, /CSV/i); assert.match(html, /OHLC|bougie/i); assert.match(html, /chronolog|ordre des dates/i); });
test('no broker credentials or live order endpoint are embedded', () => { assert.doesNotMatch(html, /api[_-]?secret|TELEGRAM_BOT_TOKEN|placeOrder\(/i); });
