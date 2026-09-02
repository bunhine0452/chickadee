/* ═══════════ 오늘의 인쇄 데이터 — Run 08 · cart-shop-web ═══════════
   경로 홈(ink-home.html)의 「오늘의 인쇄」와 같은 판. 시간은 분 단위(큐 칸 너비 = 시간). */
var RUN = { no:'Run 08', repo:'cart-shop-web', date:'02 SEP', streak:7 };

var LY = [
  {n:'0겹', k:'미인쇄', pl:'실루엣만'},
  {n:'1겹', k:'애벌',   pl:'흐린 하프톤'},
  {n:'2겹', k:'먹판',   pl:'윤곽이 잡힘'},
  {n:'3겹', k:'+ 청판', pl:'색이 들어옴'},
  {n:'4겹', k:'+ 진홍', pl:'완성'}
];
var TRACK = {t0:'T0 문법', t1:'T1 클론 코딩', t2:'T2 구조'};
/* 겹별 다음 인쇄 간격 — 시간을 두고 다시 맞혀야 겹이 쌓인다 */
var NEXT_AT = ['오늘 안에', '내일', '3일 뒤', '9일 뒤', '3주 뒤'];

/* ───────── T0 카드 ─────────
   kind : meaning(의미형) · blank(빈칸형) · point(지목형)
   seg  : 대상 줄을 조각으로 — pick:n 은 짚을 수 있는 토큰, hole 은 빈칸
   why  : 보기별 진단문(정답 자리는 null) — 「틀렸다」가 아니라 「그것이 참이 되는 조건」 */
