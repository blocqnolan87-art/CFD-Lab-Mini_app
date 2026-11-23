// Client-side OHLC CSV validation and stepwise replay. No network, no future-bar access.
const aliases = {
  time: ["timestamp","datetime","date","time","dateheure","date/heure"],
  open: ["open","o","ouverture"],
  high: ["high","h","haut"],
  low: ["low","l","bas"],
  close: ["close","c","cloture","clôture","fermeture"],
};
function splitCsvLine(line, delimiter) {
  const out=[]; let value="", quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch.charCodeAt(0)===34 && quoted && line[i+1]?.charCodeAt(0)===34){value+=String.fromCharCode(34);i++}
    else if(ch.charCodeAt(0)===34) quoted=!quoted;
    else if(ch===delimiter && !quoted){out.push(value.trim());value=""}
    else value+=ch;
  }
  if(quoted) throw new Error("Guillemet CSV non fermé.");
  out.push(value.trim()); return out;
}
function numeric(value, decimalComma) {
  const normalized=decimalComma?value.replace(/\s/g,"").replace(",","."):value.replace(/\s/g,"");
  const n=Number(normalized); return normalized!==""&&Number.isFinite(n)?n:NaN;
}
export function parseOhlcCsv(text) {
  if(typeof text!=="string"||!text.trim()) throw new Error("Fichier CSV vide.");
  const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim());
  if(lines.length<21) throw new Error("Import refusé : il faut au moins 20 bougies OHLC.");
  if(lines.length>10001) throw new Error("Import limité à 10 000 bougies.");
  const first=lines[0], delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?";":",";
  const headers=splitCsvLine(first,delimiter).map(x=>x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim());
  const indexes={};
  for(const key of Object.keys(aliases)){indexes[key]=headers.findIndex(h=>aliases[key].some(a=>h===a.normalize("NFD").replace(/[\u0300-\u036f]/g,"")||h.startsWith(a+" ")))}
  for(const key of ["open","high","low","close"]) if(indexes[key]<0) throw new Error("Colonne obligatoire absente : "+key.toUpperCase()+".");
  const decimalComma=delimiter===";";
  const bars=lines.slice(1).map((line,i)=>{
    const cells=splitCsvLine(line,delimiter), bar={};
    for(const key of ["open","high","low","close"]) bar[key]=numeric(cells[indexes[key]]||"",decimalComma);
    if(Object.values(bar).some(v=>!Number.isFinite(v))) throw new Error("Valeur OHLC invalide à la ligne "+(i+2)+".");
    if(bar.high<Math.max(bar.open,bar.close,bar.low)||bar.low>Math.min(bar.open,bar.close,bar.high)) throw new Error("Cohérence OHLC invalide à la ligne "+(i+2)+".");
    if(indexes.time>=0){bar.time=cells[indexes.time]||"";if(!bar.time)throw new Error("Date/heure absente à la ligne "+(i+2)+".");}
    return bar;
  });
  if(indexes.time>=0){
    const stamps=bars.map((b,i)=>{
      const stamp=Date.parse(b.time);
      if(!Number.isFinite(stamp)) throw new Error("Date/heure invalide à la ligne "+(i+2)+".");
      return stamp;
    });
    if(stamps.some((v,i)=>i&&v<=stamps[i-1])) throw new Error("Les dates doivent être strictement chronologiques, sans doublon.");
  }
  return bars;
}
export function createReplay(bars) {
  if (!Array.isArray(bars) || bars.length < 2) {
    throw new Error("Replay nécessite au moins 2 bougies.");
  }
  // Take an immutable snapshot so caller mutations cannot alter future replay bars.
  const snapshot = bars.map((source, i) => {
    const bar = source && typeof source === "object" ? { ...source } : null;
    if (!bar || !Number.isFinite(bar.close) || bar.close <= 0) {
      throw new Error("Prix de clôture invalide à l'index " + i + ".");
    }
    // The public replay API also accepts close-only synthetic candles used by
    // the lesson demo. Imported CSV candles always carry the complete OHLC set.
    const hasAnyOhlc = ["open", "high", "low"].some(k => bar[k] !== undefined);
    if (hasAnyOhlc) {
      if (!["open", "high", "low", "close"].every(k => Number.isFinite(bar[k]) && bar[k] > 0)) {
        throw new Error("Bougie OHLC invalide à l'index " + i + ".");
      }
      if (bar.high < Math.max(bar.open, bar.close, bar.low) ||
          bar.low > Math.min(bar.open, bar.close, bar.high)) {
        throw new Error("Cohérence OHLC invalide à l'index " + i + ".");
      }
    }
    return bar;
  });
  const hasTime = snapshot.some(bar => bar.time !== undefined);
  if (hasTime) {
    const timestamps = snapshot.map((bar, i) => {
      const stamp = typeof bar.time === "number" ? bar.time : Date.parse(bar.time);
      if (!Number.isFinite(stamp)) throw new Error("Date/heure invalide à l'index " + i + ".");
      return stamp;
    });
    if (timestamps.some((stamp, i) => i > 0 && stamp <= timestamps[i - 1])) {
      throw new Error("Les dates du replay doivent être strictement croissantes.");
    }
  }
  let index = 0;
  const copyCurrent = () => ({ ...snapshot[index] });
  return {
    current: copyCurrent,
    hasNext: () => index < snapshot.length - 1,
    next: () => {
      if (index >= snapshot.length - 1) return null;
      index += 1;
      return copyCurrent();
    },
    position: () => index + 1,
    total: () => snapshot.length
  };
}
export function virtualPnl(direction, entry, current, notional) {
  if(![direction,entry,current,notional].every(Number.isFinite)||![1,-1].includes(direction)||entry<=0||current<=0||notional<=0) throw new Error("Paramètres P&L invalides.");
  return direction*(current-entry)*notional/entry;
}

