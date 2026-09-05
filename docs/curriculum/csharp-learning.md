# C# 학습법 — `csharp.md` §11

`csharp.md` 가 680줄이라 이 절만 파일을 뺐다(`java.md` → `java-learning.md` 와 같은 처리).
**정본은 `csharp.md`** 이고 §1~§10 을 고치지 않았다. 변경 제안은 §11.6 의 표에만 있다.

**자바를 먼저 읽는다.** 두 언어는 기계가 거의 같다 — 관리되는 힙 · 참조와 값 · 가상 머신 ·
32비트 `int` · 정수 나눗셈 버림 · 조건 자리에 `bool` 만. 그래서 언어를 안 가리는 부분은
[`java-learning.md`](./java-learning.md) 가 이미 썼고(기계 한 문장의 근거 · objects-first 논쟁 ·
CS2023 SDF 의 주제 순서 · 판별력 검사), **이 문서는 갈리는 자리만** 쓴다.
언어 무관 근거는 [`docs/program/pedagogy.md`](../program/pedagogy.md) 다.

---

## §11 학습법 — 이 언어를 이해한다는 것

### §11.1 이 언어의 기계 — 한 문장과 그림 하나

> **이름이 값 자체를 담는지 자리를 담는지를 이름이 아니라 타입 선언이 정한다 —
> `struct` 면 값 전체가, `class` 면 화살표만 복사된다.**

자바의 한 문장(「스택의 이름은 값 아니면 자리를 담고, `new` 로 만든 것은 힙에만 산다」)과
갈리는 곳이 **한 낱말**이다. 자바는 그 갈래가 **고정**이다 — 원시 8종은 값, 나머지는 전부 자리이고
사용자가 새 값 타입을 못 만든다(`java.md` §7 이 `common/value-vs-reference` 를 「자바에는 전이가
아예 안 붙는다」로 적은 이유다). C# 은 그 갈래를 **사용자가 선언한다.**

`csharp.md` §0.4 의 실측이 그 한 문장의 증거다 — 같은 `=` 뒤에 원본을 보면 struct 는 **1**,
class 는 **9** 다.

#### §9 오개념 열둘 중 몇을 설명하나

| §9 # | 무엇을 믿나 | 이 문장이 설명하나 |
|---|---|---|
| 5 | `==` 는 언제나 내용을 견준다 | ○ |
| 6 | 객체를 넘기면 복사된다(또는 안 된다) | ○ |
| 7 | `List` 를 넘기면 원본이 안 바뀐다 | ○ |
| 12 | 제네릭은 Java 처럼 지워진다 | ○ (실행 시각에 타입이 남는다 = 값이 어디 사는가의 연장) |
| 1 · 4 | `var` 가 동적이다 · `string?` 가 `null` 을 막는다 | ✕ — `cs/compile-and-run` |
| 2 · 3 | `5 / 2` 가 2.5 · 조건 자리에 아무 값 | ✕ — 평가 트리 |
| 8 | LINQ 한 줄이 그 자리에서 돈다 | ✕ — `cs/eager-vs-lazy` |
| 9 · 10 | `async` 가 빨라진다 · `.Result` 로 꺼내면 된다 | ✕ — `cs/concurrency-model` |
| 11 | `Dispose` 가 메모리를 반환한다 | ✕ — `cs/gc-and-lifetime` |

**열둘 중 넷이다.** 자바는 열셋 중 아홉이었다. 갈리는 이유가 목록의 모양에 있다 —
C# §9 의 뒤쪽 다섯(⑧~⑫)은 **라이브러리와 런타임**의 것이고 문법 아래의 메모리 기계가 아니다.
그리고 그 다섯은 **실측이 아니라 명세·커뮤니티 문헌에서 온 것**이다(`csharp.md` §9 이 그렇게
적었고 §11.4 가 재확인한다). 그러므로 「C# 은 기계 하나로 덜 덮인다」는 **언어의 성질일 수도,
목록의 출처가 다른 탓일 수도** 있다 — 안 쟀다.

