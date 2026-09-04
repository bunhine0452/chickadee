# 문제를 푸는 방식 — 다섯 단의 문항 체계

지금 문항은 **개념 한 장에 카드 한 장**이다. 새 체계는 **기능 하나에 다섯 단**이고 단마다
유형이 두셋 붙는다. 전제: `docs/04-grading-engines.md` · `docs/curriculum/feature-paths.md`.

---

## 1. 지금 것을 왜 내리나

| 유형 | 재는 것 | 정답지 출처 | 저작 부채 |
|---|---|---|---|
| T0 `point` 지목 | 토큰의 **자리**를 안다 | 사전 `point[]` + `Site.picks` | 개념당 문항 |
| T0 `blank` 빈칸 | 토큰을 **재인**한다 | 사전 `blank[].options`(오답 = `confusions`) | 문항 + 혼동 개념 |
| T0 `meaning` 의미 | 값·역할을 **예측**한다 | 사전 템플릿 + mustache 치환 | 개념당 문항 |
| T0 실행 추적 (D151) | 어느 줄이 **먼저** 도나 | `exec-facts` 의 파스 트리 | **0** |
| T1 `transcribe` 필사 | 코드를 **산출**한다(3단 페이딩) | 원본 블록 | 0 |
| T2 `placement` | 기능을 넣으려면 **어디를** 고치나 | 실제 커밋 diff | 0 |
| T2 `flow`·`radius` | 파일 사이 순서·영향 | import 그래프 | 0 |
| T2 `direction`·`entry`·`role` | 방향·문·폴더 역할 | 그래프 + 경로 패턴 | 0 |

부채 열이 갈림길이다. 0 인 유형은 정답이 **리포에서** 나오고 부채가 있는 셋은 사전에서
나온다. 실측(04 §1.4): ts `essential` 22개에 `meaning:` 22 · `point:` 19 · `blank:` **2**.

| 살릴 것 | 왜 |
|---|---|
| T1 페이딩 3단 + 스펙 카드 | 「빈 파일에서 다시」가 곧 3단계다. `mustHold` 출처 우선순위(사용자 → 사전 → AST, 04 §3.3)가 5단의 사양지 그대로다. 단위만 블록에서 기능 슬라이스로 올린다 |
| T1 동등 판정 사다리 | 실행 없이 「같은 뜻인가」를 재는 것이 이것뿐이다 (§3) |
| 왜 게이트 | 채점 없이 자기 말만 받는다. 설명할 수 있는지를 재는 장치가 이것뿐이다 |
| 이의 루프 | 답이 하나인 T0 보다 답이 여럿인 4·5단에서 더 필요하다 |
| 실행 추적 · T2 책임 배치 | 2단의 씨앗이 이미 돌고, 책임 배치는 커밋을 정답지로 쓰는 유일한 문제다 |
| T2 흐름 추적 | 재료를 import 그래프에서 **기능 경로**(`entryUnits` + `http` 간선 + 매퍼 간선)로 갈아탄다 |

| 버릴 것 | 왜 |
|---|---|
| T0 의미형 | 04 §1.3 이 「값을 계산하지 않는다」를 못 박아 모든 값이 사전 치환이다. 3단이 물을 것은 「`deleted_date IS NULL` 을 지우면 누가 로그인되나」인데 **그건 사전에 못 적는다** — 리포마다 다르다 |
| T0 빈칸형 | 1단에만 남긴다. 오답이 `confusions` 개념의 `token` 이라 혼동 개념이 저작돼야 하는데 22개 중 2개고 자바·MyBatis 사전은 0개다 |
| 개념 = 카드 = 스케줄 단위 | 유형이 아니라 **배치**를 버린다. 짚기 자체는 1단에서 값이 있다 |
| T2 의존성 방향 | 기능 경로가 이미 순서를 주므로 2단 `hop` 에 흡수된다 |
| T2 폴더 역할 | 04 §8.5 가 스스로 「가장 큰 약점은 정답이 경로 패턴 휴리스틱」이라 적었다. 단위가 폴더가 아니면 물을 자리가 없다 |
| 1·2단의 필사 | 못 읽는 코드를 필사시키면 타자 연습이 된다(04 §3.1). 필사는 5단에만 |

