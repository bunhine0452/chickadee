---
schema_version: 1
type: chore
slug: "go-swift-sql-learning-method-research"
status: done
difficulty: high
created_at: "2026-09-05T19:27:49+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/sql-learning.md"
    op: create
  - path: "docs/curriculum/go-learning.md"
    op: create
  - path: "docs/curriculum/swift-learning.md"
    op: create
  - path: "docs/curriculum/sql.md"
    op: update
  - path: "docs/curriculum/go.md"
    op: update
  - path: "docs/curriculum/swift.md"
    op: update
related: []
tags:
  - "curriculum"
  - "pedagogy"
  - "sql"
  - "go"
  - "swift"
  - "research"
  - "mcp-tool"
---
[x] Go·Swift·SQL 의 학습법 조사 — §11 세 편 (J4)

## 추가 기능

세 언어에 `## §11 학습법 — 이 언어를 이해한다는 것` 을 붙였다. 본문 셋이 다 800줄 상한을 넘어
`<lang>-learning.md` 로 분리하고 본문 끝에 링크 한 절만 더했다 — **§0~§10 은 한 글자도 안 고쳤다.**
sql 383줄 · go 320줄 · swift 370줄. 본문은 sql 560 · go 602 · swift 675 로 전부 800 미만.

## 동작 흐름

**SQL 을 먼저 깊게 했다.** 기계가 절차가 아니라 집합이라 다섯 단의 「추적」·「수정」을 다시 정의해야 했다.

- **2단(추적)** — `pedagogy.md` §1.2 가 「앱의 2단은 경로 추적이라 값을 굴리는 것이 하나도 없다」고
  짚었는데, SQL 은 경로가 아예 없어 `exec`·`hop`·`origin`·`caller` 넷이 통째로 빈다. 그래서 둘로 갈랐다 —
  ⓐ 쿼리 **안**은 「행의 소멸」 추적(`trace-table` 시간=절/변수=행 → `GROUP BY` 에서 깨지므로 `value`
  → 결과 표 격자) ⓑ 쿼리 **밖**은 아홉과 같다(매퍼 간선·origin·caller). **SQL 이 그 빈자리를 채우는 첫 언어다.**
- **4·5단(수정)** — 실측으로 정했다. 자기 리포 이행 9판을 `sqlite3` 에 부으면 오류 0·표 43개라 러너가
  사실상 공짜인데, 표본 리포(MySQL) 151줄은 **표 0개**이고 규칙 여덟으로 깎아도 0이다 — 러너는 언어가
  아니라 **방언마다 하나**다. 채점은 `EXCEPT` 대칭 차집합(실측 `diff_rows=0`)이라 **AST 승격이 면제되는
  첫 언어**다. 막는 것은 러너가 아니라 `fixtures/db/v0009.db` 의 **행 0개**다.

**Miedema 원문을 열었다.** sql.md §10 이 「ACM 403 으로 본문을 못 열었다」고 남긴 자리를 TU/e 오픈액세스
박사학위논문(2024)으로 채웠다 — 열두 라벨과 유병률(n=249)을 표 6.2 에서 그대로 가져왔다.

**Go·Swift 는 `pedagogy.md` §4 의 세 시험을 표의 열로 넣었다.** 넓게 적은 주장이 전부 탈락하고 좁힌 판이
통과하는 것이 두 언어에서 되풀이됐다. Go 의 `defer`(인자 평가 시점, 0)와 Swift 의 `defer`(블록 캡처, 9)가
서로의 반증이 되어 판정 기준이 실제로 도는 것을 보였다.

## 검증

- 세 문서의 마크다운 표 열 수를 스크립트로 검사 — 어긋남 0(이스케이프 파이프 제외). 처음에 go·swift 의
  §11.1 표가 머리글 3열·본문 2열이라 고쳤다.
- 인용한 값은 전부 이 세션에서 실행했다: `sqlite3 3.51.1`(SQL 여섯 항목) · Swift 6.3.3(열세 항목) ·
  `which go` → not found. Go 값은 명세 계산이라고 각 자리에 표시했다.
- 사용자 리포는 읽기만 했다(`git log`·`git show`·`cat`, 쓰기 0). 스키마 적재 시험은 스크래치패드의
  임시 DB 에서 했다.
- 금지어 검사(강력한·혁신적·완벽한·robust 류) — 0건.

## 남은 것

- 등록부 행 셋을 「번호 미정」으로 각 문서 §11.6 에 초안으로만 적었다(마지막이 D184).
- 새 그림 신청 둘(메모리 줄에 창 필드 · 나란한 걸음)은 `README.md` §12 신청 표에 못 올렸다 —
  이 세션의 범위 밖이라 각 문서에만 적었다.
- `sql/self-join` 이 §3 32개 어디에도 없다. 근거가 가장 두꺼운 어려움에 개념 자리가 없다.