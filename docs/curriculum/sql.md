# SQL 커리큘럼 조사 — `sql`

조사 시점 2026-09-04. 열 편 중 **유일한 선언형**이라 다른 아홉의 개념 축(이름·반복·함수·조건·예외)이
거의 통째로 안 맞는다. 그 어긋남이 이 편의 내용이고, §6 의 재사용 수치가 그 크기다.

이 편은 **이 리포의 SQL 실물 21파일(2,432줄)을 세어서** 썼다 — 명령문 178개(`packages/store-sql/statements/`)와
이행 6판(`migrations/`, 표 34개). §1·§8 의 숫자는 추정이 아니라 계수와 실제 파싱 결과다.

---

## §1 언어 좌표

| 항목 | 값 |
|---|---|
| TIOBE 2026-08 | **8위 · 1.88%** (2025-06 에 역대 최저 12위까지 내려갔다 올라온 자리) |
| 네임스페이스 (`lang`) | `sql` |
| tree-sitter `grammar` 키 | `sql` — **크레이트명은 `sequel`** (D19 가 이미 적어 둔 그대로. `crates/parse/src/langs.rs:22` 에서 확인) |
| 확장자 | `.sql` |
| 크레이트 | `tree-sitter-sequel 0.3.11` (`Cargo.lock`), `LANGUAGE_VERSION` = **14** (파이썬과 같고 TS 는 15) |
| 방언 | 이 앱은 **SQLite**. 문법은 방언 합집합이지 SQLite 가 아니다 → §8 |

**이 언어로 실제로 만들어지는 것.** 단독 앱이 아니다. 웹·모바일 앱의 **저장소 층**으로 다른 언어 안에
섞여 산다 — 이행 파일(`migrations/*.sql`), 명령문 파일, 그리고 ORM 을 뚫고 나온 원문 쿼리.
바이브 코딩 대상자의 리포에서 SQL 은 대개 **파일 수는 적고 줄 수는 굵은** 소수 파일에 몰린다.

**바이브 코딩으로 나온 SQL 의 생김새 — 이 리포를 센 결과.** 명령문 178개 기준.

| 구문 | 명령문 178개 중 | 구문 | 명령문 178개 중 |
|---|---|---|---|
| `SELECT` 로 시작 | **92 (51%)** | 서브쿼리 `( SELECT` | 41 (23%) |
| `INSERT` 로 시작 | 35 (19%) | `JOIN` 있음 | 40 (22%) — 그중 `LEFT JOIN` 18 |
| `UPDATE` 로 시작 | 34 (19%) | `ORDER BY` | 56 (31%) |
| `DELETE` 로 시작 | 15 (8%) | `LIMIT` | 26 (14%) |
| `WITH`(CTE)로 시작 | **2 (1%)** | `GROUP BY` | 14 (8%) |
| 이름 있는 자리표 `:x` | **169 (94%)** | `HAVING` | **1 (0.6%)** |
| `COALESCE` | 19 (11%) | 집계 함수 | 29 (16%) |
| `ON CONFLICT`(업서트) | 20 (11%) | 윈도 함수 `OVER (` | **0** |

이행 6판에서는 `CREATE TABLE` 34 · `CREATE INDEX` 24 · `REFERENCES`/`FOREIGN KEY` 78 · `CHECK(` 55 ·
`NOT NULL` 252 · `PRAGMA` 8. **`CREATE VIEW` 0 · `CREATE TRIGGER` 0.**

여기서 세 가지가 나온다. ① **문장이 짧다** — 중앙값 3줄, 최대 25줄. T0 창 하나에 문장 하나가 통째로 들어간다.
② **읽기와 쓰기가 반반이다** — `SELECT` 51% 대 `INSERT`+`UPDATE`+`DELETE` 46%. 「SQL = 조회」가 아니다.
③ **고급 구문이 안 나온다** — 윈도 함수 0, CTE 2, `HAVING` 1. 심화 개념 몇은 이 리포에서 카드가 0장이다(§4).

---

## §2 기초 — 바닥 여덟

D147 의 축(식만이 아니라 **문**)을 SQL 로 옮기면 「절(clause)」이 문의 자리를 맡는다.
SQL 에는 `if`·`while`·함수 정의가 없으므로 여덟 자리를 **읽는 축 여섯 + 쓰는 축 둘**로 나눴다.

