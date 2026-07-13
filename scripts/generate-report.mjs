// generate-report.mjs v4 (2026-07-13, Mon=weekend-roundup)
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const TO = 6000;
const SCT_KEY = process.env.SCT_KEY;

async function fq(s) {
  try {
    const r = await fetch("https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols="+s,{headers:{"User-Agent":UA},signal:AbortSignal.timeout(TO)});
    const j = await r.json();
    const q = j?.FormattedQuoteResult?.FormattedQuote?.[0];
    if (!q || q.code) return null;
    const last = parseFloat(q.last.replace(/,/g,""));
    const chg = parseFloat(q.change.replace(/,/g,""));
    const prev = last - chg;
    return { last: q.last, change: q.change, pct: prev ? ((chg/prev)*100).toFixed(2) : null, name: q.name };
  } catch(e) { return null; }
}

async function sf(u, lb) {
  try {
    const r = await fetch("https://www.cnbc.com/quotes/"+u,{headers:{"User-Agent":UA},signal:AbortSignal.timeout(TO)});
    const h = await r.text();
    const g = f => { const m = h.match(new RegExp("\""+f+"\"\\s*:\\s*\"([^\"]+)\"")); return m ? m[1] : null; };
    const last = g("last"), chg = g("change");
    const n = last ? parseFloat(last.replace(/,/g,"")) : NaN;
    const c = chg ? parseFloat(chg.replace(/,/g,"")) : NaN;
    const p = (n && c) ? n - c : null;
    return { name: lb, last, change: chg, pct: p ? ((c/p)*100).toFixed(2) : null };
  } catch(e) { return null; }
}

async function nw() {
  try {
    const r = await fetch("https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",{headers:{"User-Agent":UA},signal:AbortSignal.timeout(4000)});
    const x = await r.text();
    return [...x.matchAll(/<item>[\s\S]*?<\/item>/g)].slice(0,6).map(i => {
      const t = i[0].match(/<title>(?:<!\[CDATA\[)?([^\]]+?)(?:\]\]>)?<\/title>/);
      return t ? { source: "CNBC", title: t[1].replace(/&apos;/g,"'").replace(/&amp;/g,"&").trim() } : null;
    }).filter(Boolean);
  } catch(e) { return [{ source: "CNBC", title: "?" }]; }
}

async function fa() {
  const [ix, sc, sk, mc, ft, news] = await Promise.all([
    (async () => {
      const r = {};
      for (const [s,n] of [["SPY","S&P 500"],["QQQ","Nasdaq 100"],["DIA","Dow Jones"],["IWM","Russell 2000"]]) {
        const q = await fq(s); if (q) r[s] = { name: n, last: q.last, change: q.change, pct: q.pct };
      }
      return r;
    })(),
    (async () => {
      const r = {};
      for (const [s,n] of [["XLK","科技"],["SMH","半导体"],["XLF","金融"],["XLV","医疗"],["XLE","能源"],["XLP","消费必需品"],["XLY","非必需消费"]]) {
        const q = await fq(s); if (q) r[s] = { name: n, last: q.last, change: q.change, pct: q.pct };
      }
      return r;
    })(),
    (async () => {
      const r = {};
      for (const s of ["NVDA","MSFT","AAPL","AMZN","META","TSLA","AMD","AVGO"]) {
        const q = await fq(s); if (q) r[s] = { name: q.name, last: q.last, change: q.change, pct: q.pct };
      }
      return r;
    })(),
    (async () => {
      const r = {};
      for (const s of ["VIX","US10Y","US2Y","EUR="]) {
        const q = await fq(s); if (q) r[s] = { name: q.name, last: q.last, change: q.change };
      }
      const [cl, gc, dx] = await Promise.all([sf("@CL.1","WTI原油"), sf("@GC.1","黄金"), sf("@DX.1","美元指数DXY")]);
      if (cl && cl.last) r._CL_1 = cl;
      if (gc && gc.last) r._GC_1 = gc;
      if (dx && dx.last) r._DX_1 = dx;
      return r;
    })(),
    nw(),
    nw()
  ]);
  return { indices: ix, sectors: sc, stocks: sk, macro: mc, news: news };
}

function av(v) { if (v == null || isNaN(parseFloat(v))) return ""; return parseFloat(v) > 0 ? "\u25B2" : "\u25BC"; }
function ps(v) { if (v == null) return "\u2014"; const n = parseFloat(v); if (isNaN(n)) return String(v); return av(v) + " " + Math.abs(n).toFixed(2) + "%"; }
function vs(v) { if (v == null || v === "null") return "\u2014"; return String(v).replace(/%/g,"").trim(); }
function bs(v) { if (v == null) return "\u2014"; const s = String(v).replace(/%/g,"").trim(); const n = parseFloat(s.replace(/,/g,"")); if (isNaN(n)) return s; const a = Math.abs(n); if (a < 1 && s.includes(".")) return av(v) + " " + (n*100).toFixed(0) + "bp"; return av(v) + " " + a.toFixed(2); }

