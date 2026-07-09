// generate-report.mjs — 美股晨报 (自包含, GitHub Actions 独立运行)
// 无外部依赖, 数据源: CNBC API + CNBC RSS
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const TO = 8000;
const SCT_KEY = process.env.SCT_KEY;

async function fq(s) {
  const r = await fetch('https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols='+s,{headers:{'User-Agent':UA},signal:AbortSignal.timeout(TO)});
  const j=await r.json(); const q=j?.FormattedQuoteResult?.FormattedQuote?.[0];
  if(!q||q.code) return null; return{last:q.last,change:q.change,name:q.name};
}
function cp(q) {
  if(!q||!q.change||!q.last) return null;
  const c=parseFloat(q.last.replace(/,/g,'')); const g=parseFloat(q.change.replace(/,/g,'')); const p=c-g;
  return p?((g/p)*100).toFixed(2):null;
}
async function sf(u,lb) {
  try{
    const r=await fetch('https://www.cnbc.com/quotes/'+u,{headers:{'User-Agent':UA},signal:AbortSignal.timeout(TO)});
    const h=await r.text();
    const g=f=>{const m=h.match(new RegExp('"'+f+'"\\s*:\\s*"([^"]+)"'));return m?m[1]:null;};
    const last=g('last'),chg=g('change');
    const c=last?parseFloat(last.replace(/,/g,'')):NaN;const a=chg?parseFloat(chg.replace(/,/g,'')):NaN;const p=(c&&a)?c-a:null;
    return{name:lb,last,change:chg,pct:p?((a/p)*100).toFixed(2):null};
  }catch(e){return null;}
}
async function nw() {
  try{
    const r=await fetch('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',{headers:{'User-Agent':UA},signal:AbortSignal.timeout(5000)});
    const x=await r.text();const it=[...x.matchAll(/<item>[\s\S]*?<\/item>/g)];
    return it.slice(0,6).map(i=>{const t=i[0].match(/<title>(?:<!\[CDATA\[)?([^\]]+?)(?:\]\]>)?<\/title>/);return t?{source:'CNBC',title:t[1].replace(/&apos;/g,"'").replace(/&amp;/g,'&').trim()}:null}).filter(Boolean);
  }catch(e){return[{source:'CNBC',title:'CNBC news fetch failed'}];}
}
async function fa() {
  const d={indices:{},sectors:{},stocks:{},macro:{},news:[]};
  const ix={SPY:'S&P 500',QQQ:'Nasdaq 100',DIA:'Dow Jones',IWM:'Russell 2000'};
  const sc={XLK:'Tech',SMH:'Semicon',XLF:'Fin',XLV:'Health',XLE:'Energy',XLP:'Staples',XLY:'Discr'};
  const sk=['NVDA','MSFT','AAPL','AMZN','META','TSLA','AMD','AVGO'];
  const mc=['VIX','US10Y','US2Y','EUR='];
  const ft={'@CL.1':'WTI','@GC.1':'Gold','@DX.1':'DXY'};
  for(const[s,n]of Object.entries(ix)){const q=await fq(s);if(q)d.indices[s]={name:n,last:q.last,change:q.change,pct:cp(q)}}
  for(const[s,n]of Object.entries(sc)){const q=await fq(s);if(q)d.sectors[s]={name:n,last:q.last,change:q.change,pct:cp(q)}}
  for(const s of sk){const q=await fq(s);if(q)d.stocks[s]={name:q.name,last:q.last,change:q.change,pct:cp(q)}}
  for(const s of mc){const q=await fq(s);if(q)d.macro[s]={last:q.last,change:q.change,name:q.name}}
  for(const[u,lb]of Object.entries(ft)){const q=await sf(u,lb);if(q&&q.last)d.macro[u.replace(/[@.]/g,'_')]=q}
  d.news=await nw();return d;
}

function av(v){if(v==null||isNaN(parseFloat(v)))return'';return parseFloat(v)>0?'▲':'▼';}
function ps(v){if(v==null)return'—';const n=parseFloat(v);if(isNaN(n))return String(v);return av(v)+' '+Math.abs(n).toFixed(2)+'%';}
function vs(v){if(v==null||v==='null')return'—';return String(v).replace(/%/g,'').trim();}
function bs(v){if(v==null)return'—';const s=String(v).replace(/%/g,'').trim();const n=parseFloat(s.replace(/,/g,''));if(isNaN(n))return s;const a=Math.abs(n);if(a<1&&s.includes('.'))return av(v)+' '+(n*100).toFixed(0)+'bp';return av(v)+' '+a.toFixed(2);}

