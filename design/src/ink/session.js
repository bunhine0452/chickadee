/* ═══════════ 엔진 : 큐 · 작업 띠 · 길잡이 · LIFER · 요약 · 키보드 ═══════════ */
var bench = $('#bench');
var S = { pos:0, results:[], elapsed:{}, liferN:0, carry:null, queue:QUEUE.map(function(q){ return Object.assign({}, q); }), done:false };
var MOD = {t0:T0, t1:T1M, t2:T2M}, cur = null;
var KEY = 'session.'+RUN.no.replace(/\s+/g,'').toLowerCase();

/* ---------- 저장 / 복원 : Esc 로 나가도 여기서 이어 찍는다 ---------- */
function persist(){ store(KEY, {pos:S.pos, results:S.results, elapsed:S.elapsed, queue:S.queue, liferN:S.liferN}); }
function restore(){
  if (Q.get('reset') || Q.get('at')){ try{ localStorage.removeItem('ink.'+KEY); localStorage.removeItem('ink.t1.draft'); }catch(e){} return; }
  var v = loadJSON(KEY); if (!v || !v.queue) return;
  S.pos = v.pos || 0; S.results = v.results || []; S.elapsed = v.elapsed || {}; S.queue = v.queue; S.liferN = v.liferN || 0;
}

/* ---------- 작업 띠 : 시간 비례 큐 ---------- */
function renderQueue(){
  var jq = $('#jq'), lb = $('#jqLabels');
  jq.innerHTML = S.queue.map(function(q, i){
    var p = i < S.pos ? 100 : i === S.pos ? Math.min(100, Math.round((S.elapsed[i]||0) / (q.mins*60) * 100)) : 0;
    return '<i class="'+q.kind+(q.review?' review':'')+(i<S.pos?' done':'')+(i===S.pos?' now':'')+'" style="--w:'+q.mins+';--p:'+p+'%" title="'+plain(q.label)+' · '+fmtMin(q.mins)+'"></i>';
  }).join('');
  lb.innerHTML = S.queue.map(function(q, i){ return '<span class="'+(i===S.pos?'now':'')+'" style="--w:'+q.mins+'">'+(q.mins >= 2 ? plain(q.label) : '')+'</span>'; }).join('');
  updateTime();
}
function updateTime(){
  var q = S.queue[S.pos];
  if (S.done || !q){ $('#jqNow').innerHTML = '<b>'+S.queue.length+' / '+S.queue.length+'</b> · 인쇄 완료'; $('#jqTime').textContent = '오늘 '+fmtMin(totalElapsed()/60); return; }
  var left = 0; S.queue.forEach(function(x, i){ if (i >= S.pos) left += Math.max(0, x.mins*60 - (S.elapsed[i]||0)); });
  $('#jqNow').innerHTML = '지금 <b>'+(S.pos+1)+' / '+S.queue.length+'</b> · '+q.label+' ('+q.sub+')';
  $('#jqTime').textContent = '남은 시간 약 '+Math.max(1, Math.round(left/60))+'분 · '+fmtMin(q.mins)+' 판';
  var now = $('#jq i.now'); if (now) now.style.setProperty('--p', Math.min(100, Math.round((S.elapsed[S.pos]||0)/(q.mins*60)*100))+'%');
}
function totalElapsed(){ var t = 0; Object.keys(S.elapsed).forEach(function(k){ t += S.elapsed[k]; }); return t; }
setInterval(function(){ if (S.done || document.hidden) return; S.elapsed[S.pos] = (S.elapsed[S.pos]||0) + 1; if (S.elapsed[S.pos] % 5 === 0) persist(); updateTime(); }, 1000);

