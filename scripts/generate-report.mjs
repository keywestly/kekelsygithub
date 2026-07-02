// generate-report.mjs v2 鈥?Daily global market investment briefing
// Author: Personal Investment Advisor AI
import { fetchAll } from "./daily-fetcher.mjs";

function arr(n) { if(isNaN(n)) return "\u25b8"; return n > 0 ? "\u25b2" : n < 0 ? "\u25bc" : "\u25b8"; }
function pct(v) { if(v == null) return "\u2014"; const n = parseFloat(v); if(isNaN(n)) return v; return arr(n) + " " + Math.abs(n).toFixed(2) + "%"; }
function bp(v) { if(v == null) return "\u2014"; const s = String(v).replace(/%/,"").trim(); const n = parseFloat(s.replace(/,/g,"")); if(isNaN(n)) return s; const a = Math.abs(n); if(a < 1 && s.includes(".")) return arr(n) + " " + (n*100).toFixed(0) + "bp"; return arr(n) + " " + a.toFixed(2); }
function val(v) { if(v == null || v == "null") return "\u2014"; return v.toString(); }

function tempScore(vixVal) {
  if (!vixVal || vixVal <= 0) return { s: 50, l: "\u4e2d\u6027" };
  if (vixVal < 14) return { s: 88, l: "\u98ce\u9669\u504f\u597d\u6781\u9ad8" };
  if (vixVal < 17) return { s: 78, l: "\u98ce\u9669\u504f\u597d\u8f83\u9ad8" };
  if (vixVal < 20) return { s: 65, l: "\u504f\u4e50\u89c2" };
  if (vixVal < 24) return { s: 50, l: "\u4e2d\u6027\u504f\u8c28\u614e" };
  if (vixVal < 30) return { s: 35, l: "\u504f\u9632\u5fa1" };
  return { s: 20, l: "\u6050\u614c" };
}

function decideStrategy(d) {
  const vv = parseFloat(d.macro.VIX?.last || 20);
  const sp = parseFloat(d.indices.SPY?.pct || 0);
  const qq = parseFloat(d.indices.QQQ?.pct || 0);
  const sm = parseFloat(d.sectors.SMH?.pct || 0);
  if (vv > 28) return { a: "\u51cf\u4ed3", r: "VIX" + vv.toFixed(1) + "\uff0c\u5e02\u573a\u6050\u614c\uff0c\u51cf\u4ed3\u7b49\u5f85\u5e95\u90e8\u786e\u8ba4" };
  if (vv > 23) return { a: "\u89c2\u671b", r: "VIX " + vv.toFixed(1) + "\uff0c\u4e0d\u786e\u5b9a\u6027\u9ad8\uff0c\u6682\u7f13\u64cd\u4f5c" };
  if (vv > 19) return { a: "\u6301\u6709", r: "VIX " + vv.toFixed(1) + "\uff0c\u5e02\u573a\u4e2d\u6027\u504f\u8c28\u614e\uff0c\u6301\u4ed3\u89c2\u671b" };
  if (sp > 0.5 && qq > 0.5 && sm > 0.5) return { a: "\u52a0\u4ed3", r: "\u4e09\u5927\u6307\u6570\u9f50\u6da8 + \u534a\u5bfc\u4f53\u9886\u6da8\uff0c\u52a0\u4ed3\u79d1\u6280" };
  if (sp < -0.5 && qq < -0.5) return { a: "\u89c2\u671b", r: "\u79d1\u6280\u5927\u8dcc\uff0c\u7b49\u5f85\u56de\u8c03\u5e95\u90e8\u786e\u8ba4" };
  return { a: "\u6301\u6709", r: "\u5e02\u573a\u5206\u5316\uff0c\u6301\u4ed3\u89c2\u671b\u7b49\u5f85\u66f4\u660e\u786e\u4fe1\u53f7" };
}

function opDir(catV, upThreshold, downThreshold) {
  if (catV != null && parseFloat(catV) > upThreshold) return { r: "\u4e70\u5165", s: 4 };
  if (catV != null && parseFloat(catV) < downThreshold) return { r: "\u89c2\u671b", s: 2 };
  if (catV != null && parseFloat(catV) > 0) return { r: "\u6301\u6709", s: 3 };
  return { r: "\u6301\u6709", s: 3 };
}

function star(n) { return "\u2605".repeat(n) + "\u2606".repeat(5 - n); }