| # | id | name.ko / en | token | universal | diff. | prereq | **이 언어라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 1 | `sql/text-literal` | 글자 값 적기 / Text literal | `'…'` | `common/text-literal` | 1 | — | 작은따옴표는 **값**, 큰따옴표는 **이름**이다. `WHERE name = "bob"` 은 `bob` 이라는 **열**과 견주라는 뜻이고, SQLite 는 그 열이 없으면 조용히 글자로 봐준다 |
| 2 | `sql/from-table` | 어느 표에서 가져올지 대기 / Naming the source | `FROM` | — | 1 | — | 적히기는 `SELECT` 아래인데 **먼저 도는 절**이다. 적힌 순서와 도는 순서가 다른 첫 자리 |
| 3 | `sql/select-list` | 볼 열 고르기 / Choosing columns | `SELECT` | `common/map-transform` | 1 | 2 | 한 번 적은 식이 **모든 행에 한 번씩** 적용된다. 반복문을 적을 자리가 아예 없다 |
| 4 | `sql/comparison` | 두 값 견주기 / Comparison | `=` | `common/comparison` | 1 | 1 | 같은 `=` 가 `WHERE` 에서는 **묻는 일**, `UPDATE … SET` 에서는 **넣는 일**이다. 어느 쪽인지는 기호가 아니라 **절**이 정한다 |
| 5 | `sql/where-filter` | 조건에 맞는 행만 남기기 / Filtering rows | `WHERE` | `common/filter-select` | 1 | 3, 4 | 행을 **하나씩 따로** 본다. 여러 행을 한꺼번에 봐야 아는 조건(`COUNT(*) > 3`)은 여기 못 쓴다 |
| 6 | `sql/null-check` | 값이 없는 자리 가려내기 / Testing for absence | `IS NULL` | **null** | 2 | 4 | `= NULL` 은 **틀렸다고 안 하고 아무것도 안 맞는다**. 거짓이 아니라 「모름」이라서 `WHERE` 가 그 행을 버린다 |
| 7 | `sql/order-by` | 줄 세우기 / Ordering rows | `ORDER BY` | `common/ordering` (신규) | 2 | 3 | 이걸 안 쓰면 **순서가 없다**. 어제 나온 순서가 오늘도 같으리라는 약속이 없다 |
| 8 | `sql/update-set` | 있는 행의 값 바꾸기 / Updating rows | `SET` | `common/reassignment` | 2 | 4, 5 | `WHERE` 를 빠뜨린 `UPDATE` 는 **표 전체**를 바꾼다. 오류가 아니라 **성공**으로 끝난다 |

6번을 `common/absent-value` 에 안 붙인 이유는 §6 에 적었다. 이 한 칸이 D4 전이 모델의 경계다.

---

## §3 중심 — 16개

각 줄 끝의 문장은 **「이 개념이 없으면 그 언어로 짠 코드를 왜 못 읽나」**다.

| # | id | name.ko / en | token | universal | diff. | prereq | 이 언어라서 다른 것 / 없으면 못 읽는 이유 |
|---|---|---|---|---|---|---|---|
| 9 | `sql/insert-row` | 새 행 넣기 / Inserting a row | `INSERT INTO` | `common/mutating-append` | 1 | 1, 2 | 열 이름을 안 적으면 **표에 적힌 순서**로 값이 들어간다 — 나중에 열이 하나 늘면 조용히 어긋난다. 이 리포 35개(19%) |
| 10 | `sql/delete-row` | 행 지우기 / Deleting rows | `DELETE FROM` | — | 2 | 5 | 되돌리는 낱말이 없다. `WHERE` 없는 `DELETE` 는 표를 비우고 성공을 돌려준다 |
| 11 | `sql/named-param` | 값 자리 비워 두기 / Bound parameter | `:name` | — | 1 | 1 | **169/178(94%)** 에 나온다. `:repoId` 는 SQL 이 아니라 **드라이버가 채우는 자리**다 — 문자열로 이어 붙이지 않는 이유(주입)가 여기 있다. 이걸 모르면 이 리포의 어느 문장도 못 읽는다 |
| 12 | `sql/qualified-column` | 어느 표의 열인지 밝히기 / Qualified column | `t.col` | — | 1 | 2 | 이 리포에 820번. 점이 **안으로 들어가는 것이 아니다** — `c.kind` 는 `c` 안을 뒤지는 게 아니라 「`kind` 는 어느 표 것인가」를 고르는 것이다. `FROM mastery m` 의 `m` 은 그 문장 안에서만 사는 이름이다 |
| 13 | `sql/arithmetic` | 셈하기 / Arithmetic | `-` | `common/arithmetic` | 1 | 3 | 정수끼리 `/` 는 **정수 나눗셈**이다(`3/2 = 1`) — 파이썬과 정반대다. 그리고 어느 한쪽이 `NULL` 이면 결과가 통째로 `NULL` 이다 |
| 14 | `sql/case-when` | 조건으로 값 고르기 / Conditional value | `CASE WHEN` | `common/conditional-expression` | 2 | 3, 4 | SQL 에는 `if` **문이 없다**. 갈래는 문이 아니라 **값**이라 열이 놓이는 자리에만 온다 |
| 15 | `sql/join-inner` | 두 표를 짝지어 붙이기 / Inner join | `JOIN … ON` | — | 2 | 4, 12 | 옆으로 붙이는 것이 아니라 **짝이 맞는 조합을 전부** 만든다. 오른쪽에 짝이 둘이면 왼쪽 행이 두 줄이 된다. `ON` 을 빠뜨리면 막지 않고 **모든 조합**을 준다 |
| 16 | `sql/join-left` | 짝이 없어도 왼쪽은 남기기 / Left join | `LEFT JOIN` | — | 3 | 6, 15 | 짝이 없으면 오른쪽 열이 **`NULL` 로 채워진다**. 그래서 그 뒤 `WHERE` 에 오른쪽 열 조건을 쓰면 그 행이 탈락해 `LEFT` 가 조용히 `INNER` 가 된다. 이 리포 18개(10%) |
| 17 | `sql/aggregate` | 여러 행을 한 값으로 접기 / Aggregate | `COUNT(` | `common/aggregate` (신규) | 2 | 3, 6 | 결과의 **행 수가 입력의 행 수와 달라지는** 유일한 자리. `COUNT(*)` 는 행을 세고 `COUNT(col)` 은 `NULL` 을 빼고 센다 |
| 18 | `sql/group-by` | 같은 값끼리 묶기 / Grouping rows | `GROUP BY` | — | 3 | 17 | 묶은 뒤에는 **묶음을 대표하는 값만** 고를 수 있다. 표준은 그 밖의 열을 오류로 막지만 **SQLite 는 묶음 안에서 아무 행이나 골라 준다** — 틀린 답이 조용히 나온다 |
| 19 | `sql/having` | 묶은 뒤에 거르기 / Filtering groups | `HAVING` | — | 3 | 5, 18 | `WHERE` 는 묶기 **전** 행을, `HAVING` 은 묶은 **뒤** 묶음을 거른다. 이 리포에는 **1개뿐**이라 카드가 한 장 나온다 |
| 20 | `sql/subquery` | 괄호 안에 또 다른 조회 / Subquery | `( SELECT` | — | 3 | 3, 5 | 괄호 안의 `SELECT` 가 **값 하나**인지 **표 하나**인지는 놓인 자리가 정한다. 이 리포 41개(23%), 한 문장에 최대 4겹 |
| 21 | `sql/exists` | 있기만 하면 되는 조건 / Existence test | `EXISTS` | `common/exists-any` (신규) | 3 | 20 | 안쪽이 **무엇을 고르는지 안 본다** — 행이 하나라도 있는지만 본다. 그래서 이 리포가 전부 `SELECT 1 FROM …` 로 쓴다 |
| 22 | `sql/limit-offset` | 몇 줄만 가져오기 / Limiting rows | `LIMIT` | — | 2 | 7 | `ORDER BY` 없이 쓰면 **어느 행이 올지 약속이 없다**. 「상위 10개」가 아니라 「아무 10개」다 |
| 23 | `sql/coalesce` | 없을 때 채우기 / Default for absence | `COALESCE` | `common/nullish-default` | 2 | 6 | 이 언어에서 「없으면 기본값」은 연산자가 아니라 **함수**다 — 처음으로 `NULL` 이 아닌 인자를 고른다 |
| 24 | `sql/on-conflict` | 없으면 넣고 있으면 고치기 / Upsert | `ON CONFLICT` | — | 3 | 8, 9 | 「먼저 찾아보고 없으면 넣는다」를 **한 문장**으로 쓴다. 어느 제약이 부딪혔는지를 괄호에 적어야 한다. 이 리포 20개(11%) — 그런데 문법이 이 구문을 못 읽는다(§8) |

