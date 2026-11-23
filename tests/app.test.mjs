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

import { parseOhlcCsv, createReplay, virtualPnl, positionSizeFromRisk } from '../src/simulator-engine.mjs';
test('CSV OHLC importer validates rows and French semicolon decimals', () => {
  const rows=['Date;Open;High;Low;Close'];
  for(let i=0;i<20;i++)rows.push('2026-01-'+String(i+1).padStart(2,'0')+';10,0;12,0;9,0;11,0');
  const parsed=parseOhlcCsv(rows.join('\n'));
  assert.equal(parsed.length,20);assert.equal(parsed[0].open,10);assert.equal(parsed[0].close,11);
});
test('CSV rejects malformed OHLC and duplicate/out-of-order dates', () => {
  const rows=['Date,Open,High,Low,Close'];
  for(let i=0;i<20;i++)rows.push('2026-01-'+String(i+1).padStart(2,'0')+',10,12,9,11');
  rows[5]='2026-01-06,10,8,9,11';
  assert.throws(()=>parseOhlcCsv(rows.join('\n')),/Cohérence OHLC/);
});
test('CSV rejects unparseable timestamps instead of silently skipping chronology checks', () => {
  const rows=['Date,Open,High,Low,Close'];
  for(let i=0;i<20;i++)rows.push('2026-01-'+String(i+1).padStart(2,'0')+',10,12,9,11');
  rows[7]='not-a-date,10,12,9,11';
  assert.throws(()=>parseOhlcCsv(rows.join(String.fromCharCode(10))),error=>error.message.includes('Date/heure invalide'));
});
test('step replay reveals bars sequentially and never skips ahead', () => {
  const bars=Array.from({length:20},(_,i)=>({open:10+i,high:12+i,low:9+i,close:11+i}));
  const replay=createReplay(bars);assert.equal(replay.current().close,11);assert.equal(replay.position(),1);
  assert.equal(replay.next().close,12);assert.equal(replay.position(),2);assert.equal(replay.hasNext(),true);
});
test('virtual P&L is computed from only the supplied visible close',()=>{
  assert.equal(virtualPnl(1,100,105,100),5);assert.equal(virtualPnl(-1,100,95,100),5);
});

test('risk sizing respects risk budget and leverage cap for 100 euro practice capital',()=>{
  const sized=positionSizeFromRisk(100,1,2,5);
  assert.equal(sized.riskBudget,1);
  assert.equal(sized.notional,50);
  assert.equal(sized.margin,10);
  assert.equal(sized.estimatedStopLoss,1);
  assert.equal(sized.cappedByLeverage,false);
});
test('risk sizing caps exposure when stop distance is very tight',()=>{
  const sized=positionSizeFromRisk(100,2,0.1,3);
  assert.equal(sized.notional,300);
  assert.equal(sized.margin,100);
  assert.equal(sized.cappedByLeverage,true);
  assert.equal(sized.estimatedStopLoss,0.3);
});
test('risk sizing rejects invalid inputs',()=>{
  assert.throws(()=>positionSizeFromRisk(100,0,2,5),/Paramètres de risque/);
  assert.throws(()=>positionSizeFromRisk(100,1,2,0),/Paramètres de risque/);
});


test('academy quiz has five staged questions, feedback, scoring and restart controls',()=>{
  assert.match(html,/Quiz de validation/);
  assert.match(html,/quizItems=\[/);
  assert.match(html,/quizScore/);
  assert.match(html,/quizNext/);
  assert.match(html,/quizRestart/);
  assert.match(html,/Quiz terminé/);
  assert.match(html,/quizFeedback.*aria-live|id="quizFeedback" aria-live="polite"/);
  assert.match(html,/financement overnight et ses conditions/i);
  assert.match(html,/gap ou une exécution différente/i);
});