/* ---------- 판 걸기 ---------- */
function ctxFor(i){
  var q = S.queue[i];
  return {
    no:(i+1)+'판', idx:i, total:S.queue.length, bench:bench,
    parentName:(S.carry && S.carry.parentName) || '',
    done:onDone, enqueue:insertQueue, jump:jumpTo, back:backUp, lifer:showLifer, guide:setGuide
  };
}
function mountItem(i){
  var q = S.queue[i]; if (!q) return summary();
  bench.innerHTML = '';
  bench.scrollTop = 0;
  var ctx = ctxFor(i);
  if (q.kind === 't0'){
    var opts = {retry:!!q.retry, ly:q.ly, prereq:!!q.prereq};
    if (S.carry && S.carry.card === q.card){ Object.assign(opts, S.carry.opts); S.carry = null; }
    if (q.prereq){ ctx.parentName = q.parentName; }
    T0.mount(q.card, ctx, opts);
  } else if (q.kind === 't1') T1M.mount(ctx);
  else T2M.mount(ctx);
  cur = MOD[q.kind];
  renderQueue(); persist();
}
function onDone(r){
  var q = S.queue[S.pos];
  r.at = S.pos; r.label = q.label; S.results[S.pos] = r;
  if (r.prereq && q.parent){
    /* 아래층을 마쳤다 — 위 판으로 자동 복귀. 이어보기 문단이 새로 열린다 */
    var pd = {}; pd[q.card] = true;
    S.carry = {card:q.parent, parentName:'', opts:{returned:true, dunno:true, ly:q.parentLyFrom, lyTo:q.parentLy, prereqDone:Object.assign(pd, q.prereqDone||{})}};
    say('돌아왔습니다. 아까 막힌 자리입니다.', '이어보기 문단이 새로 열렸습니다.');
  }
  S.pos++;
  if (S.pos >= S.queue.length){ S.done = true; persist(); return summary(); }
  mountItem(S.pos);
}
function insertQueue(item, after){
  /* 다시 찍기 : 지금 자리 + after 뒤에 끼운다 (끝을 넘으면 끝에) — 같은 판이 이미 잡혀 있으면 안 겹친다 */
  if (S.queue.some(function(q, i){ return i > S.pos && q.retry && q.card === item.card; })) return;
  var at = Math.min(S.queue.length, S.pos + after);
  S.queue.splice(at, 0, item); renderQueue(); persist();
  say(josa(item.label,'을','를')+' <b>다시 찍기</b>로 오늘 순서에 넣었습니다.', '이 세션 안에서 한 번 더 나옵니다. 벌점이 아니라 일정입니다.');
}
function jumpTo(cardId, o){
  var c = CARDS[cardId];
  S.queue.splice(S.pos, 0, {kind:'t0', card:cardId, mins:c.mins || 0.7, label:c.concept, sub:'아래층', prereq:true, parent:o.parent, parentName:o.parentName, parentLyFrom:o.lyFrom, parentLy:o.lyTo, prereqDone:o.prereqDone});
  say('아래층 「'+c.concept+'」 판으로 내려왔습니다.', '마치면 자동으로 원래 자리로 돌아옵니다.');
  mountItem(S.pos);
}
function backUp(){
  /* 아래층에서 답하지 않고 올라간다 — 판은 큐에서 빠지고 위 판은 그대로 */
  var q = S.queue[S.pos]; if (!q || !q.prereq) return;
  S.queue.splice(S.pos, 1);
  S.carry = {card:q.parent, opts:{dunno:true, ly:q.parentLyFrom, lyTo:q.parentLy, prereqDone:q.prereqDone||{}}};
  say('위로 돌아왔습니다. 아래층 판은 나중에 다시 걸 수 있습니다.');
  mountItem(S.pos);
}
function setGuide(msg, cls){ var s = $('#say'); if (s) s.innerHTML = msg; deeDo($('#deeGuide'), cls); }

/* ---------- LIFER : 처음 기록하는 순간 — 세션당 최대 3회, 아무 키나 누르면 닫힘 ---------- */
var liferCb = null, liferSerial = 47;
function showLifer(card, cb){
  if (S.liferN >= 3){ if (cb) cb(); return; }
  S.liferN++; persist();
  var d = new Date();
  $('#liferName').innerHTML = card.concept+' <code>'+esc(card.code)+'</code>';
  $('#liferWhere').innerHTML = '당신의 <b>'+card.file+':'+card.focus+'</b> 에서 채집 · T0 문법';
  var sr = $('#liferSerial'); sr.textContent = '#0'+(liferSerial + S.liferN - 1)+' · '+d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' · '+pad2(d.getHours())+':'+pad2(d.getMinutes());
  sr.style.animation = 'none'; void sr.offsetWidth; sr.style.animation = '';
  var v = $('#lifer'); v.hidden = false; liferCb = cb;
  setTimeout(function(){ deeDo($('#deeLifer'), 'lifer'); }, 300);
  live('처음 기록했습니다. '+plain(card.concept)+'. 아무 키나 누르면 닫힙니다.');
}
function hideLifer(){ var v = $('#lifer'); if (v.hidden) return false; v.hidden = true; var cb = liferCb; liferCb = null; if (cb) cb(); return true; }
$('#lifer').addEventListener('click', hideLifer);