---

## §4 심화 — 8개

「SQL 을 쓰는 사람」과 「데이터베이스로 공학하는 사람」이 갈리는 자리.
**이 리포의 사용처 수를 같이 적었다** — 0인 것은 카드가 안 구워진다.

| # | id | name.ko / en | token | universal | diff. | prereq | 이 언어라서 다른 것 (사용처) |
|---|---|---|---|---|---|---|---|
| 25 | `sql/cte` | 조회에 이름 붙여 두기 / CTE | `WITH` | `common/variable-binding` | 3 | 20 | 이름이 **그 문장 안에서만** 산다 — 다음 문장에서 못 부른다. 서브쿼리를 위로 끌어올려 **읽는 순서를 도는 순서와 맞추는** 유일한 도구 (이 리포 2) |
| 26 | `sql/window-function` | 접지 않고 이웃을 보기 / Window function | `OVER (` | — | 4 | 7, 17 | 집계와 반대로 **행 수를 안 줄인다** — 각 행 옆에 그 행이 속한 무리의 값을 붙인다 (이 리포 **0** — 카드 0장) |
| 27 | `sql/transaction` | 여러 문장을 한 덩어리로 / Transaction | `BEGIN` | — | 4 | 8, 9 | 「반만 되는 일」을 없앤다. 이 리포에서는 트랜잭션이 **SQL 이 아니라 TypeScript**(`store-sql/src/tx.ts`)에 있어 `.sql` 파일에는 한 번도 안 나온다 (이 리포 0) |
| 28 | `sql/index` | 찾는 시간만 줄이는 곁표 / Index | `CREATE INDEX` | — | 3 | 5, 7 | **답을 안 바꾸고 시간만** 바꾼다. 지워도 결과는 같고 앱만 느려진다 — 그래서 없어도 시험이 통과한다 (이행 24) |
| 29 | `sql/foreign-key` | 다른 표의 행을 가리키기 / Foreign key | `REFERENCES` | — | 3 | 9, 15 | **SQLite 는 외래 키를 기본으로 안 켠다** — `PRAGMA foreign_keys=ON` 없이는 제약이 적혀 있어도 아무 일도 안 한다 (이행 78) |
| 30 | `sql/constraint-check` | 넣기 전에 막을 조건 / Check constraint | `CHECK (` | — | 2 | 4, 9 | SQLite 는 **나중에 못 고친다** — `ALTER TABLE` 로 제약을 바꿀 수 없어 표를 새로 만들어 옮겨야 한다(이 리포가 D120 에서 실제로 걸린 자리) (이행 55) |
| 31 | `sql/query-plan` | 고른 길 읽기 / Query plan | `EXPLAIN QUERY PLAN` | — | 4 | 15, 28 | 「어떻게 할지」를 안 적었으므로 **읽어야만 안다**. 명령형 언어에는 이런 층이 없다 (이 리포 0) |
| 32 | `sql/normalization` | 같은 사실을 한 곳에만 / Normalization | — | — | 4 | 15, 29 | 표를 나누는 일 자체에 **구문이 없다** — `CREATE TABLE` 여러 개로만 드러난다. 그래서 캡처 쿼리로 못 잡고 스키마 전체를 봐야 한다 (표 34) |

