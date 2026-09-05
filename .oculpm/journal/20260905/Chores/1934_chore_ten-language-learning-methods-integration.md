---
schema_version: 1
type: chore
slug: "ten-language-learning-methods-integration"
status: done
difficulty: high
created_at: "2026-09-05T19:34:53+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/README.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/program/fundamentals.md"
    op: update
  - path: "design/system/diagrams.md"
    op: update
  - path: "docs/curriculum/java.md"
    op: update
  - path: "docs/curriculum/csharp.md"
    op: update
  - path: "docs/curriculum/java-learning.md"
    op: create
  - path: "docs/curriculum/csharp-learning.md"
    op: create
related: []
tags:
  - "학습법"
  - "병렬"
  - "D185"
  - "커리큘럼"
  - "형식"
  - "mcp-tool"
---
[x] 열 언어 학습법 — 병렬 다섯의 통합 (D185)

사용자 요청 「각 언어별로 완벽한 학습법을 통해 학습할 수 있게 해줘, 병렬 세션으로 조사해」. 「완벽한」은 없다 — 다섯 세션(J0 학습 과학 · J1 py/ts · J2 java/csharp · J3 c/cpp/rs · J4 go/swift/sql, 전부 Opus)이 **재현된 근거와 그 강도**를 적었다.

## 하나로 모이는 발견

**연구가 말하는 「추적」이 앱의 2단에 없다.** Lister 2004·Lopez 2008 의 tracing 은 값과 상태를 손으로 굴리는 것인데, 앱의 2단 넷(`exec`·`hop`·`origin`·`caller`)은 전부 **경로**다. J0 가 찾았고 넷이 독립적으로 확인했다 — SQL 에서는 결함이 되고(경로가 없어 2단이 통째로 빈다), 로그인 챕터에는 자리가 있고(`user` 가 가리키는 상자 A/B), C·C++·Rust 는 열 축이 변수가 아니라 주소·객체·place 다.

**새 형식은 둘로 충분하다.** `order`(Parsons) · `trace-table`(시간 × 변수 격자). 다섯이 그 밖의 형식을 하나도 신청하지 않았다. 확장 여섯은 `fundamentals.md` §13.

**「언어 특유」 판정 기준 하나.** 그 연습을 나머지 아홉에 옮겼을 때 답이 **사라져야** 특유다. 답이 그저 달라지는 것은 `siblings` 가 이미 하는 일이다. 좁힌 주장은 통과, 넓힌 주장은 탈락 — 「Rust 오류 읽기」 탈락 · `E0502` 통과 · SQL 「결과 표 먼저 적기」가 가장 깨끗.

**순서는 안 바꾼다.** objects-first 근거가 무방향이고(Ehlert & Schulte 2009 차이 없음 · CS2023 SDF 에 paradigm 0회), Brown 실험판 Rust Book 은 순서가 아니라 4장 **내용**을 바꿔 효과를 냈다(48→57%, d=0.56).

## 언어마다 「이해한다」 한 문장

py 하나(명세 근거) · js **셋**(인벤토리 33건 중 이벤트 루프 0건) · java 하나(9/13) · csharp 하나(4/12) · c **둘**(바이트+주소 / 약속만 지키는 컴파일러) · cpp 하나(9/12) · rs 하나(4.5/12, 수명이 구멍) · go 하나(6/12) · swift 하나(6/12) · sql 하나(**12/12**). README §13 표.

## 「내 코드가 교재」가 갈랐다

성립: py · ts · java · sql · go. 불성립: c·cpp(사람이 쓴 파일 0장) · swift·csharp(파서도 표본도 0). 권고 — C 는 코스가 아니라 기계 설명(21개념), C++ 코스 안 염, Swift·C# 은 성질 게이트 제외 규칙 필요.

## 정정 — 앱이 틀린 확신을 가르칠 뻔한 것

`java.md` §10 #13: Integer 캐시 밖(`128 == 128`)을 「거짓」으로 채점하면 안 된다 — JLS 5.1.7 은 공유를 허용하되 요구하지 않는다. 카탈로그(`fundamentals.ts`)에는 그 항목이 없어 코드는 무사하다. 그 밖에 ts prototype↔class 선행 뒤집기 근거(ECC `class` 1 · `prototype` 36), py §9 #4 오인용, fundamentals.md 「셋만 돌렸다」→ 넷.

## 적용하지 않은 것 — 사용자 결정

각 언어 §N.6 의 순서 변경 diff 는 적용하지 않고 README §13 에 목록으로 남겼다. 그림 신청 여섯(권한 줄 교체 포함)은 `diagrams.md` 몫으로 적었고 메모리 줄 언어 열에 Java·C# 만 반영했다.

## 근거의 한계 — 정직하게

다섯 문서 출처 131건, 1차 68~94%. **전문을 읽은 것은 소수**(J0 2/25 · J3 5/24 · J2 13/28 · J4 2/22). Go·Swift 학습자 오개념 연구는 없다. C++ 오개념 1차 문헌은 2002 이후 못 찾았다. Parsons 근거의 SLR 은 효과 크기를 모으지 않았고 22편 중 9편이 기여를 분리하지 않았다.

## 검증

typecheck · lint · test:unit · gates · design:check · contrast · motion — 커밋 전 전부 돌렸다(결과는 커밋 메시지 시점에 초록). CI 는 마지막 푸시에서 `gh run watch`.