/* ---------- 요약 : 인쇄 완료 ---------- */
function summary(){
  S.done = true; cur = null; renderQueue();
  var byCard = {}, order = [];
  S.results.forEach(function(r){ if (!r) return; if (!byCard[r.card]){ byCard[r.card] = {first:r, last:r}; order.push(r.card); } else byCard[r.card].last = r; });
  var ok = S.results.filter(function(r){ return r && r.ok; }).length, n = S.results.filter(Boolean).length;
  var lifer = S.results.filter(function(r){ return r && r.fresh && r.ok && !r.retry; })[0];
  var mins = Math.max(1, Math.round(totalElapsed()/60));
  var shifts = order.map(function(id){
    var a = byCard[id].first, b = byCard[id].last, from = a.lyFrom, to = b.lyTo, tr = a.track;
    var moved = to > from ? '<b>+'+(to-from)+'겹</b>' : to < from ? '<b>−'+(from-to)+'겹</b> · 다시 찍기' : '제자리';
    var extra = tr === 't1' ? ' · '+b.total+'줄 중 '+b.meaning+'줄 의미 일치'+(b.disputed ? ' · 이의 '+b.disputed+'건 보류' : '') : tr === 't2' ? ' · '+b.pct+'% · 놓침 '+b.missed : (a.prereq ? ' · 아래층' : '');
    return '<li class="shift"><span class="pair">'+deeSVG(from,'sm')+'<span class="arr">→</span>'+deeSVG(to,'sm')+'</span>' +
      '<span class="nm">'+a.concept+' <code>'+esc(a.code)+'</code><small><span class="pill '+tr+'">'+tr.toUpperCase()+'</span> '+LY[from].k+' → '+LY[to].k+' · '+moved+extra+'</small></span>' +
      '<span class="next'+(to<=1?' soon':'')+'">다음 인쇄<br><b>'+NEXT_AT[to]+'</b></span></li>';
  }).join('');
  bench.innerHTML =
    '<article class="ps wide" style="--tilt:-.2deg">' + regHTML(true) +
      '<div class="guide" id="guide" aria-hidden="true"><span class="say" id="say"></span><svg class="dee" id="deeGuide" data-ly="4" viewBox="0 0 100 100"><use href="#deeBird"/></svg></div>' +
      '<div class="ps-rail">'+deeSVG(4,'sm')+'<span class="vt">'+RUN.no+' · 완료</span></div>' +
      '<div class="ps-in">' +
        '<div class="done-head"><svg class="logo" aria-hidden="true"><use href="#logo"/></svg><div><h2 class="mr" data-w="인쇄 완료"><span>인쇄 완료</span></h2><p><b>'+RUN.no+'</b> · '+RUN.repo+' · '+n+'판을 걸었고 '+mins+'분 걸렸습니다. 이 정도가 딱 좋습니다.</p></div>'+stampHTML('인쇄 완료', RUN.date, '', -7)+'</div>' +
        '<div class="tally"><div><span class="k">찍은 판</span><div class="v">'+n+'<span class="u">판</span></div></div><div><span class="k">정합</span><div class="v">'+ok+' / '+n+'</div></div><div><span class="k">걸린 시간</span><div class="v">'+mins+'<span class="u">분</span></div></div><div><span class="k">연속 인쇄</span><div class="v">'+(RUN.streak+1)+'<span class="u">일</span></div></div></div>' +
        '<div><div class="pane-h" style="margin-bottom:4px"><b>오늘 움직인 잉크</b><span>%가 아니라 겹으로 셉니다. 겹은 시간을 두고 다시 맞힐 때만 쌓입니다.</span></div><ul class="shifts">'+shifts+'</ul></div>' +
        (lifer ? '<div class="lifer-box">'+deeSVG(4,'','deeDone')+'<div><h4>처음 기록한 문법 — '+lifer.concept+' <code>'+esc(lifer.code)+'</code></h4><p>당신의 <b>'+CARDS[lifer.card].file+':'+CARDS[lifer.card].focus+'</b> 에서 채집. 개념 하나당 평생 한 번, 도장은 영구 기록입니다.</p></div>'+stampHTML('첫 관찰','LIFER','',6)+'</div>' : '') +
        '<div class="streak-line"><span class="st">'+pad2(new Date().getDate())+'</span><span>연속 <b>'+(RUN.streak+1)+'일</b>. 연속 기록은 진도를 열지 않습니다 — 진도는 잉크 겹으로만 열립니다. 하루 쉬어도 다음 날 이어집니다.</span></div>' +
        '<div class="hintbox"><span><b>내일은 <code>async / await</code> 부터</b> 시작합니다 — 내 코드 11곳에 있는데 아직 판이 없는 문법입니다. 오늘 어긋난 판은 내일 첫 순서로 잡혔습니다.</span></div>' +
        '<div class="acts"><button type="button" class="flat-btn ghost" id="againBtn">오늘 판 다시 보기</button><span class="hint">수고했습니다. 내일 같은 시간에 이어서.</span><span class="sp"></span><button type="button" class="press-btn" id="homeBtn">홈으로 <kbd class="k">Enter</kbd></button></div>' +
      '</div>' +
    '</article>';
  $('#homeBtn').addEventListener('click', goHome);
  $('#againBtn').addEventListener('click', function(){ location.href = location.pathname + '?reset=1'; });
  setGuide('오늘 인쇄 끝. 내일 같은 시간에 봐요.', 'lifer');
  var dd = $('#deeDone'); if (dd) setTimeout(function(){ deeDo(dd, 'hop'); }, 700);
  live('오늘 인쇄를 마쳤습니다. '+n+'판 중 '+ok+'판 정합.');
}
function goHome(){ location.href = 'ink-home.html'; }
function exitSession(){
  persist();
  say('세션에서 나왔습니다. 진행은 저장됐습니다.', '돌아오면 '+(S.pos+1)+'번째 판부터 이어 찍습니다.');
  setTimeout(goHome, 700);
}