async function tr(text) {
  try {
    var url = "https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=en&tl=zh-CN&dt=t&q=" + encodeURIComponent(text);
    var r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    var j = await r.json();
    if (j && j[0] && j[0][0] && j[0][0][0]) return j[0][0][0];
  } catch(e) {}
  return null;
}

async function gen(d) {
  const now = new Date();
  const ds = now.toLocaleDateString("zh-CN", {timeZone:"Asia/Shanghai", year:"numeric",month:"long",day:"numeric",weekday:"long"});
  const L = [];

  const qq = d.indices.QQQ;
  const sp = d.indices.SPY;
  const smh = d.sectors.SMH;
  const vix = d.macro.VIX;
  const u10 = d.macro.US10Y;
  const u2 = d.macro.US2Y;
  const dxy = d.macro._DX_1;
  const gold = d.macro._GC_1;
  const wti = d.macro._CL_1;

  const vv = vix ? parseFloat(vix.last) : 20;
  const gp = gold?.pctChange ? parseFloat(gold.pctChange) : null;

  const strat = decideStrategy(d);

  L.push("\uD83D\uDCCA **\u6BCF\u65E5\u5168\u7403\u5E02\u573A\u6295\u8D44\u7B80\u62A5 | " + ds + "**");
  L.push("\u2500".repeat(24));
  L.push("");

  // Section 1
  L.push("### \u4e00\u3001\u4eca\u65e5\u4e00\u53e5\u8bdd\u7b56\u7565");
  L.push("");
  L.push("**\u7b56\u7565\uFF1A" + strat.a + "**");
  L.push("*" + strat.r + "*");
  L.push("");
  L.push("---");
  L.push("");

  // Section 2
  L.push("### \u4e8c\u3001\u7f8e\u80a1\u6838\u5fc3\u6570\u636e");
  L.push("");
  L.push("| \u6307\u6807 | \u6570\u503c | \u6da8\u8dcc\u5e45 | \u8bf4\u660e |");
  L.push("|---|---|---|---|");

  const qqDir = parseFloat(qq?.pct || 0);
  let qqExp = "\u7eb3\u6307";
  if (qqDir > 0.5) qqExp += "\u7a33\u6b65\u4e0a\u884c\uff0c\u79d1\u6280\u80a1\u627f\u63a5\u529b\u5f3a";
  else if (qqDir > 0) qqExp += "\u5fae\u6da8\uff0c\u5e02\u573a\u60c5\u7eea\u504f\u5b89";
  else if (qqDir > -0.5) qqExp += "\u5fae\u8dcc\uff0c\u79d1\u6280\u80a1\u5206\u5316";
  else qqExp += "\u660e\u663e\u56de\u8c03\uff0c\u5927\u578b\u79d1\u6280\u80a1\u538b\u529b\u8f83\u5927";
  L.push("| QQQ (\u7eb3\u65af\u8fbe\u514b100ETF) | $" + val(qq?.last?.replace(/,/g,"")) + " | " + pct(qq?.pct) + " | " + qqExp + " |");

  const spDir = parseFloat(sp?.pct || 0);
  let spExp = "\u6807\u666e500";
  if (spDir > 0.3) spExp += "\u7a33\u5065\u4e0a\u884c\uff0c\u5e02\u573a\u5e7f\u57fa\u7ec4\u7ec7\u6da8\u52bf\u5747\u5300";
  else if (spDir > -0.3) spExp += "\u633a\u76d8\uff0c\u677f\u5757\u8f6e\u52a8\u52a0\u901f";
  else spExp += "\u56de\u8c03\uff0c\u5927\u76d8\u80a1\u62d6\u7d2f";
  L.push("| \u6807\u666e500 (SPY) | $" + val(sp?.last?.replace(/,/g,"")) + " | " + pct(sp?.pct) + " | " + spExp + " |");

  const smDir = parseFloat(smh?.pct || 0);
  let smExp = "\u8d39\u57ce\u534a\u5bfc\u4f53";
  if (smDir > 1) smExp += "\u5927\u6da8\uff0cAI\u82af\u7247\u9700\u6c42\u5f3a\u52b2 + \u5e76\u8d2d\u50ac\u5316";
  else if (smDir > 0) smExp += "\u5fae\u6da8\uff0c\u534a\u5bfc\u4f53\u677f\u5757\u7a33\u5065";
  else if (smDir > -1) smExp += "\u5fae\u8dcc\uff0c\u77ed\u671f\u56de\u8c03";
  else smExp += "\u5927\u8dcc\uff0c\u534a\u5bfc\u4f53\u5468\u671f\u9884\u671f\u8f6c\u5f31";
  L.push("| \u8d39\u57ce\u534a\u5bfc\u4f53 (SMH\u8d39\u8d39\u8d39) | $" + val(smh?.last?.replace(/,/g,"")) + " | " + pct(smh?.pct) + " | " + smExp + " |");

  L.push("| VIX\u6050\u614c\u6307\u6570 | " + val(vix?.last) + " | " + bp(vix?.change) + " | " +
    (vv < 15 ? "\u5e02\u573a\u60c5\u7eea\u4e50\u89c2\uff0c\u98ce\u9669\u504f\u597d\u9ad8" : vv < 20 ? "\u60c5\u7eea\u504f\u5b89\uff0c\u5e02\u573a\u6b63\u5e38\u6ce2\u52a8" : vv < 25 ? "\u60c5\u7eea\u8c28\u614e\uff0c\u4e0d\u786e\u5b9a\u6027\u4e0a\u5347" : "\u5e02\u573a\u6050\u614c\uff0c\u507f\u907f\u98ce\u9669") + " |");

  const y10Val = u10?.last ? parseFloat(String(u10.last).replace(/%/,"")) : null;
  let y10Exp = "10Y\u7f8e\u503a";
  if (y10Val != null && y10Val > 4.5) y10Exp += "\u7ee7\u7eed\u9ad8\u4f4d\u8fd0\u884c\uff0c\u901a\u80c0\u9884\u671f\u59cb\u7ec8\u96be\u4ee5\u7f13\u89e3";
  else if (y10Val != null && y10Val > 4.3) y10Exp += "\u4e2d\u6027\u504f\u9ad8\uff0c\u5e02\u573a\u5bf9\u964d\u606f\u9884\u671f\u6301\u5e73";
  else if (y10Val != null && y10Val > 4.0) y10Exp += "\u4e2d\u6027\uff0c\u5229\u7387\u73af\u5883\u5bf9\u80a1\u5e02\u5f71\u54cd\u6709\u9650";
  else y10Exp += "\u504f\u4f4e\uff0c\u6709\u5229\u4e8e\u6210\u957f\u80a1\u4f30\u503c";
  L.push("| \u7f8e\u56fd10\u5e74\u671f\u56fd\u503a\u6536\u76ca\u7387 | " + val(u10?.last) + " | " + bp(u10?.change) + " | " + y10Exp + " |");

  const dxyPct = dxy?.pctChange ? parseFloat(dxy.pctChange) : null;
  let dxyExp = "\u7f8e\u5143\u6307\u6570";
  if (dxyPct != null && dxyPct > 0.3) dxyExp += "\u6709\u6240\u633a\u5347\uff0c\u9ec4\u91d1\u548c\u65e5\u5143\u627f\u538b";
  else if (dxyPct != null && dxyPct > -0.3) dxyExp += "\u633a\u76d8\uff0c\u5bf9\u5927\u5e02\u573a\u5f71\u54cd\u6709\u9650";
  else dxyExp += "\u7ee7\u7eed\u8d70\u5f31\uff0c\u6709\u5229\u4e8e\u6784\u5efa\u4e2d\u56fd\u8d44\u4ea7";
  L.push("| \u7f8e\u5143\u6307\u6570DXY | " + val(dxy?.last) + " | " + (dxyPct != null ? pct(String(dxyPct)) : "\u2014") + " | " + dxyExp + " |");

  let gExp = "\u9ec4\u91d1";
  if (gp != null && gp > 0.5) gExp += "\u4e0a\u6da8\uff0c\u5730\u7f18\u98ce\u9669 + \u907f\u9669\u9700\u6c42\u652f\u6491";
  else if (gp != null && gp > 0) gExp += "\u5fae\u6da8\uff0c\u9ec4\u91d1\u7ef4\u6301\u9ad8\u4f4d\u9707\u8361";
  else if (gp != null && gp > -0.5) gExp += "\u5fae\u8dcc\uff0c\u7f8e\u5143\u8d70\u5f3a\u538b\u5236\u9ec4\u91d1\u4ef7\u683c";
  else gExp += "\u4e0b\u8dcc\u660e\u663e\uff0c\u5730\u7f18\u7f13\u548c + \u7f8e\u5143\u4e0a\u884c";
  L.push("| COMEX\u9ec4\u91d1 | $" + val(gold?.last) + " | " + (gp != null ? pct(String(gp)) : "\u2014") + " | " + gExp + " |");
  L.push("");
  L.push("---");
  L.push("");

  // Section 3
  L.push("### \u4e09\u3001AI\u53ca\u534a\u5bfc\u4f53\u677f\u5757");
  L.push("");
  const aiSyms = ["NVDA","MSFT","AAPL","AMZN","META","GOOGL","AVGO","AMD","TSM","MU"];
  const aiNames = {NVDA:"NVIDIA",MSFT:"Microsoft",AAPL:"Apple",AMZN:"Amazon",META:"Meta",GOOGL:"Alphabet",AVGO:"Broadcom",AMD:"AMD",TSM:"TSMC",MU:"Micron"};
  let aiUp = 0, aiDown = 0, su = 0, sd = 0;
  const semiSet = ["NVDA","AMD","AVGO","TSM","MU"];
  aiSyms.forEach(function(s) {
    const q = d.stocks[s];
    if (!q || !q.pct) return;
    const dir = parseFloat(q.pct);
    L.push("- " + (aiNames[s] || s) + " ($" + q.last.replace(/,/g,"") + " " + pct(q.pct) + ")");
    if (dir > 0) { aiUp++; if (semiSet.includes(s)) su++; }
    else if (dir < 0) { aiDown++; if (semiSet.includes(s)) sd++; }
  });
  L.push("");
  const aiS = aiDown > aiUp * 1.5 ? "\u770b\u7a7a" : aiUp > aiDown * 1.5 ? "\u770b\u591a" : "\u4e2d\u6027";
  const smS = sd > su * 1.5 ? "\u770b\u7a7a" : su > sd * 1.5 ? "\u770b\u591a" : "\u4e2d\u6027";
  L.push("**AI\u677f\u5757\uFF1A" + aiS + "** \u2014 " +
    (aiS === "\u770b\u591a" ? "\u79d1\u6280\u80a1\u6da8\u52bf\u5747\u5300\uff0c\u7ee7\u7eed\u770b\u591a" :
     aiS === "\u770b\u7a7a" ? "\u5927\u578b\u79d1\u6280\u666e\u8dcc\uff0c\u7b49\u5f85\u56de\u8c03\u7ed3\u675f" :
     "\u79d1\u6280\u80a1\u5206\u5316\uff0cAI\u4e3b\u9898\u4ecd\u6709\u652f\u6491\u4f46\u4e2a\u80a1\u8868\u73b0\u4e0d\u4e00"));
  L.push("**\u534a\u5bfc\u4f53\uFF1A" + smS + "** \u2014 " +
    (smS === "\u770b\u591a" ? "\u534a\u5bfc\u4f53\u5f3a\u52bf\uff0cAI\u82af\u7247\u9700\u6c42\u7ed3\u6784\u6027\u589e\u957f" :
     smS === "\u770b\u7a7a" ? "\u82af\u7247\u80a1\u56de\u8c03\u8f83\u5927\uff0c\u5468\u671f\u9876\u90e8\u9884\u671f\u52a0\u91cd" :
     "\u534a\u5bfc\u4f53\u5206\u5316\uff0c\u5b58\u50a8\u82af\u7247\u5f3a\u52bf\u4f46\u903b\u8f91\u82af\u7247\u8f83\u5f31"));
  L.push("");
  L.push("---");
  L.push("");

  // Section 4
  L.push("### \u56db\u3001\u5b8f\u89c2\u4e8b\u4ef6");
  L.push("");
  if (d.news && d.news.length > 0) {
    for (var i = 0; i < Math.min(3, d.news.length); i++) {
      var n = d.news[i];
      var zh = await tr(n.title);
      L.push((i+1) + ". **" + n.title + "** (\u6765\u6e90: " + (n.source || "CNBC") + ")");
      if (zh) L.push("   " + zh);
    }
  } else {
    L.push("1. \u65b0\u95fb\u6570\u636e\u83b7\u53d6\u5931\u8d25");
  }
  L.push("");
  L.push("---");
  L.push("");

  // Section 5
  L.push("### \u4e94\u3001\u5bf9\u6211\u6301\u4ed3\u7684\u5f71\u54cd");
  L.push("");
  const ndDir2 = parseFloat(qq?.pct || 0);
  const smDir2 = parseFloat(smh?.pct || 0);
  const goldDir = gp != null ? gp : 0;

  var positions = [];
  positions.push({ n: "\u7eb3\u65af\u8fbe\u514b100\u57fa\u91d1", i: ndDir2 > 0.5 ? "\u5229\u597d" : ndDir2 > -1 ? "\u4e2d\u6027" : "\u5229\u7a7a",
    t: ndDir2 > 0.5 ? "\u7eb3\u6307\u7a33\u5065\u4e0a\u884c\uff0c\u57fa\u91d1\u8d44\u4ea7\u6b63\u9762\u652f\u6491" :
       ndDir2 > -1 ? "\u7eb3\u6307\u5fae\u8dcc\uff0c\u77ed\u671f\u6ce2\u52a8\u5f71\u54cd\u6709\u9650" :
       "\u7eb3\u6307\u56de\u8c03\u8f83\u5927\uff0c\u57fa\u91d1\u77ed\u671f\u538b\u529b\u660e\u663e" });
  var techUp = 0, techDown = 0;
  ["NVDA","MSFT","AAPL","AMZN","META","GOOGL","AVGO","TSM"].forEach(function(s) { var q = d.stocks[s]; if(q && q.pct) { if(parseFloat(q.pct) > 0) techUp++; else techDown++; }});
  positions.push({ n: "\u5168\u7403\u79d1\u6280QDII", i: techDown > techUp * 1.5 ? "\u5229\u7a7a" : techUp > techDown ? "\u5229\u597d" : "\u4e2d\u6027",
    t: techDown > techUp * 1.5 ? "\u79d1\u6280\u80a1\u666e\u8dcc\uff0c\u5168\u7403\u79d1\u6280\u57fa\u91d1\u77ed\u671f\u627f\u538b" :
       techUp > techDown ? "\u79d1\u6280\u80a1\u6574\u4f53\u6da8\u591a\u8dcc\u5c11\uff0c\u57fa\u91d1\u8868\u73b0\u7a33\u5065" :
       "\u79d1\u6280\u80a1\u5206\u5316\uff0c\u57fa\u91d1\u6321\u6563\u653b\u51fb\u80fd\u529b\u8f83\u5f3a" });
  positions.push({ n: "\u534a\u5bfc\u4f53\u57fa\u91d1", i: smDir2 > 1 ? "\u5229\u597d" : smDir2 > -1 ? "\u4e2d\u6027" : "\u5229\u7a7a",
    t: smDir2 > 1 ? "SMH\u5927\u6da8\uff0c\u534a\u5bfc\u4f53\u57fa\u91d1\u76f4\u63a5\u53d7\u76ca" :
       smDir2 > -1 ? "\u534a\u5bfc\u4f53\u633a\u76d8\uff0c\u57fa\u91d1\u77ed\u671f\u5e73\u7a33" :
       "\u534a\u5bfc\u4f53\u56de\u8c03\uff0c\u57fa\u91d1\u77ed\u671f\u56de\u64a4\u53ef\u8003\u8651\u52a0\u4ed3" });
  positions.push({ n: "\u9ec4\u91d1\u8ba4\u6cbd\u6743\u8bc1 HK11133 (\u770b\u8dcc\u9ec4\u91d1)", i: goldDir < 0 ? "\u5229\u597d" : goldDir > 0.3 ? "\u5229\u7a7a" : "\u4e2d\u6027",
    t: goldDir < 0 ? "\u9ec4\u91d1\u4e0b\u8dcc\uff0c\u8ba4\u6cbd\u6743\u8bc1\u83b7\u5229" :
       goldDir > 0.3 ? "\u9ec4\u91d1\u4e0a\u6da8\uff0c\u8ba4\u6cbd\u6743\u8bc1\u77ed\u671f\u56de\u64a4" :
       "\u9ec4\u91d1\u633a\u76d8\uff0c\u6743\u8bc1\u6ce2\u52a8\u6709\u9650" });
  positions.push({ n: "\u8054\u79d1\u79d1\u6280 (001207)", i: ndDir2 > 0.3 ? "\u5229\u597d" : "\u4e2d\u6027",
    t: ndDir2 > 0.3 ? "\u7eb3\u6307\u4e0a\u884c\uff0c\u79d1\u6280\u80a1\u60c5\u7eea\u6b63\u9762\u5f71\u54cdA\u80a1\u79d1\u6280" :
       "\u8054\u79d1\u79d1\u6280\u4e0e\u7eb3\u6307\u8054\u52a8\u6027\u6709\u9650\uff0c\u4e3b\u8981\u53d7A\u80a1\u5185\u751f\u52a8\u529b\u5f71\u54cd" });
  positions.push({ n: "\u822a\u9526\u79d1\u6280 (000818)", i: smDir2 > 0 ? "\u4e2d\u6027\u504f\u597d" : "\u4e2d\u6027",
    t: smDir2 > 0 ? "\u534a\u5bfc\u4f53\u677f\u5757\u6536\u6da8\uff0c\u5bf9\u822a\u9526\u79d1\u6280\u60c5\u7eea\u6709\u6b63\u9762\u5f71\u54cd" :
       "\u822a\u9526\u79d1\u6280\u66f4\u591a\u53d7\u519b\u5de5/\u5316\u5de5\u5468\u671f\u5f71\u54cd\uff0c\u4e0e\u7f8e\u80a1\u534a\u5bfc\u4f53\u8054\u52a8\u6027\u4e0d\u5927" });
  positions.forEach(function(p) { L.push("- **" + p.n + "**\uFF1A**" + p.i + "**\u2014" + p.t); });
  L.push("");

  var goldPctStr = gold?.pctChange ? parseFloat(gold.pctChange) : 0;
  var goldPctV = typeof goldPctStr === "number" ? goldPctStr : 0;
  var hkAct = goldPctV < -0.5 ? "加仓" : goldPctV < 0 ? "持有" : goldPctV < 0.5 ? "减仓" : "离场";
  var hkConf = Math.abs(goldPctV) > 1 ? 4 : Math.abs(goldPctV) > 0.5 ? 3 : Math.abs(goldPctV) > 0.2 ? 2 : 1;
  L.push("");
  L.push("**黄金/DXY/美债专题：**");
  L.push("- **黄金：**" + pct(String(goldPctV)) + " 至 $" + val(gold?.last) + " — " + (goldPctV < 0 ? "美元走强+地缘缓和压制" : goldPctV > 0 ? "避险需求支撑" : "挺盘"));
  L.push("- **DXY：**" + (dxy && dxy.pctChange ? pct(dxy.pctChange) : "—") + " 至 " + val(dxy?.last));
  L.push("- **10Y美债：**" + val(u10?.last) + " " + bp(u10?.change));
  L.push("- **HK11133(黄金认沽权证)：**" + hkAct + " " + star(hkConf) + " (信心评分" + hkConf + "/5)");
  L.push("---");
  L.push("");

  // Section 6
  L.push("### \u516d\u3001\u4eca\u65e5A\u80a1\u5f71\u54cd\u9884\u6d4b");
  L.push("");
  var aShares = [];
  aShares.push({ n: "\u521b\u4e1a\u677f", t: ndDir2 > 0 ? "\u5f71\u54cd\u8f83\u5927\uff1a\u504f\u79d1\u6280\u5c5e\u6027\uff0c\u7eb3\u6307\u6536\u6da8\u6709\u5229\u4e8e\u521b\u4e1a\u677f\u60c5\u7eea" : "\u5f71\u54cd\u6709\u9650\uff1a\u5185\u751f\u52a8\u529b\u4e3b\u5bfc\uff0c\u7f8e\u80a1\u79d1\u6280\u56de\u8c03\u5bf9\u521b\u4e1a\u677f\u60c5\u7eea\u6709\u4e00\u5b9a\u538b\u5236" });
  aShares.push({ n: "\u79d1\u521b\u677f", t: ndDir2 > 0 ? "\u5f71\u54cd\u8f83\u5927\uff1a\u79d1\u521b\u677f\u4e0e\u7eb3\u6307\u8054\u52a8\u6027\u6700\u5f3a\uff0c\u79d1\u6280\u80a1\u60c5\u7eea\u76f4\u63a5\u53d7\u76ca" : "\u5f71\u54cd\u660e\u663e\uff1a\u79d1\u521b\u677f\u53d7\u7f8e\u80a1\u79d1\u6280\u56de\u8c03\u5f71\u54cd\u6700\u5927\uff0c\u77ed\u671f\u538b\u529b\u8f83\u5927" });
  aShares.push({ n: "\u534a\u5bfc\u4f53", t: smDir2 > 0 ? "\u5f71\u54cd\u8f83\u5927\uff1a\u7f8e\u80a1\u534a\u5bfc\u4f53\u6536\u6da8\u76f4\u63a5\u62c9\u52a8A\u80a1\u82af\u7247\u677f\u5757\u60c5\u7eea" : "\u5f71\u54cd\u660e\u663e\uff1a\u7f8e\u80a1\u534a\u5bfc\u4f53\u56de\u8c03\u538b\u5236A\u80a1\u82af\u7247\u677f\u5757" });
  aShares.push({ n: "AI", t: ndDir2 > 0 ? "\u5f71\u54cd\u8f83\u5927\uff1aAI\u4e3b\u9898\u5168\u7403\u8054\u52a8\uff0c\u7eb3\u6307\u6536\u6da8\u6709\u52a9\u4e8eA\u80a1AI\u677f\u5757\u7ef4\u6301\u70ed\u5ea6" : "\u5f71\u54cd\u660e\u663e\uff1aAI\u4e3b\u9898\u53d7\u79d1\u6280\u80a1\u56de\u8c03\u5f71\u54cd\uff0cA\u80a1AI\u677f\u5757\u77ed\u671f\u8c28\u614e" });
  aShares.push({ n: "PCB", t: "\u5f71\u54cd\u4e2d\u7b49\uff1aPCB\u677f\u5757\u4e0e\u534a\u5bfc\u4f53\u3001AI\u6709\u4e00\u5b9a\u8054\u52a8\u6027\uff0c\u4f46\u66f4\u591a\u53d7A\u80a1\u5185\u751f\u751f\u6001\u5dee\u5f02\u5f71\u54cd" });
  aShares.push({ n: "\u9ec4\u91d1", t: goldDir > 0 ? "\u5f71\u54cd\u660e\u663e\uff1a\u7f8e\u80a1\u9ec4\u91d1\u4e0a\u6da8\u76f4\u63a5\u62c9\u52a8A\u80a1\u9ec4\u91d1\u677f\u5757" : "\u5f71\u54cd\u660e\u663e\uff1a\u7f8e\u80a1\u9ec4\u91d1\u4e0b\u8dcc\u538b\u5236A\u80a1\u9ec4\u91d1\u677f\u5757\u60c5\u7eea" });
  aShares.push({ n: "\u519b\u5de5", t: "\u5f71\u54cd\u6709\u9650\uff1a\u519b\u5de5\u677f\u5757\u4e3b\u8981\u53d7\u5730\u7f18\u653f\u6cbb\u548c\u56fd\u5185\u653f\u7b56\u5f71\u54cd\uff0c\u4e0e\u7f8e\u80a1\u8054\u52a8\u6027\u4f4e" });
  aShares.forEach(function(a) { L.push("- **" + a.n + "\uff1a**" + a.t); });
  L.push("");
  L.push("---");
  L.push("");

  // Section 7
  L.push("### \u4e03\u3001\u4eca\u65e5\u64cd\u4f5c\u5efa\u8bae");
  L.push("");
  var ndOp4 = opDir(qq?.pct, 0.5, -1);
  var smOp4 = opDir(smh?.pct, 1, -1.5);
  var gOp4 = gp != null ? (gp < -0.3 ? { r: "\u4e70\u5165", s: 4 } : gp > 0.5 ? { r: "\u51cf\u4ed3", s: 2 } : { r: "\u6301\u6709", s: 3 }) : { r: "\u6301\u6709", s: 3 };
  L.push("- **\u7eb3\u6307\uFF1A" + star(ndOp4.s) + "** ==> **" + ndOp4.r + "**");
  L.push("- **\u534a\u5bfc\u4f53\uFF1A" + star(smOp4.s) + "** ==> **" + smOp4.r + "**");
  L.push("- **\u9ec4\u91d1\uFF1A" + star(gOp4.s) + "** ==> **" + gOp4.r + "**");
  L.push("- **A\u80a1\u79d1\u6280\uFF1A" + star(ndOp4.s) + "** ==> **" + ndOp4.r + "**");
  L.push("");
  L.push("---");
  L.push("");

  // Section 8
  L.push("### \u516b\u3001\u4eca\u665a\u5173\u6ce8");
  L.push("");
  var wd = now.getDay();
  if (wd === 5 || wd === 6 || wd === 0) {
    L.push("1. **\u4e0b\u5468PCE\u6570\u636e\uFF1A** \u7f8e\u8054\u50a8\u6700\u5173\u6ce8\u7684\u901a\u80c0\u6307\u6807\uFF0c\u5f71\u54cd\u964d\u606f\u8def\u5f84\u9884\u671f");
    L.push("2. **\u4e0b\u5468\u975e\u519c\u6570\u636e\uFF1A** \u52b3\u52a8\u5e02\u573a\u66f4\u65b0\uFF0c\u4f1a\u5f71\u54cd\u5e02\u573a\u5bf9\u7ecf\u6d4e\u5f62\u52bf\u7684\u5224\u65ad");
    L.push("3. **\u7f8e\u8054\u50a8\u5b98\u5458\u8bb2\u8bdd\uFF1A** \u5173\u6ce8\u5bf9\u964d\u606f\u8282\u594f\u7684\u6697\u793a");
  } else {
    L.push("1. **\u7ecf\u6d4e\u6570\u636e\uFF1A** \u7f8e\u56fd\u5efa\u623f\u5141\u8bb8\u3001\u8010\u4e45\u54c1\u8ba2\u5355");
    L.push("2. **\u7f8e\u8054\u50a8\uFF1A** \u5b98\u5458\u8bb2\u8bdd\u5bf9\u5229\u7387\u8def\u5f84\u7684\u6697\u793a");
    L.push("3. **\u5730\u7f18\u653f\u6cbb\uFF1A** \u4e2d\u4e1c\u5c40\u52bf\u3001\u7f8e\u4f0a\u534f\u8bae\u8fdb\u5c55");
  }
  L.push("");
  L.push("---");
  L.push("");

  // Section 9
  L.push("### \u4e5d\u3001\u5e02\u573a\u6e29\u5ea6");
  var temp = tempScore(vv);
  L.push("");
  L.push("**\u5e02\u573a\u6e29\u5ea6\uFF1A" + temp.s + "/100\u5206**\u2014" + temp.l);
  L.push("");
  var spState = sp?.pct ? (parseFloat(sp.pct) > 0 ? "\u4e0a\u884c" : "\u4e0b\u8dcc") : "\u633a\u76d8";
  L.push("\u603b\u7ed3\uFF1A\u5e02\u573a\u6e29\u5ea6" + temp.s + "\u5206\uFF0C" + temp.l + "\uFF0C\u6807\u666e500" + spState + "\u4e2d\uFF0C" +
    (vv < 18 ? "\u79d1\u6280\u80a1\u4ecd\u5360\u4f18\u52bf" :
     vv < 22 ? "\u5747\u8861\u914d\u7f6e\u4e3a\u4e3b" :
     "\u507f\u907f\u98ce\u9669\u4e3a\u4e3b"));
  L.push("");
  L.push("\u2500".repeat(24));
  L.push("");
  L.push("\u26a0\ufe0f *\u4ec5\u4f9b\u53c2\u8003\uff0c\u4e0d\u6784\u6210\u6295\u8d44\u5efa\u8bae\u3002\u6570\u636e\u6765\u6e90: CNBC*");
  return L.join("\n");
}

