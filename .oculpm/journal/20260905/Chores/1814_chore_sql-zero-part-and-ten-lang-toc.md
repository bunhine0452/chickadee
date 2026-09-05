---
schema_version: 1
type: chore
slug: "sql-zero-part-and-ten-lang-toc"
status: done
difficulty: high
created_at: "2026-09-05T18:14:17+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/sql.md"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
related: []
tags:
  - "curriculum"
  - "sql"
  - "cs"
  - "0부"
  - "D156"
  - "D157"
  - "D177"
  - "mcp-tool"
---
[x] SQL 0부(값이 아니라 표)와 열 언어 공통 0부 뼈대 · 저작 순서 (I6)

사용자 요청 「열 언어를 기초부터 심화까지, **언어의 동작 원리부터**, 시각 자료를 많이」의
SQL 몫과 열 언어 목차·공통 규약. 병렬 여섯 세션 중 I6.

## 1. SQL 0부 — 아홉의 축을 억지로 안 맞췄다

아홉 언어의 0부 축 여덟(정수·실수·문자·참거짓·연산자·형 변환·대입·비교)을 SQL 에 대면
**셋만 그대로 서고, 대입은 아예 없고(변수가 없다), 넷이 다른 것이 된다.**
그래서 SQL 0부를 「값 하나가 아니라 표 하나」로 다시 잡고 여덟을 세웠다 —
`row-and-set` · `column-type` · `value-and-name` · `null-unknown` · `three-valued-comparison` ·
`implicit-cast` · `expression-per-row` · `clause-order`. 전부 깊이 ≤ 2 라 기초 14 와 합쳐 **22/24**.

0부는 §2(절 여덟)를 대체하지 않고 **그 아래**다 — §2 의 `prereq` 에 걸 여섯 줄을 표로 적었다.

## 2. 표본 둘째 실측 — `MonggleMonggle` (읽기만)

sql.md 는 이 리포 하나(SQLite)로 썼고 스스로 「표본 1」이라 적어 뒀다. 하나 더 쟀다.

- `.sql` 27파일 2,953줄인데 **내용 해시로는 14개** — `AI_API`/`AI_API_GEMINI` 가 서로 사본이다.
- 매퍼 XML 9파일 581줄 · 문장 태그 49 · `#{…}` **114곳/8파일** · `${…}` 0.
- **`IS NULL` 22 + `IS NOT NULL` 1, 매퍼 6/9 파일** — 소프트 삭제가 앱 전체의 뼈대다. 0부 최상위.
- `=` 97곳인데 `<`·`>`·`<=`·`>=` **0곳** · `CAST`/`CONVERT` **0곳** · `CASE WHEN`·CTE·윈도·`DISTINCT`·트랜잭션·`EXPLAIN` **전부 0**.
- 조인은 **서로 다른 줄이 셋뿐**이고 그중 하나가 `LEFT JOIN … ON … AND d.deleted_date IS NULL` —
  §9 오개념 7 을 **맞게 쓴** 실물이라 3단(예측) 재료로 좋다.

## 3. 파싱을 다시 재서 §8 을 반만 확인했다

MySQL·MyBatis 조각 14개를 `tree-sitter-sequel 0.3.11` 로 직접 파싱(ABI 14 · 노드 729, §8 과 같은 값).
**§8 이 「깨진다」고 적은 `AUTOINCREMENT` 는 SQLite 철자였고 MySQL 의 `AUTO_INCREMENT` 는 통과한다.**
`ENGINE=`·백틱·`TINYINT(1)`·`ON DELETE CASCADE`·`ON DUPLICATE KEY` 전부 ERROR 0.
**진짜 사각지대는 방언이 아니라 자리표 하나**임이 표본 둘로 확정됐다.

그리고 `#{}` 는 `:name` 보다 나쁘다 — `:name` 은 `(ERROR)` 를 형제로 남기는데
`#{}` 는 오른쪽을 `unary_expression` 으로 **재해석**해 `userId` 를 열 참조로 만든다.
`binary_expression` 이 살아 있어 `sql/comparison` 이 정상 매치되고 **틀린 답을 가르친다.**
`sql/comparison` 은 오늘 실물로 있는 3장 중 하나다.

## 4. 열 언어 조정 (README §8~§12)

- **§8 공통 0부 뼈대** — 축 여덟과 **열 언어 공통 id 조각**을 정했다(`<lang>/integer-literal` 등).
  이름을 언어마다 지으면 cs.md §10.1 의 「한 기계에 여덟 이름」이 0부에서 되풀이된다.
  0부 상한 **언어당 12장** — 0장 상한 24 에서 기초 8 을 뺀 산수다.
- **§9 `cs/` 연결** — 43장 중 **12장을 쓰고 셋이 없다**:
  `cs/operator-precedence`(평가 트리 그림의 뒷받침이 통째로 빈다) · `cs/type-conversion`(타입 변환 사다리의 뒷받침) ·
  `cs/truthiness`(약한 후보 — cs.md §10.3 기준을 대면 되돌려진다). `common/type-cast` 도 없다.
- **§10 저작 순서** — 뼈대 → ts → **sql** → py → java → rs → go → swift → csharp → c → cpp.
  SQL 을 2번에 둔 이유는 **뼈대의 반증 표본**이라서다 — 늦게 하면 아홉을 쓴 뒤 뼈대를 고친다.
- **§11 규모** — 저작 ≤125장 약 31,000줄. 학습은 첫 언어 46~61판 = **23~31일(하한)**,
  둘째 언어는 `common/` 재사용률이 정해 8~15일.
- **§12 규약 열** + 새 그림 신청 표(SQL 이 넷 요구).

## 5. 이 판이 새로 잡아낸 결함

**스키마가 없는 문법을 막지 않는다.** `crates/parse` 는 여섯 네임스페이스만 링크하는데
`schema.ts:29-32` 의 `grammarSchema` 는 `'c'`·`'cpp'`·`'c_sharp'`·`'swift'`·`'dart'` 를 전부 받는다.
`dictionary/c/_lang.yaml` 에 `grammars: [c]` 를 적으면 스키마도 린트도 통과하고 **캡처만 0곳**이 된다 —
03 §2.2 의 「조용히 빈 쿼리」가 언어 단위로 일어나는 자리다. README §6 표 1번 행이 「열었다」고 적은 것은
로드 단계이지 파서가 아니다.

**리포 근거로도 넷이 비어 있다** — 사용자 리포 7개에서 `go`·`c`·`cpp`·`csharp` 는 **0장**, `swift` 는 1장.
반대로 `rs` 는 **347장인데 사전이 0장**이다.

## 검증

- `docs/curriculum/{sql,README}.md` 두 파일만 고쳤다(`git status` 로 확인 — 나머지 수정분은 I1~I5 몫).
- 표 열 수를 스크립트로 검사했다 — 불일치 0(sql.md 의 1건은 셀 안의 이스케이프된 `\|` 오탐).
- 실측은 전부 재현 가능한 명령이고 사용자 리포는 `git ls-files`·`grep`·`md5` 로 **읽기만** 했다.
  파싱은 스크래치패드의 별도 크레이트에서 `--offline` 으로 돌렸다.
- 등록부에는 행을 안 올렸다(초안만). 정본은 읽기만 했다.