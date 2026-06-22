// generate-report.mjs - US stock morning report auto-script (CI version)
// Requires SCT_KEY env var for ServerChan push
import { fetchAll } from './daily-fetcher.mjs';

function arr(n) { if(isNaN(n)) return '\u25b8'; return n > 0 ? '\u25b2' : n < 0 ? '\u25bc' : '\u25b8'; }
function pct(v) { if(v == null) return '\u2014'; const n = parseFloat(v); if(isNaN(n)) return v; return arr(n) + ' ' + Math.abs(n).toFixed(2) + '%'; }
function bp(v) { if(v == null) return '\u2014'; const s = String(v).replace(/%/,'').trim(); const n = parseFloat(s.replace(/,/g,'')); if(isNaN(n)) return s; const a = Math.abs(n); if(a < 1 && s.includes('.')) return arr(n) + ' ' + (n*100).toFixed(0) + 'bp'; return arr(n) + ' ' + a.toFixed(2); }

function gen(d) {
  const now = new Date();
  const ds = now.toLocaleDateString('zh-CN', {timeZone:'Asia/Shanghai', year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const L = [], pu = s => L.push(s);

  pu('\uD83D\uDCCA **\u7F8E\u80A1\u6668\u62A5 | ' + ds + '**');
  pu('\u6570\u636E\u6765\u6E90\uFF1ACNBC\n');

  pu('### [1] \u7F8E\u80A1\u5E02\u573A\u7EFC\u8FF0\n');
  pu('| \u6307\u6570 | \u6536\u76D8 | \u6DA8\u8DCC\u5E45 |');
  pu('|---|---|---|');
  const idx = [['DIA','\u9053\u7434\u65AF'],['SPY','\u6807\u666E500'],['QQQ','\u7EB3\u65AF\u8FBE\u514B'],['IWM','\u7F57\u7D20\u20002000']];
  idx.forEach(function(kv) {
    const q = d.indices[kv[0]];
    if(q) pu('| ' + kv[1] + ' (' + kv[0] + ') | $' + q.last.replace(/,/g,'') + ' | ' + pct(q.pct) + ' |');
    else pu('| ' + kv[1] + ' (' + kv[0] + ') | \u2014 | \u2014 |');
  });
  
  // driver analysis
  const dr = [];
  const sp = d.indices.SPY?.pct;
  if(sp && parseFloat(sp) > 0.5) dr.push('\u7F8E\u80A1\u5168\u9762\u6536\u6DA8');
  else if(sp && parseFloat(sp) < -0.5) dr.push('\u7F8E\u80A1\u6574\u4F53\u627F\u538B');
  else dr.push('\u7F8E\u80A1\u7A84\u5E45\u633A\u76D8');
  const smh = d.sectors.SMH?.pct;
  if(smh && parseFloat(smh) > 3) dr.push('\u534A\u5BFC\u4F53\u677F\u5757\u9886\u6DA8\u5927\u76D8');
  const iw = d.indices.IWM?.pct;
  if(iw && parseFloat(iw) > 1) dr.push('\u5C0F\u76D8\u80A1\u8D44\u91D1\u6D41\u5165\u660E\u663E');
  const oil = d.macro.CL1?.pctChange;
  if(oil && parseFloat(oil) < -1) dr.push('\u6CB9\u4EF7\u4E0B\u8DCC\u63A8\u52A8\u98CE\u9669\u504F\u597D\u56DE\u5347');
  pu('\n**\u9A71\u52A8\u56E0\u7D20\u5206\u6790\uFF1A** ' + (dr.join('\uFF0C') || '\u5E02\u573A\u8868\u73B0\u5206\u5316') + '\n');

  pu('### [2] \u677F\u5757\u8868\u73B0\n');
  const secs = {XLK:'\u79D1\u6280',SMH:'\u534A\u5BFC\u4F53',XLF:'\u91D1\u878D',XLV:'\u533B\u7597',XLE:'\u80FD\u6E90',XLP:'\u6D88\u8D39\u5FC5\u9700\u54C1',XLY:'\u975E\u5FC5\u9700\u6D88\u8D39'};
  Object.keys(secs).forEach(function(s) {
    const q = d.sectors[s], n = secs[s];
    if(q) pu('- ' + n + ' (' + s + '): ' + pct(q.pct) + ' \u2014 $' + q.last.replace(/,/g,''));
    else pu('- ' + n + ' (' + s + '): \u2014');
  });
  
  const sp2 = [];
  if(smh && parseFloat(smh) > 3) sp2.push('\u534A\u5BFC\u4F53\u9886\u6DA8\uff08' + smh + '%\uff09\uff0CAI\u82AF\u7247\u9700\u6C42\u5F3A\u52B2');
  const xle = d.sectors.XLE?.pct;
  if(xle && parseFloat(xle) < -1) sp2.push('\u80FD\u6E90\u627F\u538B\uff08' + xle + '%\uff09\uff0C\u6CB9\u4EF7\u4E0B\u884C\u62D6\u7D2F');
  const xlf = d.sectors.XLF?.pct;
  if(xlf && parseFloat(xlf) < 0) sp2.push('\u91D1\u878D\u8D70\u5F31\uff0C\u5229\u7387\u9884\u671F\u5F71\u54CD');
  const xly = d.sectors.XLY?.pct, xlp = d.sectors.XLP?.pct;
  if(xly && xlp && parseFloat(xly) > 0 && parseFloat(xlp) < 0) sp2.push('\u8D44\u91D1\u4ECE\u9632\u5FA1\u8F6E\u52A8\u81F3\u6210\u957F\u677F\u5757');
  pu('\n**\u539F\u56E0\u5206\u6790\uFF1A** ' + (sp2.join('\uFF1B') || '\u677F\u5757\u8F6E\u52A8\u7279\u5F81\u4E0D\u660E\u663E') + '\n');

  pu('### [3] \u91CD\u70B9\u4E2A\u80A1\n');
  const syms = ['NVDA','MSFT','AAPL','AMZN','META','TSLA','AMD','AVGO'];
  const sorted = syms.map(function(s) { return {s:s, q:d.stocks[s]}; }).filter(function(x) { return x.q && x.q.pct; }).sort(function(a,b) { return parseFloat(b.q.pct) - parseFloat(a.q.pct); });
  pu('**\u6DA8\u5E45\u524D3\uFF1A**');
  for(let i = 0; i < Math.min(3, sorted.length); i++) { const x = sorted[i]; pu((i+1) + '. ' + (x.q.n||x.s) + ' (' + x.s + '): $' + x.q.last.replace(/,/g,'') + ' ' + pct(x.q.pct)); }
  pu('**\u8DCC\u5E45\u524D3\uFF1A**');
  let cnt = 0;
  for(let i = sorted.length-1; i >= 0; i--) { const x = sorted[i]; if(parseFloat(x.q.pct) >= 0) continue; cnt++; if(cnt > 3) break; pu(cnt + '. ' + (x.q.n||x.s) + ' (' + x.s + '): $' + x.q.last.replace(/,/g,'') + ' ' + pct(x.q.pct)); }
  pu('\n**\u91CD\u70B9\u5173\u6CE8\uFF1A**');
  syms.forEach(function(s) { const q = d.stocks[s]; if(q) pu('- ' + (q.n||s) + ' ($' + q.last.replace(/,/g,'') + ' ' + pct(q.pct) + ')'); });
  pu('');

  pu('### [4] \u5B8F\u89C2\u53D8\u91CF\n');
  pu('| \u6307\u6807 | \u6570\u503C | \u53D8\u5316 |');
  pu('|---|---|---|');
  const macros = {VIX:'VIX\u6050\u614C\u6307\u6570',US10Y:'10Y\u7F8E\u503A\u6536\u76CA\u7387',US2Y:'2Y\u7F8E\u503A\u6536\u76CA\u7387','EUR=':'\u6B27\u5143/\u7F8E\u5143',GC1:'\u9EC4\u91D1',CL1:'WTI\u539F\u6CB9',DX:'\u7F8E\u5143\u6307\u6570DXY'};
  Object.keys(macros).forEach(function(m) {
    const q = d.macro[m], lbl = macros[m];
    if(q) {
      if(q.pctChange) pu('| ' + lbl + ' | ' + q.last + ' | ' + pct(q.pctChange) + ' |');
      else pu('| ' + lbl + ' | ' + q.last + ' | ' + bp(q.change) + ' |');
    } else pu('| ' + lbl + ' | \u2014 | \u2014 |');
  });
  
  const mp = [];
  const u10 = d.macro.US10Y;
  if(u10) { const c = parseFloat(String(u10.change).replace(/%/,'')); if(!isNaN(c)) mp.push('10Y\u6536\u76CA\u7387' + (c>0?'\u4E0A\u884C':'\u4E0B\u884C') + Math.abs(c*100).toFixed(0) + 'bp\u81F3' + u10.last); }
  const vix = d.macro.VIX;
  if(vix) { const vx = parseFloat(vix.last); if(!isNaN(vx)) mp.push(vx < 18 ? 'VIX\u4F4E\u4F4D\uFF0C\u5E02\u573A\u60C5\u7EEA\u4E50\u89C2' : 'VIX\u4E2D\u6027\u504F\u5BA1\u614E'); }
  const gold = d.macro.GC1?.pctChange;
  if(gold && parseFloat(gold) < -0.5) mp.push('\u9EC4\u91D1\u4E0B\u8DCC' + Math.abs(parseFloat(gold)).toFixed(1) + '%\uff0C\u5730\u7F18\u98CE\u9669\u6EA2\u4EF7\u51CF\u5F31');
  else if(gold && parseFloat(gold) > 0.5) mp.push('\u9EC4\u91D1\u4E0A\u6DA8' + parseFloat(gold).toFixed(1) + '%\uff0C\u907F\u9669\u9700\u6C42\u4E0A\u5347');
  const wti = d.macro.CL1?.pctChange;
  if(wti && parseFloat(wti) < -0.5) mp.push('WTI\u539F\u6CB9\u4E0B\u8DCC' + Math.abs(parseFloat(wti)).toFixed(1) + '%\uff0C\u7F8E\u4F0A\u534F\u8BAE\u8FDB\u5C55\u538B\u4F4E\u80FD\u6E90\u4EF7\u683C');
  else if(wti && parseFloat(wti) > 0.5) mp.push('WTI\u539F\u6CB9\u4E0A\u6DA8' + parseFloat(wti).toFixed(1) + '%');
  const dxy = d.macro.DX;
  if(dxy) mp.push('\u7F8E\u5143\u6307\u6570' + dxy.last + '\uFF0C\u5F31\u52BF\u7F8E\u5143\u683C\u5C40\u7EE7\u7EED');
  pu('\n**\u5206\u6790\uFF1A** ' + (mp.join('\uFF0C') || '\u5B8F\u89C2\u73AF\u5883\u5E73\u7A33') + '\n');

  pu('### [5] \u91CD\u5927\u65B0\u95FB\n');
  if(d.news && d.news.length > 0) { d.news.slice(0,5).forEach(function(n) { pu('> **' + n.title + '** (\u6765\u6E90: ' + (n.source || 'CNBC') + ')'); }); }
  else pu('> \u65B0\u95FB\u83B7\u53D6\u5931\u8D25');
  pu('');

  pu('### [6] \u6B21\u65E5\u5173\u6CE8\n');
  pu('- **\u672C\u5468\u7126\u70B9\uFF1A** PCE\u7269\u4EF7\u6307\u6570\u3001\u65B0\u5C4B\u9500\u552E\u3001\u8010\u4E45\u54C1\u8BA2\u5355');
  pu('- **\u7F8E\u4F0A\u534F\u8BAE\uFF1A** 60\u5929\u8DEF\u7EBF\u56FE\u540E\u7EED\u8FDB\u5C55');
  pu('- **\u6B27\u6D32\u653F\u5C40\uFF1A** \u82F1\u56FD\u9996\u76F8\u8F9E\u804C\u8BA1\u5212\u5F71\u54CD');
  pu('- **\u7F8E\u8054\u50A8\uFF1A** \u5173\u6CE8\u5B98\u5458\u8BB2\u8BDD\u4E2D\u5229\u7387\u8DEF\u5F84\u6697\u793A');
  pu('');

  pu('### [7] \u6295\u8D44\u63D0\u793A\n');
  const sv = parseFloat(d.sectors.SMH?.pct || 0), vv = parseFloat(d.macro.VIX?.last || 20);
  if(!isNaN(vv) && vv < 18) pu('**\u5E02\u573A\u73AF\u5883\uFF1A** \u98CE\u9669\u504F\u597D\u8F83\u9AD8\uFF0C\u9002\u5408\u8FDB\u53D6\u578B\u914D\u7F6E');
  else if(!isNaN(vv) && vv < 25) pu('**\u5E02\u573A\u73AF\u5883\uFF1A** \u4E2D\u6027\u504F\u4E50\u89C2\uFF0C\u5747\u8861\u914D\u7F6E');
  else pu('**\u5E02\u573A\u73AF\u5883\uFF1A** \u4E0D\u786E\u5B9A\u6027\u8F83\u9AD8\uFF0C\u5EFA\u8BAE\u63A7\u5236\u4ED3\u4F4D');
  pu('**\u79D1\u6280\u80A1\uFF1A** AI\u4E3B\u9898\u6301\u7EED\u4E3B\u5BFC\u5E02\u573A\u8D70\u5411\uFF0C\u5173\u6CE8\u82AF\u7247\u677F\u5757\u52A8\u80FD\u5EF6\u7EED\u6027');
  if(sv > 3) pu('**\u534A\u5BFC\u4F53\uFF1A** \u77ED\u671F\u5F3A\u52BF\u53CD\u5F39\uFF0CAI\u9700\u6C42\u7ED3\u6784\u6027\u589E\u957F\u672A\u53D8\uFF0C\u8FFD\u9AD8\u9700\u8C28\u614E\uFF0C\u53EF\u7B49\u5F85\u56DE\u8C03\u52A0\u4ED3');
  else if(sv < -2) pu('**\u534A\u5BFC\u4F53\uFF1A** \u77ED\u671F\u627F\u538B\uFF0C\u4F46AI\u957F\u671F\u8D8B\u52BF\u672A\u6539\uFF0C\u53EF\u9022\u4F4E\u5E03\u5C40');
  else pu('**\u534A\u5BFC\u4F53\uFF1A** AI\u82AF\u7247\u9700\u6C42\u7ED3\u6784\u6027\u589E\u957F\u652F\u6491\u677F\u5757\uFF0C\u5173\u6CE8\u56DE\u8C03\u4ECB\u5165\u673A\u4F1A');
  pu('**\u80FD\u6E90\uFF1A** \u6CB9\u4EF7\u53D7\u5730\u7F18\u653F\u6CBB\u56E0\u7D20\u538B\u5236\uFF0C\u5173\u6CE8\u7F8E\u4F0A\u534F\u8BAE\u843D\u5730\u8FDB\u5C55');
  pu('**\u98CE\u9669\u63D0\u793A\uFF1A** \u5E02\u573A\u6CE2\u52A8\u6027\u53EF\u80FD\u968F\u901A\u80C0\u6570\u636E\u53D1\u5E03\u800C\u52A0\u5927\uFF0C\u5EFA\u8BAE\u63A7\u5236\u5355\u65E5\u4ED3\u4F4D\u665E\u53E3');
  pu('');
  return L.join('\n');
}

async function push(key, title, desp) {
  console.log('[report] Pushing to ServerChan...');
  const body = new URLSearchParams({title, desp});
  const r = await fetch('https://sctapi.ftqq.com/' + key + '.send', { method: 'POST', body });
  const j = await r.json();
  if(j.code === 0) { console.log('[report] \u2705 Push success pushid=' + j.data.pushid); }
  else { console.error('[report] \u274C Failed:', JSON.stringify(j)); process.exit(1); }
}

async function main() {
  console.log('[report] Fetching market data...');
  const data = await fetchAll();
  const c = Object.keys(data.indices).length;
  if(c === 0) {
    const ds = new Date().toLocaleDateString('zh-CN', {timeZone:'Asia/Shanghai', year:'numeric',month:'long',day:'numeric',weekday:'long'});
    console.log('[report] No market data (holiday/weekend)');
    const k = process.env.SCT_KEY;
    if(k) await push(k, '\uD83D\uDCCA \u7F8E\u80A1\u6668\u62A5 | ' + ds, '> \u23F8 \u4ECA\u65E5\u65E0\u6709\u6548\u4EA4\u6613\u6570\u636E\uFF08\u975E\u4EA4\u6613\u65E5\u6216\u6570\u636E\u6E90\u5F02\u5E38\uFF09\n\n\u672C\u671F\u6668\u62A5\u8DF3\u8FC7\u3002');
    return;
  }
  console.log('[report] Data fetched: ' + c + ' indices, ' + Object.keys(data.sectors).length + ' sectors, ' + Object.keys(data.stocks).length + ' stocks');
  const report = gen(data);
  console.log('[report] Report generated (' + report.length + ' chars)');
  const k = process.env.SCT_KEY;
  if(!k) throw new Error('Missing SCT_KEY environment variable');
  const title = '\uD83D\uDCCA \u7F8E\u80A1\u6668\u62A5 ' + new Date().toLocaleDateString('zh-CN', {timeZone:'Asia/Shanghai', year:'numeric',month:'long',day:'numeric'});
  await push(k, title, report);
}

main().catch(function(e) { console.error('[report] Error:', e.message); process.exit(1); });
