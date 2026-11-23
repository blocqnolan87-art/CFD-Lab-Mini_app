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

test('academy covers eight progressive topics and interactive margin math', () => {
  assert.match(html, /Qu'est-ce qu'un CFD/);
  assert.match(html, /Marge et levier/);
  assert.match(html, /Ordres et gaps/);
  assert.match(html, /Coûts de transaction/);
  assert.match(html, /Financement overnight/);
  assert.match(html, /Appel de marge et clôture forcée/);
  assert.match(html, /marginExercise/);
  assert.match(html, /e\/l/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /learned.length\/8/);
});
test('academy distinguishes simplified educational estimates from provider terms', () => {
  assert.match(html, /varient selon l'instrument|varient selon le fournisseur/i);
  assert.match(html, /pas une garantie de prix/i);
  assert.match(html, /aucun conseil financier/i);
});

import { parseOhlcCsv, createReplay, virtualPnl, positionSizeFromRisk, estimateCfdScenario } from '../src/simulator-engine.mjs';
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
test('virtual P&L is computed from the visible price and rejects invalid directions or values',()=>{
  assert.equal(virtualPnl(1,100,105,100),5);assert.equal(virtualPnl(-1,100,95,100),5);
  assert.throws(()=>virtualPnl(0,100,105,100),/Paramètres P&L/);
  assert.throws(()=>virtualPnl(1,100,105,0),/Paramètres P&L/);
  assert.throws(()=>virtualPnl(1,100,0,100),/Paramètres P&L/);
});
test('replay ends exactly at the final candle and cannot advance into future data',()=>{
  const replay=createReplay([{close:1},{close:2},{close:3}]);
  assert.equal(replay.next().close,2);assert.equal(replay.next().close,3);
  assert.equal(replay.hasNext(),false);assert.equal(replay.next(),null);assert.equal(replay.position(),3);
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


test('academy risk-budget exercise is accessible and uses the validated sizing engine',()=>{assert.match(html,/Exercice : budget de risque/);assert.match(html,/id="riskCapitalAcademy"/);assert.match(html,/id="riskPercentAcademy"/);assert.match(html,/id="stopDistanceAcademy"/);assert.match(html,/id="riskLeverageAcademy"/);assert.match(html,/id="riskExercise"/);assert.match(html,/id="riskExerciseResult" aria-live="polite"/);assert.match(html,/positionSizeFromRisk\(/);assert.match(html,/perte au stop estimée/);});
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

test('scenario includes estimated trading costs and margin indicator',()=>{const x=estimateCfdScenario({capital:100,direction:1,entry:100,exit:102,notional:500,leverage:5,spreadBps:10,commissionPercentPerSide:.1,overnightPercentPerDay:.02,days:2,slippageBps:5});assert.equal(x.grossPnl,10);assert.equal(x.totalCosts,1.95);assert.equal(x.netPnl,8.05);assert.equal(x.initialMargin,100);assert.equal(x.illustrativeMarginWarning,false);});
test('scenario signals maintenance threshold and rejects invalid direction',()=>{const x=estimateCfdScenario({capital:100,direction:-1,entry:100,exit:130,notional:500,leverage:5});assert.equal(x.illustrativeMarginWarning,true);assert.throws(()=>estimateCfdScenario({capital:100,direction:0,entry:100,exit:101,notional:100,leverage:2}),/Paramètres de scénario/);});

import { sanitizeVirtualSession } from '../src/simulator-engine.mjs';
test('persisted virtual session rejects malformed positions and filters invalid journal rows',()=>{
 const clean=sanitizeVirtualSession({v:1,balance:96.5,position:{dir:7,size:20,entry:100,openedAt:3},history:[{side:'LONG',entry:100,exit:105,pnl:1,fee:.1,step:4},{side:'INVALID',entry:100,exit:101,pnl:1,fee:0,step:5}]});
 assert.equal(clean.balance,96.5);assert.equal(clean.position,null);assert.equal(clean.history.length,1);assert.equal(clean.history[0].side,'LONG');
});
test('persisted virtual session falls back safely for corrupt storage and limits journal size',()=>{
 assert.deepEqual(sanitizeVirtualSession({v:9,balance:NaN}),{v:1,balance:100,position:null,history:[]});
 const rows=Array.from({length:35},(_,i)=>({side:'SHORT',entry:100,exit:99,pnl:1,fee:0,step:i}));
 const clean=sanitizeVirtualSession({v:1,balance:100,position:{dir:-1,size:5,entry:100,openedAt:0},history:rows});
 assert.equal(clean.position.dir,-1);assert.equal(clean.history.length,30);assert.equal(clean.history[0].step,5);
});
