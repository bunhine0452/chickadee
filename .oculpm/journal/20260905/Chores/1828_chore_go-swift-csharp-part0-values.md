---
schema_version: 1
type: chore
slug: "go-swift-csharp-part0-values"
status: done
difficulty: high
created_at: "2026-09-05T18:28:14+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/go.md"
    op: update
  - path: "docs/curriculum/swift.md"
    op: update
  - path: "docs/curriculum/csharp.md"
    op: update
related: []
tags:
  - "curriculum"
  - "part0"
  - "go"
  - "swift"
  - "csharp"
  - "D177"
  - "mcp-tool"
---
[x] Go·Swift·C# 커리큘럼에 0부 「이 언어의 값과 식」 추가 — Swift·C# 은 실측, Go 는 못 쟀다

병렬 세션 I5. 정본 §1(「프로그래밍이 처음인 사용자도 대상」)·§4(정식 코스 3부)와 사용자 요청
「기초부터, 언어의 동작 원리부터, 시각 자료를 많이」를 받아 세 언어 문서에 `## §0 0부 — 이 언어의
값과 식`을 §1 바로 뒤에 붙였다. 형식 이름은 I1 계약(`value`·`step`·`bits`·`table`·`build`·`predict`),
그림은 I2 여섯, 축·id 조각·표 열 순서·12장 상한은 I6 가 README §8·§11 에 세운 규약을 따랐다.

## 한 일

**① 0부 여덟 장 × 3.** README §8 의 공통 축 여덟(`integer-literal`·`float-literal`·`text-literal`·
`boolean-literal`·`operator-precedence`·`type-conversion`·`assignment`·`equality`)을 세 언어에
그대로 세웠다. 어긋남 판은 안 세웠다 — 셋 다 **8 / 12**. 표 열은 규약 2 의 일곱 그대로이고,
형식과 `universal` 은 §0.2 별표로 뺐다(일곱 열에 자리가 없다).

**② Swift·C# 은 실행해 쟀다.** 이 기계에 Swift 6.3.3 과 .NET 10.0.302 가 있었다. 넘침·나눗셈·
부동소수·유니코드·우선순위·형 변환·복사·같음을 직접 돌려 §0.4 실측표로 넣었다. **Go 는 툴체인이
없어(`which go` → not found) 하나도 못 쟀다** — 명세 계산 + 파이썬 교차 검산이라고 문서에 적었다.

**③ 겹침을 정리했다.** 「값 하나를 만들고·보고·견주는 것까지가 0부」를 경계로 §2·§3 의 값 층위
개념을 0부가 흡수하고 원래 자리에 `↑0부` 를 붙였다 — Go 7 · Swift 5 · C# 7.

**④ 낡은 사실 셋을 고쳤다.** csharp.md §8 의 「안 열린 세 곳」 중 둘이 이미 닫혔고(`grammarSchema`·
`grammarOf`), 문법 키 제안 `csharp` 는 채택되지 않았다(코드는 `c_sharp`). 그리고 `quality.rs` 의
못이 `swift`·`dart` 만 지켜 **C# 문법은 경고 없이 들어올 수 있다**는 것을 §0.7 순서표 2번에 적었다.

## 낸 수치

| | 0부 | 1부 | 2부 | 3부 | 합 | 일(하한) | 0장 적재량 |
|---|---:|---:|---:|---:|---:|---:|---|
| Go | 8 | 5 | 20 | 0 | 33 | 17 | 22 → **24/24** |
| Swift | 8 | 4 | 25 | 0 | 37 | 19 | 25 → **29/24 넘침** |
| C# | 8 | 3 | 24 | 0 | 35 | 18 | 24 → **26/24 넘침** |

- 같은 이모지 하나의 「길이」 — **Swift 1 · C# 11 · Go 25**(앞의 둘 실측).
- `1 << 2 + 3` — **Go 7 · Swift 7 · C# 32**(Swift·C# 실측, Go 는 명세).
- 정수가 넘칠 때 — **C# 는 고르게 하고(`checked`), Swift 는 죽고(종료 코드 133), Go 는 감긴다.**

## 드러난 것 셋

1. **「0장」과 「0부」가 다른 축인데 `essential` 하나를 같이 쓴다.** 0부를 넣으면 상한 24 를 두고
   경쟁하고, 지면 「정수에 폭이 있다」가 프롤로그에서 빠진다. 결정거리 ⓐ 0부를 정렬 밖에 두거나
   ⓑ 상한을 올린다 — README §11 미결 3번과 같은 물음이고 Swift 가 가장 아프다.
2. **0부가 문법 없이 서는가 — 반만.** `t0-synthetic.ts` 가 사전 `examples[]` 로 카드를 굽지만
   `makeSyntheticCard` 는 `previewSiteId`(실제 사용처), `makeAbsentCard` 는 `AbsenceReason` 이
   필수다. 문법이 없으면 앞을 못 만들고 뒤를 쓰면 「없다」와 「못 읽는다」가 섞인다 — D137 이 막던 자리.
3. **`cs/` 43장에 셋이 없다** — `operator-precedence`·`type-conversion`·`truthiness`. 셋 다 표에
   굵게 적고 README §9 의 「없는 것」 표를 가리켰다(규약 5 대로 새 `cs/` 를 만들지 않았다).
   추가로 세 문서의 §7 이 적어 둔 `cs/` id 여덟이 실재 이름과 달라(`cs/unicode-text` →
   `text-encoding` 등) 부기로 바로잡았다.

## 검증

- Swift: `swift v.swift` · `swiftc -Onone` 으로 종료 코드 확인(133 = SIGTRAP). C#: `dotnet run`.
  UTF-8 바이트 수와 2의 보수는 파이썬으로 교차 검산.
- 문법 배선은 소스를 직접 읽어 확인 — `crates/parse/{Cargo.toml,src/langs.rs,tests/quality.rs:125-131,src/lib.rs:128}` ·
  `packages/dictionary/src/schema.ts:29-32` · `apps/desktop/src/session-flow.ts`.
- §0.1 표 세 개의 열 수를 스크립트로 세어 규약 2(일곱 열)를 지키는지 확인 — 셋 다 위반 0.
- `git status` 로 내 범위(세 파일) 밖을 안 건드렸음을 확인.

## 메모

- 못 정한 것 — 3부가 셋 다 **0판**이다. Go 는 네임스페이스 후보 자체가 없고(`net/http`·chi·gin 중
  택일이 결정거리), Swift 는 `swiftui/` 로 가르기로 했는데 목록이 없고, C# 는 `aspnet/` 같은 것을
  안 열었다. 정본 §5 의 티어 B 에 셋 다 한 줄도 없다.
- 어느 다섯(Swift)·둘(C#)이 0장에서 잘리는지는 **안 쟀다** — 두 언어 다 리포에 파일이 0개라
  정렬 첫 키(사용처 있음)가 전부 0이고, 그때 `zeroChapterPlates` 가 무엇을 내는지 확인하지 않았다.
- 등록부에는 행을 올리지 않았다(오케스트레이터 몫).