**그림.** 메모리 줄(명세만, 순 1) · 스택 프레임(명세만, 순 3). `diagrams.md` §3 의 메모리 줄
언어 열이 `C·C++·Rust·Go` 라 **C# 도 자바처럼 빠져 있다.** 그런데 `csharp.md` §0.1 이 이미
0-3·0-7 에 메모리 줄을, 0-7 에 스택 프레임을 걸었다(「struct 를 메서드에 넘기면 프레임에 복사본이
하나 더 선다」). 자바와 **같은 신청**이고 같은 한 줄이면 된다(§11.6 ①).

`cs/` 간선은 43장 안에 있다 — `value-vs-reference` · `stack-and-heap` · `identity-vs-equality`.
**새로 신청할 `cs/` 는 없다.** `csharp.md` §0.1 이 이미 굵게 적어 둔 셋
(`operator-precedence` · `type-conversion` · `truthiness`)이 README §9 「없는 것」에 올라 있고
이 문서는 거기에 더하지 않는다.

---

### §11.2 최고의 교재·코스가 수렴한 순서

objects-first 논쟁의 근거와 CS2023 SDF 의 주제 순서는 [`java-learning.md`](./java-learning.md)
§12.2 에 있다. **논쟁 자체는 자바에서 벌어졌고 C# 에는 대응 문헌이 없다** — 검색으로 C# 을 대상으로
한 objects-first/later 비교 연구를 찾지 못했다.

| 코스·교재 | 값·식 | 객체 | 갈래 |
|---|---|---|---|
| **Microsoft Learn — Get started with C#** (Foundational C# 인증의 내용, 35시간) | Part 1 모듈 2 「literal 과 variable 값으로 데이터를 담고 꺼내기」 · 모듈 4 「숫자에 기본 연산」 | **없다** | **objects-absent** |
| Head First C# 5e (2023) | — | 앞쪽 | objects-first (차례 원문 **못 열었다**) |
| C# in Depth 4e (Skeet) | — | — | **순서 근거가 아니다** — C# **버전별** 편성이고 중급자 대상 |
| Exercism C# 트랙 | `basics`·`numbers`·`strings`·`floating-point-numbers` 가 깊이 0~3 | `classes` 도 깊이 0~3 | 간선을 안 가져온다(D148 ③) |

**Microsoft Learn 이 이 표의 발견이다.** 「Get started with C#」의 여섯 부 제목이 이렇다 —
① Write your first code using C# ② Create and run simple C# console applications ③ Add logic to
C# console applications ④ Work with variable data in C# console applications ⑤ Create methods in
C# console applications ⑥ Debug C# console applications. **여섯 어디에도 클래스가 없다.**
Microsoft 자신의 입문 경로가 objects-late 를 넘어 **objects-absent** 이고, 자유 함수가 없는 언어에서
그렇게 짰다(`csharp.md` §2 가 「자유 함수가 없어 문의 바닥이 셋뿐」이라고 적은 것과 같은 사실을
반대편에서 본 것이다 — 클래스 껍데기는 **보여 주되 안 가르친다**).

우리 배치(`csharp.md` §0.5: 0부 8 · 1부 3 · 2부 24 · 3부 0)와 대조하면 **같은 방향인데 우리가
0부에서 넷을 더 넣는다.**

| 우리 0부의 장 | MS Learn 여섯 부에 있나 | 우리가 넣은 근거 |
|---|---|---|
| 0-1 `integer-literal` — `checked`/`unchecked` | **없다** | 실측 `int.MaxValue + 1` = **−2147483648**(기본). 조용히 감기는 것을 안 가르치면 못 배운다 |
| 0-2 `float-literal` — `decimal` | 부분(숫자 모듈) | 실측 `0.1 + 0.2 == 0.3` **False** / `0.1m + 0.2m == 0.3m` **True** |
| 0-6 `type-conversion` — 캐스트가 조용히 값을 바꾼다 | 부분(4부 variable data) | 실측 `unchecked((int)3000000000L)` = **−1294967296** |
| 0-7 `assignment` — struct 대 class 복사 | **없다** | 실측 struct 1 / class 9 |
| 0-8 `equality` — `==` 가 정적 타입으로 갈린다 | **없다** | 실측 `string ==` True / `object ==` **False** (같은 값) |

