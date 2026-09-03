/* ═══════════ T2 구조 — 계층 밴드 지도 · 책임 배치 · 채점 3티어(필수 / 함께 바뀜 / 흔한 오답) ═══════════ */
var T2M = (function(){
  var T = null;
  var G = {NW:178, NH:46, GX:16, PADL:128, PADT:22, GY:60, PADR:22, PADB:18};
  function base(p){ return p.split('/').pop(); }
  function dir(p){ var a = p.split('/'); a.pop(); return a.join('/') + '/'; }

  function mount(ctx){
    T = {ctx:ctx, sel:{}, graded:false, hints:0, res:null, more:false, lyFrom:T2.ly, lyTo:T2.ly, pos:{}};
    layout(); render();
    ctx.guide('지도를 먼저 30초만 훑어봐요. 화살표는 「가져다 쓴다」 방향이에요.', 'tilt');
    live('cart 폴더 책임 배치 판을 걸었습니다. 지도에서 파일을 골라 채점합니다.');
  }
  function layout(){
    var bands = T2.bands.map(function(){ return []; });
    T2.files.forEach(function(f){ bands[f.r].push(f); });
    var maxW = Math.max.apply(null, bands.map(function(b){ return b.length*G.NW + (b.length-1)*G.GX; }));
    bands.forEach(function(b, r){
      var w = b.length*G.NW + (b.length-1)*G.GX, x0 = G.PADL + (maxW - w)/2, y = G.PADT + r*(G.NH + G.GY);
      b.forEach(function(f, i){ T.pos[f.p] = {x:x0 + i*(G.NW+G.GX), y:y}; });
    });
    T.W = G.PADL + maxW + G.PADR; T.H = G.PADT + T2.bands.length*(G.NH+G.GY) - G.GY + G.PADB;
  }
  function svgHTML(){
    var out = '<svg viewBox="0 0 '+T.W+' '+T.H+'" width="'+T.W+'" height="'+T.H+'" role="group" aria-label="cart 기능 의존 지도">' +
      '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" fill="var(--ink-mute)"/></marker>' +
      '<marker id="arK" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" fill="var(--ink)"/></marker></defs>';
    T2.bands.forEach(function(b, r){
      var y = G.PADT + r*(G.NH + G.GY);
      out += '<text class="band-l" x="10" y="'+(y+19)+'">'+esc(b.l)+'</text><text class="band-s" x="10" y="'+(y+37)+'">'+esc(b.s)+'</text>';
      if (r) out += '<line class="band-line" x1="'+(G.PADL-14)+'" x2="'+(T.W-G.PADR)+'" y1="'+(y - G.GY/2)+'" y2="'+(y - G.GY/2)+'"/>';
    });
    /* 포트 분산 : 나가는 선은 아래 변에, 들어오는 선은 위 변에 — 대상 x 순으로 */
    var outs = {}, ins = {};
    T2.edges.forEach(function(e){ (outs[e[0]] = outs[e[0]]||[]).push(e[1]); (ins[e[1]] = ins[e[1]]||[]).push(e[0]); });
    var port = function(p, list, other, top){ var pos = T.pos[p], n = list.length, span = Math.min(G.NW-40, (n-1)*22), i = list.slice().sort(function(a,b){ return T.pos[a].x - T.pos[b].x; }).indexOf(other); return {x: pos.x + G.NW/2 - span/2 + (n > 1 ? i*span/(n-1) : 0), y: top ? pos.y : pos.y + G.NH}; };
    T2.edges.forEach(function(e){
      var s = port(e[0], outs[e[0]], e[1], false), t = port(e[1], ins[e[1]], e[0], true);
      var dy = Math.max(18, (t.y - s.y) * .42);
      var d = s.y < t.y ? 'M'+s.x+' '+s.y+' C'+s.x+' '+(s.y+dy)+' '+t.x+' '+(t.y-dy)+' '+t.x+' '+t.y
                        : 'M'+s.x+' '+s.y+' C'+s.x+' '+(s.y+30)+' '+t.x+' '+(t.y-30)+' '+t.x+' '+t.y;
      out += '<path class="edge" data-f="'+esc(e[0])+'" data-t="'+esc(e[1])+'" d="'+d+'"/>';
    });
    T2.files.forEach(function(f){
      var p = T.pos[f.p], st = stateOf(f.p), badge = {ok:'✓', missed:'＋', wrong:'✕', sec:'◆'}[st] || '';
      out += '<g class="nd'+(T.sel[f.p] && !T.graded ?' sel':'')+(st?' '+st:'')+'" data-p="'+esc(f.p)+'" tabindex="0" role="button" aria-pressed="'+(!!T.sel[f.p])+'" aria-label="'+esc(f.p)+'">' +
        '<rect x="'+p.x+'" y="'+p.y+'" width="'+G.NW+'" height="'+G.NH+'" rx="2"/>' +
        '<text class="nm" x="'+(p.x+11)+'" y="'+(p.y+19)+'">'+esc(base(f.p))+'</text>' +
        '<text class="dir" x="'+(p.x+11)+'" y="'+(p.y+36)+'">'+esc(dir(f.p))+'</text>' +
        (badge ? '<text class="badge" x="'+(p.x+G.NW-22)+'" y="'+(p.y+28)+'">'+badge+'</text>' : '') +
        (f.isNew && (T.hints >= 2 || T.graded) ? '<rect class="newbg" x="'+(p.x+G.NW-58)+'" y="'+(p.y-11)+'" width="56" height="20" rx="2"/><text class="newtag" x="'+(p.x+G.NW-52)+'" y="'+(p.y+3)+'">＋ 새 파일</text>' : '') +
      '</g>';
    });
    return out + '</svg>';
  }
  function stateOf(p){
    if (!T.graded) return '';
    if (T2.core[p]) return T.sel[p] ? 'ok' : 'missed';
    if (T2.sec[p]) return 'sec';
    return T.sel[p] ? 'wrong' : '';
  }
  function render(){
    var ctx = T.ctx, no = ctx.no;
    ctx.bench.innerHTML =
      '<article class="ps xwide" style="--tilt:-.15deg" data-card="cartresp">' + regHTML(false) +
        '<div class="guide" id="guide" aria-hidden="true"><span class="say" id="say"></span><svg class="dee" id="deeGuide" data-ly="4" viewBox="0 0 100 100"><use href="#deeBird"/></svg></div>' +
        '<div class="ps-rail">'+deeSVG(T.lyTo,'sm','deeRail')+'<span class="plus" id="railPlus"></span><span class="vt" id="railVt">'+no+' · '+T.lyTo+'겹 · '+LY[T.lyTo].k+'</span></div>' +
        '<div class="ps-in">' +
          '<div class="ps-head"><span class="sig mr" data-w="'+no+'"><span>'+no+'</span></span>' +
            '<div><h2 class="ps-h2"><span class="pill t2">T2</span><code>'+T2.code+'</code> 폴더 책임<span class="pl">책임 배치 · 정답지 = 실제 커밋 · 부분 점수</span></h2>' +
            '<div class="ps-src">내 리포 <b>'+RUN.repo+'</b> · 파일 12 · 연결 12 · 층 4 · 화살표는 언제나 <b>가져다 쓴다(import)</b> 방향</div></div>' +
            '<div class="ps-ly">'+passHTML(T.lyTo,'t2')+'<span class="lyn">잉크 <b>'+T.lyTo+'겹</b> / 4 · '+LY[T.lyTo].k+'</span></div></div>' +
          '<p class="ask">'+T2.q+'<small>'+T2.hint+' 정답을 맞히는 게 목적이 아니라, 내 프로젝트가 어떻게 나뉘어 있는지 감을 잡는 게 목적입니다.</small></p>' +
          '<div class="map" id="map">'+svgHTML()+'</div>' +
          '<div class="map-status" id="mapStatus"><span>파일 상자에 마우스를 올리면 연결이 보이고, 클릭하면 고릅니다.</span><span>위쪽 = 사용자와 가까운 쪽 · 아래쪽 = 데이터와 가까운 쪽</span></div>' +
          (T.graded ? resultHTML() : pickHTML()) +
        '</div>' +
      '</article>';
    bindMap();
    if (T.graded) bindResult(); else bindPick();
  }
  function pickHTML(){
    var picked = Object.keys(T.sel);
    return '<div class="picked" id="picked">'+(picked.length ? picked.map(function(p){ return '<span class="chip">'+esc(base(p))+'</span>'; }).join('') : '<span class="none">아직 고른 파일이 없습니다.</span>')+'</div>' +
      (T.hints ? '<div class="hintbox">'+T2.hints.slice(0, T.hints).map(function(h, i){ return '<span><b>힌트 '+(i+1)+'</b> — '+h+'</span>'; }).join('')+'</div>' : '') +
      '<div class="slot" style="min-height:0"></div>' +
      '<div class="acts"><button type="button" class="flat-btn dunno" id="t2hint"'+(T.hints>=3?' disabled':'')+'>모르겠어요 · 힌트 '+Math.min(3,T.hints+1)+'/3 <kbd class="k">H</kbd></button><span class="hint">힌트는 감점이 아닙니다. 놓친 파일은 채점 뒤 지도에서 깜빡입니다.</span><span class="sp"></span>' +
      '<button type="button" class="press-btn blue" id="t2grade"'+(picked.length?'':' disabled')+'>채점하기 <kbd class="k">Enter</kbd></button></div>';
  }
  function bindMap(){
    var edges = $$('.edge', T.ctx.bench);
    $$('.nd', T.ctx.bench).forEach(function(g){
      var p = g.dataset.p;
      var hover = function(on){
        edges.forEach(function(e){ var rel = e.dataset.f === p || e.dataset.t === p; e.classList.toggle('hl', on && rel); e.classList.toggle('fade', on && !rel); });
        var st = $('#mapStatus');
        if (on){ var uses = T2.edges.filter(function(e){ return e[1] === p; }).length, used = T2.edges.filter(function(e){ return e[0] === p; }).length; st.innerHTML = '<span><b>'+esc(p)+'</b> · 이 파일을 쓰는 곳 <b>'+uses+'</b> · 이 파일이 쓰는 것 <b>'+used+'</b></span><span>'+(T.graded ? '✓ 맞게 고름 · ＋ 놓침 · ✕ 아닌데 고름 · ◆ 같이 바뀜' : '클릭하면 선택 / 해제')+'</span>'; }
        else st.innerHTML = '<span>파일 상자에 마우스를 올리면 연결이 보이고, 클릭하면 고릅니다.</span><span>위쪽 = 사용자와 가까운 쪽 · 아래쪽 = 데이터와 가까운 쪽</span>';
      };
      g.addEventListener('mouseenter', function(){ hover(true); }); g.addEventListener('mouseleave', function(){ hover(false); });
      g.addEventListener('focus', function(){ hover(true); }); g.addEventListener('blur', function(){ hover(false); });
      var toggle = function(){ if (T.graded) return; if (T.sel[p]) delete T.sel[p]; else T.sel[p] = 1; g.classList.toggle('sel', !!T.sel[p]); g.setAttribute('aria-pressed', !!T.sel[p]); repaintPick(); };
      g.addEventListener('click', toggle);
      g.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } });
    });
  }
  function repaintPick(){
    var picked = Object.keys(T.sel);
    $('#picked').innerHTML = picked.length ? picked.map(function(p){ return '<span class="chip">'+esc(base(p))+'</span>'; }).join('') : '<span class="none">아직 고른 파일이 없습니다.</span>';
    $('#t2grade').disabled = !picked.length;
  }
  function bindPick(){
    $('#t2hint').addEventListener('click', hint);
    $('#t2grade').addEventListener('click', grade);
  }
  function hint(){ if (T.hints >= 3) return; T.hints++; render(); T.ctx.guide(T.hints === 3 ? '이제 개수까지 알려 드렸어요.' : '힌트는 감점이 아니에요.', 'peek'); }

  /* ---------- 채점 3티어 ---------- */
  function grade(){
    var core = Object.keys(T2.core), sec = Object.keys(T2.sec), sel = Object.keys(T.sel);
    var found = core.filter(function(p){ return T.sel[p]; }), missed = core.filter(function(p){ return !T.sel[p]; });
    var bonus = sec.filter(function(p){ return T.sel[p]; }), wrong = sel.filter(function(p){ return !T2.core[p] && !T2.sec[p]; });
    var pct = Math.round(found.length / core.length * 100);
    T.res = {found:found, missed:missed, bonus:bonus, wrong:wrong, pct:pct};
    T.graded = true; T.lyTo = pct >= 85 ? Math.min(4, T.lyFrom + 1) : T.lyFrom;
    render();
    var first = $('.nd.missed', T.ctx.bench); if (first) first.scrollIntoView({block:'nearest', inline:'center', behavior:'smooth'});
    T.ctx.guide(pct === 100 ? '완벽해요. 층을 다 짚었어요.' : pct >= 85 ? '거의 맞았어요. 놓친 자리가 깜빡여요.' : '놓친 파일부터 봐요. 거기가 오늘의 핵심이에요.', pct >= 85 ? 'hop' : 'tilt');
    live('채점했습니다. 꼭 고쳐야 할 6개 중 '+found.length+'개를 찾았습니다.');
  }
  function group(cls, sym, title, sub, items){
    if (!items.length) return '';
    return '<div class="rg '+cls+'"><h5><span class="sym">'+sym+'</span>'+title+'<small>'+sub+'</small></h5><ul>' + items.map(function(p){
      var c = T2.core[p] || T2.sec[p], note = c ? c[1] : (T2.trap[p] || '이번 커밋에서는 바뀌지 않은 파일입니다.');
      return '<li><code>'+esc(p)+'</code>'+(c ? '<span class="stat">'+c[0]+'</span>' : '<span class="stat">변경 없음</span>')+'<p>'+note+'</p></li>';
    }).join('') + '</ul></div>';
  }
  function resultHTML(){
    var R = T.res, core = Object.keys(T2.core).length;
    var title = R.pct === 100 ? '완벽합니다' : R.pct >= 65 ? '거의 맞았어요' : '다시 한 번 볼까요';
    return '<div class="verdict"><div class="big mr" data-w="'+R.pct+'%"><span>'+R.pct+'%</span></div><div><h4>'+title+'</h4>' +
        '<p>꼭 고쳐야 할 '+core+'개 중 <b>'+R.found.length+'개 찾음</b> · <b>'+R.missed.length+'개 놓침</b> · 필요 없는데 고른 것 <b>'+R.wrong.length+'개</b> · 보너스 <b>'+R.bonus.length+'개</b></p>' +
        '<div class="meter"><i class="f" style="--w:'+R.found.length+'"></i><i class="m" style="--w:'+R.missed.length+'"></i></div></div></div>' +
      '<div class="rgroups">' +
        group('missed','＋','놓친 파일','여기가 이번 학습의 핵심입니다 — 지도에서 깜빡입니다', R.missed) +
        group('ok','✓','맞게 고른 파일','', R.found) +
        group('wrong','✕','안 고쳐도 됐던 파일','흔한 오답과 그 이유', R.wrong) +
        group('sec','◆','같이 바뀐 파일','골라도 안 골라도 감점하지 않습니다', Object.keys(T2.sec)) +
      '</div>' +
      '<div class="commit"><span class="h">'+T2.commit.h+'</span><div><p><b>정답의 출처</b> — LLM 채점이 아니라 실제 커밋 기록입니다.</p><p class="msg">'+esc(T2.commit.m)+'</p><p>'+T2.commit.d+' · '+T2.commit.n+'</p></div></div>' +
      '<div class="slot" style="min-height:0"></div>' +
      '<div class="acts"><button type="button" class="flat-btn ghost" id="t2more">'+(T.more ? '「이것도 맞다」 의견 접수됨' : '이것도 맞다고 생각해요')+'</button><span class="hint">'+(T.more ? '정답지는 커밋 1건이라 더 넓은 정답이 있을 수 있어요. 같은 의견이 쌓이면 이 문제의 정답지를 넓힙니다.' : '잉크 <b>'+T.lyFrom+'겹 → '+T.lyTo+'겹</b> · 다음 인쇄 <b>'+NEXT_AT[T.lyTo]+'</b>')+'</span><span class="sp"></span><button type="button" class="press-btn blue" id="t2next">다음 <kbd class="k">Space</kbd></button></div>';
  }
  function bindResult(){
    $('#t2more').addEventListener('click', function(){ T.more = !T.more; render(); });
    $('#t2next').addEventListener('click', next);
    var d = $('#deeRail'); if (d) d.setAttribute('data-ly', String(T.lyTo));
    var p = $('#railPlus'); if (p && T.lyTo > T.lyFrom){ p.textContent = '+1겹'; p.classList.add('on'); }
  }
  function next(){ T.ctx.done({card:'cartresp', concept:'cart/ 폴더 책임', code:'cart/', track:'t2', ok:T.res.pct >= 85, lyFrom:T.lyFrom, lyTo:T.lyTo, pct:T.res.pct, found:T.res.found.length, missed:T.res.missed.length, wrong:T.res.wrong.length}); }
  function key(e){
    if (!T.graded){
      if (e.key === 'Enter'){ if (Object.keys(T.sel).length) grade(); else say('지도에서 파일을 먼저 고르세요.'); return true; }
      if (e.key === 'h' || e.key === 'H'){ hint(); return true; }
      return false;
    }
    if (e.key === 'Enter' || e.key === ' '){ next(); return true; }
    return false;
  }
  return {mount:mount, key:key};
})();