var CARDS = {
  fnupdate: {
    id:'fnupdate', track:'t0', kind:'meaning', concept:'함수형 업데이트', code:'setItems((prev) => ...)', ly:2,
    file:'src/features/cart/useCart.ts', focus:27, review:true,
    lines:[
      {n:24, t:"const [items, setItems] = useState<Item[]>([])"},
      {n:25, t:""},
      {n:26, t:"function addItem(item: Item) {"},
      {n:27, t:"  setItems((prev) => [...prev, item])", target:true},
      {n:28, t:"}"}
    ],
    q:'27행의 <code>prev</code> 에는 무엇이 들어 있을까요? <code>addItem</code> 이 <b>연달아 두 번</b> 불렸다고 해 봅시다.',
    hint:'두 번째 호출이 첫 번째 호출의 결과를 아는지가 핵심입니다.',
    options:[
      {t:'그 순간의 최신 <code>items</code> — 두 번째 호출은 첫 번째가 넣은 것까지 받는다'},
      {t:'처음 렌더링 때의 <code>items</code> — 항상 빈 배열'},
      {t:'방금 넣으려는 <code>item</code> 하나'},
      {t:'<code>undefined</code> — 아직 아무것도 안 정해져서'}
    ],
    answer:0,
    why:[null,
      {t:'<code>setItems([...items, item])</code> 처럼 <b>바깥의 <code>items</code> 를 직접 읽었다면</b> 그 말이 맞습니다. 그 <code>items</code> 는 이번 렌더 때 찍힌 값이라 두 번째 호출이 첫 번째를 덮어씁니다. 함수를 넘기면 리액트가 <b>그 순간의 최신값</b>을 <code>prev</code> 로 건네줍니다.',
       edge:{h:'가장 날카로운 자리 — 같은 줄, 다른 결과', code:["setItems([...items, a]); setItems([...items, b])   // b 만 남는다", "setItems(p => [...p, a]); setItems(p => [...p, b])   // a, b 둘 다"]}},
      {t:'<code>prev</code> 라는 이름 때문에 헷갈리기 쉽지만, 리액트가 넣어 주는 값은 <b>상태 전체</b>입니다. <code>item</code> 은 바깥 함수의 매개변수라 이미 손에 있어요.',
       edge:{h:'가장 날카로운 자리 — 이름은 아무거나', code:["setItems((whatever) => [...whatever, item])   // prev 와 똑같이 동작"]}},
      {t:'<code>prev</code> 는 리액트가 이 함수를 <b>부를 때</b> 채워 줍니다. 비어 있는 경우는 없어요. 초기값 <code>[]</code> 이라도 들어 있습니다.',
       edge:{h:'가장 날카로운 자리 — 비는 건 함수가 아니라 값', code:["setItems(undefined)          // 이건 상태를 undefined 로 만든다", "setItems((prev) => prev)     // prev 는 항상 채워져 있다"]}}
    ],
    ok:'<code>setItems</code> 에 <b>값 대신 함수</b>를 넘기면, 리액트가 그 함수를 부를 때 <b>그 순간의 최신 상태</b>를 <code>prev</code> 로 넣어 줍니다. 그래서 연달아 불러도 앞 호출의 결과 위에 쌓입니다.',
    rule:'값을 넘기면 <b>찍힌 시점</b>의 값, 함수를 넘기면 <b>그 순간</b>의 값.',
    result:{label:'두 번 부른 뒤 items', value:'[a, b]', note:'앞 호출 위에 쌓임'},
    uses:[
      {f:'src/features/cart/useCart.ts', l:34, code:"setItems((prev) => prev.filter((i) => i.id !== id))"},
      {f:'src/features/auth/useLogin.ts', l:19, code:"setAttempts((n) => n + 1)"}
    ]
  },

  mapupdate: {
    id:'mapupdate', track:'t0', kind:'blank', concept:'배열 불변 갱신', code:'map', ly:3,
    file:'src/features/cart/useCart.ts', focus:41, review:true,
    lines:[
      {n:39, t:"function setQty(id: string, qty: number) {"},
      {n:40, t:"  setItems((prev) =>"},
      {n:41, seg:[{t:"    prev."},{hole:true},{t:"((i) => (i.id === id ? { ...i, qty } : i)),"}], target:true},
      {n:42, t:"  )"},
      {n:43, t:"}"}
    ],
    q:'빈칸에 들어갈 것을 고르세요. 이 줄은 <b>같은 길이의 새 배열</b>을 만들고, <code>id</code> 가 맞는 항목만 수량을 바꿉니다.',
    hint:'고르는 즉시 코드에 써집니다. 제출하면 채점합니다.',
    options:[{t:'map', mono:true},{t:'forEach', mono:true},{t:'filter', mono:true},{t:'push', mono:true}],
    answer:0,
    why:[null,
      {t:'<code>forEach</code> 는 하나씩 돌기만 하고 <b>아무것도 돌려주지 않습니다</b>(<code>undefined</code>). 그러면 <code>setItems(undefined)</code> 가 되어 장바구니가 통째로 사라져요. 돌면서 새 배열을 <b>받고 싶을 때</b>는 <code>map</code> 입니다.',
       edge:{h:'가장 날카로운 자리 — 돌려주는 게 있나', code:["[1, 2].forEach((n) => n * 2)   // undefined", "[1, 2].map((n) => n * 2)       // [2, 4]"]}},
      {t:'<code>filter</code> 는 <b>조건을 통과한 것만 남깁니다</b>. 길이가 줄어들 수 있어요. 여기서는 <code>id</code> 가 다른 항목도 그대로 남겨야 하니 길이가 같은 <code>map</code> 이 맞습니다. 항목을 <b>빼는</b> 34행에서는 <code>filter</code> 가 정답이에요.',
       edge:{h:'가장 날카로운 자리 — 같은 파일, 다른 줄', code:["41행  prev.map((i) => ...)       // 길이 그대로, 하나만 바꿈", "34행  prev.filter((i) => ...)    // 하나를 뺌"]}},
      {t:'<code>push</code> 는 <b>원래 배열을 직접 바꾸고</b> 새 길이(숫자)를 돌려줍니다. 리액트는 배열이 <b>새 것</b>일 때만 화면을 다시 그리니, 이 줄은 아무 변화도 못 일으켜요. 불변 갱신 = 원본은 두고 새 배열.',
       edge:{h:'가장 날카로운 자리 — 원본을 건드리나', code:["prev.push(x)          // prev 가 바뀜, 돌려주는 건 길이", "[...prev, x]          // prev 는 그대로, 새 배열"]}}
    ],
    ok:'<code>map</code> 은 항목마다 함수를 불러 <b>돌려준 값으로 새 배열</b>을 만듭니다. <code>id</code> 가 맞으면 <code>{ ...i, qty }</code> 로 복사본을, 아니면 <code>i</code> 를 그대로 돌려주니 길이는 같고 원본은 안 건드립니다.',
    rule:'새 배열이 필요하면 <b>map</b>, 골라내려면 <b>filter</b>, 돌기만 하면 <b>forEach</b>. 원본을 바꾸는 <b>push</b> 는 상태에 쓰지 않는다.',
    result:{label:'setQty("a", 3) 뒤', value:'[{id:"a", qty:3}, {id:"b", qty:1}]', note:'길이 2 그대로, a 만 바뀜'},
    uses:[
      {f:'src/features/catalog/ProductList.tsx', l:22, code:"products.map((p) => <ProductCard key={p.id} product={p} />)"},
      {f:'src/features/checkout/useOrder.ts', l:48, code:"lines.map((l) => ({ ...l, total: l.qty * l.price }))"}
    ]
  },

  optchain: {
    id:'optchain', track:'t0', kind:'point', concept:'옵셔널 체이닝', code:'?.', ly:1, fresh:true,
    file:'src/features/auth/useLogin.ts', focus:42,
    lines:[
      {n:38, t:"const res = await login(email, password)"},
      {n:39, t:"if (!res.ok) {"},
      {n:40, t:"  return setError('아이디나 비밀번호를 확인하세요')"},
      {n:41, t:"}"},
      {n:42, seg:[{t:"const nick = "},{t:"res.user", pick:1},{t:"?.", pick:2},{t:"profile?.nickname "},{t:"??", pick:3},{t:" "},{t:"'손님'", pick:4}], target:true},
      {n:43, t:"setWelcome(`${nick} 님, 어서 오세요`)"}
    ],
    q:'42행에서 <code>user</code> 가 없을 때 <b>터지지 않고 그 자리에서 멈추게 해 주는 기호</b>를 코드 위에서 짚어 보세요.',
    hint:'점선이 그어진 곳을 클릭하거나, <kbd class="k">←</kbd> <kbd class="k">→</kbd> 로 옮겨 가며 고릅니다.',
    answer:1,
    why:[
      {t:'<code>res.user</code> 는 값을 <b>꺼내는</b> 자리입니다. <code>res</code> 가 없다면 여기서 터지지만, 39행이 <code>res.ok</code> 를 이미 봤으니 <code>res</code> 는 있어요. 없을 수 있는 건 그 <b>안의</b> <code>user</code> 이고, 그걸 지키는 기호는 바로 뒤의 <code>?.</code> 입니다.',
       edge:{h:'가장 날카로운 자리 — ?. 가 지키는 건 앞이다', code:["res.user?.profile   // user 가 없으면 undefined, 터지지 않음", "res.user.profile    // user 가 없으면 TypeError"]}},
      null,
      {t:'<code>??</code> 는 <b>멈추는</b> 기호가 아니라 <b>채우는</b> 기호입니다. 앞이 <code>undefined</code> 나 <code>null</code> 이면 뒤의 <code>\'손님\'</code> 을 씁니다. 멈추는 건 <code>?.</code> 가 먼저 하고, <code>??</code> 는 그 결과를 받아 기본값을 넣어요. 둘은 짝으로 자주 다닙니다.',
       edge:{h:'가장 날카로운 자리 — ?? 와 || 의 차이', code:["0 ?? 10    // 0  (없음이 아니므로 그대로)", "0 || 10    // 10 (거짓이면 바꿔 버린다)"]}},
      {t:'<code>\'손님\'</code> 은 마지막에 <b>채워 넣는 값</b>입니다. 없는 값을 만났을 때 프로그램이 멈추지 않게 하는 건 앞쪽 <code>?.</code> 이고, 이 문자열은 그 다음 <code>??</code> 가 고르는 대체값이에요.',
       edge:{h:'가장 날카로운 자리 — 순서', code:["res.user?.profile?.nickname   // 1) 여기서 멈추면 undefined", "?? '손님'                       // 2) 그 undefined 를 '손님' 으로"]}}
    ],
    ok:'<code>?.</code> 는 <b>앞의 값이 없으면(<code>undefined</code>·<code>null</code>) 거기서 멈추고 <code>undefined</code> 를 냅니다.</b> <code>user</code> 가 없어도 <code>.profile</code> 을 읽으려다 터지지 않아요. 그래서 42행은 로그인 응답에 <code>user</code> 나 <code>profile</code> 이 빠져 있어도 안전합니다.',
    rule:'<b><code>.</code> 은 없으면 터지고, <code>?.</code> 은 없으면 멈춘다.</b> 멈춘 자리의 값은 <code>undefined</code>.',
    result:{label:'res.user 가 없을 때 nick', value:"'손님'", note:'?. 가 멈추고 ?? 가 채움'},
    dict:[
      {k:'한 줄로', t:'<code>a?.b</code> 는 <code>a</code> 가 있으면 <code>a.b</code>, 없으면 <code>undefined</code>.'},
      {k:'왜 필요한가', t:'서버 응답은 늘 완전하지 않습니다. <code>user</code> 가 빠진 응답에서 <code>res.user.profile</code> 을 읽으면 앱이 그 자리에서 멈춥니다(TypeError). 예전엔 <code>res.user && res.user.profile && …</code> 로 하나씩 확인했는데, <code>?.</code> 가 그 확인을 두 글자에 담았어요.'},
      {k:'42행 안에서', steps:['<code>res.user</code> 를 읽는다. 없으면 여기서 끝 — 값은 <code>undefined</code>.','있으면 <code>.profile</code> 을 읽는다. 없으면 여기서 끝.','있으면 <code>.nickname</code> 까지 읽는다.','결과가 <code>undefined</code> 나 <code>null</code> 이면 <code>??</code> 가 <code>\'손님\'</code> 을 고른다.']}
    ],
    prereq:[
      {n:'속성 접근 <code>.</code>', ly:3, s:'known', note:'눈에 익음 · 3겹'},
      {n:'<code>undefined</code> 와 <code>null</code>', ly:0, s:'gap', note:'아직 안 찍음 · 0겹', card:'undef'},
      {n:'널 병합 <code>??</code>', ly:0, s:'none', note:'판이 없는 문법 · 내 코드 5곳'}
    ],
    uses:[
      {f:'src/features/cart/CartSheet.tsx', l:18, code:"const total = cart?.items.length ?? 0"},
      {f:'src/features/catalog/ProductCard.tsx', l:31, code:"<img src={product.image?.url} alt={product.name} />"},
      {f:'src/features/checkout/useOrder.ts', l:57, code:"const paid = order?.payment?.status === 'paid'"}
    ],
    payoff:'<code>res.user</code> 가 <code>undefined</code> 면 <code>.profile</code> 을 읽는 순간 터집니다. <code>?.</code> 는 바로 그 순간에 <b>「없으면 멈춤」</b>을 끼워 넣는 기호예요. 42행의 두 <code>?.</code> 는 <code>user</code> 와 <code>profile</code> 두 자리를 각각 지킵니다.'
  },

  /* 아래층 : 선행 개념 판 — 평소 덱엔 안 나오고 사다리 2단에서만 내려온다 */
  undef: {
    id:'undef', track:'t0', kind:'meaning', concept:'undefined 와 null', code:'undefined', ly:0, prereqOnly:true, mins:0.7,
    file:'src/features/auth/useLogin.ts', focus:14,
    lines:[
      {n:13, t:"export function useLogin() {"},
      {n:14, t:"  const [user, setUser] = useState<User | undefined>(undefined)", target:true},
      {n:15, t:"  const [error, setError] = useState<string | null>(null)"}
    ],
    q:'14행이 실행된 직후, <code>user</code> 에는 무엇이 들어 있을까요?',
    hint:'이 판은 1문제입니다. 약 40초. 마치면 원래 자리로 돌아갑니다.',
    options:[
      {t:'<code>undefined</code> — 「아직 아무 값도 안 넣었다」는 표시'},
      {t:'<code>null</code> — 「비어 있다」는 표시'},
      {t:'빈 객체 <code>{}</code>'},
      {t:'오류가 나며 멈춘다'}
    ],
    answer:0,
    why:[null,
      {t:'<code>null</code> 도 「없음」이지만 <b>사람이 일부러 넣는 없음</b>입니다. 14행은 <code>useState(undefined)</code> 로 <code>undefined</code> 를 넣었고, 15행이 <code>null</code> 을 넣는 쪽이에요. 둘 다 <code>?.</code> 와 <code>??</code> 는 「없음」으로 똑같이 취급합니다.',
       edge:{h:'가장 날카로운 자리 — 둘을 구분해야 하는 순간', code:["user === null        // undefined 면 false", "user == null         // undefined 도 true (둘 다 잡는다)"]}},
      {t:'빈 객체는 <b>값이 있는 것</b>입니다. <code>{}</code> 는 <code>?.</code> 도 멈추지 않고 <code>??</code> 도 채우지 않아요. 「없음」은 오직 <code>undefined</code> 와 <code>null</code> 둘뿐입니다.',
       edge:{h:'가장 날카로운 자리 — 비어 보여도 값', code:["({}) ?? '손님'    // {}  (없음이 아니다)", "'' ?? '손님'      // ''  (빈 문자열도 값)"]}},
      {t:'없는 값을 <b>만드는</b> 건 오류가 아닙니다. 없는 값 <b>안을 읽으려 할 때</b>(<code>user.profile</code>) 오류가 나요. 그게 위 판의 <code>?.</code> 가 막는 순간입니다.',
       edge:{h:'가장 날카로운 자리 — 터지는 건 한 칸 뒤', code:["const user = undefined   // 괜찮다", "user.profile             // TypeError: Cannot read properties of undefined"]}}
    ],
    ok:'<code>undefined</code> 는 「아직 값이 정해지지 않음」, <code>null</code> 은 「일부러 비워 둠」입니다. 둘 다 <b>안을 읽으려 하면</b>(<code>user.profile</code>) 터집니다.',
    rule:'없는 값은 <b>만들어도</b> 괜찮고, <b>안을 읽을 때</b> 터진다.',
    result:{label:'user', value:'undefined', note:'아직 로그인 전'},
    bridge:'여기서 한 번 더 — <b>위 판으로 이어지는 자리</b>: <code>user</code> 가 <code>undefined</code> 일 때 <code>user.profile</code> 은 터지고, <code>user?.profile</code> 은 <code>undefined</code> 로 멈춥니다.',
    uses:[
      {f:'src/features/cart/useCart.ts', l:12, code:"const [coupon, setCoupon] = useState<string | undefined>()"}
    ]
  }
};