/* ---------- 키보드 : 카드 한 장은 고르기 → Enter → Space 세 번으로 끝난다 ---------- */
document.addEventListener('keydown', function(e){
  if (!$('#lifer').hidden){ e.preventDefault(); hideLifer(); return; }
  var tag = (document.activeElement && document.activeElement.tagName) || '';
  var typing = tag === 'TEXTAREA' || tag === 'INPUT';
  if (e.key === 'Escape'){
    if (typing){ document.activeElement.blur(); return; }
    if (S.done) return goHome();
    return exitSession();
  }
  if (typing) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (S.done){ if (e.key === 'Enter'){ e.preventDefault(); goHome(); } return; }
  if (cur && cur.key(e)) e.preventDefault();
});
$('#exitBtn').addEventListener('click', function(){ if (S.done) goHome(); else exitSession(); });

/* ---------- 초기화 ---------- */
bindSwitch($('#swTheme'), 'theme', 'light');
bindSwitch($('#swTrim'),  'trim',  'off');
restore();
$('#jbSub').textContent = RUN.no+' · '+RUN.repo;
if (Q.get('at')){ S.pos = Math.min(S.queue.length-1, Math.max(0, parseInt(Q.get('at'),10) || 0)); }
if (S.pos >= S.queue.length) summary(); else { mountItem(S.pos); if (S.pos > 0 && !Q.get('at')) say((S.pos+1)+'번째 판부터 이어 찍습니다.', '처음부터 하려면 「오늘 판 다시 보기」 또는 ?reset=1'); }

/* ---------- 개발 검수 (?dev=1) : 13px 하한 · 본문 행 길이 · 종이 위 대비 ---------- */
if (Q.get('dev')){
  window.__audit = function(){
    var small = [], els = $$('body *').filter(function(el){ return el.offsetParent !== null && el.childNodes.length && Array.prototype.some.call(el.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); }); });
    els.forEach(function(el){ var fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 13) small.push(el.tagName.toLowerCase()+'.'+(el.className||'')+' '+fs+'px'); });
    var m = $('.ask') || $('p'); var mw = m ? getComputedStyle(m).maxWidth : '';
    var cnt = 0, p = $$('p, li').filter(function(el){ return el.offsetParent !== null; });
    p.forEach(function(el){ var r = el.getBoundingClientRect(), fs = parseFloat(getComputedStyle(el).fontSize); cnt = Math.max(cnt, Math.round(r.width / (fs * .892))); });
    return {textEls:els.length, below13:small, measureMax:mw, maxHangulPerLine:cnt};
  };
  var box = document.createElement('div'); box.className = 'dev'; box.innerHTML = '<h3>검수 · ?dev=1</h3><pre>'+esc(JSON.stringify(window.__audit(), null, 1))+'</pre>';
  bench.appendChild(box);
}
