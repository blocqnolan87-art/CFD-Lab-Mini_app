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
  if(!Array.isArray(bars)||bars.length<2) throw new Error("Replay nécessite au moins 2 bougies.");
  let index=0;
  return {current:()=>bars[index], hasNext:()=>index<bars.length-1, next:()=>{if(index>=bars.length-1)return null;index+=1;return bars[index]}, position:()=>index+1,total:()=>bars.length};
}
export function virtualPnl(direction, entry, current, notional) {
  if(![direction,entry,current,notional].every(Number.isFinite)||entry<=0||notional<0) throw new Error("Paramètres P&L invalides.");
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