---

## §5 prereq 그래프와 0장 적재량

루트 둘: `sql/text-literal`(값이 무엇인지) · `sql/from-table`(어디서 가져오는지).

| 깊이 | 개수 | 개념 |
|---|---|---|
| 0 | 2 | text-literal · from-table |
| 1 | 5 | select-list · comparison · named-param · qualified-column · insert-row |
| 2 | 7 | where-filter · null-check · order-by · arithmetic · join-inner · case-when · constraint-check |
| 3 | 9 | update-set · delete-row · limit-offset · coalesce · subquery · join-left · aggregate · index · foreign-key |
| 4 | 8 | exists · group-by · cte · on-conflict · transaction · window-function · query-plan · normalization |
| 5 | 1 | having |

**깊이 ≤ 2 = 14/24.** TS 21/24 · 파이썬 19/24 와 견주면 **눈에 띄게 얕다.**

왜 이렇게 나오나. TS·파이썬은 깊이 0~1 에 **평평한 어휘 층**이 있다 — 리터럴·연산자·속성 접근은 서로를
안 부르므로 열 몇 개가 한꺼번에 루트에 선다. SQL 에는 그 층이 없다. 절 하나하나가 **이미 성립한 문장 안에서만**
뜻을 가지므로(`WHERE` 는 `FROM`+`SELECT` 가 있어야 말이 된다) 개념이 사슬로 늘어선다.
`having` 이 깊이 5 인 것이 그 끝이다 — `text-literal → comparison → null-check → aggregate → group-by → having`.

**사이클은 없다.** 절의 실행 순서(`FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`)가
자연스러운 위상 정렬을 준다. TS 에서 `function-definition ↔ call-expression` 같은 상호 참조가 생기는 자리가
SQL 에는 없다 — 끊을 데가 없었다.

**결과.** SQL 만 있는 리포의 0장은 **14판 = 7일**(D12 새 판 2장)이다. TS 는 24판 12일이다.
상한 24 는 한 번도 안 걸리므로 「무엇을 자를까」 규칙이 **일을 하나도 안 한다** — D147 이 TS 에서 「거의 안 한다」고
적은 것의 극단이다. 자를 게 없으므로 자르는 규칙은 그대로 두면 된다.

### T0 / T1 / T2 트랙 적합성

| 트랙 | 성립? | 근거 |
|---|---|---|
| **T0** (문법) | **성립** | 문장 중앙값 3줄·최대 25줄이라 코드 창 하나에 문장이 통째로 들어간다. 32개 중 29개가 캡처 쿼리로 잡힌다(못 잡는 셋은 §8) |
| **T1** (클론 코딩) | **성립하되 두 곳을 고쳐야** | ① `packages/cards/src/t1-block.ts:56-57` 의 `commentPrefix()` 가 파이썬이면 `#`, **그 밖은 전부 `//`** 를 준다 — SQL 주석은 `--` 라 「이어짐」 머리글이 문법 오류로 붙는다. ② `block.kind` 가 `function\|method\|class\|file\|segment` 인데 SQL 에는 앞 셋이 없다. `_blocks.scm` 은 `(statement)` 를 블록으로 잡아야 한다. 그리고 D152 ⓑ(들여쓰기 유지)가 **거꾸로다** — SQL 은 공백이 완전히 무의미하고 키워드 대소문자도 무의미하다(`select` 와 `SELECT` 가 같은 트리). 채점은 **공백과 키워드 대소문자를 둘 다 정규화**해야 한다 |
| **T2** (구조) | **지금 모양으로는 안 성립** | `resolveImports`(`packages/concepts/src/resolve-imports.ts`)에 `ts·py·go·rs·dart` 는 있고 SQL 은 없다 — **없는 게 아니라 쓸 수 없다.** SQLite SQL 에는 `import`/`include` 가 아예 없어 파일↔파일 간선이 0이다 |

**T2 를 SQL 에서 살릴 수 있는가 — 판단.** 살릴 수 있지만 **지금 T2 가 아니다.**
SQL 의 구조 그래프는 실재한다 — 이 리포에 표 34개와 `REFERENCES` 간선 78개가 있다. 문제는 모양이 다르다는 것이다.
`import_edge` 는 `PRIMARY KEY (from_file_id, to_file_id, kind)` 로 **파일→파일**인데 FK 는 **표→표**다.
이 리포는 표 34개가 `0001_init.sql` 한 파일에 있으므로 78개 간선이 전부 같은 `(file, file)` 로 접혀 **한 행**이 된다.
즉 스키마 T2 는 노드도 간선도 새로 만들어야 하고, 그러면 마이그레이션이 생긴다(D151·D154 가 피한 바로 그 값).
**권고 — SQL 은 T0+T1 로 먼저 내고 스키마 T2 는 별도 결정으로 미룬다.**

---

## §6 common/ 재사용 대 신규

### 재사용 — **10/30 (33%)**

