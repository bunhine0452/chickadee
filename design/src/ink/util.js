/* ═══════════ 공용 유틸 ═══════════ */
var root = document.documentElement;
var $  = function(s, el){ return (el||document).querySelector(s); };
var $$ = function(s, el){ return Array.prototype.slice.call((el||document).querySelectorAll(s)); };
var Q = new URLSearchParams(location.search);

function store(k, v){ try{ localStorage.setItem('ink.'+k, typeof v === 'string' ? v : JSON.stringify(v)); }catch(e){} }
function load(k){ try{ return localStorage.getItem('ink.'+k); }catch(e){ return null; } }
function loadJSON(k){ try{ return JSON.parse(load(k)); }catch(e){ return null; } }

/* 한국어 조사 : 받침 유무로 은/는 · 이/가 · 을/를 */
function josa(word, withBatchim, withoutBatchim){
  var plain = String(word).replace(/<[^>]+>/g,'').trim();
  var c = plain.charCodeAt(plain.length - 1);
  var isHangul = c >= 0xAC00 && c <= 0xD7A3;
  var has = isHangul ? ((c - 0xAC00) % 28 !== 0) : /[^aeiouAEIOU\W\d]$/.test(plain) && !/[.?!)\]>]$/.test(plain);
  return word + (has ? withBatchim : withoutBatchim);
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function plain(html){ return String(html).replace(/<[^>]+>/g,''); }
function pad2(n){ return (n<10?'0':'')+n; }
function fmtMin(m){ return m < 1 ? Math.round(m*60)+'초' : (Math.round(m*10)/10)+'분'; }

/* ---------- 구문 강조 : 리소 팔레트 안에서 절제 — 판독 보조지 장식이 아니다 ---------- */
var KW = /^(const|let|var|function|return|if|else|await|async|export|import|from|type|new|typeof|null|undefined|true|false|as|for|of|in|while|class|extends|interface|default|throw|try|catch|switch|case|break)$/;
var TOKRE = /(\/\/.*$)|(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$\d])/g;
function hl(src){
  var out = '', m, prev = '';
  TOKRE.lastIndex = 0;
  while ((m = TOKRE.exec(src))){
    var s = m[0];
    if (m[1]) out += '<i class="c">'+esc(s)+'</i>';
    else if (m[2]) out += '<i class="s">'+esc(s)+'</i>';
    else if (m[3]) out += '<i class="n">'+esc(s)+'</i>';
    else if (m[4]){
      var nxt = src.slice(TOKRE.lastIndex).match(/^\s*(\S)/);
      if (KW.test(s)) out += '<i class="k">'+esc(s)+'</i>';
      else if (prev === '<' || prev === '</' || (nxt && nxt[1] === '(')) out += '<i class="f">'+esc(s)+'</i>';
      else out += esc(s);
    }
    else if (m[5]) out += s;
    else out += '<i class="p">'+esc(s)+'</i>';
    if (!m[5]) prev = (prev === '<' && s === '/') ? '</' : s;
  }
  return out;
}
/* 코드 판 한 줄 — seg 가 있으면 조각별로(짚을 토큰 · 빈칸) */
function lineHTML(ln, opts){
  opts = opts || {};
  var body;
  if (ln.seg){
    body = ln.seg.map(function(sg){
      if (sg.hole) return '<span class="hole" data-hole>▢</span>';
      if (sg.pick) return '<button type="button" class="tk" data-k="'+sg.pick+'" role="radio" aria-checked="false" aria-label="'+esc(sg.t)+'">'+hl(sg.t)+'</button>';
      return hl(sg.t);
    }).join('');
  } else body = hl(ln.t);
  return '<div class="ln'+(ln.target?' hi':'')+(opts.cls?' '+opts.cls:'')+'" data-n="'+ln.n+'"><i>'+ln.n+'</i><span>'+(body || ' ')+'</span></div>';
}
function codeHTML(lines, opts){
  opts = opts || {};
  return '<div class="code'+(opts.cls?' '+opts.cls:'')+'" '+(opts.attrs||'')+'>'+lines.map(function(l){ return lineHTML(l, opts); }).join('')+'</div>';
}
function snippet(codeLines, cls){
  return '<div class="code'+(cls?' '+cls:'')+'">'+codeLines.map(function(t, i){ return '<div class="ln"><i>'+(i+1)+'</i><span>'+hl(t)+'</span></div>'; }).join('')+'</div>';
}

/* ---------- Dee 조각 ---------- */
function deeSVG(ly, cls, id){
  return '<span class="dee-sticker" aria-hidden="true"><svg class="dee '+(cls||'')+'" '+(id?'id="'+id+'" ':'')+'data-ly="'+ly+'" viewBox="0 0 100 100"><use href="#dee"/></svg></span>';
}
function passHTML(n, track){
  var h = '<span class="passes '+track+'" aria-label="'+n+'겹">';
  for (var i=0;i<4;i++) h += '<i class="'+(i<n?'on':'')+'"></i>';
  return h + '</span>';
}
var DEE_CLASSES = ['hop','tilt','hang','peek','lifer'];
function deeDo(el, cls){
  if (!el) return;
  DEE_CLASSES.forEach(function(c){ el.classList.remove(c); });
  void el.offsetWidth;
  if (cls) el.classList.add(cls);
}
function regHTML(hit){ return '<svg class="reg'+(hit?' hit':'')+'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 1v22M1 12h22" stroke="currentColor" stroke-width="1.4"/></svg>'; }
function stampHTML(text, sub, cls, r){ return '<span class="stamp hit '+(cls||'')+'" style="--r:'+(r||-6)+'deg">'+text+(sub?'<small>'+sub+'</small>':'')+'</span>'; }

/* ---------- 토스트 · 낭독 ---------- */
var toastEl = $('#toast'), toastT;
function say(msg, sub){
  toastEl.innerHTML = msg + (sub ? '<small>'+sub+'</small>' : '');
  toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('on'); }, 3600);
}
function live(msg){ var l = $('#live'); l.textContent = ''; setTimeout(function(){ l.textContent = plain(msg); }, 30); }

/* ---------- 스위치 : 주간반/야간반 · 부속 보임/숨김 (홈과 같은 키를 써서 페이지를 넘어도 유지) ---------- */
function bindSwitch(btn, attr, def){
  var v = load(attr) || (attr === 'theme' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : def);
  root.setAttribute('data-'+attr, v);
  var paint = function(){ $$('span', btn).forEach(function(s){ s.classList.toggle('on', s.dataset.v === root.getAttribute('data-'+attr)); }); };
  btn.addEventListener('click', function(){
    var cur = root.getAttribute('data-'+attr), spans = $$('span', btn);
    var next = spans[0].dataset.v === cur ? spans[1].dataset.v : spans[0].dataset.v;
    root.setAttribute('data-'+attr, next); store(attr, next); paint();
  });
  paint();
}
