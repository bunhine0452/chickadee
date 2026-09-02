/* ==========================================================================
   Chickadee — 학습 경로 홈
   ========================================================================== */
(function () {
  "use strict";

  var LEVELS = ["미기록", "처음 봄", "몇 번 봄", "눈에 익음"];
  var TRACK_LABEL = { t0: "T0 문법", t1: "T1 필사", t2: "T2 구조" };

  /* ── 개념 = 도감의 한 종 ─────────────────────────────────────────────── */
  var C = {
    "array-map": {
      track: "t0", unit: "상품 목록 불러오기", level: 3,
      name: "배열 map", latin: "Array.prototype.map", sign: ".map()",
      habitat: "src/products/ProductList.tsx",
      lede: "목록을 화면에 그릴 때 거의 항상 나오는 표시입니다. 배열의 항목 하나하나를 다른 것으로 바꿔서 새 배열을 만듭니다.",
      code: [
        '<span class="k">const</span> rows = products<span class="tok"><span class="pu">.</span><span class="fn">map</span></span><span class="pu">((</span>p<span class="pu">) =&gt; (</span>',
        '  <span class="pu">&lt;</span><span class="jx">ProductRow</span> <span class="ty">key</span><span class="pu">=</span><span class="pu">{</span>p.id<span class="pu">}</span> <span class="ty">product</span><span class="pu">=</span><span class="pu">{</span>p<span class="pu">}</span> <span class="pu">/&gt;</span>',
        '<span class="pu">));</span>'
      ], hl: 0,
      note: "<code>products</code> 안의 상품 하나가 <code>p</code> 로 들어오고, 그 자리에 화면 조각 하나가 대신 들어앉습니다. 원래 배열은 그대로 남습니다.",
      q: "<code>products</code> 에 상품이 3개 있으면 <code>rows</code> 는 무엇이 되나요?",
      opts: [
        { t: "화면 조각 3개가 든 새 배열", ok: true },
        { t: "원래 <code>products</code> 배열이 바뀐 것", ok: false },
        { t: "화면 조각 하나", ok: false }
      ],
      ex: "map 은 원래 배열을 건드리지 않고 같은 길이의 새 배열을 만들어 돌려줍니다."
    },
    "list-render": {
      track: "t1", unit: "상품 목록 불러오기", level: 3,
      name: "목록 컴포넌트 필사", latin: "List component", sign: "ProductList",
      habitat: "src/products/ProductList.tsx",
      lede: "내 코드에서 목록을 그리는 부분을 그대로 따라 써 봅니다. 손으로 옮겨 적으면 어디가 반복이고 어디가 예외인지 보입니다.",
      code: [
        '<span class="k">export function</span> <span class="fn">ProductList</span><span class="pu">({</span> products <span class="pu">}:</span> <span class="ty">Props</span><span class="pu">) {</span>',
        '  <span class="k">if</span> <span class="pu">(</span><span class="tok">products.length === <span class="nu">0</span></span><span class="pu">)</span> <span class="k">return</span> <span class="pu">&lt;</span><span class="jx">Empty</span> <span class="pu">/&gt;;</span>',
        '  <span class="k">return</span> <span class="pu">&lt;</span><span class="jx">ul</span><span class="pu">&gt;{</span>rows<span class="pu">}&lt;/</span><span class="jx">ul</span><span class="pu">&gt;;</span>',
        '<span class="pu">}</span>'
      ], hl: 1,
      note: "그리기 전에 빈 경우를 먼저 걸러냅니다. 이 한 줄이 없으면 빈 목록에 텅 빈 상자가 남습니다.",
      q: "빈 목록 처리를 <code>return</code> 앞에 두는 이유는 무엇인가요?",
      opts: [
        { t: "아래 코드가 빈 경우를 신경 쓰지 않아도 되게 하려고", ok: true },
        { t: "빈 배열은 <code>map</code> 에서 에러가 나서", ok: false },
        { t: "성능이 빨라져서", ok: false }
      ],
      ex: "먼저 돌려보내면(early return) 그 아래는 항상 '상품이 있는 경우'만 다루면 됩니다."
    },
    "fetch-split": {
      track: "t2", unit: "상품 목록 불러오기", level: 3,
      name: "가져오기와 그리기 나누기", latin: "Fetch / render split", sign: "useProducts",
      habitat: "src/products/useProducts.ts",
      lede: "데이터를 가져오는 일과 화면을 그리는 일을 다른 파일로 나눕니다. 나누면 화면을 바꿀 때 서버 코드를 안 열어도 됩니다.",
      code: [
        '<span class="cm">// useProducts.ts — 가져오기만 안다</span>',
        '<span class="k">export function</span> <span class="fn">useProducts</span><span class="pu">() {</span>',
        '  <span class="k">return</span> <span class="tok"><span class="fn">useQuery</span><span class="pu">(</span><span class="pu">[</span><span class="st">"products"</span><span class="pu">]</span><span class="pu">,</span> fetchProducts<span class="pu">)</span></span><span class="pu">;</span>',
        '<span class="pu">}</span>'
      ], hl: 2,
      note: "화면 컴포넌트는 <code>useProducts()</code> 만 부릅니다. 주소가 바뀌어도 컴포넌트는 그대로입니다.",
      q: "API 주소가 바뀌면 어느 파일을 고쳐야 하나요?",
      opts: [
        { t: "<code>useProducts.ts</code> 하나만", ok: true },
        { t: "목록을 쓰는 모든 컴포넌트", ok: false },
        { t: "<code>ProductList.tsx</code> 만", ok: false }
      ],
      ex: "가져오는 방법을 한 곳에 모아두면 바뀔 때 고칠 자리도 한 곳입니다."
    },
    "optional-chaining": {
      track: "t0", unit: "장바구니 담기/빼기", level: 1,
      name: "옵셔널 체이닝", latin: "Optional chaining", sign: "?.",
      habitat: "src/cart/CartBadge.tsx · 외 6곳",
      lede: "장바구니가 아직 안 불러와졌을 때에도 화면은 그려집니다. 그 순간 값이 비어 있어도 앱이 멈추지 않게 막아주는 표시입니다.",
      code: [
        '<span class="k">export function</span> <span class="fn">CartBadge</span><span class="pu">({</span> cart <span class="pu">}:</span> <span class="ty">Props</span><span class="pu">) {</span>',
        '  <span class="k">const</span> count = cart<span class="tok"><span class="pu">?.</span></span>items.length ?? <span class="nu">0</span><span class="pu">;</span>',
        '',
        '  <span class="k">if</span> <span class="pu">(</span>count === <span class="nu">0</span><span class="pu">)</span> <span class="k">return</span> <span class="k">null</span><span class="pu">;</span>',
        '',
        '  <span class="k">return</span> <span class="pu">&lt;</span><span class="jx">span</span> <span class="ty">className</span><span class="pu">=</span><span class="st">"cart-badge"</span><span class="pu">&gt;{</span>count<span class="pu">}&lt;/</span><span class="jx">span</span><span class="pu">&gt;;</span>',
        '<span class="pu">}</span>'
      ], hl: 1,
      note: "<code>cart</code> 가 아직 없을 수 있습니다. <code>?.</code> 는 앞이 비어 있으면 뒤를 읽지 않고 <code>undefined</code> 를 내놓습니다. 그 뒤 <code>?? 0</code> 이 받아서 0 으로 바꿉니다.",
      q: "<code>cart</code> 가 <code>undefined</code> 일 때 <code>count</code> 는 무엇이 되나요?",
      opts: [
        { t: "<code>0</code> 이 됩니다", ok: true },
        { t: "에러가 나면서 화면이 멈춥니다", ok: false },
        { t: "<code>undefined</code> 가 그대로 들어갑니다", ok: false }
      ],
      ex: "<code>?.</code> 가 <code>undefined</code> 를 내놓고, <code>?? 0</code> 이 그걸 받아 0 으로 바꿉니다. 둘은 거의 항상 짝으로 다닙니다."
    },
    "use-reducer": {
      track: "t1", unit: "장바구니 담기/빼기", level: 2,
      name: "장바구니 리듀서", latin: "useReducer", sign: "dispatch",
      habitat: "src/cart/reducer.ts",
      lede: "담기·빼기·비우기가 늘어나면 상태 바꾸는 코드가 흩어집니다. 리듀서는 '무엇을 했는지'만 보내고 바꾸는 일은 한 곳에 모읍니다.",
      code: [
        '<span class="k">const</span> <span class="pu">[</span>state<span class="pu">,</span> dispatch<span class="pu">]</span> = <span class="fn">useReducer</span><span class="pu">(</span>cartReducer<span class="pu">,</span> initial<span class="pu">);</span>',
        '',
        '<span class="k">function</span> <span class="fn">onAdd</span><span class="pu">(</span>item<span class="pu">:</span> <span class="ty">Item</span><span class="pu">) {</span>',
        '  <span class="tok"><span class="fn">dispatch</span><span class="pu">({</span> type<span class="pu">:</span> <span class="st">"add"</span><span class="pu">,</span> item <span class="pu">})</span></span><span class="pu">;</span>',
        '<span class="pu">}</span>'
      ], hl: 3,
      note: "여기서는 무엇이 일어났는지만 알립니다. 실제로 개수를 더하는 계산은 <code>cartReducer</code> 안에만 있습니다.",
      q: "\"담기\" 규칙을 바꾸려면 어디를 고치나요?",
      opts: [
        { t: "<code>cartReducer</code> 안의 <code>add</code> 부분", ok: true },
        { t: "<code>dispatch</code> 를 부르는 모든 곳", ok: false },
        { t: "<code>initial</code> 값", ok: false }
      ],
      ex: "부르는 쪽은 '무엇'만, 리듀서는 '어떻게'만 압니다. 규칙은 리듀서 한 곳에 있습니다."
    },
    "state-placement": {
      track: "t2", unit: "장바구니 담기/빼기", level: 0, count: 3,
      name: "상태를 어디에 둘 것인가", latin: "State placement", sign: "CartProvider",
      habitat: "src/cart/CartProvider.tsx",
      lede: "장바구니 개수를 헤더도 쓰고 목록도 씁니다. 그러면 그 상태는 둘 다를 감싸는 자리에 있어야 합니다.",
      code: [
        '<span class="pu">&lt;</span><span class="tok"><span class="jx">CartProvider</span></span><span class="pu">&gt;</span>',
        '  <span class="pu">&lt;</span><span class="jx">Header</span> <span class="pu">/&gt;</span>      <span class="cm">// 개수를 읽는다</span>',
        '  <span class="pu">&lt;</span><span class="jx">ProductList</span> <span class="pu">/&gt;</span> <span class="cm">// 담기를 보낸다</span>',
        '<span class="pu">&lt;/</span><span class="jx">CartProvider</span><span class="pu">&gt;</span>'
      ], hl: 0,
      note: "쓰는 곳이 여럿이면 그 <b>공통 조상</b>에 둡니다. 더 위로 올리면 관계없는 화면까지 다시 그려집니다.",
      q: "장바구니 상태를 앱 최상단으로 더 올리면 무엇이 나빠지나요?",
      opts: [
        { t: "상관없는 화면까지 다시 그려집니다", ok: true },
        { t: "값을 읽을 수 없게 됩니다", ok: false },
        { t: "타입이 깨집니다", ok: false }
      ],
      ex: "필요한 만큼만 위로 올립니다. 공통 조상보다 위는 그냥 넓기만 한 자리입니다."
    },
    "async-await": {
      track: "t0", unit: "장바구니 담기/빼기", level: 0, count: 11,
      name: "비동기 기다리기", latin: "async · await", sign: "await",
      habitat: "src/api/cart.ts · 외 4곳",
      lede: "서버에 물어보고 답이 올 때까지는 시간이 걸립니다. 그동안 앱을 멈추지 않으면서 답을 기다리는 표시입니다.",
      code: [
        '<span class="k">async function</span> <span class="fn">addToCart</span><span class="pu">(</span>id<span class="pu">:</span> <span class="ty">string</span><span class="pu">,</span> qty<span class="pu">:</span> <span class="ty">number</span><span class="pu">) {</span>',
        '  <span class="k">const</span> res = <span class="tok"><span class="k">await</span></span> <span class="fn">fetch</span><span class="pu">(</span><span class="st">"/api/cart"</span><span class="pu">, {</span>',
        '    method<span class="pu">:</span> <span class="st">"POST"</span><span class="pu">,</span>',
        '    body<span class="pu">:</span> <span class="ty">JSON</span><span class="pu">.</span><span class="fn">stringify</span><span class="pu">({</span> id<span class="pu">,</span> qty <span class="pu">}),</span>',
        '  <span class="pu">});</span>',
        '  <span class="k">return</span> res<span class="pu">.</span><span class="fn">json</span><span class="pu">();</span>',
        '<span class="pu">}</span>'
      ], hl: 1,
      note: "<code>await</code> 가 없으면 <code>res</code> 에는 답이 아니라 '나중에 온다는 약속'이 들어갑니다. <code>await</code> 는 <code>async</code> 함수 안에서만 쓸 수 있습니다.",
      q: "<code>await</code> 를 빼면 <code>res</code> 에는 무엇이 들어가나요?",
      opts: [
        { t: "아직 답이 아닌 <code>Promise</code>", ok: true },
        { t: "서버가 보낸 데이터", ok: false },
        { t: "<code>undefined</code>", ok: false }
      ],
      ex: "<code>fetch</code> 는 Promise 를 돌려줍니다. <code>await</code> 가 그 안의 값이 나올 때까지 이 줄에서 기다립니다."
    },
    "generics": {
      track: "t0", unit: "공통 유틸", level: 0, count: 6,
      name: "타입 매개변수", latin: "Generics", sign: "&lt;T&gt;",
      habitat: "src/lib/fetcher.ts · 외 2곳",
      lede: "같은 함수를 상품에도 쓰고 주문에도 씁니다. 그때 '무슨 타입이 나올지'를 부르는 쪽이 정하게 하는 표시입니다.",
      code: [
        '<span class="k">export async function</span> <span class="fn">getJSON</span><span class="tok"><span class="pu">&lt;</span><span class="ty">T</span><span class="pu">&gt;</span></span><span class="pu">(</span>url<span class="pu">:</span> <span class="ty">string</span><span class="pu">):</span> <span class="ty">Promise</span><span class="pu">&lt;</span><span class="ty">T</span><span class="pu">&gt; {</span>',
        '  <span class="k">const</span> res = <span class="k">await</span> <span class="fn">fetch</span><span class="pu">(</span>url<span class="pu">);</span>',
        '  <span class="k">if</span> <span class="pu">(!</span>res.ok<span class="pu">)</span> <span class="k">throw new</span> <span class="fn">Error</span><span class="pu">(</span>url<span class="pu">);</span>',
        '  <span class="k">return</span> res<span class="pu">.</span><span class="fn">json</span><span class="pu">()</span> <span class="k">as</span> <span class="ty">Promise</span><span class="pu">&lt;</span><span class="ty">T</span><span class="pu">&gt;;</span>',
        '<span class="pu">}</span>'
      ], hl: 0,
      note: "<code>T</code> 는 아직 정해지지 않은 타입의 자리입니다. <code>getJSON&lt;Product[]&gt;(...)</code> 라고 부르면 그때 <code>T</code> 가 정해집니다.",
      q: "<code>getJSON&lt;Product[]&gt;(url)</code> 의 결과 타입은 무엇인가요?",
      opts: [
        { t: "<code>Promise&lt;Product[]&gt;</code>", ok: true },
        { t: "<code>Promise&lt;any&gt;</code>", ok: false },
        { t: "<code>Product[]</code>", ok: false }
      ],
      ex: "부를 때 넣은 타입이 <code>T</code> 자리에 그대로 들어갑니다. 그래서 <code>Promise&lt;T&gt;</code> 는 <code>Promise&lt;Product[]&gt;</code> 가 됩니다."
    },
    "barrel-file": {
      track: "t2", unit: "장바구니 담기/빼기", level: 0, count: 4,
      name: "재수출 묶음", latin: "Barrel file", sign: "export *",
      habitat: "src/cart/index.ts",
      lede: "폴더 하나가 밖으로 무엇을 내주는지 한 파일에 모읍니다. 밖에서는 폴더 안의 파일 이름을 몰라도 됩니다.",
      code: [
        '<span class="cm">// src/cart/index.ts</span>',
        '<span class="tok"><span class="k">export</span> <span class="pu">*</span></span> <span class="k">from</span> <span class="st">"./CartBadge"</span><span class="pu">;</span>',
        '<span class="k">export</span> <span class="pu">*</span> <span class="k">from</span> <span class="st">"./useCart"</span><span class="pu">;</span>',
        '<span class="k">export</span> <span class="pu">*</span> <span class="k">from</span> <span class="st">"./reducer"</span><span class="pu">;</span>'
      ], hl: 1,
      note: "밖에서는 <code>import { CartBadge } from \"@/cart\"</code> 하나로 끝납니다. 안에서 파일을 옮겨도 밖은 안 바뀝니다.",
      q: "<code>CartBadge.tsx</code> 를 다른 이름으로 옮기면 어디를 고치나요?",
      opts: [
        { t: "<code>index.ts</code> 한 줄만", ok: true },
        { t: "그 컴포넌트를 쓰는 모든 파일", ok: false },
        { t: "아무 데도 안 고쳐도 됩니다", ok: false }
      ],
      ex: "묶음 파일이 안과 밖의 경계가 됩니다. 경계 안쪽 변경은 밖으로 새지 않습니다."
    }
  };

  /* ── 차례: 유닛 = 내 리포의 실제 기능 ────────────────────────────────── */
  var UNITS = [
    { id: "u1", title: "상품 목록 불러오기", state: "done", meta: "완료 · 카드 12장",
      tracks: [
        { c: "array-map",  sub: "배열 map · 구조 분해" },
        { c: "list-render", sub: "목록 컴포넌트 필사" },
        { c: "fetch-split", sub: "가져오기와 그리기 나누기" }
      ] },
    { id: "u2", title: "장바구니 담기/빼기", state: "now", meta: "카드 9장 남음",
      tracks: [
        { c: "optional-chaining", sub: "옵셔널 체이닝 · 널 병합" },
        { c: "use-reducer", sub: "장바구니 리듀서 필사" },
        { c: "state-placement", sub: "상태를 어디에 둘 것인가" }
      ] },
    { id: "u3", title: "주문서 작성", state: "locked", meta: "카드 14장",
      note: "장바구니 담기/빼기를 마치면 열립니다.",
      tracks: [
        { c: null, track: "t0", name: "폼 이벤트 · 제네릭", lv: 0 },
        { c: null, track: "t1", name: "주문서 유효성 검사 필사", lv: 0 },
        { c: null, track: "t2", name: "서버 액션과 클라이언트 경계", lv: 0 }
      ] },
    { id: "u4", title: "로그인 흐름", state: "locked", meta: "카드 11장",
      note: "주문서 작성을 마치면 열립니다.",
      tracks: [
        { c: null, track: "t0", name: "async / await · try·catch", lv: 0 },
        { c: null, track: "t1", name: "세션 훅 필사", lv: 0 },
        { c: null, track: "t2", name: "인증 의존성이 닿는 범위", lv: 0 }
      ] }
  ];

  var GAPS = ["async-await", "generics", "barrel-file", "state-placement"];

  /* ── 도우미 ───────────────────────────────────────────────────────────── */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function bird(size) {
    var n = $("#tpl-bird").content.firstElementChild.cloneNode(true);
    n.setAttribute("width", size); n.setAttribute("height", size);
    return n;
  }
  // rAF 는 탭이 그려지지 않으면 영원히 호출되지 않는다(백그라운드·최소화).
  // 화면에 반드시 나와야 하는 단계는 타이머로도 한 번 더 받쳐준다.
  function nextFrame(fn) {
    var done = false;
    var run = function () { if (done) return; done = true; fn(); };
    requestAnimationFrame(run);
    setTimeout(run, 32);
  }
  // 한국어 조사: 앞 글자의 받침 유무로 은/는, 이/가, 을/를 을 고른다.
  function josa(word, withBatchim, withoutBatchim) {
    var c = word.charCodeAt(word.length - 1);
    var has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
    return word + (has ? withBatchim : withoutBatchim);
  }
  function gaugeHTML(level, track) {
    var s = '<span class="gauge' + (level > 0 ? " gauge--" + track : "") + '" data-level="' + level +
            '" role="img" aria-label="관찰 기록: ' + LEVELS[level] + '">';
    for (var i = 0; i < 3; i++) s += '<i class="' + (i < level ? "on" : "") + '"></i>';
    return s + "</span>";
  }

  /* ── 차례 그리기 ─────────────────────────────────────────────────────── */
  function renderTOC() {
    $("#toc").innerHTML = UNITS.map(function (u) {
      var rows = u.tracks.map(function (t) {
        var c = t.c ? C[t.c] : null;
        var tr = c ? c.track : t.track;
        var lv = c ? c.level : t.lv;
        var nm = c ? c.name : t.name;
        var locked = u.state === "locked";
        return '<li class="track' + (locked ? " track--locked" : "") + '">' +
          '<button class="track__btn" ' + (locked ? 'disabled aria-disabled="true"' : 'data-open="' + t.c + '"') + '>' +
            '<span class="tag tag--' + tr + '">' + TRACK_LABEL[tr] + '</span>' +
            '<span class="track__name">' + nm + (t.sub && c ? '<span class="sub">' + c.sign.replace(/</g, "&lt;") + ' · ' + c.latin + '</span>' : '') + '</span>' +
            gaugeHTML(lv, tr) +
            '<span class="track__state">' + LEVELS[lv] + '</span>' +
          '</button></li>';
      }).join("");

      return '<li class="unit unit--' + u.state + '">' +
        '<div class="unit__rail"><span class="node node--' + u.state + '"></span></div>' +
        '<div class="unit__body">' +
          '<div class="unit__head">' +
            '<h3>' + u.title + '</h3>' +
            (u.state === "now" ? '<span class="here">지금 여기</span>' : '') +
            '<span class="unit__meta">' + u.meta + '</span>' +
          '</div>' +
          (u.note ? '<p class="unit__note">' + u.note + '</p>' : '') +
          '<ul class="tracks">' + rows + '</ul>' +
        '</div></li>';
    }).join("");
  }

  /* ── 미기록 종 ───────────────────────────────────────────────────────── */
  function renderGaps() {
    $("#gaps").innerHTML = GAPS.map(function (id) {
      var c = C[id], rec = c.level > 0;
      return '<li class="plate-card gap' + (rec ? " gap--recorded" : " plate-card--gap") + '" data-gap="' + id + '">' +
        '<div class="gap__top">' +
          '<span class="tag tag--' + (rec ? c.track : "gap") + '">' + (rec ? TRACK_LABEL[c.track] : "미기록") + '</span>' +
          '<span class="gap__sign">' + c.sign + '</span>' +
        '</div>' +
        '<p class="gap__name">' + c.name + '</p>' +
        '<p class="gap__count">' + (rec
          ? LEVELS[c.level] + " · 다시 보러 가기"
          : '내 코드에 <b>' + c.count + '번</b> 나오는데 아직 안 봄') + '</p>' +
        '<p class="habitat">' + c.habitat + '</p>' +
        '<button class="btn btn--line btn--sm" data-open="' + id + '">' + (rec ? "다시 열기" : "지금 열어보기") + '</button>' +
      '</li>';
    }).join("");
  }

  function renderRecord() {
    var n = [0, 0, 0, 0], base = [18, 12, 31, 24];
    Object.keys(C).forEach(function (k) { n[C[k].level]++; });
    // 목업: 화면에 없는 개념은 고정값으로 두고 변화분만 반영한다
    for (var i = 0; i < 4; i++) $("#rec-" + i).textContent = base[i] + n[i] - INIT[i];
  }
  var INIT = [0, 0, 0, 0];
  Object.keys(C).forEach(function (k) { INIT[C[k].level]++; });

  /* ── 관찰 시트 ───────────────────────────────────────────────────────── */
  var cur = null, lastFocus = null;

  function openConcept(id) {
    var c = C[id]; if (!c) return;
    cur = id;
    lastFocus = document.activeElement;

    $("#obs-kicker").textContent = TRACK_LABEL[c.track] + " · " + c.unit;
    $("#obs-name").textContent = c.name;
    $("#obs-latin").textContent = c.latin;
    $("#obs-sign").innerHTML = c.sign;
    $("#obs-habitat").textContent = c.habitat;
    $("#obs-lede").textContent = c.lede;
    $("#obs-note").innerHTML = c.note;
    $("#obs-q").innerHTML = c.q;

    $("#obs-code").innerHTML = c.code.map(function (line, i) {
      return '<span class="ln' + (i === c.hl ? " hl" : "") + '">' +
             '<span class="n">' + (i + 1) + '</span><span class="c">' + (line || " ") + '</span></span>';
    }).join("");

    var bs = $("#obs-bird"); bs.innerHTML = ""; var b = bird(64);
    if (c.level === 0) b.setAttribute("data-state", "sil");
    bs.appendChild(b);

    $("#obs-opts").innerHTML = c.opts.map(function (o, i) {
      return '<button class="opt" data-ok="' + (o.ok ? 1 : 0) + '"><span class="mk">' +
             "가나다".charAt(i) + '</span><span>' + o.t + "</span></button>";
    }).join("");

    $("#obs-answer").classList.remove("on");
    $("#obs-stamp").hidden = true;
    $("#obs-stamp").classList.remove("in");
    $("#btn-miss").disabled = false;
    $("#obs-explain").innerHTML = c.ex;
    updateFoot();

    $("#scrim").hidden = false; $("#obs").hidden = false;
    nextFrame(function () {
      $("#scrim").classList.add("on"); $("#obs").classList.add("on");
      $("#obs-close").focus({ preventScroll: true });
      // 레이아웃이 자리를 잡은 다음에 그린다(시트 전환·서체 적용 이후)
      nextFrame(function () { drawLeader(true); });
    });
  }

  function updateFoot() {
    var c = C[cur];
    $("#obs-gauge").outerHTML = gaugeHTML(c.level, c.track).replace('class="gauge', 'id="obs-gauge" class="gauge');
    $("#obs-level").textContent = LEVELS[c.level];
    $("#obs-next").textContent = c.level === 0 ? "아직 못 본 종입니다"
      : c.level === 3 ? "다음 복습: 3주 뒤" : c.level === 2 ? "다음 복습: 6일 뒤" : "다음 복습: 내일";
  }

  function closeObs() {
    $("#scrim").classList.remove("on"); $("#obs").classList.remove("on");
    setTimeout(function () { $("#scrim").hidden = true; $("#obs").hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ── 지시선 ──────────────────────────────────────────────────────────── */
  function drawLeader(animate) {
    var plate = $("#plate"), svg = $("#leader"), tok = $("#obs-code .tok"),
        note = $("#fieldnote"), box = $("#plate .code");
    if (!tok || getComputedStyle(svg).display === "none") return;
    var p = plate.getBoundingClientRect(), t = tok.getBoundingClientRect(),
        n = note.getBoundingClientRect(), b = box.getBoundingClientRect();
    // 지시선은 코드를 가로지르지 않는다. 지목된 줄의 오른쪽 끝(도판의 가장자리)에서 나간다.
    var x1 = b.right - p.left + 7, y1 = t.top - p.top + t.height / 2;
    var x4 = n.left - p.left - 8, y4 = n.top - p.top + 15;
    var x2 = Math.min(x1 + 18, x4 - 30), x3 = x4 - 16;
    var d = "M" + x1 + " " + y1 + " H" + x2 + " L" + x3 + " " + y4 + " H" + x4;
    var path = $("#leader-path"), dot = $("#leader-dot");
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x4) || !isFinite(y4)) return;
    path.setAttribute("d", d);
    dot.setAttribute("cx", x4 + 1); dot.setAttribute("cy", y4);
    svg.classList.remove("draw");
    if (animate) {
      svg.style.setProperty("--len", path.getTotalLength());
      void svg.offsetWidth;
      svg.classList.add("draw");
    }
  }

  /* ── 답하기 — 벌은 없다. 기록되거나, 아직 미기록이거나. ──────────────── */
  function settle(recorded) {
    var c = C[cur];
    $$("#obs-opts .opt").forEach(function (b) { b.disabled = true; });
    $("#btn-miss").disabled = true;
    $("#obs-answer").classList.add("on");

    if (recorded) {
      var wasGap = c.level === 0;
      if (c.level < 3) c.level++;
      var st = $("#obs-stamp");
      st.hidden = false; void st.offsetWidth; st.classList.add("in");
      if (wasGap) {
        var b = $("#obs-bird .bird");
        b.removeAttribute("data-state");           // 실루엣이 색을 입는다
        b.classList.add("hop"); setTimeout(function () { b.classList.remove("hop"); }, 700);
      }
      $("#dee-line").textContent = "기록했어요. " + c.name + ", 이제 눈에 들어올 거예요.";
    } else {
      $("#dee-line").textContent = "괜찮아요. " + josa(c.name, "은", "는") + " 내일 다시 보여드릴게요.";
    }
    updateFoot(); renderTOC(); renderGaps(); renderRecord();
  }

  /* ── 배선 ────────────────────────────────────────────────────────────── */
  function init() {
    $$("[data-bird]").forEach(function (s) { s.appendChild(bird(+s.dataset.bird)); });
    renderTOC(); renderGaps();

    document.addEventListener("click", function (e) {
      var open = e.target.closest("[data-open]");
      if (open && open.dataset.open !== "null") { openConcept(open.dataset.open); return; }
      if (e.target.closest("#obs-close") || e.target.closest("#scrim")) { closeObs(); return; }
      var opt = e.target.closest(".opt");
      if (opt && !opt.disabled) {
        var ok = opt.dataset.ok === "1";
        $$("#obs-opts .opt").forEach(function (b) {
          if (b.dataset.ok === "1") b.classList.add("is-recorded");
        });
        if (!ok) opt.classList.add("is-missed");
        settle(ok);
        return;
      }
      if (e.target.closest("#btn-miss")) {
        $$("#obs-opts .opt").forEach(function (b) { if (b.dataset.ok === "1") b.classList.add("is-recorded"); });
        settle(false);
      }
    });

    // 탭
    $("#tab-home").addEventListener("click", function () { switchView("home"); });
    $("#tab-ds").addEventListener("click", function () { switchView("ds"); });

    // 테마
    $$("[data-theme-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.dataset.themeBtn;
        if (v === "auto") document.documentElement.removeAttribute("data-theme");
        else document.documentElement.setAttribute("data-theme", v);
        $$("[data-theme-btn]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        buildSwatches();
      });
    });

    // 키보드: Space 로 오늘 시작, Esc 로 닫기
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#obs").hidden) { closeObs(); return; }
      var tag = (e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      if (e.code === "Space" && !typing && $("#obs").hidden && tag !== "button") {
        e.preventDefault();
        openConcept($("#btn-start").dataset.concept);
      }
    });

    window.addEventListener("resize", function () { if (!$("#obs").hidden) drawLeader(false); });

    buildSwatches(); measureLine();
  }

  function switchView(v) {
    $("#view-home").hidden = v !== "home";
    $("#view-ds").hidden = v !== "ds";
    $("#tab-home").setAttribute("aria-selected", v === "home");
    $("#tab-ds").setAttribute("aria-selected", v === "ds");
    if (v === "ds") { buildSwatches(); measureLine(); }
  }

  /* ── 조판 규칙 뷰: 대비 실측 ─────────────────────────────────────────── */
  function lum(rgb) {
    var m = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    var f = m.map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)); }
  function tokenValue(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function toRGB(v) { var d = document.createElement("div"); d.style.color = v; document.body.appendChild(d);
    var r = getComputedStyle(d).color; d.remove(); return r; }

  var TEXT_TOKENS = [
    ["--ink", "본문 잉크", "--paper"], ["--ink-2", "보조 텍스트", "--paper"], ["--ink-3", "라벨·캡션", "--paper"],
    ["--t0", "T0 문법", "--paper"], ["--t1", "T1 필사", "--paper"], ["--t2", "T2 구조", "--paper"],
    ["--mark", "미기록 표시", "--paper"], ["--code-ink", "코드", "--code-paper"],
    ["--code-gutter", "줄번호", "--code-gutter-bg"], ["--syn-key", "예약어", "--code-paper"],
    ["--syn-str", "문자열", "--code-paper"], ["--syn-fn", "함수", "--code-paper"],
    ["--syn-type", "타입", "--code-paper"], ["--syn-com", "주석", "--code-paper"]
  ];
  var SURFACE_TOKENS = [
    ["--paper", "페이지 바탕"], ["--paper-plate", "도판 표면"], ["--paper-sunken", "오목한 면"],
    ["--rule", "머리카락 괘선"], ["--rule-strong", "테두리·빈 눈금"], ["--code-hl", "지목 강조"],
    ["--t0-wash", "T0 배경"], ["--t1-wash", "T1 배경"], ["--t2-wash", "T2 배경"], ["--mark-wash", "미기록 배경"]
  ];

  function buildSwatches() {
    var t = $("#sw-text"); if (!t) return;
    t.innerHTML = TEXT_TOKENS.map(function (r) {
      var fg = toRGB(tokenValue(r[0])), bg = toRGB(tokenValue(r[2]));
      var cr = ratio(fg, bg);
      return '<div class="sw"><div class="sw__chip" style="background:var(' + r[2] + ');color:var(' + r[0] +
        ');display:flex;align-items:center;justify-content:center;font-weight:600">가나다 Aa</div>' +
        '<div class="sw__meta"><span class="sw__name">' + r[0] + '</span>' +
        '<span class="sw__cr">' + r[1] + ' · <b>' + cr.toFixed(1) + ':1</b> ' + (cr >= 7 ? "AAA" : cr >= 4.5 ? "AA" : "부족") + '</span></div></div>';
    }).join("");
    $("#sw-surface").innerHTML = SURFACE_TOKENS.map(function (r) {
      return '<div class="sw"><div class="sw__chip" style="background:var(' + r[0] + ')"></div>' +
        '<div class="sw__meta"><span class="sw__name">' + r[0] + '</span><span class="sw__cr">' + r[1] + '</span></div></div>';
    }).join("");
  }

  /* 실제로 한 줄에 한글 몇 자가 들어가는지 렌더 후 측정한다 */
  function measureLine() {
    var el = $("#ruler-text"); if (!el) return;
    var cs = getComputedStyle(el);
    var span = document.createElement("span");
    // font 단축속성은 letter-spacing 을 싣지 않는다. 개별로 복사해야 실측이 맞는다.
    span.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre";
    span.style.fontFamily = cs.fontFamily;
    span.style.fontSize = cs.fontSize;
    span.style.fontWeight = cs.fontWeight;
    span.style.letterSpacing = cs.letterSpacing;
    var sample = "한글본문한줄에들어가는글자수를재는표본문장입니다";  // 24자
    span.textContent = sample;
    document.body.appendChild(span);
    var adv = span.getBoundingClientRect().width / sample.length; span.remove();
    var chars = Math.round(el.getBoundingClientRect().width / adv);
    $("#ruler-measure").textContent =
      "실측: 한 줄에 한글 " + chars + "자 · " + Math.round(el.getBoundingClientRect().width) +
      "px · " + cs.fontSize + " / 행간 " + (parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(2) +
      " · 목표 35~45자";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