**FSRS·잉크 겹은 1·2단에만 남긴다.** 1·2단은 30초짜리 낱장이라 간격 반복의 단위가 맞고, 3~5단은
한 판이 5~15분이라 「오늘 20장」의 단위가 아니다. 3~5단의 복습은 같은 기능을 한 단 위에서 다시
여는 챕터 재방문으로 한다. 예산은 `card_state.est_min_ema` 가 이미 실측을 쌓는다.

---

## 2. 다섯 단 × 문제 유형

| 단·유형 | 무엇을 묻나 | 재료 | 채점 | 오답이 가르치는 것 |
|---|---|---|---|---|
| **1** `point` | 「…하는 것」은 어느 토큰인가 | `concept_site.picks` + 사전 `point[]` | 인덱스 일치, 셔플 없음 | 「그건 검사만 하고 변환은 안 한다」 |
| **1** `twin` | 같은 일을 하는 줄이 어디 또 있나 | 같은 `conceptId` 의 다른 `Site` 상위 3(04 §2.4 3단) + 함정 1 | 4지 | 「어휘는 파일을 가로지른다」 |
| **1** `blank` | 이 자리에 들어갈 토큰은 | `Site.hole` + 사전 `blank[]` | 셔플 후 인덱스 | `confusions` 진단 |
| **2** `exec` | 부르면 가장 먼저 도는 줄은 | `exec-facts` 의 `first`·`unconditional`·`conditional`·`unreachable` | 줄 단일 선택 | 「정의는 실행이 아니다」·「돌긴 하지만 첫째가 아니다」 |
| **2** `hop` | 버튼을 누르면 어느 **파일 어느 줄**이 순서대로 도나 | `entryUnits` 폐포 + `import_edge.kind='http'` + 매퍼 간선 | `pct = 맞은 인접 쌍/(len−1)` | 함정 형제 — 같은 컨트롤러의 다른 라우트 |
| **2** `origin` | 이 값은 어디서 **처음** 정해지나 | 경로 안의 같은 이름 문자열(매퍼 `column` ↔ 엔티티 ↔ DTO) | 파일·줄 단일 선택 | 「여기는 읽는 자리다」·「여기는 다른 경로다」 |
| **2** `caller` | 이 함수를 부르는 자리는 | 호출 이름 캡처 + import 역방향 | 단일 선택 | 「쓰는 쪽과 쓰이는 쪽」 |
| **3** `cut` | 이 줄을 지우면 무엇이 달라지나 | 경로 위 **가드 모양** 줄 + 가드 카탈로그 | 4지 | 「안 달라진다」를 고르면 그 줄이 막던 입력을 보여 준다 |
| **3** `reorder` | 두 줄을 뒤집으면 | 블록 안 선언–사용 의존(AST) + 쓰기 뒤 읽기 | 4지(「안 깨진다」 포함) | 「값이 아직 없다」와 「값이 옛것이다」 |
| **3** `contract` | 응답에서 이 필드를 빼면 프론트 **어디가 먼저** 깨지나 | HTTP 간선 양끝의 문자열 키 | 파일 선택 + 이유 4지 | 「여기는 JSON 이라 컴파일러가 안 잡는다」 |
| **4** `patch-line` | 목표대로 이 줄을 고쳐라 | 실제 `fix:` 커밋 hunk 의 `+` 줄 | T1 사다리, 편집 범위 **한 줄** | 사다리 사유 코드가 곧 진단 |
| **4** `patch-place` | 이 줄은 **어디에** 들어가나 | 원본 순서 + AST 스코프 | 위치 + 스코프 검사, **실행 없이 100%** | 「선언보다 앞에 두면 그 이름이 아직 없다」 |
| **4** `rollback` | 이 커밋 **이전** 코드는 어땠나 | 같은 hunk 의 `−` 줄 | T1 사다리 | 고친 결과가 아니라 고치기 전을 본다 |
| **5** `reimpl-spec` | 시그니처와 지킬 것만 보고 본문을 써라 | T1 스펙 카드 `mustHold` | 사다리 + `advanceThreshold` | `swap` 하나면 진급 금지 — 인자 순서는 뜻이다 |
| **5** `reimpl-layer` | 다른 층은 다 있다, 이 층을 써라 | 경로에서 한 층만 비움. 나머지 층이 사양이다 | 사다리 + **연결 검사**(호출 이름·SQL id·파라미터 대조) | 「층 사이의 계약은 이름이다」 |
| **5** `handoff` | 진짜 도는지 확인해야 할 때 | 내 답 + 원본 ±4줄 + 물음 → 프롬프트 | **채점 없음.** `ladder_event(rung=4,'prompt_built'\|'copied')` | — |