**다섯 중 셋이 MS Learn 에 아예 없고, 셋 다 「명세를 안 읽으면 조용히 틀리는」 자리다.**
이것이 우리 0부가 입문 경로 하나를 베끼지 않는 이유다 — 그리고 그 근거가 취향이 아니라
`csharp.md` §0.4 의 실측 스무 줄이다.

**부 배치를 안 바꾼다.** MS Learn 과 우리는 클래스를 뒤로 미루는 데서 이미 같고,
갈리는 다섯은 실측이 근거다.

---

### §11.3 이 언어에 특유한 연습 형태

`pedagogy.md` §4 의 세 시험(T1 이식 · T2 조항 · T3 사전).

| 후보 연습 | T1 | T2 | T3 | 판정 |
|---|---|---|---|---|
| `struct` 복사 예측 | ✕ | ○ | ○ `value-vs-reference`(신규) | **탈락 — 「값 타입이 있는 언어군」**(csharp·swift·go·rust) |
| `checked` 넘침 | 부분 | ○ | ✕ `number-literal` | 부분 |
| ↳ 좁힘: **넘칠 때 무엇이 일어날지를 `checked` 블록과 컴파일러 스위치가 정한다** | ○ | ○ `csharp.md` §0.4 실측 두 줄(unchecked −2147483648 / checked `OverflowException`) · `CheckForOverflowUnderflow` 빌드 속성 | ○ | **통과** |
| **`==` 가 변수의 정적 타입에 따라 다른 질문을 한다** | ○ | ○ | ✕ `common/comparison` | **통과** |
| LINQ 지연 실행 순서 | ✕ | ○ | ✕ `lazy-sequence`(신규) | **탈락 — 일반론** |
| ↳ 좁힘: 「두 번 훑으면 두 번 돈다」 | ✕ | ○ | ✕ | **탈락** — 파이썬 제너레이터는 **소진된다.** 답이 뒤집힐 뿐 물음은 선다 |
| `async`/`await` 순서 적기 | ✕ | 부분 | ✕ | **탈락 — 일반론** |
| ↳ 좁힘: `.Result` 교착 | 부분 | ○ | — | **탈락 — 언어가 아니라 호스트.** `csharp.md` §9 ⑩ 이 「ASP.NET Core 에는 동기화 컨텍스트가 없어 안 터진다」고 적었다 — 같은 코드가 호스트에 따라 다르면 언어 의미론이 아니다 |
| 제네릭이 reified 다 | ✕ | ○ | ✕ `generics` | **탈락** — 자바와 답이 반대일 뿐 물음은 선다 |

**C# 의 T1 통과는 둘이다.** 자바가 넷을 통과한 것과 대조된다.

**`checked` 를 좁힌 이유.** 「넘칠 때 무엇을 할지 고른다」만으로는 탈락한다 — Rust 에 
`wrapping_add`/`checked_add` 가, Swift 에 `&+` 가 있다. 그러나 그것들은 **연산자를 바꾸는 것**이다.
C# 만이 **식의 범위를 블록으로 지정**하고(`checked { … }`) **컴파일러 스위치가 프로젝트 전체의
기본값을 뒤집는다.** 그래서 C# 에서는 **같은 코드가 무엇을 하는지 그 줄만 봐서는 모른다** — 다른
아홉에는 그 물음이 없다. 이것이 `csharp.md` §0.2 가 「예측이 틀리는 순간이 곧 `checked` 라는 낱말이
왜 있나의 답」이라고 적은 자리의 판정이다.