| `sql/<concept>` | → `common/<id>` | 전이가 옳은 이유 |
|---|---|---|
| `text-literal` | `text-literal` | 글자 값은 어디서나 글자 값이다. 다른 것은 따옴표 규칙뿐 |
| `select-list` | `map-transform` | 「항목마다 바꿔 새로 만들기」가 `SELECT` 목록이 하는 일 그대로다 |
| `comparison` | `comparison` | 기호만 다르다(`<>`) |
| `where-filter` | `filter-select` | 「조건으로 골라내기」와 같다 |
| `update-set` | `reassignment` | 다른 것은 **개수**다 — 하나가 아니라 조건에 맞는 전부. D4 의 「표기 차이」 카드가 정확히 이걸 짚는다 |
| `insert-row` | `mutating-append` | 있던 묶음에 직접 더한다. 복사본이 안 생긴다 |
| `arithmetic` | `arithmetic` | 나눗셈 결과가 다르지만 셈은 셈이다 |
| `case-when` | `conditional-expression` | 「조건으로 값 고르기」와 같다. 문이 아니라 식인 것까지 같다 |
| `coalesce` | `nullish-default` | 연산자가 함수인 것만 다르다 |
| `cte` | `variable-binding` | 결과에 이름을 붙여 아래에서 쓴다 — `const x = …` 와 같은 일 |

**안 쓰는 것 20개**: `absent-value` · `async-await` · `boolean-value` · `conditional-branch` · `copy-with-changes` ·
`destructuring` · `function-call` · `function-definition` · `function-value` · `generics` · `iterate` · `list` ·
`loop-while` · `member-access` · `number-literal` · `optional-chaining` · `promise-chain` · `return-value` ·
`string-interpolation` · `try-catch`.

**이 수치의 뜻.** 파이썬은 21/30(75%)이었다. SQL 은 10/30(33%)이다.
차이는 난이도가 아니라 **`common/` 30개의 성격**이다. 30개 중 다수가 *명령형의 어휘*다 —
반복(`iterate`·`loop-while`), 함수(`function-definition`·`function-value`·`return-value`),
흐름 갈래(`conditional-branch`), 실패 처리(`try-catch`), 비동기(`async-await`·`promise-chain`).
SQL 에는 그 자리가 **없다.** 전이되는 10개는 전부 *자료에 대한 것*이다 — 값·견주기·골라내기·바꿔 새로 만들기.

**그래서 이것이 D4 의 경계다.** 숙련도 전이는 「같은 개념, 다른 표기」를 전제로 3겹 이상이면 첫 노출을 1겹으로 준다.
TS 나 파이썬을 다 올린 사용자가 SQL 에 와도 **SQL 개념 32개 중 19개(59%)는 빌릴 데가 없어** 0겹에서 시작한다.
반대쪽에서 세면 `common/` 30개 중 20개가 SQL 에서 한 번도 안 쓰인다 — 쌓아 둔 겹이 갈 곳이 없다.
D148 의 「두 번째 언어부터 싸진다」는 **패러다임이 같을 때만** 참이다.
SQL 은 그 문장에 「같은 패러다임 안에서」라는 조건이 붙어 있었음을 드러낸다.

### 신규 제안 — 3개

| id | name.ko / en | 다른 언어 둘 이상에서 성립하는 근거 |
|---|---|---|
| `common/ordering` | 순서대로 줄 세우기 / Ordering | JS `arr.sort((a,b)=>a.x-b.x)` · Python `sorted(xs, key=…)` · Rust `sort_by_key` — 셋 다 「기준을 주고 줄 세운다」다 |
| `common/aggregate` | 여럿을 한 값으로 접기 / Aggregate | JS `arr.reduce` · Python `sum()`/`max()` · Rust `iter().sum()` — 셋 다 「모음을 값 하나로」다 |
| `common/exists-any` | 하나라도 있는지 묻기 / Existence test | JS `arr.some(f)` · Python `any(…)` · Rust `iter().any(f)` — 셋 다 「전부가 아니라 하나라도」다 |

### `universal: null` 로 둘 것 — 그리고 그 중 하나는 일부러

18개 — `from-table` · `delete-row` · `named-param` · `qualified-column` · `join-inner` · `join-left` ·
`subquery` · `group-by` · `having` · `limit-offset` · `on-conflict` · `window-function` · `transaction` ·
`index` · `foreign-key` · `constraint-check` · `query-plan` · `normalization`. 전이할 데가 없다.
(10 재사용 + 3 신규 + 18 = 31. 남은 하나가 아래다.)

**`sql/null-check` 는 다르다.** `common/absent-value`(「값이 없음」)에 붙일 수 있어 **보이지만, 안 붙인다.**
표기는 거의 같다(`x IS NULL` 대 `x === null`). 다른 것은 **의미**다 —
`null === null` 은 참이고 `NULL = NULL` 은 참도 거짓도 아니다.
D4 의 전이는 「표기 차이」 카드를 먼저 주는데, 이 자리에서 표기 차이 카드는 **틀린 것을 가르친다.**
그래서 규칙 하나로 정리한다 — **차이가 표기나 개수면 전이하고, 차이가 의미면 끊는다.**
`update-set`(개수 차이)은 전이하고 `null-check`(의미 차이)는 끊는다.

---

## §7 cs/ 로 밀어낼 것

`cs.md` 에 이미 있는 것부터 잇는다.

