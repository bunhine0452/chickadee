---
schema_version: 1
type: feature
slug: "wave-one-merge-formats-dictionaries-runner-diagrams"
status: done
difficulty: high
created_at: "2026-09-05T21:00:34+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "dictionary/_glossary.en.yaml"
    op: update
  - path: "docs/plan/python-axis.md"
    op: update
  - path: "docs/curriculum/py.md"
    op: update
related: []
tags:
  - "v10"
  - "합류"
  - "형식"
  - "사전"
  - "러너"
  - "그림"
  - "mcp-tool"
---
[x] 첫 물결 합류 — 형식 둘 · 사전 셋 · SQL 러너 · 결함 둘 · 그림 일곱

병렬 여섯(S3·S4·S5·S7·S8·S10, 전부 Opus)이 같은 트리에서 돌았고 파일 소유를 갈라 충돌 0 으로 합류했다.

## 무엇이 섰나

- **형식 둘**(S3): `order`(5단 1겹, 인접쌍 pct, 진단 계산) · `trace-table`(2단, 변수/객체 축, 이월 채점, 바뀐 칸만 가림). 로그인 챕터에서 값 추적 1판·정렬 2판이 실제로 구워진다. 마이그레이션 0 — `card.kind` 를 빌리고 payload 로 가른다.
- **사전 셋**: 자바 14 신설+5 갱신(골든 65), TS 11(골든 55), SQL 8+`self-join`. essential 이 java 41 · ts 41 · sql 11. 0장 후보 java 33 · ts 32 → 프롤로그 16~17일(D184).
- **SQL 러너**(S7): `crates/store/src/run.rs` 엔진 + 10줄 명령 + TS 판정. 문항마다 메모리 DB 를 새로 세우고 5초 상한, 채점은 행을 세는 다중집합 비교(`EXCEPT` 는 중복·순서를 잃는다). 왕복 1ms 미만.
- **`#{}` 결함**(S7): 파서 앞에서 자리표를 같은 너비 글자값으로 가린다(`params.rs`). `sql/comparison` 표본 6→53, 이 리포 ERROR 노드 800→92.
- **파서 미링크 결함**(S8): `GRAMMARS` 표 하나 + `dict:lint` 오류 + Rust 양방향 대조. C# 사전을 흉내 내면 걸린다.
- **`py/arithmetic`**(S8): 정밀도 16.7%→94.9%. 오검출의 정체는 `pathlib` 경로 결합 1,145곳. 문서의 「51%」는 재현 안 됨(실제 83.3%).
- **그림 일곱**(S10): 메모리 줄·겹친 비트·스택 프레임·사다리·권한 줄·큐 사다리·나란한 걸음. 시험 +37, i18n 49×2, 여섯 폭 × 두 테마 넘침 0.

## 세션이 문서를 고친 자리

자바 「`text-length` 0곳」→ 7곳 · 「캐스트 0곳」은 원시 좁히기만(참조 다운캐스트 4곳) · TS `string-literal` 4,882→46,354(정규식이 문자열을 먼저 지웠다) · `reference-sharing` 은 별칭 선언만(펼치기는 `object-spread` 가 맡음). `ff93223` 은 4·5단 정답지로 탈락(MySQL 전용·6파일).

## 합류에서 내가 한 것

ABSENCE 일곱 행(java 6 · ts 1) · `DEBT_RATCHET` 을 합류 시점 104/100/104/95 로(병렬 중엔 어느 세션도 확정 못 함) · 용어집 39행 · `python-axis.md`·`py.md` 의 51% 서술 갱신.

## 검증

typecheck 0 · lint 0 · test:unit 2,432 · dict:lint 16 · design:check · contrast 142 · motion 0 · gates 144 · cargo 전 크레이트 ok · clippy 0 · Rust 방벽 넷 ok. Rust 센서스 3,052(보고만, D181).

## 남은 것 — 둘째 물결로

UX 감사·디자인 QA(새 화면을 봐야 한다) · 파이썬 0부 사전 · stdin 러너 + 작은 문제 층 · 커리큘럼 §N.6 적용(prototype↔class 는 개념 자체가 없어 저작이 먼저) · 카탈로그 확장(variants·langAlt·compile-error/unspecified) · 성질 게이트 셋 · 화면 전수 스크린샷.