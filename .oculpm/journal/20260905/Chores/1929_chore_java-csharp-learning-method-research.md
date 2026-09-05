---
schema_version: 1
type: chore
slug: "java-csharp-learning-method-research"
status: done
difficulty: high
created_at: "2026-09-05T19:29:22+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/java-learning.md"
    op: create
  - path: "docs/curriculum/csharp-learning.md"
    op: create
  - path: "docs/curriculum/java.md"
    op: update
  - path: "docs/curriculum/csharp.md"
    op: update
related: []
tags:
  - "curriculum"
  - "java"
  - "csharp"
  - "pedagogy"
  - "research"
  - "mcp-tool"
---
[x] 자바·C# 학습법 절을 조사해 두 문서로 분리 (J2)

## 추가 기능

`java.md` 다음 번호 §12, `csharp.md` 다음 번호 §11 로 「학습법 — 이 언어를 이해한다는 것」을 썼다.
두 원본이 이미 903·680줄이라 800줄 상한 때문에 **본문을 분리**하고 원본 끝에 링크 블록만 남겼다
(다른 언어 세션도 같은 패턴으로 `*-learning.md` 를 만들었다).

- `docs/curriculum/java-learning.md` (486줄) — §12.1 기계 · §12.2 objects-first 논쟁 ·
  §12.3 특유 연습 판정 · §12.4 오개념과 진단 · §12.5 앱에서의 자리 · §12.6 diff · §12.7 출처
- `docs/curriculum/csharp-learning.md` (290줄) — §11.1~§11.7, 자바와 갈리는 자리만

## 동작 흐름 (조사 → 판정 → diff)

`pedagogy.md`(J0)의 판정 기준 T1/T2/T3 을 §N.3 표의 열로 들었다. 자바는 넷이 통과했고
(`int`/`Integer` 두 규칙 · `static` 문맥 · 검사 예외 · 같은 소거 오버로드), **DI 추적은 탈락**시켰다 —
파이썬 `Depends`·C# DI·NestJS 에 같은 물음이 있고 근거가 언어가 아니라 프레임워크라, 이미 있는
`spring/dependency-injection`(3부)의 자리다. C# 은 둘만 통과했다(`checked` 블록·스위치 · `==` 의
정적 타입 의존).

형식은 J0 가 세운 `order`·`trace-table` 이름을 그대로 썼고, 새 형식 대신 **`FundValue` 변형 둘**을
신청했다(`{t:'compile-error'}` · `{t:'unspecified'}`) — 둘 다 「답이 값이 아닌」 판이라 순열·격자로
안 된다.

## 새로 확인한 것

- **JLS SE21 §5.1.7 원문**을 열어 `java.md` §11 의 「확인 못 함」을 닫았다. 그리고 §10 #13 의
  「−128~127 밖은 거짓이다」가 **틀렸다** — 명세는 거짓을 보장하지 않고 *정하지 않는다*
  (allows but does not require sharing). 보장이 걸리는 것도 상수 식일 때뿐이다.
- **CS2023 SDF 지식 영역(Gamma, 2023-09)** 전문 — 「paradigm」이 0회. CS Core 주제 1번이
  「변수·원시 타입·식과 그 평가」, 2번이 「상태와 상태 전이」, 클래스는 4번의 괄호 안이다.
  우리 0·1·2부 배치와 그대로 맞는다.
- **Microsoft Learn 「Get started with C#」 여섯 부 어디에도 클래스가 없다**(objects-absent).
- **progmiscon.org 자바 55개 실측** — 23개(42%)가 파이썬·JS 대응 항목이 없다. 인벤토리에 언어가
  셋뿐이라 T1 의 답이 아니라 참고값이라고 적었다.
- **Ma 외 2007 후속 연구의 실패**가 생성기 규칙 하나를 준다 — `a=b; b=c` 는 「문이 동시에 실행된다」는
  틀린 모형으로도 정답이 나와 시각화·인지갈등이 안 통했다. **판별력 검사**(후보 식의 siblings·langAlt
  값이 정답과 전부 달라야 낸다)를 `buildValueItems` 에 요구한다.
- 로그인 챕터에 **값 추적이 설 자리가 있다** — `AuthService.login:87→:90` 에서 같은 이름이 다른 힙
  상자를 가리키게 되고, 리포가 `:89` 주석으로 이유를 적어 두었다. 실행 없이 결정론으로 채점된다.

## 검증

- 줄 수: java-learning 486 · csharp-learning 290 · java.md 911(기존 903 + 링크 8) · csharp.md 690.
  분리 대상 둘 다 800 아래.
- README §12 규약 대조 — 규약 5(새 `cs/` 안 만듦) · 6(안 쓰는 형식의 이유 한 줄) · 7(새 그림 신청
  없음, 기존 명세의 언어 열 변경) · 9(수치 없는 주장 없음) · 10(등록부 행 안 올림, 사용자 리포 읽기만).
- 출처 21 + 7건. 자바 쪽 전문 확인 11건, C# 쪽 2건. 못 연 것(CS2013 본문 · Head First C# 5판 차례 ·
  Ehlert & Schulte PDF)은 각 문서의 「한계」에 적었다.