`twin` 은 사전 문항을 안 써서 부채 0 으로 유형을 하나 더한다. `hop` 은 노드 상한 6(04 §8.3)을
두고 경로를 내려가는 반쪽·올라오는 반쪽 **두 장**으로 자른다. 자르는 자리는 매퍼다 — 경로에서
언어가 바뀌는 유일한 지점이다.

**가드 카탈로그가 3단의 값을 정한다.** 사전이 아니라 생성기 카탈로그에 둔다 — 실행 추적이
`WrongBecause` 넷을 i18n 카탈로그에 둔 자리와 같다. 「soft delete 가드를 지우면 지운 행이
살아난다」는 개념마다 다르지 않고 언어에도 안 매인다. 초기 항목 넷 — SQL `AND <col> IS NULL` +
같은 매퍼에 `SET <col> = NOW()` 가 있음 · `if (!검사) throw` · `if (x != null && !x.isEmpty())` ·
`orElseThrow`.

---

## 3. 채점이 어려운 자리 — 4·5단

| 층 | 파일 | 잡는 것 | 못 잡는 것 |
|---|---|---|---|
| 정렬 | `t1-align.ts` | 같은 줄 → 창 ±2 → NW 폴백 → 같은 자리 강제 짝(D91) | 3줄 넘게 밀린 뒤 닮음 0.5 미만 |
| 정규식 11단 | `t1-line.ts` `compareLine` | 공백·주석·빈 줄·들여쓰기·종결자·따옴표·토큰 열 | 괄호·블록 한 겹. 골든 #26 `return x` ↔ `return (x)` 가 여기선 `differ` |
| 전역 치환 | `t1-rename.ts` | 일관된 이름 바꿈. ③ `b ∉ ORIG` 가 스왑을, ④ `a ∈ ANS` 가 한 줄만 바꾼 답안을 막는다 | 스코프가 다른 같은 이름(보수적으로 잡는다) |
| AST 승격 | `t1-ast.ts` | 문장 단위 비교, α-변환, 괄호·블록·화살표 괄호·줄 나눔. `ERROR` 20% 게이트 | **문장 순서**, 제어 구조 치환, 헬퍼 추출 |

사다리는 **참조 답 하나와의 동등**을 판정한다. 답이 여럿인 문제에 얹으면 실패가 한쪽으로만 난다.
**거짓 어긋남은 난다** — 04 §5 의 「절대 동등이 될 수 없는 목록」(연산자 변경·인자 순서·호출
유무·템플릿↔연결·`await`·`?.` 유무·리터럴 값·이름 맞바꿈)이 코드로 고정돼 있기 때문이다.
**거짓 동등은 안 난다** — ③④ 검증과 그 목록이 보수적으로 기운다. 4·5단에서 이 방향이 맞다.
거짓 어긋남은 완화한다: 4단은 편집 범위를 좁혀(한 줄 / 위치 하나) 답의 폭을 줄이고, 5단은 문턱을
그대로 두되 이의 루프를 기본으로 켠다.

| 유형 | 정규식 | AST 승격 | 구조 제약 | 이의 |
|---|---|---|---|---|
| `patch-place` | — | 스코프만 | ○ **기계 판정 100%** | 불필요 |
| `patch-line` · `rollback` | 거터 | **필수** | — | ○ |
| `reimpl-spec` | 거터 | **필수** | — | ○ 기본 켬 |
| `reimpl-layer` | 거터 | 필수 | ○ 연결 검사 | ○ 기본 켬 |

