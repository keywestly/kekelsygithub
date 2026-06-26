// daily-fetcher.mjs — Fetches market data from CNBC APIs and news feeds
const CNBC_QUOTE = 'https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=';
const MARKETS = { SPY: 'S&P 500', QQQ: 'Nasdaq 100', DIA: 'Dow Jones', IWM: 'Russell 2000' };
const SECTORS = { XLK: '科技', SMH: '半导体', XLF: '金融', XLV: '医疗', XLE: '能源', XLP: '消费必需品', XLY: '非必需消费' };
const STOCKS = ['NVDA', 'MSFT', 'AAPL', 'AMZN', 'META', 'GOOGL', 'TSLA', 'TSM', 'AMD', 'AVGO', 'MU'];
const MACRO = ['VIX', 'US10Y', 'US2Y', 'EUR='];
const FUTURES = { '@CL.1': 'WTI原油', '@GC.1': '黄金', '@DX.1': '美元指数DXY' };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const TO = 8000;

async function fetchJson(s) {
  const r = await fetch(CNBC_QUOTE + s, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TO) });
  const j = await r.json();
  const q = j?.FormattedQuoteResult?.FormattedQuote?.[0];
  if (!q || q.code) return null;
  return { last: q.last, change: q.change, name: q.name };
}
function pct(q) {
  if (!q || !q.change || !q.last) return null;
  const lastNum = parseFloat(q.last.replace(/,/g, ''));
  const chgNum = parseFloat(q.change.replace(/,/g, ''));
  const prev = lastNum - chgNum;
  return prev ? ((chgNum / prev) * 100).toFixed(2) : null;
}
async function scrapeFuture(u, label) {
  try {

  const r = await fetch('https://www.cnbc.com/quotes/' + u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TO) });
  const h = await r.text();
  const g = (f) => { const m = h.match(new RegExp('"' + f + '"\\s*:\\s*"([^"]+)"')); return m ? m[1] : null; };
  const last = g('last'); const chg = g('change');
  const lastNum = last ? parseFloat(last.replace(/,/g, '')) : NaN;
  const chgNum = chg ? parseFloat(chg.replace(/,/g, '')) : NaN;
  const prev = (lastNum && chgNum) ? lastNum - chgNum : null;
  return { name: label, last, change: chg, pctChange: prev ? ((chgNum / prev) * 100).toFixed(2) : null };
  } catch (e) { return null; }
}
async function fetchNews() {
  try {
    const r = await fetch('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) });
    const x = await r.text();
    const items = [...x.matchAll(/<item>[\s\S]*?<\/item>/g)];
    return items.slice(0, 6).map(item => {
      const t = item[0].match(/<title>(?:<!\[CDATA\[)?([^\]]+?)(?:\]\]>)?<\/title>/);
      const l = item[0].match(/<link>(?:<!\[CDATA\[)?([^\]]+?)(?:\]\]>)?<\/link>/);
      return t ? { source: 'CNBC', title: t[1].replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim(), url: l ? l[1] : '' } : null;
    }).filter(Boolean);
  } catch (e) { return [{ source: 'CNBC', title: 'CNBC新闻获取失败', url: '' }]; }
}
export async function fetchAll() {
  const d = { indices: {}, sectors: {}, stocks: {}, macro: {}, news: [] };
  for (const [sym, n] of Object.entries(MARKETS)) { const q = await fetchJson(sym); if (q) d.indices[sym] = { n, last: q.last, change: q.change, pct: pct(q) }; }
  for (const [sym, n] of Object.entries(SECTORS)) { const q = await fetchJson(sym); if (q) d.sectors[sym] = { n, last: q.last, change: q.change, pct: pct(q) }; }
  for (const sym of STOCKS) { const q = await fetchJson(sym); if (q) d.stocks[sym] = { n: q.name, last: q.last, change: q.change, pct: pct(q) }; }
  for (const sym of MACRO) { const q = await fetchJson(sym); if (q) d.macro[sym] = { last: q.last, change: q.change, name: q.name }; }
  for (const [u, label] of Object.entries(FUTURES)) { const q = await scrapeFuture(u, label); if (q && q.last) d.macro[u.replace(/[@.]/g, '_')] = q; }
  d.news = await fetchNews();
  return d;
}
