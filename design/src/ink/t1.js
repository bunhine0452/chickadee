/* ═══════════ T1 클론 코딩 — 고정 골격 / 가변 잉크 · 줄을 벗어날 때만 판정 · 같은 뜻인데요 ═══════════ */
var T1M = (function(){
  var T = null, KWSET = {};
  'const let var function return if else await async export import from type new typeof null undefined true false as for of in while class extends interface default throw try catch'.split(' ').forEach(function(k){ KWSET[k] = 1; });
  var PROT = {}; 'useState useLogin FormEvent preventDefault submit target value form input button className disabled type onChange onSubmit error pending email password string'.split(' ').forEach(function(k){ PROT[k] = 1; });
  var ORIG_IDENTS = {};
  var STAGES = [['보고 치기','원본을 보면서 그대로'],['뼈대만','주석과 시그니처만'],['백지','한 줄 스펙만']];

  function toks(s){ return (s.match(/[A-Za-z_$][\w$]*|\d+|\S/g) || []); }
  function isIdent(t){ return /^[A-Za-z_$][\w$]*$/.test(t) && !KWSET[t]; }

  function mount(ctx){
    T = {ctx:ctx, stage:T1.stage, ticks:{}, cur:0, peeks:0, downgraded:false, view:'edit', disputed:{}, res:null, shortOk:false, whyText:'', whyPick:null, lyFrom:T1.ly, lyTo:T1.ly};
    T1.original.forEach(function(l){ toks(l).forEach(function(t){ if (isIdent(t)) ORIG_IDENTS[t] = 1; }); });
    render();
    ctx.guide('필사 중엔 조용히 있을게요. 막히면 <code>`</code> 를 누르고 있어요.', null);
    live('LoginForm 필사 판을 걸었습니다. 2단계, 주석과 시그니처만 남아 있습니다.');
  }

  function head(no){
    return regHTML(false) +
      '<div class="guide" id="guide" aria-hidden="true"><span class="say" id="say"></span><svg class="dee" id="deeGuide" data-ly="4" viewBox="0 0 100 100"><use href="#deeBird"/></svg></div>' +
      '<div class="ps-rail">'+deeSVG(T.lyTo,'sm','deeRail')+'<span class="plus" id="railPlus"></span><span class="vt" id="railVt">'+no+' · '+T.lyTo+'겹 · '+LY[T.lyTo].k+'</span></div>';
  }
  function headIn(no, pl){
    return '<div class="ps-head"><span class="sig mr" data-w="'+no+'"><span>'+no+'</span></span>' +
      '<div><h2 class="ps-h2"><span class="pill t1">T1</span><code>'+T1.code+'</code> 필사<span class="pl">'+pl+'</span></h2>' +
      '<div class="ps-src">내 코드 <b>'+T1.file+'</b> · <b>'+T1.fn+'</b> · '+T1.original.length+'줄 · 주 2회 리듬</div></div>' +
      '<div class="ps-ly">'+passHTML(T.lyTo,'t1')+'<span class="lyn">잉크 <b>'+T.lyTo+'겹</b> / 4 · '+LY[T.lyTo].k+'</span></div></div>';
  }
  function stepper(){
    return '<div class="stepper" role="list">' + STAGES.map(function(s, i){
      var n = i+1, cls = n < T.stage ? 'done' : n === T.stage ? 'cur' : '';
      return '<div class="step '+cls+'" role="listitem"><b>'+n+'</b><span>'+s[0]+'</span><small>'+s[1]+'</small></div>';
    }).join('') + '</div>';
  }

  /* ---------- 편집 화면 ---------- */
  function render(){
    var ctx = T.ctx, no = ctx.no;
    var refRows = T1.original.map(function(t, i){
      var ink = T.stage === 1 || T1.show2.indexOf(i) >= 0;
      if (ink) return '<div class="ln" data-n="'+(i+1)+'"><i>'+(i+1)+'</i><span>'+(hl(t)||' ')+'</span></div>';
      var ind = t.match(/^\s*/)[0].length, w = Math.min(30, Math.max(4, t.trim().length * 0.56));
      return '<div class="ln hidden" data-n="'+(i+1)+'"><i>'+(i+1)+'</i><span>'+' '.repeat(ind)+'<i class="ph" style="width:'+w.toFixed(1)+'em"></i><span class="ink">'+hl(t)+'</span></span></div>';
    }).join('');
    var draft = load('t1.draft') || '';
    ctx.bench.innerHTML =
      '<article class="ps wide" style="--tilt:.15deg" data-card="loginform">' + head(no) +
        '<div class="ps-in">' + headIn(no, '2번째 인쇄 · '+T.stage+'단계 '+STAGES[T.stage-1][0]) + stepper() +
          '<p class="ask">'+(T.stage===1?'원본을 보면서 그대로 옮겨 쓰세요.':T.stage===2?'주석과 시그니처만 보고, 내가 썼던 <code>LoginForm</code> 을 다시 써 보세요.':'스펙만 보고 처음부터 써 보세요.')+'<small>손으로 쓰는 것 자체가 목적입니다. 100% 일치하지 않아도 됩니다. 줄을 벗어날 때만 판정하고, 타이핑 중에는 아무 일도 일어나지 않습니다.</small></p>' +
          '<div class="split">' +
            '<div class="ref" id="ref"><div class="pane-h"><b>'+(T.stage===1?'원본 — 보면서 그대로 치세요':'주석과 시그니처만')+'</b><span class="mono">'+(T.stage===1?'TypeScript · 20줄':'본문은 가려져 있습니다')+'</span></div><div class="code">'+refRows+'</div></div>' +
            '<div class="vr"></div>' +
            '<div><div class="pane-h"><b>직접 쓰기</b><span class="mono" id="edMeta">0줄 · 자동 저장</span></div>' +
              '<div class="editor" id="editor"><div class="gut" id="gut"></div><textarea id="ta" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="필사 입력">'+esc(draft)+'</textarea></div>' +
              '<div class="ed-status"><span class="legend"><i class="e"></i>정합 <i class="q"></i>동등 <i class="d"></i>어긋남</span><span><b>Tab</b> 들여쓰기</span><span><b>`</b> 누르고 있기 = 원본 잠깐 보기</span><span><b>⌘↵</b> 채점</span><span id="peekN">원본 본 횟수 <b>0</b></span></div>' +
            '</div>' +
          '</div>' +
          '<div class="slot" style="min-height:0"></div>' +
          '<div class="acts" id="t1acts">' +
            '<button type="button" class="flat-btn dunno" id="t1peek">모르겠어요 · 원본 잠깐 보기 <kbd class="k">`</kbd></button>' +
            '<button type="button" class="flat-btn ghost" id="t1down">한 단계 쉽게 <kbd class="k">⌘.</kbd></button>' +
            '<button type="button" class="flat-btn ghost" id="t1sample">예시 답안 채우기 · 데모</button>' +
            '<span class="hint">힌트는 감점이 아니라 이 판을 더 자주 보여줄 신호로만 쓰입니다.</span><span class="sp"></span>' +
            '<button type="button" class="press-btn" id="t1grade">채점하기 <kbd class="k">⌘↵</kbd></button>' +
          '</div>' +
        '</div>' +
      '</article>';
    bindEditor();
    paintGutter(true);
  }
  function bindEditor(){
    var ta = $('#ta'), ed = $('#editor');
    ['input','click','keyup','select'].forEach(function(ev){ ta.addEventListener(ev, function(){ updateCaret(ev === 'input'); }); });
    ta.addEventListener('focus', function(){ ed.classList.add('focus'); });
    ta.addEventListener('blur', function(){ ed.classList.remove('focus'); });
    ta.addEventListener('keydown', function(e){
      if (e.key === 'Tab'){ e.preventDefault(); insert('  '); return; }
      if (e.key === 'Enter' && T.stage < 3){ e.preventDefault(); var pos = ta.selectionStart, before = ta.value.slice(0, pos), line = before.slice(before.lastIndexOf('\n')+1); var ind = line.match(/^\s*/)[0]; if (/[{(\[]\s*$/.test(line)) ind += '  '; insert('\n'+ind); return; }
      if (e.key === '`'){ e.preventDefault(); if (!e.repeat) peek(true); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter'){ e.preventDefault(); grade(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === '.'){ e.preventDefault(); down(); return; }
    });
    ta.addEventListener('keyup', function(e){ if (e.key === '`') peek(false); });
    var pk = $('#t1peek');
    pk.addEventListener('mousedown', function(){ peek(true); }); pk.addEventListener('mouseup', function(){ peek(false); }); pk.addEventListener('mouseleave', function(){ peek(false); });
    pk.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if (!e.repeat) peek(true); } });
    pk.addEventListener('keyup', function(e){ if (e.key === 'Enter' || e.key === ' ') peek(false); });
    $('#t1down').addEventListener('click', down);
    $('#t1sample').addEventListener('click', function(){ ta.value = T1.sample.join('\n'); T.ticks = {}; lines().forEach(function(l, i){ T.ticks[i] = evalLine(i, l); }); paintGutter(); store('t1.draft', ta.value); say('예시 답안을 채웠습니다.', '동등(따옴표·이름 치환)과 어긋남(누락·맞바꿈)이 한 번씩 들어 있습니다.'); });
    $('#t1grade').addEventListener('click', grade);
  }
  function insert(s){ var ta = $('#ta'), st = ta.selectionStart, en = ta.selectionEnd; ta.value = ta.value.slice(0, st) + s + ta.value.slice(en); ta.selectionStart = ta.selectionEnd = st + s.length; updateCaret(true); }
  function lines(){ return $('#ta').value.split('\n'); }
  function caretLine(){ var ta = $('#ta'); return ta.value.slice(0, ta.selectionStart).split('\n').length - 1; }
  function updateCaret(changed){
    var ta = $('#ta'), ln = caretLine(), ls = lines();
    if (ln !== T.cur){ if (ls[T.cur] !== undefined) T.ticks[T.cur] = evalLine(T.cur, ls[T.cur]); T.cur = ln; }
    if (changed){ store('t1.draft', ta.value); }
    paintGutter();
  }
  function paintGutter(initial){
    var ls = lines(), n = Math.max(ls.length, 20), ta = $('#ta');
    ta.rows = n + 1;
    $('#gut').innerHTML = Array.apply(null, {length:n}).map(function(_, i){ return '<div class="gl '+(T.ticks[i]||'')+(i===T.cur?' cur':'')+'">'+(i+1)+'</div>'; }).join('');
    $('#edMeta').textContent = ls.filter(function(l){ return l.trim(); }).length + '줄 · ' + (initial ? '자동 저장' : '저장됨 ' + pad2(new Date().getHours()) + ':' + pad2(new Date().getMinutes()));
  }
  function peek(on){
    var ref = $('#ref'); if (!ref) return;
    if (on && !ref.classList.contains('peek')){ T.peeks++; $('#peekN').innerHTML = '원본 본 횟수 <b>'+T.peeks+'</b>'; var cur = $('.ln[data-n="'+(T.cur+1)+'"]', ref); if (cur) cur.scrollIntoView({block:'nearest'}); }
    ref.classList.toggle('peek', on);
  }
  function down(){ if (T.stage <= 1) return; T.downgraded = true; T.stage--; store('t1.draft', $('#ta').value); render(); say('한 단계 쉽게 — 기록만 남고 감점은 없습니다.'); }

  /* ---------- 판정 : 줄 단위 ---------- */
  function evalLine(i, text){
    if (!text.trim()) return '';
    var best = 'differ';
    for (var j = Math.max(0, i-3); j <= Math.min(T1.original.length-1, i+3); j++){
      var r = compareLine(T1.original[j], text);
      if (r.status === 'exact') return 'exact';
      if (r.status === 'equiv' || r.status === 'pending') best = 'equiv';
    }
    return best;
  }
  function compareLine(o, u){
    var reasons = [], maps = [];
    if (o === u || o.replace(/\s+$/,'') === u.replace(/\s+$/,'')) return {status:'exact', reasons:[], maps:[]};
    var oc = /^\s*\/\//.test(o), uc = /^\s*\/\//.test(u);
    if (oc && uc) return {status:'equiv', reasons:['주석 문구는 비교하지 않음'], maps:[]};
    if (oc !== uc) return {status:'differ', reasons:[oc ? '원본의 주석이 없습니다' : '원본에 없는 주석입니다'], maps:[]};
    if (!o.trim() && !u.trim()) return {status:'exact', reasons:[], maps:[]};
    if (!o.trim() || !u.trim()) return {status:'differ', reasons:['한쪽이 빈 줄입니다'], maps:[]};
    if (o.match(/^\s*/)[0].length !== u.match(/^\s*/)[0].length) reasons.push('들여쓰기 폭');
    var a = o.trim(), b = u.trim();
    var ea = /[;,]$/.test(a), eb = /[;,]$/.test(b);
    if (ea !== eb){ a = a.replace(/[;,]$/,''); b = b.replace(/[;,]$/,''); reasons.push('세미콜론 / 후행 쉼표'); }
    var q = function(s){ return s.replace(/'([^'\\]*)'/g, '"$1"').replace(/`([^`$]*)`/g, '"$1"'); };
    if (q(a) !== a || q(b) !== b){ if (q(a) === q(b) || toks(q(a)).join(' ') === toks(q(b)).join(' ')) reasons.push('따옴표 종류'); a = q(a); b = q(b); }
    var ta = toks(a), tb = toks(b);
    if (ta.join(' ') === tb.join(' ')) return {status:'equiv', reasons: reasons.length ? reasons : ['공백'], maps:[]};
    if (ta.length !== tb.length) return {status:'differ', reasons:['토큰 수가 다릅니다'], maps:[]};
    for (var i = 0; i < ta.length; i++){
      if (ta[i] === tb[i]) continue;
      if (!isIdent(ta[i]) || !isIdent(tb[i]) || PROT[ta[i]] || PROT[tb[i]] || (i > 0 && ta[i-1] === '.')) return {status:'differ', reasons:['토큰 불일치 ('+ta[i]+' ↔ '+tb[i]+')'], maps:[]};
      maps.push([ta[i], tb[i]]);
    }
    return {status:'pending', reasons:reasons, maps:maps};
  }
  function nq(s){ return s.replace(/'([^'\\]*)'/g, '"$1"').replace(/`([^`$]*)`/g, '"$1"'); }
  function sim(a, b){ var x = toks(nq(a)), y = toks(nq(b)); if (!x.length || !y.length) return 0; var m = 0, used = {}; x.forEach(function(t){ for (var i=0;i<y.length;i++){ if (!used[i] && y[i] === t){ used[i] = 1; m++; break; } } }); return 2*m/(x.length+y.length); }

  function grade(){
    var ls = lines(), nonEmpty = ls.filter(function(l){ return l.trim(); }).length;
    if (nonEmpty < 6 && !T.shortOk){ T.shortOk = true; say('아직 너무 짧습니다 ('+nonEmpty+'줄). 조금 더 쓰고 채점하세요.', '정말 여기까지만 보고 싶다면 한 번 더 채점을 누르면 그대로 채점합니다.'); return; }
    peek(false);
    var O = T1.original, U = ls, used = {}, rows = [];
    O.forEach(function(o, i){
      var bi = -1, bs = 0;
      /* 같은 줄 번호가 충분히 닮았으면 그대로 짝짓는다 — 창 탐색은 줄이 밀린 경우만 */
      if (U[i] !== undefined && !used[i]){ var s0 = (!o.trim() && !U[i].trim()) ? 1 : sim(o, U[i]); if (s0 >= 0.6){ bi = i; bs = s0; } }
      if (bi < 0) for (var j = Math.max(0, i-2); j <= Math.min(U.length-1, i+2); j++){ if (used[j]) continue; var s = (!o.trim() && !U[j].trim()) ? 1 : sim(o, U[j]); if (s > bs){ bs = s; bi = j; } }
      if (bi >= 0 && bs >= 0.5){ used[bi] = 1; rows.push({oi:i, ui:bi, cmp:compareLine(o, U[bi])}); }
      else rows.push({oi:i, ui:-1, cmp:{status:'missing', reasons:[], maps:[]}});
    });
    U.forEach(function(u, j){ if (!used[j] && u.trim()) rows.push({oi:-1, ui:j, cmp:{status:'extra', reasons:[], maps:[]}}); });
    /* 변수명 치환 3조건 : 파일 전체 1:1 · 새 이름이 원본에 없음 (스왑·그림자 방지) */
    var fwd = {}, bwd = {};
    rows.forEach(function(r){ r.cmp.maps.forEach(function(m){ (fwd[m[0]] = fwd[m[0]] || {})[m[1]] = 1; (bwd[m[1]] = bwd[m[1]] || {})[m[0]] = 1; }); });
    rows.forEach(function(r){
      if (r.cmp.status !== 'pending') return;
      var ok = true, swap = false;
      r.cmp.maps.forEach(function(m){ if (Object.keys(fwd[m[0]]).length !== 1 || Object.keys(bwd[m[1]]).length !== 1) ok = false; if (ORIG_IDENTS[m[1]]){ ok = false; swap = true; } });
      if (ok){ r.cmp.status = 'equiv'; r.cmp.reasons.push('지역 변수명 일관 치환 ('+r.cmp.maps.map(function(m){ return m[0]+' → '+m[1]; }).join(', ')+')'); }
      else { r.cmp.status = 'differ'; r.cmp.swap = swap; r.cmp.reasons.push(swap ? '이름 맞바꿈 — 바꾼 이름이 원본에 이미 있습니다' : '변수명 치환이 파일 전체에서 일관되지 않습니다'); }
    });
    var n = {exact:0, equiv:0, differ:0, missing:0, extra:0};
    rows.forEach(function(r){ n[r.cmp.status]++; });
    T.res = {rows:rows, n:n, total:O.length, meaning:n.exact + n.equiv, user:U};   /* 결과 화면은 에디터가 사라진 뒤에도 다시 그려진다 — 답안 줄을 여기 보관 */
    T.view = 'result'; T.filter = 'ne';
    renderResult();
    T.ctx.guide(T.res.meaning/T.total >= .85 ? '판이 거의 맞물렸어요.' : '어긋난 줄부터 보세요. 동등은 틀린 게 아니에요.', T.res.meaning/O.length >= .85 ? 'hop' : 'tilt');
    live('채점했습니다. '+O.length+'줄 중 '+T.res.meaning+'줄이 의미가 맞습니다.');
  }

  /* ---------- 결과 화면 ---------- */
  function markDiff(o, u){
    var x = toks(o), y = toks(u);
    if (x.length !== y.length) return esc(u);
    var pos = 0, out = '', src = u;
    y.forEach(function(t, i){ var at = src.indexOf(t, pos); if (at < 0) return; out += esc(src.slice(pos, at)) + (t === x[i] ? esc(t) : '<mark>'+esc(t)+'</mark>'); pos = at + t.length; });
    return out + esc(src.slice(pos));
  }
  function renderResult(){
    var ctx = T.ctx, no = ctx.no, R = T.res, pct = Math.round(R.meaning / R.total * 100);
    var rows = R.rows.filter(function(r){ var s = r.cmp.status; return T.filter === 'all' || (T.filter === 'ne' ? s !== 'exact' : (s === 'differ' || s === 'missing' || s === 'extra')); });
    var rowsHTML = rows.length ? rows.map(function(r){
      var s = r.cmp.status, i = R.rows.indexOf(r), note = r.oi >= 0 ? T1.notes[r.oi] : null;
      var o = r.oi >= 0 ? esc(T1.original[r.oi]) : '<span>원본에 없는 줄입니다</span>';
      var u = r.ui >= 0 ? (s === 'differ' && r.oi >= 0 ? markDiff(T1.original[r.oi], R.user[r.ui]) : esc(R.user[r.ui])) : '<span>이 줄을 안 썼습니다</span>';
      var tag = s === 'exact' ? '<span class="rtag e">정합</span>' : s === 'equiv' ? '<span class="rtag q">동등</span>' : '<span class="rtag d">'+(r.cmp.swap ? '이름 맞바꿈' : s === 'missing' ? '누락' : s === 'extra' ? '추가' : '어긋남')+'</span>';
      var why = '';
      if (s === 'equiv') why = '<div class="why">형태만 다릅니다. <b>틀린 게 아닙니다.</b> 사유: '+r.cmp.reasons.join(' · ')+'</div>';
      else if (s === 'differ' || s === 'missing' || s === 'extra'){
        why = '<div class="why">'+(note ? note.t : s === 'missing' ? '이 줄이 빠졌습니다. 원본이 왜 이 줄을 필요로 했는지 확인해 보세요.' : s === 'extra' ? '원본에 없는 줄입니다. 틀렸다는 뜻은 아니지만, 원본이 왜 이게 없어도 됐는지 확인해 보세요.' : '뜻이 달라지거나 자동으로 같음을 증명할 수 없습니다. 사유: '+r.cmp.reasons.join(' · '))+
          (s === 'differ' ? '<div><button type="button" class="flat-btn ghost dis" data-dis="'+i+'">'+(T.disputed[i] ? '이의 접수됨 · 판정 보류' : '같은 뜻인데요')+'</button></div>' : '')+'</div>';
      }
      return '<div class="drow '+s+(T.disputed[i]?' disputed':'')+'"><i>'+(r.oi >= 0 ? r.oi+1 : '＋')+'</i><span class="o">'+o+'</span><span class="u">'+u+'</span><span class="st">'+tag+'</span>'+why+'</div>';
    }).join('') : '<div class="drow exact"><i>·</i><span class="o" style="grid-column:2/5;font-family:var(--f-ui)">이 조건에 맞는 줄이 없습니다.</span></div>';
    var disputedN = Object.keys(T.disputed).length;
    ctx.bench.innerHTML =
      '<article class="ps wide" style="--tilt:.15deg" data-card="loginform">' + head(no) +
        '<div class="ps-in">' + headIn(no, '채점 결과') + stepper() +
          '<div class="score"><div class="big">'+R.total+'분의 '+R.meaning+'<small>의미가 맞은 줄</small></div><div><p>이 중 글자까지 같은 줄은 <b>'+R.n.exact+'줄</b>. <b>동등</b>은 형태만 다르고 같은 뜻으로 인정한 줄 — 공백·들여쓰기, 따옴표 종류, 세미콜론, 주석 문구, 지역 변수명 일관 치환.</p>' +
            '<div class="pills"><span class="pill t1">정합 '+R.n.exact+'</span><span class="pill t0">동등 '+R.n.equiv+'</span><span class="pill t2">어긋남 '+(R.n.differ+R.n.missing+R.n.extra)+'</span><span class="pill ghost">'+(pct>=85?'다음 단계로 가도 좋습니다':pct>=65?'한 번 더 같은 단계를 권합니다':'같은 단계를 한 번 더 하는 편이 빠릅니다')+'</span></div></div></div>' +
          '<div class="dfilter"><span>보기</span><button type="button" class="sw" id="dfilter"><span'+(T.filter==='ne'?' class="on"':'')+' data-v="ne">어긋남 + 동등만</span><span'+(T.filter==='all'?' class="on"':'')+' data-v="all">전체</span><span'+(T.filter==='d'?' class="on"':'')+' data-v="d">어긋남만</span></button><span>판정이 억울하면 각 줄의 <b>「같은 뜻인데요」</b>로 이의를 남길 수 있습니다. 점수는 그대로 두고 규칙 쪽을 고칩니다.</span></div>' +
          '<div class="drows">'+rowsHTML+'</div>' +
          '<div class="acts"><button type="button" class="flat-btn ghost" id="t1back">에디터로 돌아가기</button><span class="hint">'+(disputedN ? '이의 <b>'+disputedN+'건</b>은 판정 보류로 기록합니다.' : '원본 본 횟수 <b>'+T.peeks+'</b> · 감점 없음')+'</span><span class="sp"></span><button type="button" class="press-btn" id="t1why">다음 — 왜 이렇게 생겼는지 한 줄 <kbd class="k">Enter</kbd></button></div>' +
        '</div>' +
      '</article>';
    $$('span', $('#dfilter')).forEach(function(s){ s.addEventListener('click', function(){ T.filter = s.dataset.v; renderResult(); }); });
    $$('[data-dis]', ctx.bench).forEach(function(b){ b.addEventListener('click', function(){ var i = +b.dataset.dis; if (T.disputed[i]) delete T.disputed[i]; else T.disputed[i] = 1; renderResult(); }); });
    $('#t1back').addEventListener('click', function(){ T.view = 'edit'; render(); });
    $('#t1why').addEventListener('click', renderWhy);
  }

  /* ---------- 「왜」 게이트 : 채점하지 않지만 건너뛸 수 없다 ---------- */
  function renderWhy(){
    T.view = 'why';
    var ctx = T.ctx, no = ctx.no, W = T1.why, orig = T1.original[W.line].trim();
    ctx.bench.innerHTML =
      '<article class="ps wide" style="--tilt:.15deg" data-card="loginform">' + head(no) +
        '<div class="ps-in">' + headIn(no, '왜 이렇게 생겼을까') +
          '<div class="whybox"><h4>'+W.q+'</h4><p>'+W.help+'</p>' +
            snippet([orig]) +
            '<textarea id="whyText" placeholder="예: 브라우저가 폼을 보내면서 페이지를 새로 고치는 걸 막으려고">'+esc(T.whyText)+'</textarea>' +
            '<div class="row"><span class="cnt" id="whyCnt"></span><button type="button" class="flat-btn ghost" id="whyDunno">모르겠어요 · 보기 보기</button></div>' +
            '<div id="whyChoices">'+(T.whyPick != null || T.whyOpen ? whyChoicesHTML() : '')+'</div>' +
          '</div>' +
          '<div class="acts"><button type="button" class="flat-btn ghost" id="t1res">채점 결과로</button><span class="hint">고르고 나서도 <b>자기 말로 한 줄</b> 옮겨야 마칩니다. 옮겨 적는 그 순간이 목적입니다.</span><span class="sp"></span><button type="button" class="press-btn" id="t1finish" disabled>저장하고 마치기 <kbd class="k">Enter</kbd></button></div>' +
        '</div>' +
      '</article>';
    var ta = $('#whyText'), fin = $('#t1finish'), cnt = $('#whyCnt');
    var check = function(){ var v = ta.value.trim(); var ok = v.length >= 10 && v !== orig; T.whyText = ta.value; cnt.textContent = v === orig ? '코드를 그대로 옮기지 말고 말로 써 주세요' : v.length+' / 10자'; cnt.classList.toggle('ok', ok); fin.disabled = !ok; };
    ta.addEventListener('input', check); check();
    $('#whyDunno').addEventListener('click', function(){ T.whyOpen = true; $('#whyChoices').innerHTML = whyChoicesHTML(); bindWhy(); });
    $('#t1res').addEventListener('click', renderResult);
    fin.addEventListener('click', finish);
    bindWhy();
    setTimeout(function(){ ta.focus(); }, 60);
  }
  function whyChoicesHTML(){
    var W = T1.why;
    return '<div class="choices one">' + W.choices.map(function(c, i){
      var st = T.whyPick == null ? '' : (c.ok ? ' right' : (T.whyPick === i ? ' wrong' : ''));
      return '<button type="button" class="ch'+st+'" data-w="'+i+'"'+(T.whyPick!=null?' disabled':'')+'><span class="n">'+(i+1)+'</span><span class="t">'+c.t+(T.whyPick!=null && (c.ok || T.whyPick===i) ? '<br><small style="color:var(--ink-soft)">'+c.fb+'</small>' : '')+'</span></button>';
    }).join('') + '</div>' + (T.whyPick != null ? '<p style="margin-top:8px"><b>이제 같은 내용을 위 칸에 자기 말로 한 줄만 옮겨 주세요.</b> 답을 보고 써도 됩니다.</p>' : '');
  }
  function bindWhy(){ $$('[data-w]', T.ctx.bench).forEach(function(b){ b.addEventListener('click', function(){ T.whyPick = +b.dataset.w; $('#whyChoices').innerHTML = whyChoicesHTML(); bindWhy(); }); }); }
  function finish(){
    var R = T.res, pct = R.meaning / R.total;
    T.lyTo = pct >= .85 ? Math.min(4, T.lyFrom + 1) : T.lyFrom;
    store('t1.draft', '');
    T.ctx.done({card:'loginform', concept:'LoginForm 필사', code:'LoginForm', track:'t1', ok:pct >= .85, lyFrom:T.lyFrom, lyTo:T.lyTo, meaning:R.meaning, total:R.total, exact:R.n.exact, equiv:R.n.equiv, peeks:T.peeks, disputed:Object.keys(T.disputed).length, downgraded:T.downgraded, why:T.whyText});
  }
  function key(e){
    if (T.view === 'result' && e.key === 'Enter'){ renderWhy(); return true; }
    if (T.view === 'why' && e.key === 'Enter'){ var f = $('#t1finish'); if (f && !f.disabled) finish(); return true; }
    if (T.view === 'edit' && e.key === 'Enter' && document.activeElement !== $('#ta')){ $('#ta').focus(); return true; }
    return false;
  }
  return {mount:mount, key:key};
})();
