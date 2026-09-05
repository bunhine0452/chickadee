---
schema_version: 1
type: chore
slug: "c-cpp-rs-learning-sections"
status: done
difficulty: high
created_at: "2026-09-05T19:26:28+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/c.md"
    op: update
  - path: "docs/curriculum/cpp.md"
    op: update
  - path: "docs/curriculum/rs.md"
    op: update
  - path: "docs/curriculum/c-learning.md"
    op: create
  - path: "docs/curriculum/cpp-learning.md"
    op: create
  - path: "docs/curriculum/rs-learning.md"
    op: create
related: []
tags:
  - "curriculum"
  - "pedagogy"
  - "c"
  - "cpp"
  - "rust"
  - "research"
  - "mcp-tool"
---
[x] C·C++·Rust 학습법 절(§11) 조사와 작성 — 기계 하나 + 델타 둘

## 추가 기능

`c.md`·`cpp.md`·`rs.md` 에 `## §11 학습법 — 이 언어를 이해한다는 것` 을 더했다. 셋 다 800줄
상한 규약(README §12)에 따라 `<lang>-learning.md` 로 분리하고 본문 끝에 요약 + 링크를 남겼다
(cpp 은 477줄이라 상한에는 안 걸리지만 C·Rust 와 같은 자리에 두려고 분리).

세 편은 **기계가 하나**라는 전제로 짰다 — `c-learning.md` §11.1 이 기계 둘(자리 = 주소 붙은
바이트 · 약속 = 규격이 정한 것만 지킨다)을 세우고, cpp·rs 는 「같은 기계 + 무엇이 더해졌나」만
적는다. 중복 서술 없음.

절 구성은 여섯 고정 — §11.1 기계와 그림 · §11.2 교재 순서 대조 · §11.3 연습 형태
(pedagogy.md §4 의 T1/T2/T3 판정표) · §11.4 오개념과 계산된 진단 · §11.5 앱에서 서는 자리
(다섯 단 · D184 판단) · §11.6 diff · §11.7 출처.

## 주요 판단

- **UB 판정이 T1 을 가장 깨끗하게 통과한다** — 같은 식을 아홉 언어에 옮기면 답이 사라지는 게
  아니라 생긴다. 그리고 `value` 가 자유 텍스트라 「약속 없음」 선택지가 힌트를 안 흘린다.
- **Brown 실험판의 permissions 그림이 우리 「소유권 화살표」 명세와 다르다** — place 대 owner,
  권한 표 대 화살표. 실측(48→57%, N=342, d=0.56)이 붙은 쪽은 Brown 이라 명세 교체를 신청했다.
- **`trace-table` 의 열 축이 「변수」로 고정되면 셋 다 못 선다** — C 는 주소, C++ 은 객체,
  Rust 는 place. Rust 는 칸까지 값이 아니다(R/W/O).
- **C 는 「기계 설명」으로만 남기고 C++ 은 코스를 안 연다**를 권고했다. 근거는 실측 —
  사람이 쓴 `.c`·`.cpp` 가 0장이라 4·5단이 재료 없이 못 선다.

## 검증

- 세 학습 문서의 마크다운 표 열 수 불일치 0 · 절 제목 §11.1~§11.7 순서 정상(스크립트 확인).
- 줄 수: c.md 578 · cpp.md 477 · rs.md 577 · c-learning 271 · cpp-learning 212 ·
  rs-learning 296 — 전부 800 미만.
- 출처 24건 중 전문 확인 5(Crichton OOPSLA 2023 · Brown 4.2·4.3 · Zhu ICSE 2022 ·
  Cunningham ICER 2017 · Gustedt Modern C), 목차·초록만 13, 미열람(유료·2차) 6 — 각 행에 표시.
- git 트리는 안 건드렸다(문서 편집만).