/**
 * Size a virtual CFD exposure from a risk budget and stop distance.
 * Estimates only: gaps, slippage, provider rules and costs can increase losses.
 */
export function positionSizeFromRisk(capital, riskPercent, stopPercent, leverage) {
  if (![capital, riskPercent, stopPercent, leverage].every(Number.isFinite) ||
      capital <= 0 || riskPercent <= 0 || riskPercent > 100 ||
      stopPercent <= 0 || leverage < 1 || leverage > 100) {
    throw new Error("Paramètres de risque invalides.");
  }
  const riskBudget = capital * riskPercent / 100;
  const requestedNotional = riskBudget / (stopPercent / 100);
  const maxNotional = capital * leverage;
  const notional = Math.min(requestedNotional, maxNotional);
  return {
    riskBudget,
    requestedNotional,
    notional,
    margin: notional / leverage,
    estimatedStopLoss: notional * stopPercent / 100,
    cappedByLeverage: requestedNotional > maxNotional
  };
}

/** Educational CFD cost/margin scenario; maintenance formula is illustrative only. */
export function estimateCfdScenario({capital,direction,entry,exit,notional,leverage,spreadBps=0,commissionPercentPerSide=0,overnightPercentPerDay=0,days=0,slippageBps=0,maintenanceMarginPercent=50}) {
 const v=[capital,entry,exit,notional,leverage,spreadBps,commissionPercentPerSide,overnightPercentPerDay,days,slippageBps,maintenanceMarginPercent];
 if(!v.every(Number.isFinite)||capital<=0||entry<=0||exit<=0||notional<=0||leverage<1||leverage>100||![1,-1].includes(direction)||spreadBps<0||spreadBps>1000||commissionPercentPerSide<0||commissionPercentPerSide>10||overnightPercentPerDay< -10||overnightPercentPerDay>10||days<0||days>365||slippageBps<0||slippageBps>1000||maintenanceMarginPercent<=0||maintenanceMarginPercent>100)throw new Error("Paramètres de scénario invalides.");
 const grossPnl=direction*(exit-entry)/entry*notional,spreadCost=notional*spreadBps/10000,commissionCost=notional*commissionPercentPerSide/100*2,financingCost=notional*overnightPercentPerDay/100*days,slippageCost=notional*slippageBps/10000,totalCosts=spreadCost+commissionCost+financingCost+slippageCost,netPnl=grossPnl-totalCosts,initialMargin=notional/leverage,equityAfter=capital+netPnl,maintenanceRequirement=initialMargin*maintenanceMarginPercent/100;
 return {grossPnl,spreadCost,commissionCost,financingCost,slippageCost,totalCosts,netPnl,initialMargin,equityAfter,maintenanceRequirement,marginLevelPercent:equityAfter>0?equityAfter/initialMargin*100:0,illustrativeMarginWarning:equityAfter<=maintenanceRequirement};
}

/** Validate persisted browser-session data before using it in the simulator UI. */
export function sanitizeVirtualSession(value) {
  if (!value || typeof value !== "object" || value.v !== 1 || !Number.isFinite(value.balance)) {
    return { v: 1, balance: 100, position: null, history: [] };
  }
  const p = value.position;
  const position = p && [1, -1].includes(p.dir) &&
    [p.size, p.entry, p.openedAt].every(Number.isFinite) &&
    p.size > 0 && p.entry > 0 && p.openedAt >= 0
    ? { dir: p.dir, size: p.size, entry: p.entry, openedAt: p.openedAt }
    : null;
  const history = Array.isArray(value.history) ? value.history.filter(t =>
    t && ["LONG", "SHORT"].includes(t.side) &&
    [t.entry, t.exit, t.pnl, t.fee, t.step].every(Number.isFinite) &&
    t.entry > 0 && t.exit > 0 && t.fee >= 0 && t.step >= 0
  ).slice(-30).map(t => ({ side: t.side, entry: t.entry, exit: t.exit, pnl: t.pnl, fee: t.fee, step: t.step })) : [];
  return { v: 1, balance: value.balance, position, history };
}
