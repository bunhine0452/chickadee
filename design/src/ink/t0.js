/* ═══════════ T0 문법 카드 — 의미형 · 빈칸형 · 지목형 + 「모르겠어요 = 다시 찍기」 4단 사다리 ═══════════ */
var T0 = (function(){
  var T = null;
  var RUNGS = [
    {h:'더 자세히',        s:'사전 3층 — 한 줄로 · 왜 필요한가 · 이 줄 안에서'},
    {h:'여전히 모르겠어요', s:'아래층이 비어 있는지 진단하고, 비었으면 그 판으로 내려갑니다'},
    {h:'다른 예시로',      s:'내 리포에서 같은 문법이 쓰인 다른 자리'},
    {h:'자유 질문',        s:'키가 있으면 대화, 없으면 복사해서 물어보기', llm:true}
  ];
  var KIND = {meaning:'의미형', blank:'빈칸형', point:'지목형'};

  function mount(cardId, ctx, opts){
    opts = opts || {};
    var card = CARDS[cardId];
    T = {
      card:card, ctx:ctx, sel:null, answered:false, correct:null, ladder:false, rung:1,
      prereq:!!opts.prereq, returned:!!opts.returned, retry:!!opts.retry,
      dunno:!!opts.dunno, prereqDone:opts.prereqDone || {},
      lyFrom:(opts.ly != null ? opts.ly : card.ly), promptOut:''
    };
    T.lyTo = (opts.lyTo != null ? opts.lyTo : T.lyFrom);
    if (T.returned){ T.ladder = true; T.rung = 2; }
    render();
    ctx.guide(guideMsg('start'), T.prereq ? 'peek' : null);
    live((T.prereq ? '아래층 판으로 내려왔습니다. ' : '') + plain(card.concept) + ' 판을 걸었습니다. ' + KIND[card.kind]);
  }

  function guideMsg(k){
    var c = T.card;
    if (k === 'start'){
      if (T.prereq) return '아래층이에요. 1문제만 보고 같이 올라가요.';
      if (T.returned) return '돌아왔어요. 아까 막힌 자리예요. 이어보기부터 읽어요.';
      if (T.retry) return '다시 찍는 판이에요. 이번엔 진단을 기억하고 있죠?';
      if (c.fresh) return '처음 만나는 문법이에요. 틀려도 돼요.';
      return c.review ? (T.lyFrom+'겹 찍혀 있어요. 한 번 더 맞히면 '+Math.min(4,T.lyFrom+1)+'겹.') : '이 판은 오늘 처음이에요.';
    }
    if (k === 'right') return T.lyTo >= 4 ? '정합! 4겹, 완성이에요.' : '정합! 한 겹 올라갔어요.';
    if (k === 'wrong') return '어긋났어요. 이 경우엔 이렇게 찍혀요 — 아래 진단을 봐요.';
    if (k === 'dunno') return '다시 찍기는 공정이에요. 아래를 같이 봐요.';
    return '';
  }

  /* ---------- 렌더 ---------- */
  function render(){
    var c = T.card, ctx = T.ctx, kind = c.kind;
    var no = ctx.no;
    var choicesHTML = '';
    if (kind !== 'point'){
      choicesHTML = '<div class="choices'+(kind==='blank'?' ':'')+'" role="radiogroup" aria-label="보기">' + c.options.map(function(o, i){
        return '<button type="button" class="ch'+(o.mono?' code-choice':'')+'" data-k="'+(i+1)+'" role="radio" aria-checked="false"><span class="n">'+(i+1)+'</span><span class="t">'+(o.mono?esc(o.t):o.t)+'</span></button>';
      }).join('') + '</div>';
    }
    var crumb = '';
    if (T.prereq){
      crumb = '<div class="crumb"><span class="depth">아래층</span><b>'+ctx.parentName+'</b><span class="arr">›</span><span>'+c.concept+' — <b>지금</b> · 1문제 · 약 40초</span><span class="sp" style="flex:1"></span><button type="button" class="flat-btn ghost" id="t0back">↩ 지금 위로 돌아가기 <kbd class="k">B</kbd></button></div>';
    }
    var ribbon = '';
    if (T.retry) ribbon = '<div class="crumb"><span class="depth">다시 찍기</span><span>지난번에 어긋난 판입니다. 진단은 그대로 두고 <b>다시 고릅니다</b>.</span></div>';

    var html =
      '<article class="ps" style="--tilt:'+(T.prereq?'.25':'-.2')+'deg" data-card="'+c.id+'">' +
        regHTML(false) +
        '<div class="guide" id="guide" aria-hidden="true"><span class="say" id="say"></span><svg class="dee" id="deeGuide" data-ly="4" viewBox="0 0 100 100"><use href="#deeBird"/></svg></div>' +
        '<div class="ps-rail">' + deeSVG(T.lyFrom, 'sm', 'deeRail') + '<span class="plus" id="railPlus">+1겹</span><span class="vt" id="railVt">'+no+' · '+T.lyFrom+'겹 · '+LY[T.lyFrom].k+'</span></div>' +
        '<div class="ps-in">' +
          crumb + ribbon +
          '<div class="ps-head">' +
            '<span class="sig mr" data-w="'+no+'"><span>'+no+'</span></span>' +
            '<div><h2 class="ps-h2"><span class="pill t0">T0</span>'+c.concept+' <code>'+esc(c.code)+'</code><span class="pl">'+KIND[kind]+' · '+(T.prereq?'아래층':T.retry?'다시 찍기':c.fresh?'새 판':'복습')+'</span></h2>' +
            '<div class="ps-src">내 코드 <b>'+c.file+':'+c.focus+'</b>'+(c.uses?' · 이 문법 내 코드 '+(c.uses.length+1)+'곳':'')+'</div></div>' +
            '<div class="ps-ly">'+passHTML(T.lyFrom,'t0')+'<span class="lyn" id="lyn">잉크 <b>'+T.lyFrom+'겹</b> / 4 · '+LY[T.lyFrom].k+' · '+LY[T.lyFrom].pl+'</span></div>' +
          '</div>' +
          '<p class="ask">'+c.q+'<small id="askHint">'+c.hint+'</small></p>' +
          codeHTML(c.lines, {cls: kind==='point' ? 'pickable' : '', attrs:'id="t0code"'}) +
          choicesHTML +
          '<div class="slot" id="t0slot"><div class="slot-idle" id="t0idle">판정란 — 답을 제출하면 여기에 판정과 진단이 적힙니다. 이 칸은 미리 비워 둔 자리라 답해도 위쪽 글이 밀리지 않습니다.</div><div class="fb" id="t0fb" aria-live="polite"></div></div>' +
          (T.returned ? '<div class="link-para" id="payoff"><span class="tag-new">새로 열림</span><h4>↩ 방금 배운 것과 이어보기</h4><p>'+c.payoff+'</p></div>' : '') +
          '<div id="t0ladder">'+(T.ladder ? ladderHTML() : '')+'</div>' +
          '<div class="acts" id="t0acts">'+actsHTML()+'</div>' +
        '</div>' +
      '</article>';
    ctx.bench.innerHTML = html;
    bind();
    if (T.returned){ setTimeout(function(){ var p = $('#payoff'); if (p) p.scrollIntoView({block:'center', behavior:'smooth'}); }, 80); }
  }

  function actsHTML(){
    var c = T.card;
    var hint = T.answered
      ? (T.correct ? '맞혔어도 개운하지 않으면 <b>다시 찍기</b>를 누르세요. 감점은 없습니다.' : '진단은 그대로 둡니다. 다음 판에서 한 번 더 만나요.')
      : (c.kind === 'point' ? '코드에서 한 곳을 고른 뒤 <b>Enter</b>' : '<b>1</b>~<b>'+c.options.length+'</b> 로 고르고 <b>Enter</b>');
    return '<button type="button" class="flat-btn dunno'+(T.ladder?' on':'')+'" id="t0dunno">'+(T.ladder?'사다리 접기':'모르겠어요 · 다시 찍기')+' <kbd class="k">?</kbd></button>' +
      '<span class="hint" id="t0hint">'+hint+'</span><span class="sp"></span>' +
      (T.prereq && T.answered ? '<button type="button" class="press-btn blue" id="t0submit">위로 돌아가기 <kbd class="k">Space</kbd></button>'
        : '<button type="button" class="press-btn blue" id="t0submit">'+(T.answered ? '다음 <kbd class="k">Space</kbd>' : '확인 <kbd class="k">Enter</kbd>')+'</button>');
  }

  function bind(){
    var c = T.card;
    $$('.ch', T.ctx.bench).forEach(function(b){ b.addEventListener('click', function(){ if (!T.answered) choose(+b.dataset.k); }); });
    $$('.tk', T.ctx.bench).forEach(function(b){ b.addEventListener('click', function(){ if (!T.answered) choose(+b.dataset.k); }); });
    $('#t0submit').addEventListener('click', submit);
    $('#t0dunno').addEventListener('click', dunno);
    var back = $('#t0back'); if (back) back.addEventListener('click', function(){ T.ctx.back(); });
    if (T.ladder) bindLadder();
  }

  /* ---------- 고르기 ---------- */
  function choose(k){
    var c = T.card; T.sel = k;
    $$('.ch, .tk', T.ctx.bench).forEach(function(b){ var on = +b.dataset.k === k; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    var hole = $('.hole', T.ctx.bench);
    if (hole){ hole.textContent = c.options[k-1].t; hole.classList.add('filled'); }
    var hint = $('#askHint');
    if (c.kind === 'blank') hint.innerHTML = '코드에 «'+esc(c.options[k-1].t)+'» 를 써 넣었습니다. 제출하면 채점합니다.';
    else if (c.kind === 'point') hint.innerHTML = '짚은 곳 — <code>'+esc(pickText(k))+'</code>. Enter 로 제출.';
    else hint.innerHTML = '고른 보기 — '+k+'번. Enter 로 제출.';
  }
  function pickText(k){ var t = ''; T.card.lines.forEach(function(l){ (l.seg||[]).forEach(function(s){ if (s.pick === k) t = s.t; }); }); return t; }
  function movePick(d){
    var n = $$('.tk', T.ctx.bench).length; if (!n) return;
    var k = T.sel ? ((T.sel - 1 + d + n) % n) + 1 : (d > 0 ? 1 : n);
    choose(k); var el = $('.tk[data-k="'+k+'"]', T.ctx.bench); if (el) el.focus();
  }

  /* ---------- 제출 · 채점 ---------- */
  function submit(){
    if (T.answered) return next();
    if (T.sel == null){ say('먼저 고르세요.', T.card.kind === 'point' ? '코드 위의 점선 토큰을 클릭하거나 ← → 로 옮깁니다.' : '1~'+T.card.options.length+' 로 고릅니다.'); var b = $('#t0submit'); b.classList.add('down'); setTimeout(function(){ b.classList.remove('down'); }, 120); return; }
    grade();
  }
  function grade(){
    var c = T.card, ok = (T.sel - 1) === c.answer;
    T.answered = true; T.correct = ok;
    /* 보기·토큰 표시 : 더는 못 누르니 점선을 걷는다 */
    $$('.ch, .tk', T.ctx.bench).forEach(function(b){
      var k = +b.dataset.k;
      b.disabled = true;
      if (k === c.answer + 1) b.classList.add('right');
      else if (k === T.sel && !ok) b.classList.add('wrong');
    });
    var code = $('#t0code'); if (code) code.classList.remove('pickable');
    var hole = $('.hole', T.ctx.bench);
    if (hole){ hole.classList.add(ok ? 'right' : 'wrong'); if (!ok) setTimeout(function(){ hole.classList.remove('wrong'); hole.classList.add('right'); hole.textContent = c.options[c.answer].t; }, 320); }
    /* 잉크 겹 : 맞히면 +1. 한 번 어긋났다고 바닥까지 떨어지지 않는다 — 대신 다시 찍기가 잡힌다.
       다시 찍는 판은 회복만 한다 — 같은 개념으로 하루에 두 번 오르지 않는다 (D3 · 02 §3.3) */
    if (ok && !T.dunno && !T.retry) T.lyTo = Math.min(4, T.lyFrom + 1);
    paintRail();
    /* 피드백 슬롯 : 자리가 미리 비어 있어 위 글이 안 밀린다 */
    var fb = $('#t0fb'), why = ok ? null : c.why[T.sel - 1];
    var gain = ok
      ? '<div class="gain">'+deeSVG(T.lyFrom,'sm')+'<span class="arr">→</span>'+deeSVG(T.lyTo,'sm')+'<span>잉크 <b>'+T.lyTo+'겹</b>'+(T.retry ? ' · 원래 겹으로 돌아옴' : '')+' · 다음 인쇄 <b>'+NEXT_AT[T.lyTo]+'</b></span></div>'
      : '<div class="gain">'+deeSVG(T.lyFrom,'sm')+'<span class="arr">→</span>'+deeSVG(T.lyTo,'sm')+'<span>잉크 <b>'+T.lyTo+'겹</b> 그대로 · <b>다시 찍기</b>를 오늘 순서에 넣었습니다</span></div>';
    var idle = $('#t0idle'); if (idle) idle.hidden = true;
    fb.className = 'fb' + (ok ? ' right' : '');
    fb.innerHTML =
      '<div class="stampbox">'+(ok ? stampHTML('정합','IN REGISTER','',-7) : stampHTML('어긋남','OFF REGISTER','yellow',5))+'</div>' +
      '<div>' +
        (ok ? '<h4>맞았습니다 — 판이 맞물렸습니다</h4><p>'+c.ok+'</p>'
            : '<h4>어긋났습니다 — <code>'+esc(selLabel())+'</code> 를 골랐습니다</h4><p>'+why.t+'</p>') +
        (why && why.edge ? '<div class="edge"><b>'+why.edge.h+'</b>'+snippet(why.edge.code)+'</div>' : '') +
        '<p><b>규칙</b> — '+c.rule+'</p>' +
        (c.result ? '<p><b>이 줄이 끝난 뒤</b> · <code>'+esc(c.result.label)+'</code> = <code>'+esc(c.result.value)+'</code> — '+c.result.note+'</p>' : '') +
        (T.prereq && c.bridge ? '<div class="edge">'+c.bridge+'</div>' : '') +
        gain +
      '</div>';
    requestAnimationFrame(function(){ fb.classList.add('on'); });
    if (!ok) T.ctx.enqueue({kind:'t0', card:c.id, mins:0.5, label:c.concept, sub:'다시 찍기', review:true, retry:true, ly:T.lyTo}, 3);
    $('#t0acts').innerHTML = actsHTML(); $('#t0submit').addEventListener('click', submit); $('#t0dunno').addEventListener('click', dunno);
    T.ctx.guide(guideMsg(ok ? 'right' : 'wrong'), ok ? 'hop' : 'tilt');
    live(ok ? '맞았습니다. 잉크 '+T.lyTo+'겹.' : '어긋났습니다. 진단을 판정란에 적었습니다.');
    if (ok && c.fresh && !T.retry) setTimeout(function(){ T.ctx.lifer(c); }, 420);
    setTimeout(function(){ fb.scrollIntoView({block:'nearest', behavior:'smooth'}); }, 60);
  }
  function selLabel(){ var c = T.card; return c.kind === 'point' ? pickText(T.sel) : plain(c.options[T.sel-1].t); }
  function paintRail(){
    var d = $('#deeRail'); if (d) d.setAttribute('data-ly', String(T.lyTo));
    var p = $('#railPlus'); if (p){ p.textContent = (T.lyTo > T.lyFrom ? '+1겹' : T.lyTo < T.lyFrom ? '−1겹' : ''); p.classList.toggle('on', T.lyTo !== T.lyFrom); }
    var vt = $('#railVt'); if (vt) vt.textContent = T.ctx.no+' · '+T.lyTo+'겹 · '+LY[T.lyTo].k;
    var lyn = $('#lyn'); if (lyn) lyn.innerHTML = '잉크 <b>'+T.lyTo+'겹</b> / 4 · '+LY[T.lyTo].k+' · '+LY[T.lyTo].pl;
    var ps = $('.ps-ly .passes', T.ctx.bench); if (ps) ps.outerHTML = passHTML(T.lyTo, 't0');
  }
  function next(){
    T.ctx.done({card:T.card.id, concept:T.card.concept, code:T.card.code, track:'t0', ok:T.correct, lyFrom:T.lyFrom, lyTo:T.lyTo, dunno:T.dunno, prereq:T.prereq, retry:T.retry, fresh:!!T.card.fresh});
  }

  /* ---------- 모르겠어요 = 다시 찍기 ---------- */
  function dunno(){
    if (!T.dunno){
      T.dunno = true;
      T.lyTo = Math.max(0, T.lyFrom - 1);
      paintRail();
      if (!T.prereq) T.ctx.enqueue({kind:'t0', card:T.card.id, mins:0.5, label:T.card.concept, sub:'다시 찍기', review:true, retry:true, ly:T.lyTo}, 3);
      T.ctx.guide(guideMsg('dunno'), 'hang');
      live('다시 찍기 사다리를 열었습니다. 잉크가 한 겹 내려가고 다시 찍는 시점이 오늘로 당겨졌습니다.');
    }
    T.ladder = !T.ladder;
    $('#t0ladder').innerHTML = T.ladder ? ladderHTML() : '';
    $('#t0acts').innerHTML = actsHTML(); $('#t0submit').addEventListener('click', submit); $('#t0dunno').addEventListener('click', dunno);
    if (T.ladder){ bindLadder(); setTimeout(function(){ $('#t0ladder').scrollIntoView({block:'start', behavior:'smooth'}); }, 60); }
    else T.ctx.guide(T.answered ? (T.correct ? '접었어요. 다음 판으로 가요.' : '접었어요. 진단은 남아 있어요.') : '접었어요. 다시 골라 봐요.', 'peek');
  }
  function ladderHTML(){
    var c = T.card;
    return '<section class="reprint" aria-label="다시 찍기 사다리">' +
      '<div class="ld-head">'+deeSVG(T.lyTo, 'hang')+'<div><h3>모르겠어요 = 다시 찍기</h3><p>흐리게 찍힌 판을 다시 거는 건 실패가 아니라 <b>공정</b>입니다. 부끄러운 일이 아니라 그 자리로 다시 데려다 달라는 신호예요.</p></div>' +
        '<div class="ld-gain">잉크 <b>'+T.lyFrom+'겹</b> <span class="arr">→</span> <b>'+T.lyTo+'겹</b> · 다시 찍기 <b>'+NEXT_AT[Math.min(4,T.lyFrom)]+'</b> <span class="arr">→</span> <b>오늘 안에</b></div></div>' +
      '<div class="rungs" role="tablist">' + RUNGS.map(function(r, i){
        return '<button type="button" class="rung'+(T.rung===i+1?' on':'')+(r.llm?' llm':'')+'" role="tab" aria-selected="'+(T.rung===i+1)+'" data-r="'+(i+1)+'"><b>'+(i+1)+'단</b><span>'+r.h+'</span><small>'+r.s+'</small></button>';
      }).join('') + '</div>' +
      '<div class="rung-body" id="rungBody">'+rungHTML(T.rung)+'</div>' +
    '</section>';
  }
  function bindLadder(){
    $$('.rung', T.ctx.bench).forEach(function(b){ b.addEventListener('click', function(){ openRung(+b.dataset.r); }); });
    bindRung();
  }
  function openRung(r){
    T.rung = r;
    $$('.rung', T.ctx.bench).forEach(function(b){ var on = +b.dataset.r === r; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#rungBody').innerHTML = rungHTML(r); bindRung();
  }
  function rungHTML(r){
    var c = T.card;
    if (r === 1){
      var layers = c.dict || [
        {k:'한 줄로', t:c.rule},
        {k:'왜 필요한가', t:c.ok},
        {k:c.focus+'행 뒤의 값', t: c.result ? '<code>'+esc(c.result.label)+'</code> = <code>'+esc(c.result.value)+'</code> — '+c.result.note : ''}
      ];
      return '<h4>사전 3층 — 한 줄로 시작해 이 줄 안까지</h4><div class="dict">' + layers.map(function(l){
        return '<div><b>'+l.k+'</b><div>'+(l.steps ? '<ol class="steps">'+l.steps.map(function(s, i){ return '<li><p>'+(i+1)+'. '+s+'</p></li>'; }).join('')+'</ol>' : '<p>'+l.t+'</p>')+'</div></div>';
      }).join('') + '</div><p style="margin-top:10px">1~3단은 인터넷도 API 키도 없이 동작합니다. 4단만 선택 사항입니다.</p>';
    }
    if (r === 2){
      var pre = c.prereq || [];
      var gaps = pre.filter(function(p){ return p.s === 'gap' && !T.prereqDone[p.card]; });
      var diag = !pre.length
        ? '<p>이 개념의 아래층은 모두 찍혀 있습니다. 이건 「이해 못 한」 것이 아니라 아직 <b>익숙하지 않은</b> 것입니다. 설명을 더 읽기보다 3단으로 내려가 같은 문법이 쓰인 내 코드를 여러 개 보는 편이 빠릅니다.</p>'
        : (gaps.length
          ? '<p>「모르겠어요」의 대부분은 이 개념이 어려워서가 아니라 <b>아래층이 비어 있어서</b>입니다. 이 개념을 떠받치는 '+pre.length+'개 중 <b>'+gaps.length+'개</b>가 아직 안 찍혔습니다.</p>'
          : '<p><b>비어 있던 층을 방금 채웠습니다.</b> 아래층이 다 찼으니 위 「이어보기」 문단을 한 번 더 읽고 다시 짚어 보세요.</p>');
      return '<h4>아래층 진단 — 무엇이 비어 있나</h4>' + diag +
        '<div class="prereq" style="margin-top:10px">' + pre.map(function(p){
          var done = p.card && T.prereqDone[p.card];
          var st = done ? '방금 봄 · '+Math.max(1,p.ly+1)+'겹' : p.note;
          return '<div class="pq'+(p.s==='gap'&&!done?' gap':'')+'">'+deeSVG(done?Math.max(1,p.ly+1):p.ly,'sm')+'<span class="nm">'+p.n+'<small>'+st+'</small></span>' +
            (p.s === 'gap' && p.card ? (done ? '<span class="pill ghost">✓ 방금 보고 왔습니다</span>' : '<button type="button" class="press-btn blue" data-jump="'+p.card+'">↳ 이 판으로 내려가기 · 1문제 · 약 40초</button>')
             : p.s === 'none' ? '<span class="pill ghost">판 없음 · 홈에서 「판 만들기」</span>' : '<span class="pill ghost">찍혀 있음</span>') +
          '</div>';
        }).join('') + '</div>' +
        (gaps.length ? '<p style="margin-top:10px">내려가도 지금 판은 사라지지 않습니다. 아래층을 마치면 <b>이 자리로 자동으로 돌아오고</b>, 돌아오면 이어보기 문단이 새로 열립니다.</p>' : '');
    }
    if (r === 3){
      return '<h4>내 리포의 같은 문법 — 다른 자리</h4><p>같은 규칙이 다른 모양으로 쓰인 곳입니다. 설명을 더 읽기보다 이쪽이 빠를 때가 많아요.</p><div class="uses" style="margin-top:10px">' + (c.uses||[]).map(function(u){
        return '<div class="use"><div class="src"><b>'+u.f+'</b><span>'+u.l+'행</span></div><div class="code"><div class="ln"><i>'+u.l+'</i><span>'+hl(u.code)+'</span></div></div></div>';
      }).join('') + '</div>';
    }
    return '<h4>직접 물어보기</h4><p>키가 없어도 됩니다. 아래 칸에 막힌 지점을 적으면 <b>이 줄과 앞뒤 4줄만</b> 담은 프롬프트를 만들어 드립니다. 이 앱은 아무것도 스스로 전송하지 않습니다 — 복사해서 붙여넣는 순간에만 밖으로 나갑니다.</p>' +
      '<div class="askbox" style="margin-top:10px"><textarea id="askText" placeholder="예: ?. 가 undefined 를 내면 그 다음 줄은 어떻게 되는지 모르겠어요">'+esc(T.askText||'')+'</textarea>' +
      '<div class="row"><button type="button" class="flat-btn" id="askBuild">프롬프트 만들기</button><button type="button" class="flat-btn ghost" id="askCopy"'+(T.promptOut?'':' disabled')+'>복사</button><span class="note">API 키 없음 · 로컬 사전과 내 코드만 사용</span></div>' +
      (T.promptOut ? '<div class="prompt-out" id="promptOut">'+esc(T.promptOut)+'</div>' : '') + '</div>';
  }
  function bindRung(){
    $$('[data-jump]', T.ctx.bench).forEach(function(b){ b.addEventListener('click', function(){ T.ctx.jump(b.dataset.jump, {parent:T.card.id, parentName:T.card.concept+' '+T.card.code, lyFrom:T.lyFrom, lyTo:T.lyTo, prereqDone:T.prereqDone}); }); });
    var ta = $('#askText'); if (ta) ta.addEventListener('input', function(){ T.askText = ta.value; });
    var build = $('#askBuild'); if (build) build.addEventListener('click', function(){
      var c = T.card, base = c.file.split('/').pop();   /* D8 : 경로는 빼고 파일명만 나간다 */
      var ctxLines = c.lines.map(function(l){ return l.n+'  '+(l.seg ? l.seg.map(function(s){ return s.hole ? (c.options[c.answer].t) : s.t; }).join('') : l.t); }).join('\n');
      T.promptOut = '파일 '+base+' '+c.focus+'행 근처입니다.\n\n```\n'+ctxLines+'\n```\n\n배우려는 문법: '+c.concept+' ('+c.code+')\n제가 막힌 지점: '+(T.askText||'(비어 있음)')+'\n'+(T.answered ? (T.correct ? '문제는 맞혔지만, 왜 그런지는 스스로 설명하지 못하겠습니다.' : '문제에서 「'+selLabel()+'」 를 골라 틀렸습니다.') : '아직 답을 고르지 못했습니다.')+'\n\n프로그래밍을 막 시작한 사람에게 설명하듯, 다른 예제 말고 위 코드 그대로를 예로 들어 알려주세요.';
      $('#rungBody').innerHTML = rungHTML(4); bindRung(); say('프롬프트를 만들었습니다.', '복사해서 Claude 나 ChatGPT 에 붙여넣으세요.');
    });
    var copy = $('#askCopy'); if (copy) copy.addEventListener('click', function(){
      try{ navigator.clipboard.writeText(T.promptOut); say('클립보드에 복사했습니다.'); }catch(e){ say('복사하지 못했습니다. 텍스트를 직접 선택해 복사하세요.'); }
    });
  }

  /* ---------- 키보드 ---------- */
  function key(e){
    var c = T.card;
    if (e.key >= '1' && e.key <= '4'){ if (!T.answered){ var n = c.kind === 'point' ? $$('.tk', T.ctx.bench).length : c.options.length; if (+e.key <= n) choose(+e.key); } return true; }
    if (c.kind === 'point' && !T.answered && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){ movePick(e.key === 'ArrowRight' ? 1 : -1); return true; }
    if (e.key === 'Enter'){ submit(); return true; }
    if (e.key === ' '){ if (T.answered) next(); else say('먼저 답을 고르고 Enter 로 제출하세요.'); return true; }
    if (e.key === '?' || (e.shiftKey && e.key === '/')){ dunno(); return true; }
    if ((e.key === 'b' || e.key === 'B') && T.prereq){ T.ctx.back(); return true; }
    return false;
  }
  return {mount:mount, key:key};
})();