/* ───────── T1 필사 : LoginForm · 2단계(뼈대만) ─────────
   show2 = 2단계에서 잉크로 남는 줄(0-based) : 주석 · 시그니처 · 빈 줄 · 블록 끝 */
var T1 = {
  id:'loginform', track:'t1', concept:'LoginForm 필사', code:'LoginForm', ly:3, stage:2, mins:9,
  file:'src/features/auth/LoginForm.tsx', fn:'LoginForm()',
  original:[
    "// 로그인 폼. 제출하면 useLogin 의 submit 을 부르고, 실패 메시지는 폼 아래에 보여준다",
    "export function LoginForm() {",
    "  const { submit, error, pending } = useLogin()",
    "  const [email, setEmail] = useState('')",
    "  const [password, setPassword] = useState('')",
    "",
    "  async function onSubmit(e: FormEvent) {",
    "    e.preventDefault()",
    "    await submit(email, password)",
    "  }",
    "",
    "  return (",
    "    <form onSubmit={onSubmit}>",
    "      <input value={email} onChange={(e) => setEmail(e.target.value)} />",
    "      <input type=\"password\" value={password} onChange={(e) => setPassword(e.target.value)} />",
    "      <button disabled={pending}>로그인</button>",
    "      {error && <p className=\"err\">{error}</p>}",
    "    </form>",
    "  )",
    "}"
  ],
  show2:[0,1,5,6,9,10,11,12,17,18,19],
  /* 데모용 「그럴듯한 답안」 — 동등(따옴표·이름 치환)과 어긋남(누락·맞바꿈)을 한 번씩 보여 준다 */
  sample:[
    "// 로그인 폼. 제출하면 useLogin 의 submit 을 부르고, 실패 메시지는 폼 아래에 보여준다",
    "export function LoginForm() {",
    "  const { submit, error, pending } = useLogin();",
    "  const [email, setEmail] = useState(\"\")",
    "  const [password, setPassword] = useState('')",
    "",
    "  async function onSubmit(ev: FormEvent) {",
    "    ev.preventDefault()",
    "    await submit(password, email)",
    "  }",
    "",
    "  return (",
    "    <form onSubmit={onSubmit}>",
    "      <input value={email} onChange={(e) => setEmail(e.target.value)} />",
    "      <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />",
    "      <button disabled={pending}>로그인</button>",
    "    </form>",
    "  )",
    "}"
  ],
  notes:{
    8:{tag:'이름 맞바꿈', t:'이름 <code>email</code> 과 <code>password</code> 를 맞바꾼 형태라 「변수명 치환」처럼 보이지만, <b>바꾼 이름이 원본에 이미 있으면</b> 치환으로 인정하지 않습니다. 서버는 첫 인자를 이메일로 읽으니 <b>뜻이 달라집니다</b>.'},
    16:{tag:'누락', t:'실패 메시지를 보여 주는 줄이 빠졌습니다. <code>error</code> 가 있어도 화면에 아무것도 안 나오니, 로그인이 왜 안 되는지 사용자가 알 수 없습니다.'},
    2:{tag:'동등', t:'세미콜론 하나 차이. 자동 판정이 <b>같은 뜻</b>으로 인정합니다.'}
  },
  why:{ line:7, q:'8행 <code>e.preventDefault()</code> 는 왜 필요할까요?', help:'한 줄이면 됩니다. 채점하지 않습니다. 다만 건너뛸 수는 없습니다 — 여기서 뇌가 안 켜지면 앞의 9분은 타자 연습이 됩니다.',
    choices:[
      {t:'브라우저가 폼을 제출하며 <b>페이지를 새로 고치는 기본 동작</b>을 막으려고', ok:true, fb:'맞습니다. 이게 없으면 <code>await submit(...)</code> 이 끝나기도 전에 페이지가 통째로 다시 열립니다.'},
      {t:'로그인 버튼을 두 번 누르지 못하게 하려고', ok:false, fb:'그건 16행의 <code>disabled={pending}</code> 이 합니다. <code>preventDefault</code> 는 브라우저의 기본 제출 동작을 막는 것뿐이에요.'},
      {t:'입력값을 비우려고', ok:false, fb:'입력값은 <code>setEmail(\'\')</code> 같은 상태 갱신으로 비웁니다. 이 줄은 이벤트의 기본 동작만 막아요.'}
    ]}
};