**`==` 가 통과하는 이유가 더 깨끗하다.** 실측 — 내용이 같은 두 문자열이 `string ==` 로는 True 이고
변수를 `object` 로 선언하면 **False** 다. 코드는 한 글자도 안 바뀌고 **선언한 타입만 바뀐다.**
자바는 둘 다 참조 비교라 답이 하나이고(`String` 인턴이 우연히 맞힐 뿐), 파이썬·JS 는 정적 타입이
없어 **물음 자체가 성립하지 않는다.** T3 만 못 채우는데(`common/comparison` 을 쓴다) 그것은
`csharp.md` §6 이 이미 「`universal` 은 공유하되 오답 진단에 이 차이를 박아야 한다」로 처리했다.

#### 표현 가능한가

`pedagogy.md` §3.2 의 새 형식 둘(`order` Parsons · `trace-table` 시간 × 변수)을 쓴다.

| 통과한 연습 | 형식 | 단 | 그림 |
|---|---|---|---|
| `checked` 넘침 | `value` — **판정란이 예측과 실제를 나란히 편다** | 0부 (다섯 단 밖) | 비트 배열 |
| `==` 의 정적 타입 의존 | **`trace-table`** (열: `s1 == s2` · `(object)s1 == (object)s2` · `s1.Equals(s2)`) | 0부 | 값 상자 |
| struct 대 class 복사 (탈락했지만 0부 0-7 에 선다) | **`trace-table`** (행: 대입 전 · 대입 · 필드 변경 후 / 열: `a.X` · `b.X`) | 0부 | 메모리 줄 · 스택 프레임 |