**구조 제약 검사가 새로 드는 것**이고 실행 없이 도는 유일한 「여러 답 허용」 장치다. 넷을
문자열·AST 대조로만 본다 — ⓐ 선언이 사용보다 앞인가 ⓑ 호출 이름이 이웃 층의 선언과 같은가
ⓒ SQL `id` 가 DAO 메서드 이름과 같은가 ⓓ `#{param}` 이 `@Param` 과 같은가.

**AST 승격은 4·5단에서 선택이 아니다.** 정규식만 두면 골든 #26 같은 자리가 「틀렸습니다」가
되고, 04 위험표대로 한 번 틀린 판정이 그 뒤의 맞는 판정까지 못 믿게 만든다. **문법이 없는
언어에서는 4·5단을 안 낸다.** 딸려 오는 둘: 규칙이 바뀌면 `patternKey` 가 전부 바뀌므로
`T1_ENGINE_VERSION` 을 올려야 하고(D143 선례), `appeal.track` 의 CHECK `('t1','t2')` 도 넓혀야 한다.

---

## 4. 실행이 꼭 필요한 자리

`packages/grading/src/t3-adapter.ts` 에 있는 것은 `RunnerAdapter` 인터페이스와
`export const runners: RunnerAdapter[] = []` 뿐이고 `t3_run` 은 언제나 `NOT_IMPLEMENTED` 다.
주석이 이유를 적어 두었다 — 「T3 만이 프로세스 실행을 요구하고, 그것은 Tauri `shell` 스코프와
샌드박스 결정을 끌고 온다」.

| 실행이 답할 것 | 대안 | 남는 구멍 |
|---|---|---|
| 값이 실제로 무엇인가 | 가드 카탈로그 + 실행 추적의 파스 트리 사실 | 리포 고유 값은 못 낸다. 그래서 3단이 「값」이 아니라 **「무엇이 달라지나」**를 묻는다 |
| 테스트가 통과하나 | **커밋 원장** — `fix:` 커밋 diff 가 「이렇게 고치면 됐다」의 실측 정답지 | 커밋이 적은 리포는 4단이 얇아진다(04 §8.4 와 같은 조건) |
| 런타임 오류가 나나 | 구조 제약 검사 ⓐ~ⓓ + 가드 카탈로그 | 실제 예외 메시지는 못 본다 |
| HTTP 왕복이 200 인가 | `http` 간선이 「이어져 있는가」까지 | 「도는가」는 아니다 |
| 위 전부 | **`handoff`** — 프롬프트를 사람이 들고 나간다 | 자기 보고라 채점 불가, 기록만 |
| 「내가 이해했나」 | **왜 게이트** — 트림 후 10자 이상, 원본과 Dice < 0.6 | 채점하지 않는다. 그것이 목적이다 |

**선**: 유형 16개 중 실행이 필요한 것은 `handoff` 하나고 나머지 15개는 파스 트리·그래프·커밋
원장·문자열 대조만 쓴다. **러너 없이 다섯 단이 전부 선다.** 러너를 여는 것은 인프라 결정이고,
들어오면 5단에 `test` 유형이 하나 붙는다.

---

## 5. 마이그레이션

PROGRAM.md 가 인용한 열 값은 `0001_init.sql` 의 것이고 **`0005_card_kind_entry_role.sql` 이 이미
넓혔다** — 지금은 열둘이다.

```
('meaning','blank','point','transcribe','placement','radius','flow','direction','entry','role','repair','reimpl')
```

`repair`·`reimpl` 은 처음부터 예약돼 있고 카드가 한 장도 없다. 4·5단이 그 자리에 앉는다.

| 새 유형 | `card.kind` | |
|---|---|---|
| 1단 `point` · 2단 `exec` | `point` | `t0-exec.ts:212` 가 이미 `point` 로 굽는다 |
| 1단 `blank` · 2단 `caller` | `blank` · `radius` | 그대로 |
| 2단 `hop` | `flow` | `payload` 만 파일 → **(파일, 줄)** 쌍으로 |
| 4단 셋 · 5단 셋 | `repair` · `reimpl` | **예약분 사용** |
| `twin`·`origin`·`cut`·`reorder`·`contract` | — | **새로 다섯을 든다** |

