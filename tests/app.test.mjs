import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
test('PWA mobile-first and French content', () => {
  assert.match(html, /lang="fr"/); assert.match(html, /viewport/); assert.match(html, /Académie/); assert.match(html, /simulateur/i); assert.equal(manifest.display, 'standalone');
});
test('simulator uses virtual capital and makes no real orders', () => {
  assert.match(html, /100 €|100,00 €|100/); assert.match(html, /aucun ordre réel|aucune exécution d'ordre/i); assert.match(html, /Simulation LONG/); assert.match(html, /Simulation SHORT/);
  assert.doesNotMatch(html, /TELEGRAM_BOT_TOKEN|placeOrder\(/i);
});
test('synthetic candles and deterministic seeded generator are present', () => {
  assert.match(html, /bougies de démonstration synthétiques/i); assert.match(html, /seed=8675309/); assert.match(html, /function random\(/);
});
test('learning progress is stored locally and risk is explained', () => {
  assert.match(html, /localStorage/); assert.match(html, /levier amplifie/i); assert.match(html, /pertes/i);
});
