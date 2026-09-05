---
schema_version: 1
type: chore
slug: "py-ts-learning-method-research"
status: done
difficulty: high
created_at: "2026-09-05T19:22:59+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/py-learning.md"
    op: create
  - path: "docs/curriculum/ts-learning.md"
    op: create
  - path: "docs/curriculum/py.md"
    op: update
  - path: "docs/curriculum/ts.md"
    op: update
related: []
tags:
  - "curriculum"
  - "py"
  - "ts"
  - "pedagogy"
  - "research"
  - "mcp-tool"
---
[x] 파이썬·JS/TS 학습법 조사 — 표기 기계·교재 순서·언어 특유 연습 (J1)

## 추가 기능

두 언어의 `## §11 학습법 — 이 언어를 이해한다는 것` 을 썼다. 본문이 800줄 상한에 걸려
`py-learning.md`(463줄) · `ts-learning.md`(427줄)로 갈라 내고 본문 끝에 링크 절 한 개씩을 붙였다.

절 구성은 지시대로 §11.1 표기 기계 · §11.2 교재 순서 대조 · §11.3 언어 특유 연습 ·
§11.4 오개념과 진단 · §11.5 앱에서의 자리 · §11.6 diff + 등록부 초안 · §11.7 출처.

## 동작 흐름

- **1차 출처로만 주장한다.** Sorva 2013 · du Boulay 1986 · Guo 2013 · Nelson·Xie·Ko 2017 ·
  Xie 외 2018 · Chiodini 외 2021 · HTML 명세 · Python 언어 참조·FAQ · MDN · TS Handbook ·
  Eloquent JS · javascript.info · YDKJS · Think Python · CS50P 목차를 원문으로 읽었다.
  못 연 것(ACM 이 403 한 건)은 「제목·저자만 확인」으로 적었다.
- **`progmiscon.org` 정적 API 를 내려받아 셌다** — 전체 247건 / 4언어, 파이썬 32(공개 30·초안 2) ·
  JavaScript 33(공개 6·초안 27). `ts.md` §9 의 「여섯」은 공개분만이었고, `py.md` §9 #4 의
  `AssignCompares` 인용이 오인용임을 확인했다.
- **표본 리포를 다시 쟀다(읽기만).** 파이썬은 `ast` 로 202파일, JS/TS 는 주석·문자열 제거 후
  정규식으로 1,035파일. 가변 기본 인자 0곳 · `is` 리터럴 0곳 · `Math.trunc` 0~2곳 ·
  `this` 85곳/16파일 대 화살표 16,063곳 등.
- **J0 의 `pedagogy.md` 기준을 적용했다** — §4 의 세 시험(T1 이식·T2 조항·T3 사전)으로 연습마다
  통과/탈락을 판정했고, 새 형식은 짓지 않고 J0 이 정한 `order`·`trace-table` 을 쓴다.
  `trace-table` 은 칸 종류만 넓히자고 신청했다(파이썬은 상자 라벨 + 분할 채점, TS 는 타입 문자열).

## 검증

- `wc -l` — py.md 747 · ts.md 632 · 새 문서 463·427, 넷 다 800줄 상한 안.
- 마크다운 표 열 수를 스크립트로 전수 검사, 불일치 0. 이스케이프 안 된 `||` 0건.
- 인용한 `cs/` id 를 `dictionary/cs/` 43장과 대조 — `cs/name-scope` 가 없음을 확인해
  py.md §9 #8 의 스테일 참조를 diff ⑧로 올렸다. `cs/task-queue` 는 cs.md §10.1 이 이미 접은 것이라
  신설 신청 대신 「접기가 JS 에서 무엇을 잃는지」만 적었다.
- 등록부(`docs/00-overview.md`)에 행을 올리지 않았다 — 두 문서에 「번호 미정」 초안만 뒀다.