`meaning`·`direction`·`entry`·`role` 은 카드를 안 굽지만 **CHECK 에서 빼지 않는다** — 빼면 이미
구운 행을 지워야 하고 은퇴(`retired_at`)로 충분하다. `transcribe` 는 5단 재료로 남는다.

**DDL 의 길은 D146 이 이미 냈다.** SQLite 는 CHECK 를 `ALTER` 하지 못해 표를 다시 만들어야 하고,
그러려면 **외래키를 꺼야 한다** — 켠 채 `DROP TABLE card` 를 하면 `card` 를 참조하는 아홉 표의
행이 `ON DELETE CASCADE` 로 함께 사라진다. `PRAGMA foreign_keys` 는 트랜잭션 안에서 무시되므로
러너가 루프 밖에서 끄고 끝나고 `foreign_key_check` 로 확인한다. `0005` 를 복사하면 되고 비용은
`card` 전량 복사 한 번이다. 같은 이행에서 **`card.stage_no INTEGER CHECK (BETWEEN 1 AND 5)`**
(`track` 은 큐·통계가 보므로 안 건드리고 `level` 은 「사용처 복잡도 밴드」라 뜻이 다르다)와
**`appeal.track` CHECK 확장**을 같이 한다.

**이름이 겹치는 자리**: `card_state.stage`(1~3)는 T1 페이딩 겹, `card.stage_no`(1~5)는 코스의
단이다. `reimpl-spec` 카드는 `stage_no = 5` 이면서 `stage = 3` 이다.

---

## 6. 표본으로 검증 — MonggleMonggle 로그인

전부 그 파일들의 실제 줄이다.