async function push(key, title, desp) {
  console.log("[report] Pushing to ServerChan...");
  var body = new URLSearchParams({title: title, desp: desp});
  var r = await fetch("https://sctapi.ftqq.com/" + key + ".send", { method: "POST", body: body });
  var j = await r.json();
  if (j.code === 0) { console.log("[report] OK pushid=" + j.data.pushid); }
  else { console.error("[report] FAIL:", JSON.stringify(j)); process.exit(1); }
}

async function main() {
  console.log("[report] Fetching market data...");
  var data = await fetchAll();
  var c = Object.keys(data.indices).length;
  if (c === 0) {
    var ds = new Date().toLocaleDateString("zh-CN", {timeZone:"Asia/Shanghai", year:"numeric", month:"long", day:"numeric", weekday:"long"});
    console.log("[report] No market data (holiday/weekend)");
    var k = process.env.SCT_KEY;
    if (k) await push(k, "\uD83D\uDCCA \u6bcf\u65e5\u5168\u7403\u5e02\u573a\u6295\u8d44\u7b80\u62a5 | " + ds, "> \u23f8 \u4eca\u65e5\u65e0\u6709\u6548\u4ea4\u6613\u6570\u636e\uFF08\u975e\u4ea4\u6613\u65e5\u6216\u6570\u636e\u6e90\u5f02\u5e38\uFF09\n\n\u672c\u671f\u7b80\u62a5\u8df3\u8fc7\u3002");
    return;
  }
  console.log("[report] Data: " + c + " indices, " + Object.keys(data.sectors).length + " sectors, " + Object.keys(data.stocks).length + " stocks");
  var report = await gen(data);
  console.log("[report] Report: " + report.length + " chars");
  var k = process.env.SCT_KEY;
  if (!k) throw new Error("Missing SCT_KEY");
  var prefix = process.env.REPORT_PREFIX || "";
var title = prefix + "\uD83D\uDCCA \u6bcf\u65e5\u5168\u7403\u5e02\u573a\u6295\u8d44\u7b80\u62a5 " + new Date().toLocaleDateString("zh-CN", {timeZone:"Asia/Shanghai", year:"numeric", month:"long", day:"numeric"});
  await push(k, title, report);
}

main().catch(function(e) { console.error("[report] Error:", e.message); process.exit(1); });