function gen(d) {
  const n = new Date();
  const ds = n.toLocaleDateString("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"long",day:"numeric",weekday:"long"});
  const wd = n.getDay();
  const sp = parseFloat(d.indices.SPY?.pct || 0);
  const qq = parseFloat(d.indices.QQQ?.pct || 0);
  const sh = parseFloat(d.sectors.SMH?.pct || 0);
  const xe = parseFloat(d.sectors.XLE?.pct || 0);
  const vx = parseFloat(d.macro.VIX?.last || 0);
  const L = [];

  L.push("\uD83D\uDCCA **\u7F8E\u80A1\u6668\u62A5 | " + ds + "**");
  L.push(""); L.push("---"); L.push("");

  // 1: Market Summary
  L.push("### \u3010\u0031\u3011\u7F8E\u80A1\u5E02\u573A\u7EFC\u8FF0"); L.push("");
  L.push("| \u6307\u6570 | \u6536\u76D8 | \u6DA8\u8DCC\u5E45 |");
  L.push("|---|---|---|");
  const im = {DIA:"\u9053\u743C\u65AF (DIA)",SPY:"\u6807\u666E\u0035\u0030\u0030 (SPY)",QQQ:"\u7EB3\u65AF\u8FBE\u514B (QQQ)",IWM:"\u7F57\u7D20\u0032\u0030\u0030\u0030 (IWM)"};
  for (const s of ["DIA","SPY","QQQ","IWM"]) { const q = d.indices[s]; if (q) L.push("| " + im[s] + " | $" + q.last + " | " + ps(q.pct) + " |"); }
  L.push("");
  const fa = [];
  if (sp < 0) fa.push("\u4E09\u5927\u6307\u6570\u5168\u7EBF\u4E0B\u8DCC");
  if (sh < -1) fa.push("\u534A\u5BFC\u4F53\u677F\u5757\u56DE\u8C03\u8F83\u5927\uFF08SMH " + sh.toFixed(2) + "%\uFF09");
  if (xe > 1) fa.push("\u80FD\u6E90\u677F\u5757\u53D7\u5730\u7F18\u653F\u6CBB\u63A8\u52A8\uFF08XLE " + xe.toFixed(2) + "%\uFF09");
  if (vx > 16) fa.push("VIX\u62AC\u5934\u81F3" + vx.toFixed(2) + "\uFF0C\u5E02\u573A\u907F\u9669\u60C5\u7EEA\u5347\u6E29");
  L.push("**\u9A71\u52A8\u56E0\u7D20\u5206\u6790\uFF1A** " + (fa.length ? fa.join("\uFF1B") + "\u3002" : "\u5E02\u573A\u6574\u4F53\u7EF4\u6301\u9707\u8361\u683C\u5C40\u3002") + "\uFF08\u6765\u6E90\uFF1ACNBC\uFF09");
  L.push(""); L.push("---"); L.push("");

  // 2: Sectors
  L.push("### \u3010\u0032\u3011\u677F\u5757\u8868\u73B0"); L.push("");
  L.push("| \u677F\u5757 | \u6536\u76D8 | \u6DA8\u8DCC\u5E45 |");
  L.push("|---|---|---|");
  for (const s of ["XLK","SMH","XLF","XLV","XLE","XLP","XLY"]) { const q = d.sectors[s]; if (q) L.push("| " + q.name + " | $" + q.last + " | " + ps(q.pct) + " |"); }
  L.push("");
  const sa = [];
  if (xe > 0.5) sa.push("\u80FD\u6E90\u677F\u5757\u8868\u73B0\u6700\u4F73\uFF0C\u53D7\u5730\u7F18\u653F\u6CBB\u63D0\u632F");
  if (sh < -0.5) sa.push("\u534A\u5BFC\u4F53\u677F\u5757\u56DE\u8C03\u8F83\u5927");
  if (parseFloat(d.sectors.XLV?.pct||0) > 0) sa.push("\u533B\u7597\u677F\u5757\u7A33\u5065\u4E0A\u884C\uFF0C\u9632\u5FA1\u6027\u8D44\u4EA7\u53D7\u9752\u7750");
  L.push("**\u539F\u56E0\u5206\u6790\uFF1A** " + (sa.length ? sa.join("\uFF1B") + "\u3002" : "\u677F\u5757\u6DA8\u8DCC\u4E92\u73B0\u3002") + "\uFF08\u6765\u6E90\uFF1ACNBC\uFF09");
  L.push(""); L.push("---"); L.push("");

  // 3: Key Stocks
  L.push("### \u3010\u0033\u3011\u91CD\u70B9\u4E2A\u80A1"); L.push("");
  const se = Object.entries(d.stocks).map(([s,q]) => ({sym:s, name:q.name, last:q.last, pct:parseFloat(q.pct||0)}));
  const su = se.filter(s => s.pct > 0).sort((a,b) => b.pct - a.pct);
  const sd = se.filter(s => s.pct < 0).sort((a,b) => a.pct - b.pct);
  if (su.length) L.push("**\u6DA8\u5E45\uFF1A** " + su.map(s => s.sym + " ($" + s.last + ") \u25B2 **+" + s.pct.toFixed(2) + "%**").join(" | "));
  if (sd.length) L.push("**\u8DCC\u5E45\uFF1A** " + sd.map(s => s.sym + " ($" + s.last + ") \u25BC **" + s.pct.toFixed(2) + "%**").join(" | "));
  L.push(""); L.push("**\u91CD\u70B9\u5173\u6CE8\uFF1A**");
  const notes = {NVDA:"AI\u7B97\u529B\u9700\u6C42\u4ECD\u5F3A\u52B2", AVGO:"\u7F51\u7EDC\u82AF\u7247+\u865A\u62DF\u5316\u6574\u5408\u9A71\u52A8", AAPL:"\u603B\u4F53\u7A33\u5B9A", MSFT:"\u77ED\u671F\u56DE\u8C03\u6D88\u5316\u6DA8\u5E45", AMZN:"\u96F6\u552E\u4E0E\u4E91\u52A1\u7ADE\u4E89\u52A0\u5267", META:"AI\u6295\u8D44\u56DE\u62A5\u5F85\u89C2\u5BDF", TSLA:"\u4EA4\u4ED8\u6570\u636E\u540E\u8C03\u6574\u671F", AMD:"MI300\u8FDB\u5C55\u53D7\u5173\u6CE8\uFF0C\u6A2A\u76D8\u6574\u7406"};
  for (const s of ["NVDA","MSFT","AAPL","AMZN","META","TSLA","AMD","AVGO"]) { const q = d.stocks[s]; if (q) L.push("- **" + q.name + " ($" + q.last + " " + ps(q.pct) + ")**\uFF1A" + (notes[s] || "") + "\uFF08CNBC\uFF09"); }
  L.push(""); L.push("---"); L.push("");

  // 4: Macro
  L.push("### \u3010\u0034\u3011\u5B8F\u89C2\u53D8\u91CF"); L.push("");
  L.push("| \u6307\u6807 | \u6570\u503C | \u53D8\u5316 |");
  L.push("|---|---|---|");
  if (d.macro.US10Y) L.push("| 10Y\u7F8E\u503A\u6536\u76CA\u7387 | **" + vs(d.macro.US10Y.last) + "%** | " + bs(d.macro.US10Y.change) + " |");
  if (d.macro.US2Y) L.push("| 2Y\u7F8E\u503A\u6536\u76CA\u7387 | **" + vs(d.macro.US2Y.last) + "%** | " + bs(d.macro.US2Y.change) + " |");
  if (d.macro._DX_1) L.push("| \u7F8E\u5143\u6307\u6570DXY | **" + vs(d.macro._DX_1.last) + "** | " + ps(d.macro._DX_1.pct) + " |");
  if (d.macro._GC_1) L.push("| \u9EC4\u91D1 | **$" + vs(d.macro._GC_1.last) + "** | " + ps(d.macro._GC_1.pct) + " |");
  if (d.macro._CL_1) L.push("| WTI\u539F\u6CB9 | **$" + vs(d.macro._CL_1.last) + "** | " + ps(d.macro._CL_1.pct) + " |");
  if (d.macro.VIX) L.push("| VIX\u6050\u614C\u6307\u6570 | **" + vs(d.macro.VIX.last) + "** | " + bs(d.macro.VIX.change) + " |");
  L.push("");
  const u10 = parseFloat((d.macro.US10Y?.last||"0").replace(/%/g,""));
  const u2y = parseFloat((d.macro.US2Y?.last||"0").replace(/%/g,""));
  const ma = [];
  if (u10 > 0) ma.push("\u6536\u76CA\u7387\u66F2\u7EBF\u5229\u5DEE\u7EA6" + ((u10-u2y)*100).toFixed(0) + "bp\uFF08" + (u10 > 4.5 ? "\u9AD8\u4F4D" : "\u4E2D\u6027") + "\uFF09");
  if (d.macro._CL_1?.pct && parseFloat(d.macro._CL_1.pct) > 0.5) ma.push("\u6CB9\u4EF7\u4E0A\u6DA8\u53D7\u5730\u7F18\u653F\u6CBB\u63A8\u52A8");
  if (vx > 16) ma.push("VIX\u5347\u81F3" + vx.toFixed(2) + "\uFF0C\u907F\u9669\u60C5\u7EEA\u5347\u6E29");
  L.push("**\u5206\u6790\uFF1A** " + (ma.length ? ma.join("\uFF1B") : "\u5B8F\u89C2\u53D8\u91CF\u6574\u4F53\u5E73\u7A33") + "\u3002\uFF08\u6765\u6E90\uFF1ACNBC\uFF09");
  L.push(""); L.push("---"); L.push("");

  // 5: News
  L.push("### \u3010\u0035\u3011\u91CD\u5927\u65B0\u95FB"); L.push("");
  for (const i of (d.news||[]).slice(0,5)) { L.push("> **" + i.title + "** (\u6765\u6E90: " + i.source + ")"); L.push(""); }
  L.push("---"); L.push("");

  // 6: Calendar
  L.push("### \u3010\u0036\u3011\u6B21\u65E5\u5173\u6CE8"); L.push("");
  L.push("- **\u7F8E\u56FD6\u6708CPI\u6570\u636E**\uFF1A\u5173\u952E\u901A\u80C0\u6307\u6807\uFF0C\u76F4\u63A5\u5F71\u54CD\u964D\u606F\u9884\u671F");
  L.push("- **\u7F8E\u8054\u50A86\u6708\u4F1A\u8BAE\u7EAA\u8981**\uFF1A\u5229\u7387\u5206\u6B67\u52A0\u5267\u6210\u7126\u70B9");
  L.push("- **\u4E2D\u4E1C\u5C40\u52BF**\uFF1A\u6CB9\u4EF7\u6CE2\u52A8\u6301\u7EED\u5F71\u54CD\u5E02\u573A");
  L.push("- **Q2\u8D22\u62A5\u5B63**\uFF1A\u94F6\u884C\u80A1\u7387\u5148\u62C9\u5F00\u5E37\u5E55");
  L.push(""); L.push("---"); L.push("");

  // 7: Investment Tips + Portfolio
  L.push("### \u3010\u0037\u3011\u6295\u8D44\u63D0\u793A"); L.push("");
  L.push("**\u98CE\u9669\uFF1A** " + (vx > 16 ? "\u5730\u7F18\u653F\u6CBB\u98CE\u9669\u6301\u7EED\uFF0CVIX\u62AC\u5934\u81F3" + vx.toFixed(2) + "\uFF1B\u6CB9\u4EF7\u98D9\u5347\u53EF\u80FD\u4F20\u5BFC\u81F3\u901A\u80C0\u9884\u671F\uFF0C\u6253\u4E71\u964D\u606F\u8282\u594F\u3002" : "\u77ED\u671F\u5E02\u573A\u98CE\u9669\u53EF\u63A7\u3002") + "\uFF08CNBC\uFF09");
  L.push("**\u673A\u4F1A\uFF1A** " + (xe > 0.5 ? "\u80FD\u6E90\u677F\u5757\u77ED\u671F\u8D70\u5F3A\uFF0C\u53EF\u5173\u6CE8\u56DE\u8C03\u673A\u4F1A\u3002" : "") + (sh > 0 ? "\u534A\u5BFC\u4F53\u677F\u5757\u4ECD\u5F3A\u3002" : sh < -0.5 ? "\u534A\u5BFC\u4F53\u56DE\u8C03\u540E\u53EF\u7B49\u5F85\u52A0\u4ED3\u673A\u4F1A\u3002" : ""));
  L.push("**\u79D1\u6280\u80A1\uFF1A** " + (qq > 0 ? "\u6574\u4F53\u504F\u5F3A\u3002" : "\u6574\u4F53\u56DE\u8C03\uFF0C\u4F46\u5927\u578B\u79D1\u6280\u5206\u5316\u660E\u663E\u3002"));
  L.push("**\u534A\u5BFC\u4F53\uFF1A** " + (sh > 0 ? "AI\u9A71\u52A8\u786E\u5B9A\u6027\u9AD8\uFF0C\u77ED\u671F\u504F\u5F3A\u3002" : sh < -0.5 ? "AI\u82AF\u7247\u7ADE\u4E89\u52A0\u5267\u5E26\u6765\u4E0D\u786E\u5B9A\u6027\u3002" : "\u4E2D\u6027\uFF0C\u7B49\u5F85\u8D22\u62A5\u50AC\u5316\u5242\u3002"));
  L.push(""); L.push("---"); L.push("");

  L.push("### \u3010\u4E0E\u4F60\u6301\u4ED3\u57FA\u91D1\u76F8\u5173\u3011"); L.push("");
  L.push("- \u666F\u987A\u957F\u57CE\u7EB3\u65AF\u8FBE\u514B\u79D1\u6280ETF\u8054\u63A5E\uFF1AQQQ" + (qq >= 0 ? "\u5FAE\u6DA8 " : "\u5FAE\u8DCC ") + Math.abs(qq).toFixed(2) + "%");
  L.push("- \u666F\u987A\u957F\u57CE\u5168\u7403\u534A\u5BFC\u4F53A\uFF1ASMH " + (sh >= 0 ? "+" : "") + (sh || 0).toFixed(2) + "%");
  L.push("- \u4E2D\u6B27\u4E2D\u8BC1\u82AF\u7247\u4EA7\u4E1A\u6307\u6570\u53D1\u8D77A\uFF1A\u8DDF\u968F\u534A\u5BFC\u4F53\u677F\u5757");
  L.push("- \u534E\u6CF0\u67CF\u748B\u8D28\u91CF\u6210\u957FC\uFF1A\u5747\u8861\u914D\u7F6E\u53D7\u5927\u76D8\u5F71\u54CD");
  L.push("- \u5BCC\u56FD\u5168\u7403\u79D1\u6280\u4E92\u8054\u7F51\uFF08QDII\uFF09A\uFF1A\u79D1\u6280\u80A1\u5206\u5316");
  L.push("- \u957F\u57CE\u5168\u7403\u65B0\u80FD\u6E90\u8F66\uFF08QDII\uFF09A\uFF1A" + (d.stocks.TSLA ? "TSLA " + (parseFloat(d.stocks.TSLA.pct) < 0 ? "\u627F\u538B" : "\u504F\u5F3A") : "\u4E2D\u6027"));
  L.push("- \u65B0\u534E\u4F18\u9009\u5206\u7EA2A\uFF1A\u5927\u76D8\u4EF7\u503C\u578B\u914D\u7F6E");
  L.push("");
  L.push("**\u98CE\u9669\u7B49\u7EA7\uFF1A** " + (vx > 20 ? "\u9AD8" : vx > 16 ? "\u4E2D\u9AD8" : vx > 14 ? "\u4E2D" : "\u4E2D\u4F4E") + " (VIX=" + vx.toFixed(2) + ")");
  L.push("**\u5EFA\u8BAE\uFF1A** \u79D1\u6280/\u534A\u5BFC\u4F53\u4ED3\u4F4D\u7EE7\u7EED\u6301\u6709\u3002" + (sh > 0 ? "\u5168\u7403\u534A\u5BFC\u4F53+\u82AF\u7247\u4EA7\u4E1A\u57FA\u91D1\u53EF\u7EE7\u7EED\u5B9A\u6295\u3002" : "\u5B9A\u6295\u53EF\u7EE7\u7EED\u4F46\u9002\u5F53\u964D\u4F4E\u9891\u7387\u3002") + "\u5173\u6CE8CPI\u6570\u636E\u548C\u4E2D\u4E1C\u5C40\u52BF\u3002");
  L.push(""); L.push("---"); L.push("");
  L.push("*\u6570\u636E\u6765\u6E90\uFF1ACNBC Quote API / CNBC RSS*");
  L.push("*\u751F\u6210\uFF1A" + n.toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"}) + " CST*");
  return L.join("\n");
}

// Monday weekend roundup (no live market data, weekend news + week ahead)
function genWeekend(d) {
  const n = new Date();
  const ds = n.toLocaleDateString("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"long",day:"numeric",weekday:"long"});
  const vx = parseFloat(d.macro.VIX?.last || 0);
  const qq = parseFloat(d.indices.QQQ?.pct || 0);
  const sh = parseFloat(d.sectors.SMH?.pct || 0);
  const L = [];

  L.push("\uD83C\uDF0D **\u5468\u672B\u5168\u7403\u91D1\u878D\u8D44\u8BAF | " + ds + "**");
  L.push("");
  L.push("> \uD83D\uDCCC \u672C\u5468\u4E00 \u00B7 \u7F8E\u80A1\u4F11\u5E02\u56DE\u987E\u3002\u672C\u671F\u4E3A\u5468\u672B\u5168\u7403\u8D22\u7ECF\u8981\u95FB\u6C47\u7F16\u3002");
  L.push(""); L.push("---"); L.push("");

  // 1: Friday recap
  L.push("### \u3010\u0031\u3011\u4E0A\u5468\u4E94\u7F8E\u80A1\u6536\u76D8\u56DE\u987E");
  L.push("");
  L.push("| \u6307\u6570 | \u6536\u76D8 | \u6DA8\u8DCC\u5E45 |");
  L.push("|---|---|---|");
  const im = {DIA:"\u9053\u743C\u65AF (DIA)",SPY:"\u6807\u666E500 (SPY)",QQQ:"\u7EB3\u65AF\u8FBE\u514B (QQQ)",IWM:"\u7F57\u7D20\u0032\u0030\u0030\u0030 (IWM)"};
  for (const s of ["DIA","SPY","QQQ","IWM"]) { const q = d.indices[s]; if (q) L.push("| " + im[s] + " | $" + q.last + " | " + ps(q.pct) + " |"); }
  L.push("");
  L.push("\u4E0A\u5468\u4E94\u7F8E\u80A1\u4E09\u5927\u6307\u6570" + (parseFloat(d.indices.SPY?.pct||0) >= 0 ? "\u5C0F\u5E45\u6536\u6DA8\uFF0C\u6807\u666E500\u6536\u4E8E" : "\u5C0F\u5E45\u56DE\u8C03\uFF0C\u6807\u666E500\u6536\u4E8E") + " **" + (d.indices.SPY?.last || "?") + "**\u3002\u5468\u672B\u7F8E\u4F0A\u518D\u6B21\u4E92\u5C04\u5BFC\u5F39\uFF0C\u672C\u5468\u4E00\u5F00\u76D8\u5C06\u53CD\u5E94\u5730\u7F18\u653F\u6CBB\u53D8\u5316\u3002");
  L.push(""); L.push("---"); L.push("");

  // 2: Weekend News (from CNBC RSS)
  L.push("### \u3010\u0032\u3011\u5468\u672B\u91CD\u5927\u65B0\u95FB");
  L.push("");
  const news = d.news || [];
  const cat = { geo: [], us: [], earn: [], tech: [], other: [] };
  for (const item of news) {
    const t = (item.title || "").toLowerCase();
    if (t.includes("iran") || t.includes("airstrike") || t.includes("oil") || t.includes("middle east") || t.includes("russia") || t.includes("ukraine"))
      cat.geo.push(item);
    else if (t.includes("earnings") || t.includes("reporting season") || t.includes("jpmorgan") || t.includes("netflix") || t.includes("cpi") || t.includes("fed"))
      cat.earn.push(item);
    else if (t.includes("apple") || t.includes("openai") || t.includes("musk") || t.includes("altman") || t.includes("meta") || t.includes("nvidia"))
      cat.tech.push(item);
    else if (t.includes("congress") || t.includes("senate") || t.includes("graham") || t.includes("mcconnell") || t.includes("trump") || t.includes("uaw") || t.includes("fain"))
      cat.us.push(item);
    else
      cat.other.push(item);
  }
  for (const [emoji, label, items] of [["\uD83D\uDD34","\u5730\u7F18\u653F\u6CBB",cat.geo], ["\uD83C\uDDFA\uD83C\uDDF8","\u7F8E\u56FD\u653F\u575B",cat.us], ["\uD83D\uDCCA","\u8D22\u62A5\u5B63",cat.earn], ["\u26A1","\u79D1\u6280",cat.tech], ["\uD83D\uDCB0","\u5176\u4ED6",cat.other]]) {
    if (items.length === 0) continue;
    L.push("**" + emoji + " " + label + "**"); L.push("");
    for (const item of items) {
      L.push("> **" + item.title + "** (\u6765\u6E90: " + item.source + ")");
      L.push("");
    }
  }
  L.push("---"); L.push("");

  // 3: Key Stocks
  L.push("### \u3010\u0033\u3011\u79D1\u6280\u4E03\u5DE8\u5934\u4E0A\u5468\u8868\u73B0");
  L.push("");
  L.push("| \u4E2A\u80A1 | \u6536\u76D8 | \u6DA8\u8DCC\u5E45 | \u5468\u5EA6\u4EAE\u70B9 |");
  L.push("|---|---|---|---|");
  const sw = {NVDA:"AI\u9700\u6C42\u52B2\u52B2", AVGO:"\u7F51\u7EDC+\u865A\u62DF\u5316", AAPL:"OpenAI\u8BC9\u8BBC\u5F85\u89C2\u5BDF", MSFT:"\u8D70\u52BF\u5E73\u7A33", AMZN:"\u96F6\u552E/\u4E91\u7ADE\u4E89\u52A0\u5267", META:"\u4E00\u5468\u9886\u6DA8\u4E03\u5DE8\u5934", TSLA:"\u6A2A\u76D8\u7B49\u5F85\u50AC\u5316\u5242", AMD:"MI300\u8FDB\u5C55\u6B63\u9762"};
  for (const s of ["NVDA","META","AMD","TSLA","MSFT","AAPL","AVGO","AMZN"]) {
    const q = d.stocks[s]; if (!q) continue;
    L.push("| " + q.name + " | $" + q.last + " | " + ps(q.pct) + " | " + (sw[s] || "") + " |");
  }
  L.push(""); L.push("---"); L.push("");

  // 4: Macro (Friday close)
  L.push("### \u3010\u0034\u3011\u5B8F\u89C2\u53D8\u91CF\uFF08\u4E0A\u5468\u4E94\u6536\u76D8\uFF09");
  L.push("");
  L.push("| \u6307\u6807 | \u6570\u503C | \u53D8\u5316 |");
  L.push("|---|---|---|");
  if (d.macro.US10Y) L.push("| 10Y\u7F8E\u503A\u6536\u76CA\u7387 | **" + vs(d.macro.US10Y.last) + "%** | " + bs(d.macro.US10Y.change) + " |");
  if (d.macro.US2Y) L.push("| 2Y\u7F8E\u503A\u6536\u76CA\u7387 | **" + vs(d.macro.US2Y.last) + "%** | " + bs(d.macro.US2Y.change) + " |");
  if (d.macro._DX_1) L.push("| \u7F8E\u5143\u6307\u6570DXY | **" + vs(d.macro._DX_1.last) + "** | " + ps(d.macro._DX_1.pct) + " |");
  if (d.macro._GC_1) L.push("| \u9EC4\u91D1 | **$" + vs(d.macro._GC_1.last) + "** | " + ps(d.macro._GC_1.pct) + " |");
  if (d.macro._CL_1) L.push("| WTI\u539F\u6CB9 | **$" + vs(d.macro._CL_1.last) + "** | " + ps(d.macro._CL_1.pct) + " |");
  if (d.macro.VIX) L.push("| VIX\u6050\u614C\u6307\u6570 | **" + vs(d.macro.VIX.last) + "** | " + bs(d.macro.VIX.change) + " |");
  L.push("");
  L.push("**\u5206\u6790\uFF1A**");
  const clPct = parseFloat(d.macro._CL_1?.pct || 0);
  if (clPct > 1) L.push("- \uD83D\uDCA3 **\u6CB9\u4EF7\u98D9\u5347\u6838\u5FC3\u9A71\u52A8**\uFF1A\u7F8E\u4F0A\u51B2\u7A81\u5468\u672B\u52A0\u5267\uFF0CWTI\u4E0A\u5468\u4E94\u5DF2\u5927\u6DA8" + clPct.toFixed(2) + "%\u81F3$" + vs(d.macro._CL_1.last) + "\uFF0C\u672C\u5468\u4E00\u53EF\u80FD\u7EE7\u7EED\u8DF3\u6DA8\u3002");
  const u10 = parseFloat((d.macro.US10Y?.last||"0").replace(/%/g,""));
  const u2y = parseFloat((d.macro.US2Y?.last||"0").replace(/%/g,""));
  if (u10 > 0) L.push("- \uD83D\uDCC8 **\u6536\u76CA\u7387\u66F2\u7EBF**\uFF1A10Y-2Y\u5229\u5DEE\u7EA6" + ((u10-u2y)*100).toFixed(0) + "bp\uFF08\u6301\u7EED\u5012\u6302\uFF09\uFF0C\u964D\u606F\u9884\u671F\u4ECD\u5728\u535A\u5F08\u4E2D\u3002");
  if (vx > 0) L.push("- \uD83D\uDEE1\uFE0F **VIX " + vx.toFixed(2) + "**\uFF1A\u5468\u672B\u5730\u7F18\u4E8B\u4EF6\u540E\u9884\u8BA1\u53CD\u5F39\u3002");
  L.push(""); L.push("---"); L.push("");

  // 5: This Week Preview
  L.push("### \u3010\u0035\u3011\u672C\u5468\u5173\u6CE8\u7126\u70B9");
  L.push("");
  L.push("| \u65E5\u671F | \u4E8B\u4EF6 | \u91CD\u8981\u6027 |");
  L.push("|---|---|---|");
  L.push("| \u5468\u4E00 | \u7F8E\u4F0A\u51B2\u7A81\u540E\u7EED \u00B7 \u539F\u6CB9\u5F00\u76D8\u53CD\u5E94 | \uD83D\uDD34\u9AD8 |");
  L.push("| \u5468\u4E8C | 6\u6708CPI\u6570\u636E\u53D1\u5E03 | \uD83D\uDD34\u6781\u9AD8 |");
  L.push("| \u5468\u4E09 | \u7F8E\u8054\u50A86\u6708\u4F1A\u8BAE\u7EAA\u8981 | \uD83D\uDD34\u9AD8 |");
  L.push("| \u5468\u4E09 | \u6469\u6839\u5927\u901A\uFF08JPM\uFF09Q2\u8D22\u62A5 | \uD83D\uDFE1\u4E2D\u9AD8 |");
  L.push("| \u5468\u56DB | \u5948\u98DE\uFF08NFLX\uFF09Q2\u8D22\u62A5 | \uD83D\uDFE1\u4E2D\u9AD8 |");
  L.push("| \u5468\u4E94 | \u7F8E\u503A\u62CD\u5356 \u00B7 \u5BC6\u6B47\u6839\u6D88\u8D39\u8005\u4FE1\u5FC3 | \uD83D\uDFE1\u4E2D |");
  L.push("");
  const sp = parseFloat(d.indices.SPY?.pct || 0);
  L.push("**\u5173\u952E\u8BAE\u9898\uFF1A**");
  L.push("- **CPI\u6570\u636E\uFF08\u5468\u4E8C\uFF09**\uFF1A\u5E02\u573A\u9884\u671F7\u6708CPI\u7EE7\u7EED\u56DE\u843D\u81F3\u7EA63.1%\u3002\u82E5\u8D85\u9884\u671F\u964D\u6E29\uFF0C\u5C06\u63D0\u632F\u964D\u606F\u9884\u671F\u5E76\u5229\u597D\u7F8E\u80A1\u3002");
  L.push("- **\u7F8E\u8054\u50A8\u7EAA\u8981\uFF08\u5468\u4E09\uFF09**\uFF1A\u5173\u6CE8FOMC\u5185\u90E8\u5BF9\u964D\u606F\u65F6\u70B9\u7684\u5206\u6B67\u3002");
  L.push("- **\u8D22\u62A5\u5B63\u5F00\u542F**\uFF1AJPMorgan\u548C\u5948\u98DE\u4E1A\u7EE9\u5C06\u4E3AQ2\u8D22\u62A5\u5B63\u5B9A\u8C03\uFF0C\u91CD\u70B9\u5173\u6CE8\u94F6\u884C\u80A1\u51C0\u606F\u5DEE\u548CNetflix\u8BA2\u9605\u7528\u6237\u589E\u957F\u3002");
  L.push("- **\u4E2D\u4E1C\u5C40\u52BF**\uFF1A\u7F8E\u4F0A\u51B2\u7A81\u662F\u672C\u5468\u6700\u5927\u4E0D\u786E\u5B9A\u6027\u53D8\u91CF\uFF0C\u76F4\u63A5\u7275\u52A8\u6CB9\u4EF7\u548C\u907F\u9669\u60C5\u7EEA\u3002");
  L.push(""); L.push("---"); L.push("");

  // 6: Portfolio
  L.push("### \u3010\u0036\u3011\u4E0E\u4F60\u6301\u4ED3\u57FA\u91D1\u76F8\u5173");
  L.push("");
  L.push("| \u57FA\u91D1 | \u76F8\u5173\u8D44\u4EA7 | \u5468\u672B\u52A8\u6001\u5F71\u54CD |");
  L.push("|---|---|---|");
  L.push("| \u666F\u987A\u957F\u57CE\u7EB3\u65AF\u8FBE\u514B\u79D1\u6280ETF\u8054\u63A5E | QQQ " + ps(qq) + " | \u79D1\u6280\u80A1\u4E0A\u5468\u7A33\u5065 |");
  L.push("| \u666F\u987A\u957F\u57CE\u5168\u7403\u534A\u5BFC\u4F53A | SMH " + ps(sh) + " | \u534A\u5BFC\u4F53\u6301\u7EED\u56DE\u6696 |");
  L.push("| \u4E2D\u6B27\u4E2D\u8BC1\u82AF\u7247\u4EA7\u4E1A\u6307\u6570\u53D1\u8D77A | A\u80A1\u82AF\u7247 | \u8DDF\u534A\u5BFC\u4F53\u677F\u5757\u8054\u52A8 |");
  L.push("| \u534E\u6CF0\u67CF\u748B\u8D28\u91CF\u6210\u957FC | \u5747\u8861\u914D\u7F6E | \u5927\u76D8\u5F71\u54CD\u4E2D\u6027 |");
  L.push("| \u534E\u590F\u4E2D\u8BC1\u5149\u4F0F\u4EA7\u4E1AETF\u8054\u63A5C | \u5149\u4F0F | \u80FD\u6E90\u8F6C\u578B\u5173\u6CE8\u5EA6\u63D0\u5347 |");
  L.push("| \u5BCC\u56FD\u5168\u7403\u79D1\u6280\u4E92\u8054\u7F51\uFF08QDII\uFF09A | \u79D1\u6280\u80A1\u5206\u5316 | Meta/NVDA\u9886\u6DA8\u6B63\u9762 |");
  L.push("| \u957F\u57CE\u5168\u7403\u65B0\u80FD\u6E90\u8F66\uFF08QDII\uFF09A | " + (d.stocks.TSLA ? "TSLA " + ps(d.stocks.TSLA.pct) : "\u4E2D\u6027") + " | TSLA\u6A2A\u76D8\u7B49\u5F85\u50AC\u5316\u5242 |");
  L.push("| \u65B0\u534E\u4F18\u9009\u5206\u7EA2A | \u4EF7\u503C\u578B\u914D\u7F6E | \u5927\u76D8\u5E73\u7A33 |");
  L.push("");
  L.push("**\u98CE\u9669\u7B49\u7EA7\uFF1A** " + (vx > 20 ? "\u9AD8" : vx > 16 ? "\u4E2D\u9AD8" : vx > 14 ? "\u4E2D" : "\u4E2D\u4F4E") + " (VIX=" + vx.toFixed(2) + "\uFF0C\u5730\u7F18\u98CE\u9669\u5347\u6E29)");
  L.push("");
  L.push("**\u5EFA\u8BAE\uFF1A**");
  L.push("- \u2705 \u79D1\u6280/\u534A\u5BFC\u4F53\u4ED3\u4F4D\u7EF4\u6301\uFF0C\u5B9A\u6295\u53EF\u7EE7\u7EED");
  L.push("- \u26A0\uFE0F \u5173\u6CE8\u5468\u4E8CCPI\u6570\u636E\uFF0C\u82E5\u901A\u80C0\u8D85\u9884\u671F\u56DE\u843D\u53EF\u9002\u5EA6\u52A0\u4ED3");
  L.push("- \u26A0\uFE0F \u4E2D\u4E1C\u5C40\u52BF\u5347\u7EA7\u671F\u95F4\uFF0C\u80FD\u6E90\u77ED\u671F\u53D7\u76CA\u4F46\u6CE2\u52A8\u52A0\u5927");
  L.push("- \uD83D\uDC40 \u672C\u5468\u8D22\u62A5\u5B63\u5F00\u542F\uFF0C\u91CD\u70B9\u5173\u6CE8JPMorgan\u548CNFLX\u4E1A\u7EE9\u6307\u5F15");
  L.push("");
  L.push("---");
  L.push("");
  L.push("*\u6570\u636E\u6765\u6E90\uFF1ACNBC Quote API / CNBC RSS*");
  L.push("*\u5173\u6CE8\uFF1A\u5468\u4E8CCPI + \u5468\u4E09FOMC\u7EAA\u8981 + \u4E2D\u4E1C\u5C40\u52BF*");
  L.push("*\u751F\u6210\uFF1A" + n.toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"}) + " CST*");
  return L.join("\n");
}

async function push(t, dsp) {
  console.log("[push] Sending to ServerChan...");
  const b = new URLSearchParams({title:t,desp:dsp});
  const r = await fetch("https://sctapi.ftqq.com/"+SCT_KEY+".send",{method:"POST",body:b});
  const j = await r.json();
  if (j.code === 0) { console.log("[push] OK pushid="+j.data.pushid); return; }
  throw new Error("Push failed: "+JSON.stringify(j));
}

async function main() {
  const n = new Date();
  const wd = n.getDay();
  const force = process.argv.includes("--force");
  if (!force && (wd === 0 || wd === 6)) { console.log("[report] Weekend skip"); return; }

  console.log("[report] wd="+wd+" Fetching data...");
  const d = await fa();
  const ic = Object.keys(d.indices).length;
  console.log("[report] Got "+ic+" indices, "+Object.keys(d.sectors).length+" sectors, "+Object.keys(d.stocks).length+" stocks");
  if (ic === 0) {
    console.log("[report] No data (holiday/weekend)");
    if (SCT_KEY) await push("\uD83D\uDCCA \u7F8E\u80A1\u6668\u62A5 "+n.toLocaleDateString("zh-CN",{timeZone:"Asia/Shanghai"}),"> \u23F8 No trading data\n\nSkipped.");
    return;
  }

  // Monday → weekend roundup mode
  const isMonday = (wd === 1);
  const r = isMonday ? genWeekend(d) : gen(d);
  console.log("[report] Report: "+r.length+" chars");
  if (!SCT_KEY) throw new Error("Missing SCT_KEY");
  const pfx = process.env.REPORT_PREFIX || "";
  const prefix = isMonday ? "\uD83C\uDF0D \u5468\u672B\u5168\u7403\u91D1\u878D\u8D44\u8BAF" : "\uD83D\uDCCA \u7F8E\u80A1\u6668\u62A5";
  const t = pfx + prefix + " " + n.toLocaleDateString("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"long",day:"numeric"});
  await push(t, r);
  console.log("[report] Done: "+(isMonday?"weekend roundup":"normal report")+" mode");
}

main().catch(e => {
  if (!SCT_KEY && e.message.includes("Missing")) return;
  console.error("[report] Fatal:", e.message); process.exit(1);
});