**안 쓰는 형식 셋과 그 이유**(README §12 규약 6) — `step` 은 0부 0-5·0-7 이 쓰고 여기서는 안 쓴다 ·
`build` 는 러너가 없다(C# 어댑터가 `t3-adapter.ts` 에 없고 파서도 없다 — `csharp.md` §0.7) ·
`order`(Parsons)는 C# 특유가 아니라서 안 쓴다. 통과한 둘은 순서 문제가 아니라 값 문제다.

**`csharp.md` §0.2 의 형식 표가 낡았다.** 거기 여섯 형식(`value`·`step`·`bits`·`table`·`build`·
`predict`)을 쓰는데, `fundamentals.md` §2 가 **`bits` 와 `predict` 를 형식에서 내렸다** —
`bits` 는 `table` 의 한 배치로, `predict` 는 `value` 의 **판정란**으로. C# 은 여섯을 전부 쓴다고
적었으므로 그 표가 가장 크게 어긋난다(§11.6 ②).

**새 형식은 신청하지 않는다.** `java-learning.md` §12.3 이 신청한 `FundValue` 변형 둘 중
**`{t:'compile-error'}` 는 C# 에도 필요하다** — CS0029(`var n = 0; n = "hi";`) · CS0161(반환 누락) ·
CS0020(상수 0 나눗셈)이 전부 「컴파일이 안 된다」가 정답인 판이고 `csharp.md` §9 ①이 그 대표 오답이다.
`{t:'unspecified'}` 는 C# 에 필요 없다 — 명세가 `checked`/`unchecked` 양쪽을 다 정한다.

---

### §11.4 연구된 오개념과 그 진단

#### C# 에는 오개념 연구가 없다 — 재확인했다

`progmiscon.org` 를 2026-09-05 에 다시 확인했다. 언어는 **자바(55) · 자바스크립트 · 파이썬** 셋이고
**C# 은 없다.** Chiodini 외(2021)가 인벤토리의 언어를 셋으로 적은 그대로다.
`csharp.md` §9 의 열둘은 Microsoft Learn 의 언어 참조·명세와 커뮤니티 문헌에서 정리한 것이고
**실측 데이터가 아니다** — 그 문서가 이미 정직하게 적었고 이 조사가 뒤집을 것을 못 찾았다.

**그래서 C# 오개념의 근거 강도는 자바보다 한 단계 낮다.** 자바는 면담(Kaczmarczyk 2010) ·
모형 조사(Ma 외 2007) · 큐레이션된 인벤토리 55항목이 있고, C# 은 명세와 실측 스무 줄이 있다.
문서가 이 차이를 지우지 않는 것이 이 절의 요점이다.

#### 자바와 C# 은 서로의 `siblings` 로 못 쓴다

`fundamentals.md` §3.3 의 열 언어 규칙표에서 **java 행과 csharp 행이 전 열 동일하다.**

| 열 | Java | C# |
|---|---|---|
| 정수 폭 | 32 | 32 |
| `7 / 2` | `3` | `3` |
| `-7 % 2` | `-1` | `-1` |
| 오버플로 | 감긴다 `-2147483648` | 감긴다 (`unchecked` 기본) |
| 참·거짓 | `true`/`false` | `true`/`false` |

`fundamentals.md` §5 의 `other-language` 진단(「그 답은 <언어>의 규칙이다」)은 **두 언어 사이에서
한 번도 안 걸린다.** C# 판의 `other-language` 가 실제로 나오는 상대는 파이썬(`3.5`·`1`·무한 정수) ·
TS(`3.5`) · Go/Swift(64비트 · `1 << 2 + 3` 이 `7`) · Rust(패닉) · Swift(트랩)다.

**그리고 C# 의 대표 오답 넷은 다른 언어가 아니라 같은 언어 안에서 갈린다.**

| 식 | 오답 | 참이 되는 조건 | `siblings` 가 잡나 |
|---|---|---|---|
| `0.1 + 0.2 == 0.3` | `True` | **접미사가 `m` 이면** 참이다 (실측) | ✕ |
| `s1 == s2` (같은 내용) | `False` | **변수를 `object` 로 선언하면** 참이다 (실측) | ✕ |
| `int.MaxValue + 1` | 예외 | **`checked` 를 적었으면** 참이다 | ✕ |
| `5 / 2` | `2.5` | **한쪽이 `5.0` 이면** 참이다 | ✕ |

넷 다 **같은 식에 한 글자(`m` · `checked` · `.0` · 선언 타입)를 바꾼 것**이라
「그 답은 파이썬의 규칙이다」로는 진단이 안 된다. 필요한 것은 **같은 언어 안의 다른 규칙**이다.

`java-learning.md` §12.4 가 자바에서 정확히 같은 구멍을 찾아 `javaAlt` 를 신청했다(자바는 넷 —
`"a" + 1 + 2` · `Integer` 캐시 · `new String` · `static` 문맥). **두 언어가 같은 칸을 요구하므로
이름을 언어 중립으로 둔다 — `langAlt`.** 카탈로그 한 칸이고 사전이 아니다(개념마다 다르지 않고
**식마다** 다르다).

#### `FUND_DIALECTS` 의 csharp 행은 이제 「실측」이다

`fundamentals.md` §10 실측 1번이 「일곱(c · cpp · java · csharp · rs · go · swift)이 **명세**다.
착수 전에 실제 툴체인으로 다시 재야 한다」고 적었다. **C# 은 재어졌다** — `csharp.md` §0 의 값이
`.NET SDK 10.0.302` 로 `dotnet new console` → `dotnet run` 해서 얻은 것이고 §0.4 가 스무 줄을
표로 갖고 있다. 네 식(`int-div`·`mod-neg`·`float-add`·`int-overflow`) 전부 포함된다.
**그 행의 「확인」 열을 「명세」에서 「실측」으로 바꿀 수 있다**(§11.6 ③). 남은 것은 여섯이다.

---

### §11.5 우리 앱에서 그 학습법이 서는 자리

#### 「내 코드가 교재」 — C# 에서는 못 잰다

`csharp.md` §0.7 이 이미 셋을 못박았다 — `crates/parse` 에 문법이 **없고**, 표본 리포에 `.cs` 가
**0개**이며, `dictionary/csharp/**` 도 없다. 정본 §5 의 티어로는 **A 만 선다.**

그러므로 `java-learning.md` §12.5 가 낸 수치(0부 19판 중 10판이 내 코드를 짚는다 = 53%,
0·1·2부 43판 중 30판 = 70%)에 **대응하는 C# 값이 없다. 안 쟀고, 잴 방법이 오늘 없다.**
사용자가 C# 리포를 가져오고 §0.7 의 일곱 걸음이 끝나야 잰다.

이것이 `pedagogy.md` §5 가 권한 **성질 게이트**(내 코드를 짚는 판의 비율)에 대한 C# 의 답이다 —
게이트를 두면 C# 은 **분모가 0이라 게이트가 안 돈다.** 게이트를 만들 때 「파서가 없는 언어에서는
검사를 건너뛴다」가 규칙에 들어가야 한다. 안 들어가면 C# 사전을 여는 날 CI 가 빨개진다.

#### 로그인 챕터와의 대조 — 못 한다

`chapter-login.md` 는 자바·Vue·MyBatis 표본의 것이고 C# 에 대응하는 챕터가 없다.
`java-learning.md` §12.5 가 `AuthService.login` 의 일곱 줄에서 값 추적 격자를 세운 것 같은 대조를
C# 에서는 **못 한다.** 3부도 0판이다(`aspnet/` 네임스페이스가 없다 — `csharp.md` §0.5).

대신 그 형식이 C# 에서 무엇을 물을지는 0부가 이미 답한다 — 0-7 의 struct/class 복사가
**`trace-table` 의 가장 좋은 판**이고(행 셋 · 열 둘 · 답이 전부 결정론), 자바에는 그 판이 아예 없다
(사용자 정의 값 타입이 없어서다).

#### 0장 상한 폐지의 결과 — C# 쪽 판단

**C# 에서는 이득만 있다.** `csharp.md` §0.5 가 「0장 적재량 24 → 26, 상한을 두 장 넘긴다」고 쟀다.
상한이 없어지면 그 두 장 문제가 사라진다. 그리고 잘렸을 때 **무엇이 잘리는지가 이 언어에서 특히
나쁘다** — 넷째 정렬 키가 id 알파벳순인데, C# 0부 여덟 중 넷(`integer-literal` `checked` ·
`float-literal` `decimal` · `type-conversion` 캐스트 · `equality` 정적 타입)이 **명세를 안 읽으면
조용히 틀리는 자리**이고 알파벳순은 그것을 모른다.