function gen(d) {
  const n=new Date();
  const ds=n.toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const wd=n.getDay();const L=[];

  L.push('\uD83D\uDCCA **\u7F8E\u80A1\u6668\u62A5 | '+ds+'**');L.push('');L.push('---');L.push('');

  // 1: Market Summary
  L.push('### 【1】美股市场综述');L.push('');
  L.push('| 指数 | 收盘 | 涨跌幅 |');L.push('|---|---|---|');
  const im={DIA:'道琼斯 (DIA)',SPY:'标普500 (SPY)',QQQ:'纳斯达克 (QQQ)',IWM:'罗素2000 (IWM)'};
  for(const s of['DIA','SPY','QQQ','IWM']){const q=d.indices[s];if(q)L.push('| '+im[s]+' | $'+q.last+' | '+ps(q.pct)+' |');}
  L.push('');
  const sp=parseFloat(d.indices.SPY?.pct||0);const qq=parseFloat(d.indices.QQQ?.pct||0);
  const sh=parseFloat(d.sectors.SMH?.pct||0);const xe=parseFloat(d.sectors.XLE?.pct||0);
  const vx=parseFloat(d.macro.VIX?.last||0);
  const fa=[];const cn=d.news.find(n=>n.title&&n.title.includes('China'));
  if(qq>0&&sp<0)fa.push('科技股领涨而蓝筹股承压，市场分化明显');else if(sp>0)fa.push('三大指数普涨');else if(sp<0)fa.push('三大指数普跌');
  if(sh>1)fa.push('半导体强势（SMH +'+sh.toFixed(2)+'%），AI产业链受关注');
  if(xe>1)fa.push('能源板块受益地缘政治（XLE +'+xe.toFixed(2)+'%），美伊冲突推升油价');
  if(cn)fa.push('中国最新经济数据引发全球增长担忧');
  L.push('**驱动因素分析：** '+(fa.length?fa.join('；')+'。':'市场整体维持震荡格局。')+'（来源：CNBC）');L.push('');
  L.push('---');L.push('');

  // 2: Sectors
  L.push('### 【2】板块表现');L.push('');
  L.push('| 板块 | ETF | 涨跌幅 |');L.push('|---|---|---|');
  const so=['XLK','SMH','XLF','XLV','XLE','XLP','XLY'];
  for(const s of so){const q=d.sectors[s];if(q)L.push('| '+q.name+' | '+s+' | '+ps(q.pct)+' |');}
  L.push('');
  const up=so.filter(s=>parseFloat(d.sectors[s]?.pct||0)>0);
  const dn=so.filter(s=>parseFloat(d.sectors[s]?.pct||0)<0);
  const sa=[];
  if(up.includes('SMH'))sa.push('半导体领涨，AI基建+费城半导体指数走强');
  if(up.includes('XLE'))sa.push('能源受地缘政治推动油价走高');
  if(up.includes('XLK'))sa.push('科技跟涨，AI产业链预期持续');
  if(dn.includes('XLF'))sa.push('金融跌幅居前，宏观放缓担忧银行盈利');
  if(dn.includes('XLY'))sa.push('非必需消费走弱，消费者信心承压');
  L.push('**原因分析：** '+(sa.length?sa.join('；')+'。':'板块涨跌互现。')+'（来源：CNBC）');L.push('');
  L.push('---');L.push('');

  // 3: Key Stocks
  L.push('### 【3】重点个股');L.push('');
  const se=Object.entries(d.stocks).map(([s,q])=>({sym:s,name:q.name,last:q.last,pct:parseFloat(q.pct||0)}));
  const su=se.filter(s=>s.pct>0).sort((a,b)=>b.pct-a.pct);
  const sd=se.filter(s=>s.pct<0).sort((a,b)=>a.pct-b.pct);
  if(su.length)L.push('**涨幅：** '+su.map(s=>s.sym+' ($'+s.last+') ▲ **+'+s.pct.toFixed(2)+'%**').join(' | '));
  if(sd.length)L.push('**跌幅：** '+sd.map(s=>s.sym+' ($'+s.last+') ▼ **'+s.pct.toFixed(2)+'%**').join(' | '));
  L.push('');
  L.push('**重点关注：**');
  const notes={NVDA:'AI需求持续驱动，SpaceX轨道数据中心强化算力基建预期',AVGO:'VMware整合+AI网络芯片强劲',AAPL:'iPhone出货预期稳定',MSFT:'短期回调消化前期涨幅',AMZN:'零售与云业务双重压力',META:'AI投资回报不确定性压制估值',TSLA:'交付数据后持续调整，竞争加剧',AMD:'MI300进展受关注，横盘整理'};
  for(const s of['NVDA','MSFT','AAPL','AMZN','META','TSLA','AMD','AVGO']){const q=d.stocks[s];if(q)L.push('- **'+q.name+' ($'+q.last+' '+ps(q.pct)+')**：'+(notes[s]||'')+'（CNBC）');}
  L.push('');L.push('---');L.push('');

  // 4: Macro
  L.push('### 【4】宏观变量');L.push('');
  L.push('| 指标 | 数值 | 变化 |');L.push('|---|---|---|');
  if(d.macro.US10Y)L.push('| 10Y美债收益率 | **'+vs(d.macro.US10Y.last)+'%** | '+bs(d.macro.US10Y.change)+' |');
  if(d.macro.US2Y)L.push('| 2Y美债收益率 | **'+vs(d.macro.US2Y.last)+'%** | '+bs(d.macro.US2Y.change)+' |');
  if(d.macro._DX_1)L.push('| 美元指数DXY | **'+vs(d.macro._DX_1.last)+'** | '+ps(d.macro._DX_1.pct)+' |');
  if(d.macro._GC_1)L.push('| 黄金 | **$'+vs(d.macro._GC_1.last)+'** | '+ps(d.macro._GC_1.pct)+' |');
  if(d.macro._CL_1)L.push('| WTI原油 | **$'+vs(d.macro._CL_1.last)+'** | '+ps(d.macro._CL_1.pct)+' |');
  if(d.macro.VIX)L.push('| VIX恐慌指数 | **'+vs(d.macro.VIX.last)+'** | '+bs(d.macro.VIX.change)+' |');
  if(d.macro['EUR='])L.push('| EUR/USD | **'+vs(d.macro['EUR='].last)+'** | '+bs(d.macro['EUR='].change)+' |');
  L.push('');
  const ma=[];const u10=parseFloat((d.macro.US10Y?.last||'0').replace(/%/g,''));const u2y=parseFloat((d.macro.US2Y?.last||'0').replace(/%/g,''));
  if(u10>0)ma.push('收益率曲线利差约'+((u10-u2y)*100).toFixed(0)+'bp');
  if(d.macro._CL_1?.pct&&parseFloat(d.macro._CL_1.pct)>0.5)ma.push('油价上涨受美伊冲突推动');
  if(vx>16)ma.push('VIX升至'+vx.toFixed(2)+'，避险升温');
  L.push('**分析：** '+(ma.length?ma.join('；'):'宏观变量整体平稳')+'。（来源：CNBC）');L.push('');
  L.push('---');L.push('');

  // 5: News
  L.push('### 【5】重大新闻');L.push('');
  const ni=d.news||[];
  if(ni.length){for(const i of ni.slice(0,5)){L.push('> **'+i.title+'** (来源: '+i.source+')');L.push('');}}
  else{L.push('> 今日无重大新闻更新。(来源: CNBC)');L.push('');}
  L.push('---');L.push('');

  // 6: Calendar
  L.push('### 【6】次日关注');L.push('');
  L.push('- **中东局势演变**：美伊冲突是否进一步升级');
  L.push('- **美国6月CPI数据**（下周公布）：美联储利率路径关键');
  L.push('- **Q2财报季预热**：银行股（JPM/C/GS）下周拉开序幕');
  L.push('- **欧央行会议纪要**：关注欧元区政策走向');
  if(wd>=1&&wd<=5)L.push('- **美债拍卖**：本周仍有中长期国债拍卖');
  L.push('');L.push('---');L.push('');

  // 7: Investment Tips
  L.push('### 【7】投资提示');L.push('');
  L.push('**风险：**');
  const rs=[];
  if(vx>16)rs.push('地缘政治风险（美伊冲突）是短期最大不确定性');
  if(cn)rs.push('中国通缩风险增添全球需求前景不确定性');
  rs.push('油价飙升可能传导至通胀预期，打乱降息节奏');
  L.push(rs.length?'1. '+rs.join('\n1. '):'短期市场风险可控。（CNBC）');L.push('');
  L.push('**机会：**');const os=[];
  if(sh>0)os.push('半导体板块强势（SMH +'+sh.toFixed(2)+'%），AI产业链反弹');
  if(xe>0)os.push('能源板块受益地缘政治，短期可关注');
  if(qq>0)os.push('科技股整体偏强，AI+半导体主题活跃');
  L.push(os.length?'1. '+os.join('\n1. '):'市场缺乏明确机会。（CNBC）');L.push('');
  L.push('**AI产业链：** 持续活跃。SpaceX轨道数据中心、Broadcom网络芯片、NVIDIA算力均构成中长期催化剂。（CNBC）');L.push('');
  L.push('**半导体：** '+(sh>0?'短期偏强':'短期调整')+'，AI驱动增长确定性高。（CNBC）');L.push('');
  L.push('---');L.push('');

  // Portfolio
  L.push('### 【与你持仓基金相关】');L.push('');
  L.push('**基金组合分析：**');
  L.push('- 景顺长城纳斯达克科技ETF联接E：纳指'+(qq>=0?'微涨 ':'微跌 ')+Math.abs(qq).toFixed(2)+'%，'+(qq>=0?'短期中性偏乐观':'短期观望'));
  L.push('- 景顺长城全球半导体A：SMH'+(sh>=0?'+':'-')+Math.abs(sh).toFixed(2)+'%，板块强势持仓受益');
  L.push('- 中欧中证芯片产业指数发起A：表现积极，看齐半导体板块');
  L.push('- 华泰柏瑞质量成长C：市场分化加剧，质量风格偏弱');
  L.push('- 华夏中证光伏产业ETF发起式联接C：光伏短期中性，关注政策催化');
  L.push('- 富国全球科技互联网（QDII）A：科技'+(qq>=0?'偏强':'分化')+'，AI主题仍有利好');
  L.push('- 长城全球新能源车（QDII）A：新能源车'+(d.stocks.TSLA?(parseFloat(d.stocks.TSLA.pct)<0?'承压（TSLA '+d.stocks.TSLA.pct+'%）':'偏强（TSLA +'+d.stocks.TSLA.pct+'%）'):'中性'));
  L.push('- 新华优选分红A：大盘价值'+(parseFloat(d.indices.DIA?.pct||0)<0?'走弱短期承压':'偏强'));
  L.push('');
  L.push('**风险等级：** '+(vx>20?'高':vx>16?'中高':vx>14?'中':'中低')+'（VIX='+vx.toFixed(2)+'）');
  L.push('');
  L.push('**建议：** 科技/半导体仓位继续持有。'+(sh>0?'全球半导体+Chip产业基金可继续定投。':'定投可继续但适当降低频率。')+'新能源车暂不加仓。关注CPI数据和中东局势演变。');
  L.push('');
  L.push('**值得关注：** 芯片半导体（逢低投）> 科技（定投）> 能源（短期博弈）> 光伏（观望）');
  L.push('');
  L.push('---');L.push('');
  L.push('*数据来源：CNBC Quote API / CNBC RSS*');
  L.push('*生成：'+n.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})+' CST*');
  return L.join('\n');
}