/* ───────── T2 구조 : cart/ 폴더 책임 배치 ─────────
   정답지 = 실제 커밋. core 는 점수 분모, sec 는 감점 없는 보너스, trap 은 흔한 오답과 그 이유 */
var T2 = {
  id:'cartresp', track:'t2', concept:'cart/ 폴더 책임', code:'cart/', ly:3, mins:3, review:true,
  q:'장바구니에서 상품 수량을 <code>＋ / −</code> 버튼으로 바꾸는 기능을 넣는다면, <b>어느 파일들을 고쳐야 할까요?</b>',
  hint:'지도에서 파일 상자를 클릭해 고릅니다. 정답 개수는 비공개입니다.',
  bands:[
    {l:'화면', s:'app/'},
    {l:'기능', s:'features/cart/'},
    {l:'동작 · 통신', s:'hooks · api'},
    {l:'공용 · 데이터', s:'lib · server'}
  ],
  files:[
    {p:'app/cart/page.tsx', r:0},
    {p:'features/cart/CartSheet.tsx', r:1},
    {p:'features/cart/CartItemRow.tsx', r:1},
    {p:'features/cart/QuantityStepper.tsx', r:1, isNew:true},
    {p:'features/cart/useCart.ts', r:2},
    {p:'features/cart/useCartQuantity.ts', r:2, isNew:true},
    {p:'features/cart/cartApi.ts', r:2},
    {p:'app/api/cart/route.ts', r:2},
    {p:'components/ui/Button.tsx', r:3},
    {p:'lib/format.ts', r:3},
    {p:'server/cartRepo.ts', r:3},
    {p:'server/schema.ts', r:3}
  ],
  edges:[
    ['app/cart/page.tsx','features/cart/CartSheet.tsx'],
    ['features/cart/CartSheet.tsx','features/cart/CartItemRow.tsx'],
    ['features/cart/CartSheet.tsx','features/cart/useCart.ts'],
    ['features/cart/CartItemRow.tsx','features/cart/QuantityStepper.tsx'],
    ['features/cart/CartItemRow.tsx','lib/format.ts'],
    ['features/cart/QuantityStepper.tsx','features/cart/useCartQuantity.ts'],
    ['features/cart/QuantityStepper.tsx','components/ui/Button.tsx'],
    ['features/cart/useCartQuantity.ts','features/cart/cartApi.ts'],
    ['features/cart/useCart.ts','features/cart/cartApi.ts'],
    ['features/cart/cartApi.ts','app/api/cart/route.ts'],
    ['app/api/cart/route.ts','server/cartRepo.ts'],
    ['server/cartRepo.ts','server/schema.ts']
  ],
  commit:{h:'a3f19c2', d:'2026-07-14', m:'feat(cart): 장바구니 수량 +/- 조절 기능 추가', n:'7 files changed, +181 −23'},
  core:{
    'features/cart/QuantityStepper.tsx':['+64 −0','새로 만든 파일입니다. ＋ / − 버튼 두 개와 숫자 하나. 화면 조각은 여기서 시작해요.'],
    'features/cart/useCartQuantity.ts':['+41 −0','새로 만든 훅입니다. 버튼을 누르면 서버에 알리고 결과를 돌려받는 동작은 화면이 아니라 여기 놓였어요.'],
    'features/cart/CartItemRow.tsx':['+9 −4','한 줄짜리 항목 안에 스테퍼를 끼워 넣느라 고쳐졌습니다.'],
    'features/cart/cartApi.ts':['+18 −1','서버에 「수량 바꿔 줘」라고 말하는 함수가 하나 늘었습니다.'],
    'app/api/cart/route.ts':['+27 −2','그 요청을 받는 서버 쪽 입구. 화면만 고쳐서는 서버가 모릅니다.'],
    'server/cartRepo.ts':['+14 −0','실제로 DB 에 수량을 쓰는 자리. 끝까지 내려와야 저장돼요.']
  },
  sec:{
    'server/schema.ts':['+4 −1','수량 필드 타입이 같이 손봐졌어요. 몰랐어도 감점 없습니다.']
  },
  trap:{
    'features/cart/CartSheet.tsx':'목록을 감싸기만 해서 실제로는 한 줄도 안 바뀌었습니다. 가장 흔한 오답이에요.',
    'app/cart/page.tsx':'페이지는 CartSheet 를 놓기만 합니다. 안쪽이 바뀌어도 페이지는 모릅니다.',
    'components/ui/Button.tsx':'공용 부품은 웬만하면 안 건드리는 쪽이 좋아요. 스테퍼가 이 버튼을 가져다 쓸 뿐입니다.',
    'lib/format.ts':'가격 표시 함수. 수량이 바뀌어도 표시 규칙은 그대로예요.',
    'features/cart/useCart.ts':'아깝습니다! 장바구니 상태는 여기 있지만, 이번엔 수량 전용 훅을 새로 만들었기 때문에 이 파일은 그대로 뒀어요.'
  },
  hints:[
    '이 기능은 4개 층 중 <b>3개 층</b>에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.',
    '<b>새로 만들어진 파일이 2개</b> 있습니다. 지도에 「새 판」 표시가 있어요.',
    '꼭 고쳐야 하는 파일은 <b>6개</b>입니다. (＋ 보너스 1개)'
  ]
};

/* ───────── 오늘의 인쇄 큐 : 칸 너비 = 분 ───────── */
var QUEUE = [
  {kind:'t0', card:'fnupdate',  mins:0.5, label:'함수형 업데이트',  sub:'복습', review:true},
  {kind:'t0', card:'mapupdate', mins:0.5, label:'배열 불변 갱신',   sub:'복습', review:true},
  {kind:'t0', card:'optchain',  mins:2,   label:'옵셔널 체이닝 ?.', sub:'새 판'},
  {kind:'t1', card:'loginform', mins:9,   label:'LoginForm 필사',   sub:'2번째 인쇄'},
  {kind:'t2', card:'cartresp',  mins:3,   label:'cart/ 폴더 책임',  sub:'복습', review:true}
];
