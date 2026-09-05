---
schema_version: 1
type: chore
slug: "ten-language-fundamentals-curriculum"
status: done
difficulty: high
created_at: "2026-09-05T18:30:54+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/program/fundamentals.md"
    op: create
  - path: "docs/program/README.md"
    op: update
  - path: "design/system/diagrams.md"
    op: create
  - path: "docs/curriculum/README.md"
    op: update
  - path: "docs/curriculum/sql.md"
    op: update
  - path: "docs/curriculum/py.md"
    op: update
  - path: "docs/curriculum/ts.md"
    op: update
  - path: "docs/curriculum/java.md"
    op: update
  - path: "docs/curriculum/c.md"
    op: update
  - path: "docs/curriculum/cpp.md"
    op: update
  - path: "docs/curriculum/rs.md"
    op: update
  - path: "docs/curriculum/go.md"
    op: update
  - path: "docs/curriculum/swift.md"
    op: update
  - path: "docs/curriculum/csharp.md"
    op: update
related: []
tags:
  - "커리큘럼"
  - "0부"
  - "문항 형식"
  - "시각 자료"
  - "병렬"
  - "mcp-tool"
---
[x] 열 언어 0부와 「값을 적는」 형식 — 병렬 여섯의 통합

사용자 요청: 「독스의 10개 언어를 기초부터 심화까지, **언어의 동작 원리부터** 배울 수 있게. 시각 자료를 많이. **4지선다가 아니라 다른 형식**이어야 할 것 같은데 어떤 방식이 좋을까?」

## 형식 — 정본이 이미 답을 갖고 있었다

정본 §1 이 「가치는 설명이 아니라 **강제된 능동 출력**이다. 읽기는 인식이지 지식이 아니다」라고 못박는다. **4지선다는 인식이고 소거법으로 맞을 수 있다** — 제품의 창립 전제와 정면으로 충돌한다. 그래서 「고르지 않고 적는다」로 갔다.

오케스트레이터가 여섯을 권했고 **I1 이 넷으로 깎았다.** 근거가 맞다.
- **`bits` 를 내렸다** — 64비트를 적게 하면 재는 것이 타자다. 「비트 그림이 값을 갖는 자리는 **틀린 다음**이고 그건 형식이 아니라 판정란이다.」
- **`predict` 를 내렸다** — 러너가 없으면 카탈로그 값이 「실제」를 대신해 `value` 와 같아지고, 있어도 학습자가 하는 일은 값 적기 하나다.
- **`build` 는 지금 못 선다** — D175 러너가 `{repoId, lang:'java'}` 고정이고 학습자 리포에서 작업본을 뜬다. 기초 문항은 리포가 없다. **오케스트레이터가 권할 때 확인하지 않은 자리다.**

남은 넷: `value`(칸 하나) · `step`(칸 N, **이월 채점** — 앞 칸이 뒤 칸의 기댓값을 정한다) · `table`(부분 점수) · `build`(유보).

## 채점에서 가장 좋은 판단 둘

**실수를 엡실론이 아니라 비트로 견준다.** `0.30000000000000005` 통과(그 사이에 다른 double 이 없다), `0.3` 불통과. 자릿수 규칙을 사람이 안 정하고 부동소수점에 맡겼다.

**오답 진단을 사람이 안 쓴다.** 문항이 같은 식의 **다른 언어 답**을 함께 굽고, 틀리면 「그 답은 파이썬의 규칙이다」가 **계산된다**. 정본 §3-2 가 값 적기에서 이 모양이 된다. 분류 아홉.

## 시각 자료 — 그림과 채점이 같은 함수에서 나온다

`bitsOf(value, type)` 가 그림과 채점값을 함께 낸다 → **어긋날 수 없다.** 그 그림이 오개념 하나를 스스로 반증한다 — `0.1` 은 55자리로 펼쳐지고 `0.5` 는 `lossy:false` 다.

장식과 그림을 가르는 기준을 문서 첫 절에 박았다 — **지워도 문항이 성립하면 장식, 지우면 문항이 안 서면 그림.** 부호·지수·가수를 세 색으로 칠하는 관행은 §6 위반이라 줄과 이름으로 갈랐다. 가리기 규칙 하나: **구조는 남고 값이 사라지며, `aria-label` 도 함께 가린다**(소리로 답이 새면 가린 것이 아니다).

## 실측이 문서를 뒤집은 자리

- **`MonggleMonggle` 자바 99파일에 나눗셈이 0곳.** `%`·`char`·캐스트도 0. 0부 19판 중 **여섯(32%)이 사용처 0**.
- 반대로 **오토박싱 256곳/65파일** — 난이도 4 심화에 있던 것을 0부로 올렸다.
- **느슨한 같음이 리포마다 갈린다** — `ECC` js 410파일에 **1곳**, `ai-pm` 613파일에 **375곳**. `ts.md` 의 「AI 가 섞는다」는 한 리포에서만 참이다.
- **사람이 쓴 `.c`·`.cpp` 가 리포 열에 0장** — 잡히는 468개 헤더 중 452가 OpenSSL. D158 경로가 예외가 아니라 기본이 된다.
- **러스트 `as` 563곳 대 `try_into` 12곳 — 47배.**
- Swift·C# 은 **이 기계에서 실제로 돌려 쟀다**(Swift 6.3.3 · .NET 10). 이모지 하나의 「길이」가 Go 25 · Swift 1 · C# 11.

## 교육적으로 가장 날카로운 판단

**정의되지 않은 동작을 「아무 값이나 나온다」로 가르치면 안 된다.** 그렇게 배운 학습자는 `if (x + 1 < x)` 로 넘침을 검사할 수 있다고 믿는데 **컴파일러가 그 `if` 를 지운다.** 정답은 값이 아니라 「이 식은 답을 약속하지 않는다」이고 그 선택지가 0부 내내 답란에 있어야 한다.

## 새로 드러난 결함 둘

1. **`grammarSchema` 가 파서에 안 붙은 언어를 받는다** — `c`·`cpp`·`c_sharp`·`swift`·`dart` 는 사전을 써도 캡처가 0곳인데 스키마도 린트도 통과한다. 「열려 있다」는 로드 단계이지 파서가 아니다. `quality.rs:130` 의 못은 `swift`·`dart` 만 지켜 **C# 은 경고 없이 들어온다.**
2. **MyBatis `#{userId}` 가 파스 트리를 바꿔 `sql/comparison` 이 틀린 답을 가르친다** — 오른쪽이 열 참조로 재해석되는데 비교식은 살아 있어 매치가 정상으로 보인다. 실물 세 장 중 하나.

## 검증

`pnpm typecheck`·`pnpm lint` 무출력 · `pnpm test:unit` **2,305 통과 / 실패 0**(그림 35 · 기초 문항 36 신규) · `design:check` 일치 · `check:contrast` 142쌍 · `check:motion` 0 · `test:gates` 144.

## 메모 — 사용자 결정 넷

**세 세션이 독립적으로 같은 벽에 부딪혔다: 0장 상한 24.** 후보가 py·java 34 · ts 32 · C++ 28 · Swift 29 로 전부 넘친다. 이 하나가 나머지를 푼다. 그 밖에 — 어느 언어부터 지을지(순서는 나왔다: 뼈대 → ts → sql → py → java → rs …) · `cs/` 에 없는 셋(`operator-precedence`·`type-conversion`·`truthiness`) 신설 · `build` 형식을 지금 열지.