자바와 달리 **판 수가 부담이 아니다** — C# 0부는 8판(4일)이고 자바는 19판(10일)이다.
0부만 놓고 보면 C# 이 상한 폐지의 수혜를 가장 적게 받는 언어이기도 하다(애초에 8판이라 상한
근처에 안 간다). 문제는 0부가 아니라 **2부 24판**이고, 그것은 상한이 아니라 `csharp.md` §0.6 의
18일 셈이 다룰 자리다.

---

### §11.6 바꿀 것 — diff

**본문은 안 고쳤다.** 등록부 행 번호는 오케스트레이터가 매긴다.
①은 `java-learning.md` §12.6 ①과 **같은 한 줄**이다.

| # | 무엇을 | 어디서 → 어디로 | 근거 |
|---|---|---|---|
| ① | 「메모리 줄」의 언어 열에 `csharp` 를 더한다 (자바와 같은 신청) | `diagrams.md` §3 명세만 표 | `csharp.md` §0.1 이 이미 0-3·0-7 에 걸었다 — 명세와 불일치 |
| ② | §0.2 의 형식 표에서 `bits` → `table` 의 한 배치, `predict` → `value` 의 판정란으로 고쳐 적는다 | `csharp.md` §0.2 (0-1·0-4·0-8 행) | `fundamentals.md` §2.1·§2.2 가 둘을 형식에서 내렸다 |
| ③ | `FUND_DIALECTS` 의 csharp 행 「확인」을 **명세 → 실측**으로 | `fundamentals.md` §3.3 표 · §10 실측 1번의 「일곱」 → 「여섯」 | `csharp.md` §0.4 가 .NET 10.0.302 로 네 식을 전부 쟀다 |
| ④ | 카탈로그의 언어 안 오답 칸 이름을 **`langAlt`** 로 (자바 전용 `javaAlt` 가 아니라) | `packages/cards/src/fundamentals.ts` · `java-learning.md` §12.6 ⑤ | 자바 넷과 C# 넷이 같은 모양의 구멍이다 (§11.4) |
| ⑤ | `FundValue` 에 `{t:'compile-error'}` — C# 에서도 필요 | `fundamentals.md` §6 payload | CS0029 · CS0161 · CS0020 이 「컴파일이 안 된다」를 정답으로 갖는다 |
| ⑥ | 성질 게이트를 만들 때 **「파서가 없는 언어는 건너뛴다」**를 규칙에 넣는다 | `pedagogy.md` §6 물음 3 | C# 은 분모가 0이라 게이트가 안 돈다 (§11.5) |
| ⑦ | §0.5 의 부 배치 · §0.6 의 18일 — **안 바꾼다** | — | MS Learn 과 우리가 클래스를 미루는 데서 이미 같고, 갈리는 다섯은 §0.4 실측이 근거다 (§11.2) |