| 유형 | 문항 |
|---|---|
| 1 `point` | `AuthController.java:57` `login(@Valid @RequestBody LoginRequest request)` — 「JSON 본문을 객체로 바꾸는 것은?」 정답 `@RequestBody`, 오답 `@Valid`(검사만 한다)·`ResponseEntity`(나가는 쪽) |
| 1 `twin` | `AuthService.java:78~79` `userDao.findByLoginId(...).orElseThrow(...)` 와 같은 일을 하는 줄 — 정답 `:120`(`:138`·`:164` 에도 같은 관용구), 오답 `:82` `passwordEncoder.matches(...)` 는 꺼내는 게 아니라 비교한다 |
| 1 `blank` | `JwtUtil.java:38` `.signWith(▢, SignatureAlgorithm.HS256)` — 정답 `secretKey`(`:17` 선언), 오답 `secret`(`:21` 생성자 인자, 아직 문자열이다) |
| 2 `exec` | 「`AuthService.login`(`:76`)에서 먼저 도는 줄은?」 정답 `:78`, 오답 `:76`(정의는 실행이 아니다)·`:82`·`:87`. **한계** — `t0-exec.ts` 의 `slice(0,3)` 이 삽입 순서로 잘라, 조건 안 줄 `:83` `throw new UnauthorizedException` 은 후보 끝이라 「돌 수도 있다」 진단이 이 블록에선 안 나온다 |
| 2 `hop` | 내려가는 반쪽 — `authService.js:21` `api.post("/auth/login", credentials)` → `AuthController.java:32` `@RequestMapping("/api/auth")` + `:56` `@PostMapping("/login")` → `:58` → `AuthService.java:78` → `UserMapper.xml:31` `<select id="findByLoginId">`. 함정 `AuthController.java:64` `@PostMapping("/logout")` · `UserMapper.xml:39` `findById` |
| 2 `origin` | 「`authService.js:36` `role: response.data.role` 은 어디서 정해지나?」 정답 `AuthService.java:94` `String role = user.getRole() != null ? user.getRole() : "USER";`. 오답 `UserMapper.xml:15` `<result property="role" column="role"/>`(읽는 자리)·`JwtUtil.java:35` `.claim("role", role)`(또 싣는 자리)·`AuthService.java:54` `.role("USER")`(회원가입 경로다) |
| 2 `caller` | 「`JwtUtil.generateToken`(`:28`)을 부르는 자리는?」 정답 `AuthService.java:95` — 리포 전체에서 여기 하나뿐이다 |
| 3 `cut` | 「`UserMapper.xml:35` `AND deleted_date IS NULL` 을 지우면?」 정답 「탈퇴한 사용자도 로그인된다」. 근거는 같은 파일 `:88~93` `<update id="deleteUser">` 가 `SET deleted_date = NOW()` 하는 soft delete 라는 것 — 카탈로그 첫 항목이 이 짝을 본다 |
| 3 `reorder` | 「`AuthService.java:87` `resetDailyCoinIfNeeded(...)` 와 `:90` `user = userDao.findById(...)` 를 뒤집으면?」 정답 「응답의 `coin`(`:106`)이 리셋 전 값이 된다」. 코드가 답을 적어 두었다 — `:89` 주석 「코인 리셋 후 다시 조회하여 최신 코인 값 가져오기」 |
| 3 `contract` | 「`LoginResponse` 에서 `token` 을 빼면?」 정답 `authService.js:24` `if (response.data.token)` 이 거짓이 되어 `:25` 저장이 안 돌고 `:87` `isLoggedIn()` 이 늘 `false`. 오답 `:39`(`currentUser` 는 그대로 저장된다) |
| 4 `patch-line` | 커밋 `dc37666` 「fix: 사용자 정보 조회 시 role 값 추가」 2파일 `+2`. 자리 `AuthService.java:132`, 참조 답 = `+` 줄 `.role(user.getRole() != null ? user.getRole() : "USER")`. **이 커밋은 T2 책임 배치에 못 든다** — 소스 파일이 둘이라 3~12 필터에서 탈락한다 |
| 4 `patch-place` | `:87` `resetDailyCoinIfNeeded(user.getUserId());` 를 빼 놓고 「어디에 들어가나」. 정답 `:84` 뒤. 오답 `:78` 앞(`user` 가 아직 없다 — **스코프 검사가 기계적으로 잡는다**)·`:90` 뒤(재조회가 무의미해진다)·`:95` 뒤(응답 `coin` 이 옛 값) |
| 4 `rollback` | 커밋 `22c85de` 「fix: 마이페이지 코인 리셋 트랜잭션 분리로 readOnly 오류 해결」 3파일 `+23/−13`. 지금의 `:112~116`(`REQUIRES_NEW` 로 떼어 낸 메서드)을 주고 이전 모양을 묻는다. 참조 답 = `−` 줄, `getUserInfo` 안의 `int reset = userDao.resetDailyCoin(...)` + `if (reset > 0) {…}`. 파일이 셋이라 책임 배치에도 선다 |
| 5 `reimpl-spec` | `JwtUtil.generateToken`(`:28~40`, 13줄 — T1 블록 하한 12줄에 걸린다). `mustHold` 넷: subject 에 userId 를 문자열로 · loginId 와 role 을 claim 으로 · 만료는 `now + expiration` · `secretKey` 로 HS256 서명. `.claim("loginId", loginId)` 와 `.claim("role", role)` 을 뒤집으면 문자열 리터럴이 어긋나 `TOKEN_MISMATCH` 로 잡힌다 |
| 5 `reimpl-layer` | `UserMapper.xml:31~36` `findByLoginId` 를 비운다. 사양은 `UserDao.java:17` `Optional<User> findByLoginId(@Param("loginId") String loginId)` + 같은 파일 `:7~22` `UserResultMap` + 호출부 `AuthService.java:78`. 연결 검사: `id` = DAO 메서드 이름 · `#{loginId}` = `@Param("loginId")`. `AND deleted_date IS NULL` 을 안 쓴 답은 `missing` 이 되고 그 줄이 3단 `cut` 이 물었던 줄이다 |
| 5 `handoff` | 「내가 쓴 `generateToken` 이 `JwtUtil.validateToken`(`:61~68`)을 통과하나」 — 실행이 필요하다. 프롬프트에 초점 ±4줄 + 내 답 + 이 물음. `ladder_event(rung=4, action='copied')` 만 남는다 |