| 기존 `cs/` | 어느 SQL 개념이 필요로 하나 |
|---|---|
| `cs/invariant` | `constraint-check` · `foreign-key` — 제약은 「언제나 참인 것」을 기계에 적어 두는 일이다 |
| `cs/complexity` | `index` · `query-plan` — 인덱스가 왜 답을 안 바꾸고 시간만 바꾸는지가 여기서만 설명된다 |
| `cs/race-condition` | `transaction` |
| `cs/state` | `update-set` · `delete-row` |
| `cs/text-encoding` | `order-by` — `ORDER BY name` 이 한글을 어떤 순서로 세우는가(collation) |
| `cs/static-vs-dynamic-typing` | `comparison` · `constraint-check` — SQLite 는 열의 타입이 **권고**라 `INTEGER` 열에 글자가 들어간다 |
| `cs/null-reference` | `null-check` — **대비용**이다. 「없는 참조」와 「모르는 값」이 다르다는 것을 여기서 가른다 |

### 새 `cs/` 후보 5

| id | 한 줄 정의 | 필요로 하는 SQL 개념 |
|---|---|---|
| `cs/declarative-vs-imperative` | 무엇을 원하는지 적기와 어떻게 할지 적기의 차이 | `select-list` (사실상 이 편 전체의 뿌리) |
| `cs/set-vs-sequence` | 순서가 없는 모음과 있는 모음 | `order-by` · `limit-offset` · `select-list` |
| `cs/three-valued-logic` | 참·거짓 말고 「모름」이 있는 논리 | `null-check` · `join-left` · `having` · `coalesce` |
| `cs/cardinality` | 두 모음을 짝지으면 결과가 몇 줄인가 (1:1 · 1:N · N:M) | `join-inner` · `join-left` · `foreign-key` · `normalization` |
| `cs/search-tree` | 정렬해 둔 곁표로 반씩 줄여 찾기 (B-트리) | `index` · `query-plan` |

`cs/transaction-isolation`(동시에 고칠 때 무엇이 보이나)도 후보였으나 기존 `cs/race-condition` 과 겹치는 부분이
커서 뺐다. `sql/transaction` 하나가 요구하는 것이므로 `cs/race-condition` 에 격리 수준을 한 줄 더 붙이는 쪽을 권한다.

---

## §8 tree-sitter 현실 — **직접 파싱해서 잰 것**

| 항목 | 값 | 확인 방법 |
|---|---|---|
| `grammar` 키 | `sql` | `crates/parse/src/langs.rs:22` |
| 크레이트 | `tree-sitter-sequel 0.3.11` (상류 `DerekStride/tree-sitter-sql`) | `Cargo.lock` · `crates/parse/Cargo.toml:16` |
| `grammar_abi` | **14** | 벤더된 `src/parser.c:7` 의 `LANGUAGE_VERSION` |
| 노드 종류 | 전체 **729개** — 이름 있는 것 **523개**, 그중 **`keyword_*` 가 356개** | `src/node-types.json` · `Language::node_kind_count()` |
| 확장자 | `.sql` | |
| 기능 플래그 | `lang-sql` — 기본값에 포함 | `crates/parse/Cargo.toml:32` |

**키워드가 노드다.** 파이썬·TS 는 키워드가 익명 노드라 캡처 쿼리가 부모 노드로만 앵커를 잡는데,
이 문법은 `(keyword_where)`·`(keyword_group)` 처럼 **키워드 하나하나에 직접 앵커를 걸 수 있다.**
절 단위 개념(§2~§3 의 대부분)에는 선물이다. 대가는 `langs.rs` 의 `grammar_version`(`{abi}-{node_kind_count}`)이
`14-729` 인데 **키워드가 하나만 늘어도 바뀐다**는 것이다 — 이 문법은 Postgres·MySQL·Hive 를 계속 흡수하므로
다른 언어보다 이 문자열이 자주 흔들린다. 03 §2.2 의 「조용히 빈 쿼리」가 SQL 에서 제일 잘 난다.

### 방언이 문제다 — 실측

문법은 **방언 합집합**이다. 노드 종류에 Postgres(`dollar_quote`·`keyword_jsonb`·`keyword_bigserial`·`keyword_regclass`),
MySQL(`keyword_auto_increment`·`keyword_zerofill`·`row_format`·`keyword_engine`),
Hive(`stored_as`·`keyword_orc`·`keyword_parquet`·`storage_location`)가 전부 들어 있다.
**SQLite 는 안 들어 있다.** 문법 정의에서 `pragma`·`autoincrement`·`rowid`·`glob`·`insert or` 가 0회다.

조각 66개를 실제로 파싱해 본 결과(`tree-sitter-sequel 0.3.11`, ABI 14):

| 깨지는 것 (SQLite·이식성 구문) | 잘 되는 것 |
|---|---|
| **`:name` 자리표** ← 이 리포 94% | `?` · `$1` · `@id` 는 `(parameter)` 로 잘 된다 |
| `PRAGMA …` → 문장 전체가 `(ERROR)` | `JOIN` · `LEFT JOIN` · `GROUP BY` · `HAVING` |
| `AUTOINCREMENT` | `WITH`(CTE) · `OVER (…)` 윈도 함수 |
| **`ON CONFLICT (col) DO …`** ← 이 리포 11% | `ON CONFLICT DO NOTHING`(대상 괄호 **없을 때만**) |
| `INSERT OR REPLACE` | MySQL 의 `ON DUPLICATE KEY UPDATE` — **된다** |
| `BEGIN` · `COMMIT` · `ROLLBACK` · `SAVEPOINT` (전부) | `CASE WHEN` · `EXISTS` · `NOT IN` · `UNION ALL` · `DISTINCT` |
| `EXPLAIN QUERY PLAN` | `CREATE INDEX`(부분 인덱스 포함) · `CREATE VIEW` · `ALTER TABLE ADD COLUMN` |
| `CREATE TRIGGER … BEGIN … END` | `<>` 와 `!=` 둘 다 · 소문자 키워드 · `--` 주석 · 쉼표 조인 |
| `CHECK (x BETWEEN 1 AND 3)` (`WHERE` 안의 `BETWEEN` 은 됨) | `CHECK (x IN (…))` · `CHECK (x >= 1 AND x <= 3)` |
| `?1`(SQLite 번호 자리표) | `REFERENCES … ON DELETE CASCADE` · 자기 조인 |