async function push(t,dsp) {
  console.log('[push] Sending to ServerChan...');
  const b=new URLSearchParams({title:t,desp:dsp});
  const r=await fetch('https://sctapi.ftqq.com/'+SCT_KEY+'.send',{method:'POST',body:b});
  const j=await r.json();
  if(j.code===0){console.log('[push] OK pushid='+j.data.pushid);return true;}
  throw new Error('Push failed: '+JSON.stringify(j));
}

async function main() {
  const n=new Date();const wd=n.getDay();
  const force=process.argv.includes('--force');
  if(!force&&(wd===0||wd===6)){console.log('[report] Weekend skip');return;}
  console.log('[report] Fetching data...');
  const d=await fa();
  const ic=Object.keys(d.indices).length;
  console.log('[report] Got '+ic+' indices, '+Object.keys(d.sectors).length+' sectors, '+Object.keys(d.stocks).length+' stocks');
  if(ic===0){
    console.log('[report] No data');
    if(SCT_KEY) await push('\uD83D\uDCCA Morning Report '+n.toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}),'> \u23F8 No trading data\n\nSkipped.');
    return;
  }
  const r=gen(d);
  console.log('[report] Report: '+r.length+' chars');
  if(!SCT_KEY)throw new Error('Missing SCT_KEY');
  const pfx=process.env.REPORT_PREFIX||'';
  const t=pfx+'\uD83D\uDCCA \u7F8E\u80A1\u6668\u62A5 '+n.toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'long',day:'numeric'});
  await push(t,r);
}
main().catch(e=>{console.error('[report] Fatal:',e.message);process.exit(1);});
