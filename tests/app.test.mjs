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

test('virtual positions can persist and be closed into a trade journal', () => {
  assert.match(html, /cfdVirtualSession/);
  assert.match(html, /function pnlAt\(/);
  assert.match(html, /function closePosition\(/);
  assert.match(html, /tradeHistory/);
  assert.match(html, /tradeLog/);
  assert.match(html, /Clôturer la position/);
});

test('academy covers seven progressive topics and interactive margin math', () => {
  assert.match(html, /Qu'est-ce qu'un CFD/);
  assert.match(html, /Marge et levier/);
  assert.match(html, /Ordres et gaps/);
  assert.match(html, /Coûts de transaction/);
  assert.match(html, /Financement overnight/);
  assert.match(html, /marginExercise/);
  assert.match(html, /e\/l/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /learned.length\/7/);
});
test('academy distinguishes simplified educational estimates from provider terms', () => {
  assert.match(html, /varient selon l'instrument|varient selon le fournisseur/i);
  assert.match(html, /pas une garantie de prix/i);
  assert.match(html, /aucun conseil financier/i);
});