MySQL 의 업서트는 되는데 SQLite 의 업서트는 안 된다 — **이 한 줄이 「합집합 문법은 SQLite 가 아니다」의 증거**다.

### 가장 위험한 것은 `:name` 이다 — 조용히 깨지기 때문에

이 리포 21파일을 전부 파싱하면 **20파일에서 ERROR 노드가 나온다**(총 646개).
그런데 `crates/parse/src/query.rs` 의 `POOR_BYTE_RATIO = 0.05` 로 재면 **`poor` 로 걸리는 파일은 1개뿐**이다
(`0001_init.sql`, 0.059). `:` 하나가 ERROR 바이트 1개라 비율이 안 오르기 때문이다.
**파일 관문은 통과하고 트리는 망가진다** — 이쪽이 통째로 떨어지는 것보다 나쁘다.

```
SELECT a FROM t WHERE id = :id;
→ (binary_expression left: (field (identifier))
                     (ERROR)                       ← ':' 가 여기
                     right: (field (identifier)))  ← 'id' 가 열 참조로 읽힌다
```

`binary_expression` 이 **살아 있으므로** `sql/comparison` 캡처 쿼리는 정상적으로 매치되고,
오른쪽 피연산자를 「열 이름」이라고 가르친다. 값이 들어올 자리인데 열이라고 한다. 답이 틀린 카드가 구워진다.

**해야 할 일 셋.** ① `sql/comparison`·`sql/where-filter` 의 `.scm` 에 `(ERROR)` 형제를 배제하는 앵커를 넣는다
(파이썬이 연쇄 비교를 「자식이 정확히 둘」로 잘라낸 것과 같은 수법). ② `sql/named-param`·`sql/on-conflict`·
`sql/transaction` 셋은 **문법이 고쳐질 때까지 사전에 올리지 않는다** — 32개 중 3개다.
③ 상류(`DerekStride/tree-sitter-sql`)에 `:name`·`PRAGMA`·`ON CONFLICT (col)` 규칙을 올리거나,
SQLite 전용 문법(`tree-sitter-sqlite` 계열)으로 갈아탈지를 별도 결정으로 판단한다.
후자를 고르면 `grammar` 키는 `sql` 그대로 두고 `langs.rs` 한 줄만 바꾸면 된다(D19 가 이미 그렇게 분리해 뒀다).

---

## §9 오개념 8~12

| # | 무엇을 믿나 → 실제로는 | 출처 |
|---|---|---|
| 1 | `WHERE x = NULL` 로 빈 값을 찾을 수 있다 → 아무 행도 안 맞는다. 결과가 「거짓」이 아니라 「모름」이라 `WHERE` 가 버린다. `IS NULL` 을 써야 한다 | 삼치 논리는 SQL 표준의 정의 |
| 2 | 적힌 순서대로 돈다(`SELECT` 가 먼저) → `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`. 그래서 `SELECT` 에서 붙인 별칭을 `WHERE` 에서 못 쓴다 | Miedema et al. 2021 — 참가자들이 `GROUP BY` 를 맨 앞에 놓고 `SELECT`·`FROM`·`WHERE` 순서를 바꿔 적었다 |
| 3 | `WHERE COUNT(*) > 3` 이 된다 → 집계는 `SELECT` 와 `HAVING` 에만 온다. `WHERE` 시점에는 아직 묶음이 없다 | Miedema et al. 2021 |
| 4 | `GROUP BY` 없이 집계 열과 보통 열을 섞어도 된다 / 묶을 열을 안 적어도 된다 → 표준은 오류, **SQLite 는 묶음에서 아무 행이나 골라 준다**. 틀린 답이 조용히 나온다 | Taipalus 2020 — 「불필요하거나 빠진 그룹 열」이 집계 쿼리 1,486건에서 빈도 **0.40** 으로 1위 |
| 5 | `JOIN` 은 두 표를 옆으로 붙인다 → 짝이 맞는 **조합을 전부** 만든다. 오른쪽에 짝이 둘이면 왼쪽 행이 두 줄이 된다 | Ahadi et al. 2016 — 의미 오류가 `JOIN`·서브쿼리·`GROUP BY` 쿼리에 몰린다 |
| 6 | 조인 조건을 안 적어도 외래 키로 알아서 잇는다 → 모든 조합(데카르트 곱)이 나온다 | Taipalus 2020 — `missing join` 0.12 · `omitting a join` 0.07, 둘 다 **끝내 안 고쳐지는** 오류. 원인은 「단서 없음」 |
| 7 | `LEFT JOIN` 뒤에 `WHERE b.x = 1` 을 써도 왼쪽이 다 남는다 → 짝 없는 행은 `b.x` 가 `NULL` 이라 그 조건에서 탈락한다. `LEFT` 가 조용히 `INNER` 가 된다 | 오개념 1의 따름 |
| 8 | `ORDER BY` 없이도 넣은 순서대로 나온다 → 순서가 없다. SQLite 는 대개 `rowid` 순으로 나와 **더 잘 속는다** — 인덱스가 하나 생기면 그날 순서가 바뀐다 | 집합 의미론 |
| 9 | `UPDATE`/`DELETE` 에 `WHERE` 를 빼면 데이터베이스가 막아 준다 → 안 막는다. 표 전체를 바꾸고 **성공**을 돌려준다 | |
| 10 | `"…"` 로 글자 값을 쓸 수 있다 → 표준에서 큰따옴표는 **이름**이다. SQLite 는 그런 이름이 없으면 글자로 봐주는 옛 관용이 남아 있어 한 곳에서만 조용히 다르게 돈다 | SQLite 의 알려진 호환 기능 |
| 11 | `NOT IN (서브쿼리)` 는 안 맞는 것을 다 준다 → 서브쿼리 결과에 `NULL` 이 **하나라도** 있으면 전부 탈락해 0행이 된다. `NOT EXISTS` 는 그러지 않는다 | 오개념 1의 따름 |
| 12 | `DISTINCT` 는 함수라 `DISTINCT(x)` 로 한 열에만 건다 → 고른 열 **전부의 조합**에 걸린다. 괄호는 아무 일도 안 한다 | |