---

### §11.7 출처

자바와 공유하는 것(CS2023 SDF · Chiodini 2021 · progmiscon · objects-first 논쟁 셋)은
[`java-learning.md`](./java-learning.md) §12.7 에 있다. 여기는 C# 것만 적는다.

| # | 출처 | 1차/2차 | 확인 |
|---|---|---|---|
| 1 | Microsoft Learn — *Get started with C#* 학습 경로 Part 1~6. https://learn.microsoft.com/en-us/training/paths/get-started-c-sharp-part-1/ (부 제목은 `part-2`~`part-6` 을 각각 열어 확인) | 1차 | **전문**(Part 1 의 모듈 여섯 · Part 2~6 의 제목) |
| 2 | Microsoft · freeCodeCamp *Foundational C# Certification* (35시간 · 80문항). https://devblogs.microsoft.com/dotnet/announcing-foundational-csharp-certification/ | 1차 | 2차(발표 글) |
| 3 | Skeet, J. *C# in Depth*, 4e — 편성이 C# **버전별**이고 중급자 대상. https://csharpindepth.com/contents | 1차 | 2차(출판사·저자 사이트 요약) |
| 4 | Sierra 외 *Head First C#*, 5e. https://www.oreilly.com/library/view/head-first-c/9781098141776/preface02.html | 1차 | **확인 못 함**(403). 「objects-first」는 이전 판에서 알려진 편성이고 5판 차례를 못 봤다 |
| 5 | progmiscon.org 언어 목록 — 2026-09-05 재확인. **C# 없음** https://progmiscon.org/misconceptions/ | 1차 | **전문**(목록) |
| 6 | `csharp.md` §0.4 실측 — .NET SDK **10.0.302**, `dotnet new console` → `dotnet run`, 2026-09-05 | 1차 | 이 저장소의 기록 |
| 7 | C# 컴파일러 오류 CS0029 · CS0161 · CS0020 (Microsoft Learn 언어 참조) · `CheckForOverflowUnderflow` 빌드 속성 | 1차 | 2차 — **오류 번호를 문서 원문으로 대조하지 않았다.** `csharp.md` §2·§9 의 인용을 그대로 쓴다 |

**한계.** ① C# 을 대상으로 한 오개념 연구도 objects-first 비교 연구도 **찾지 못했다.**
없다는 증명이 아니라 못 찾았다는 뜻이다. ② Head First C# 5판 차례를 못 열어 표의 한 칸이 비었다.
③ `checked` 의 T1 판정에서 Rust·Swift·Go 의 대응 기능은 각 언어 문서(`rs.md`·`swift.md`·`go.md`)의
기술을 근거로 삼았고 **각 언어 명세를 직접 안 읽었다.**