오개념 4·6 은 「끝내 고쳐지지 않는」 부류다 — Taipalus 2020 은 구문 오류와 의미 오류는 대개 학생이 스스로 고치고
**논리 오류가 안 고쳐진다**고 잰다(4개 코호트 987명). 그러니 진단(`diag`)을 붙일 우선순위가 4·6·5 다.

---

## §10 근거와 출처

**확인함**

- TIOBE Index 2026-08 — SQL 8위 1.88% (1위 Python 18.53%). <https://www.tiobe.com/tiobe-index/> (2026-09-04 조회)
- `tree-sitter-sequel 0.3.11` — 벤더 소스 `src/parser.c` 의 `LANGUAGE_VERSION 14`, `src/node-types.json` 의 이름 있는 노드 523개.
  상류 <https://github.com/DerekStride/tree-sitter-sql>
- 파싱 실측 — 이 리포 SQL 21파일과 조각 66개를 `tree-sitter-sequel 0.3.11` 로 직접 파싱. ERROR 646개 / 20파일,
  `POOR_BYTE_RATIO 0.05` 기준 `poor` 1파일
- 이 리포 계수 — `packages/store-sql/statements/*.sql`(명령문 178) · `migrations/*.sql`(표 34)
- Miedema, Aivaloglou, Fletcher (2021) *Identifying SQL Misconceptions of Novices: Findings from a Think-Aloud Study*,
  ICER '21. DOI <https://doi.org/10.1145/3446871.3469759> (CC BY 4.0, ICER '21 Honorable Mention).
  네 범주(선행 과목 지식 · 일반화 · 언어 · 불완전한 심성 모형)와 학생 21명 규모까지 확인
- Taipalus (2020) *Explaining Causes Behind SQL Query Formulation Errors*, FIE 2020.
  DOI <https://doi.org/10.1109/FIE44824.2020.9274114> — 전문 확인. 4코호트 987명, 오류 분류 4계층/18범주/105오류,
  §9 의 빈도 수치(0.40 · 0.12 · 0.07)는 이 논문의 표 III·VII
- Taipalus, Siponen, Vartiainen (2018) *Errors and Complications in SQL Query Formulation*, ACM TOCE.
  DOI <https://doi.org/10.1145/3231712> — 위 논문이 쓴 오류 분류의 원전
- Ahadi, Prior, Behbood, Lister (2016) *Students' Semantic Mistakes in Writing Seven Different Types of SQL Queries*,
  ITiCSE '16. DOI <https://doi.org/10.1145/2899415.2899464> — 초록·요약만 확인(본문 유료)
- **Exercism 에 `sql` 트랙이 없다.** `github.com/exercism/sql` 은 404 다.
  대신 `exercism/sqlite`(연습 81개)와 `exercism/plsql`(11개)이 있는데 **둘 다 `concepts: []` 이고
  `status.concept_exercises: false`** 다 — D148 이 쓰는 「깊이 0~3 개념 목록」이 **SQL 에는 존재하지 않는다.**
  그래서 §2 의 여덟은 외부 목록의 독립 검증 없이 **이 리포 계수와 오개념 연구만으로** 정했다. 검증 하나가 빈 자리다

**확인 못 함**

- Miedema et al. 의 **개별 오개념 목록**(번호와 문장) — ACM·TU/e 양쪽 모두 403/Cloudflare 로 본문을 못 열었다.
  §9 의 2·3·4 는 검색 결과에 인용된 요약에 근거하며 **원문 대조를 못 했다.** CC BY 4.0 이므로 접근만 되면 인용 가능하다
- Ahadi et al. 2016 본문 — 초록과 2차 인용만 봤다
- progmiscon.org — D148 대로 **재사용 라이선스가 없어** 열지 않았다
- 「바이브 코딩 SQL 의 생김새」는 **이 리포 한 개**의 계수다. 표본 1이다. ORM 을 쓰는 리포·Postgres 리포는
  분포가 다를 것이 거의 확실하다 — 특히 `:name` 대신 `$1`(Postgres)이나 `?`(MySQL)를 쓰면 §8 의 가장 큰 문제가 사라진다
