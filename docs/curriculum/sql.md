# SQL 커리큘럼 조사 — `sql`

조사 시점 2026-09-04. 열 편 중 **유일한 선언형**이라 다른 아홉의 개념 축(이름·반복·함수·조건·예외)이
거의 통째로 안 맞는다. 그 어긋남이 이 편의 내용이고, §6 의 재사용 수치가 그 크기다.

이 편은 **이 리포의 SQL 실물 21파일(2,432줄)을 세어서** 썼다 — 명령문 178개(`packages/store-sql/statements/`)와
이행 6판(`migrations/`, 표 34개). §1·§8 의 숫자는 추정이 아니라 계수와 실제 파싱 결과다.
**§0 은 표본을 하나 더 잰다**(`MonggleMonggle` · MySQL · 매퍼 9파일) — 무엇이 표본 특유이고 무엇이 SQL 특유인지 가르려고.

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

## §0 0부 — 값 하나가 아니라 표 하나

사용자 요청은 「기초부터 심화까지, **언어의 동작 원리부터**」다. 아홉 언어는 그 0부를 공통 축 여덟
(정수·실수·문자·참거짓·연산자·형 변환·대입·비교)으로 쓴다 — [`README.md`](./README.md) §8 이 그 뼈대다.
**SQL 은 그 축을 안 쓴다.** 억지로 맞추면 절반이 빈칸이 되고, 빈칸이 아니라 **다른 것이 들어가야 한다는 것**이
이 언어의 동작 원리다.

이 절은 §2(기초 — 절 여덟)의 **아래**다. §2 는 「어떻게 적나」이고 §0 은 「그 절이 무엇을 다루나」다.

---

### §0.1 아홉의 축은 SQL 에서 셋만 그대로 선다

| 공통 축 (아홉) | SQL | 왜 |
|---|---|---|
| **정수** — 자릿수가 정해져 있다 | 자리가 옮겨간다 | 타입이 값이 아니라 **열**에 붙는다. 벗은 정수 리터럴이 오는 자리는 `LIMIT` 뒤·`DEFAULT` 뒤·`VALUES` 안뿐이다 |
| **실수** — 근사값이다 | 거의 안 선다 | 표본 둘 다 부동소수 열이 **0개**다 (MonggleMonggle 9표에 `double`·`float` 0 · 이 리포 34표에 `REAL` 0). 돈·점수를 `INTEGER`·`DECIMAL` 로 잡아서다 |
| **문자** — 글자와 바이트는 다르다 | 그대로 선다 | `VARCHAR(30)` 이 30글자인지 30바이트인지가 방언·collation 마다 다르다 |
| **참거짓** | **셋이 된다** | 참·거짓·**모름**. 이 한 축이 SQL 0부의 절반이다 |
| **연산자** — 우선순위 | 그대로 선다 | `AND` 가 `OR` 보다 먼저 묶인다. 괄호 없는 `WHERE a=1 OR b=2 AND c=3` 은 `a=1 OR (b=2 AND c=3)` 이다 |
| **형 변환** | 그대로 서되 더 조용하다 | 명시 변환(`CAST`/`CONVERT`)이 **두 표본 합쳐 0곳**이다. 일어나는 변환은 전부 암묵이라 화면에 안 보인다 |
| **대입** — 이름에 값 붙이기 | **없다** | 변수가 없다. `=` 는 묻는 일이고, `UPDATE … SET` 안에서만 넣는 일이다 |
| **비교** | 값 하나가 아니라 **행마다 한 번씩** | 식을 한 번 적으면 행 수만큼 평가된다. 반복을 적을 자리가 아예 없다 |

**셋이 그대로 서고(문자·연산자·형 변환), 하나가 사라지고(대입), 넷이 다른 것이 된다.** 그 넷이 아래 여덟의 뼈대다.

---

### §0.2 SQL 의 0부 여덟

「이 여덟을 모르면 §2 의 절 여덟이 **왜 그렇게 도는지**를 못 배우고 외우게 된다」가 고른 기준이다.
`cs/` 열은 [`cs.md`](./cs.md) 의 43장 중 이 개념이 요구하는 것이고, **굵은 것은 아직 없는 장**이다.

| # | id | name.ko / en | 한 줄 | `cs/` | 그림 | 초보가 실제로 틀리는 자리 |
|---|---|---|---|---|---|---|
| 0-1 | `sql/row-and-set` | 단위는 행이다 / Rows, not values | 다루는 것이 값 하나가 아니라 **행의 모음**이고, 그 모음에는 순서가 없다 | `set-vs-sequence` · `declarative-vs-imperative` | **행 격자**(신규) | 「첫 행」이 있다고 믿는다. `ORDER BY` 없는 `LIMIT` 이 이 리포 26곳·MonggleMonggle 140곳인데 그중 순서를 약속받는 것은 `ORDER BY` 가 붙은 것뿐이다 |
| 0-2 | `sql/column-type` | 타입은 값이 아니라 열에 붙는다 / Types live on columns | 값을 적을 때 타입을 안 적는다. 자리가 타입을 이미 정해 놨다 | `type` · `static-vs-dynamic-typing` | 타입 변환 사다리 | MySQL 에 불리언 타입이 **없어** `TINYINT(1)` 이다(MonggleMonggle 3곳). SQLite 는 열 타입이 **권고**라 `INTEGER` 열에 글자가 들어가고 오류가 안 난다 |
| 0-3 | `sql/value-and-name` | 따옴표가 값과 이름을 가른다 / Literal or identifier | `'…'` 는 값, 그 밖은 이름. 어느 따옴표가 이름인지는 방언이 정한다 | `text-encoding` | 값 상자(값/이름 두 칸) | `WHERE name = "bob"` 은 `bob` 이라는 **열**과 견주라는 뜻이다. MySQL 은 백틱이 이름(MonggleMonggle 898곳)이고, SQLite 는 그 이름이 없으면 조용히 글자로 봐준다 |
| 0-4 | `sql/null-unknown` | 없음이 아니라 모름 / Unknown, not empty | `NULL` 은 「빈 값」이 아니라 「값을 모른다」는 표시다. 모름끼리는 같은지도 모른다 | **`three-valued-logic`** · `null-reference`(대비) | **진리표 3×3**(신규) | `= NULL` 은 오류가 아니라 **아무 행도 안 맞는다**. MonggleMonggle 매퍼 9파일 중 **6파일**이 `IS NULL` 을 쓰고(23곳) 그 앱의 삭제 기능 전체가 이 한 개념 위에 서 있다 |
| 0-5 | `sql/three-valued-comparison` | 견주기가 내는 답이 셋 / Three-valued comparison | 비교의 결과가 참·거짓·**모름**이고, `WHERE` 는 참만 남긴다 — 모름은 거짓과 **같이** 버려지는데 `NOT` 을 씌우면 갈린다 | **`three-valued-logic`** | 평가 트리(3색) | `NOT IN (서브쿼리)` 안에 `NULL` 이 하나라도 있으면 결과가 **0행**이다. `NOT EXISTS` 는 그러지 않는다 |
| 0-6 | `sql/implicit-cast` | 타입이 다르면 조용히 맞춘다 / Implicit conversion | 양쪽 타입이 다르면 오류가 아니라 한쪽을 바꿔서 견준다. 어느 쪽을 바꾸는지가 방언마다 다르다 | **`type-conversion`(없다 — §0.5)** | 타입 변환 사다리 | `CAST`·`CONVERT` 가 **두 표본 합쳐 0곳**이다 — 일어나는 변환이 전부 코드에 안 보인다. 글자로 견주면 `'10' < '9'` 가 참이다 |
| 0-7 | `sql/expression-per-row` | 식 하나가 행마다 한 번 / One expression, every row | 한 번 적은 식이 행 수만큼 평가된다. 그래서 반복문을 적을 자리가 없고, 여러 행을 한꺼번에 봐야 아는 것은 이 층에서 못 묻는다 | `declarative-vs-imperative` | 행 격자 + 평가 트리 | 「반복문은 어디 쓰나」. 그리고 `WHERE COUNT(*) > 3` — `WHERE` 시점에는 아직 다른 행을 못 본다 |
| 0-8 | `sql/clause-order` | 적는 순서와 도는 순서가 다르다 / Written order, run order | `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`. 적기는 `SELECT` 가 먼저인데 돌기는 다섯 번째다 | `eager-vs-lazy` · `exec/order` | **절 파이프 6칸**(신규) | `SELECT` 에서 붙인 별칭을 `WHERE` 에서 못 쓴다. Miedema et al. 2021 이 참가자들이 절 순서를 바꿔 적는 것을 관찰한 자리다(§9 오개념 2) |

**깊이는 얕다.** 0-1·0-2·0-3 이 루트(선행 없음)이고, 0-4 ← 0-3, 0-5 ← 0-4, 0-6 ← 0-2, 0-7 ← 0-1,
0-8 ← 0-7 이다. **여덟 전부가 깊이 ≤ 2** 라 0장 상한 24(D147)에 그대로 들어간다 — §5 가 잰 기초 14 와 합쳐 **22/24** 다.

### 0부 여덟이 §2 의 절 여덟에 어떻게 걸리나

0부를 먼저 두면 §2 의 「이 언어라서 다른 것」 칸 중 넷이 **거기서 설명되지 않고 아래에서 설명된다.**
§2 의 `prereq` 에 아래 한 줄씩을 더한다.

| §2 의 절 | 새 선행 | 지금 §2 가 혼자 짊어지고 있는 것 |
|---|---|---|
| 1 `sql/text-literal` | `sql/value-and-name` | 「작은따옴표는 값, 큰따옴표는 이름」 |
| 4 `sql/comparison` | `sql/three-valued-comparison` · `sql/implicit-cast` | 「같은 `=` 가 절에 따라 묻는 일도 넣는 일도 된다」 |
| 5 `sql/where-filter` | `sql/expression-per-row` | 「행을 하나씩 따로 본다」 |
| 6 `sql/null-check` | `sql/null-unknown` | 「거짓이 아니라 모름이라서 버려진다」 |
| 7 `sql/order-by` | `sql/row-and-set` | 「이걸 안 쓰면 순서가 없다」 |
| 3 `sql/select-list` | `sql/clause-order` | 「적히기는 위인데 나중에 돈다」 |

---

### §0.3 표본 둘째 — MonggleMonggle 실측 (읽기만)

§1 의 계수는 **이 리포 하나**(SQLite · 명령문 178개)였고 §10 이 「표본 1」이라고 적어 뒀다.
표본을 하나 더 재서 무엇이 표본 특유이고 무엇이 SQL 특유인지 갈랐다.
대상은 `MonggleMonggle`(Spring + MyBatis + **MySQL**) — `.sql` **27파일 2,953줄**(내용 해시로는 **14개** —
`AI_API`/`AI_API_GEMINI` 가 서로 사본이다)과 매퍼 XML **9파일 581줄**, 문장 태그 **49개**(select 23 · update 16 · insert 8 · delete 2).

| 0부 개념 | 이 리포 (SQLite) | MonggleMonggle (MySQL) | 판정 |
|---|---|---|---|
| 0-4 `null-unknown` | `IS NULL` 이 사전 3장 중 하나로 이미 서 있다 | `IS NULL` **22** + `IS NOT NULL` **1**, 매퍼 **6/9 파일** | **SQL 특유.** 두 표본 다 최상위. 소프트 삭제(`deleted_date IS NULL`)가 이 앱의 뼈대다 |
| 0-5 `three-valued-comparison` | — | `=` **97곳**(매퍼 본문) · `!=` 1 · `<`/`>`/`<=`/`>=` **0** | **SQL 특유.** 견주기의 97%가 등호 하나다. 삼값이 드러나는 자리는 전부 `NULL` 쪽이다 |
| 0-2 `column-type` | 열 타입이 권고(SQLite) | 9표 타입 분포 — `datetime` 21 · `bigint` 17 · `text` 10 · `int` 9 · `tinyint` 3 · `longtext` 2 · `date` 2. **불리언 타입 없음** | **방언 특유.** 같은 개념인데 함정이 정반대다 — SQLite 는 「안 지킨다」, MySQL 은 「불리언이 정수다」 |
| 0-6 `implicit-cast` | `CAST` 0곳 | `CAST`·`CONVERT` **0곳**, 날짜 함수 비교 20곳(`DATE(x) < #{today}`) | **SQL 특유.** 두 표본 다 명시 변환이 0이다. 변환은 늘 일어나고 늘 안 보인다 |
| 0-1 `row-and-set` | `LIMIT` 26 · `ORDER BY` 56 | `LIMIT` **140** · `ORDER BY` **22** | **SQL 특유**, 다만 크기가 뒤집힌다. MonggleMonggle 은 `LIMIT` 이 `ORDER BY` 보다 6배 많다 — 순서를 약속받지 않는 「아무 N개」가 그만큼 흔하다 |
| 0-3 `value-and-name` | 큰따옴표 이름 | 백틱 식별자 **898곳** · 매퍼 안 문자 리터럴 1곳 | **방언 특유.** 이름 따옴표가 방언마다 다르다 |
| 0-7 `expression-per-row` | — | 집계 27곳 · `GROUP BY` 3 · `HAVING` **1** | 두 표본 다 같다 — §1 이 잰 `HAVING` 1 과 정확히 같은 숫자다 |
| 0-8 `clause-order` | — | 서브쿼리 148곳(대부분 자료 덤프) · 조인 **11곳** | 조인이 얇다(§0.4) |

**조인은 두 표본 다 얇다.** MonggleMonggle 매퍼 전체에서 **서로 다른 조인 줄이 셋뿐**이다 —
`INNER JOIN dream_results dr ON d.dream_id = dr.dream_id` · `LEFT JOIN emotion_scores e ON …` ·
`LEFT JOIN dreams d ON u.user_id = d.user_id AND d.deleted_date IS NULL`.
**마지막 하나가 §9 오개념 7 의 정답 판이다** — 짝 없는 행을 남기려면 `NULL` 조건이 `WHERE` 가 아니라
`ON` 에 있어야 하는데, 이 리포는 그것을 맞게 썼다. 「틀린 자리」가 아니라 「맞게 쓴 자리」로 가르칠 수 있는
드문 실물이라 3단(예측)의 재료로 좋다.

**안 나온 것.** `CASE WHEN` 0 · `WITH`(CTE) 0 · `OVER (` 0 · `DISTINCT` 0 · `LIKE` 0 · 트랜잭션 구문 0 ·
`EXPLAIN` 0. §4 의 심화 여덟 중 다섯이 이 표본에서도 **카드 0장**이다. 표본 둘이 같은 말을 한다 —
**바이브 코딩으로 나온 SQL 은 고급 구문을 안 쓴다.**

### 방언이 뒤집힌다 — §8 을 반만 확인했다

§8 은 `tree-sitter-sequel 0.3.11` 이 「합집합 문법이지 SQLite 가 아니다」라고 재 놨다. MySQL 조각으로 다시 재면
**같은 문법이 MonggleMonggle 에는 잘 맞는다.** 조각 14개를 실제로 파싱했다(ABI 14 · 노드 종류 729, §8 과 같은 값).

| 잘 되는 것 (ERROR 0) | 깨지는 것 |
|---|---|
| `AUTO_INCREMENT` · `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` · 백틱 식별자 · `TINYINT(1)` | **`#{userId}` (MyBatis 자리표)** — ERROR 노드 4개 |
| `REFERENCES … ON DELETE CASCADE` · `ON DUPLICATE KEY UPDATE` · `IFNULL` | `DATE(x) < #{today}` — ERROR 4개 (자리표 때문) |
| `LEFT JOIN … ON … AND d.deleted_date IS NULL` · 집계+`GROUP BY`+`HAVING` · 서브쿼리 · `ORDER BY`/`LIMIT` | `:id` (SQLite 자리표) — ERROR 1개 |

§8 이 「`AUTOINCREMENT` 가 깨진다」고 적은 것은 **SQLite 철자**다. MySQL 의 `AUTO_INCREMENT` 는 통과한다.
**이 문법의 진짜 사각지대는 방언이 아니라 자리표 하나**라는 것이 표본 둘로 확정됐다.

그리고 **`#{}` 는 `:name` 보다 나쁘게 깨진다.** `:name` 은 `binary_expression` 안에 `(ERROR)` 를 형제로 남기는데,
`#{}` 는 오른쪽을 `unary_expression` 으로 **재해석**한다.

```
WHERE id = #{userId}
→ (binary_expression left: (field (identifier))
     right: (unary_expression operator: (op_unary_other)
                              (ERROR (UNEXPECTED '{'))
                              operand: (field (identifier))))   ← userId 가 열 참조
```

`binary_expression` 이 살아 있으므로 `sql/comparison` 캡처가 **정상 매치되고 `userId` 를 열 이름이라고 가르친다.**
§8 의 「해야 할 일 셋」 ① 이 `:name` 만 보고 있었는데 **`#{}` 도 같은 배제 앵커가 필요하다** — 그리고 매퍼 XML 안의
SQL 은 D159 의 MyBatis 간선이 이미 읽는 자리라 그냥 지나칠 수 없다. 이 리포에 `#{…}` 가 **114곳 / 8파일**이다.

---

### §0.4 형식 여섯 중 SQL 이 쓰는 것 — 다섯

형식 이름은 I1 이 확정한 것을 그대로 쓴다(`value`·`step`·`bits`·`table`·`build`·`predict`).

| 형식 | SQL | 어떻게 |
|---|---|---|
| `value` | 쓴다 | 「이 식이 **이 행에서** 무엇을 내나」. 답이 셋이다 — 참·거짓·**모름** |
| `step` | 쓴다 — **가장 잘 맞는다** | 절 파이프를 한 칸씩 돌린다. `FROM` 뒤 몇 행 → `WHERE` 뒤 몇 행 → `GROUP BY` 뒤 몇 행 |
| `bits` | **안 쓴다** | 값의 비트 표현이 언어 표면에 없다. `1` 이 32비트인지 64비트인지를 SQL 로는 물을 자리가 없다 |
| `table` | 쓴다 — **0-4·0-5 의 유일한 형식** | 삼값 진리표. `AND`/`OR`/`NOT` 을 3×3 으로 채우게 한다 |
| `order` | 쓴다 | 절 조각을 순서대로 놓기. 오답이 「도는 순서와 다른 배치」다. 예전에 `build` 로 적었던 것을 J0 가 이름 지은 `order` 로 옮겼다 (D187 ⑱ · [`sql-learning.md`](./sql-learning.md) §11.6) — 채점이 `hop` 의 `pct` 재사용이라 `build` 의 인정 집합 문제가 사라진다 |
| `predict` | 쓴다 | 「`WHERE` 를 빼면 몇 행이 바뀌나」 · 「`LEFT` 를 `INNER` 로 바꾸면 몇 줄이 주나」 |

**여섯 중 `bits` 하나를 안 쓴다.** 나머지 아홉 언어가 `bits` 로 정수·실수 축을 세우는데 SQL 에는 그 축이 없어서다(§0.1).

### §0.5 그림 여섯 중 SQL 이 쓰는 것 — 셋, 그리고 새로 넷

그림 이름은 I2 가 만드는 것을 그대로 쓴다(비트 배열 · 평가 트리 · 값 상자 · 메모리 줄 · 스택 프레임 · 타입 변환 사다리).

| 그림 | SQL | 왜 |
|---|---|---|
| 비트 배열 | **안 쓴다** | `bits` 형식과 같은 이유 |
| 평가 트리 | 쓴다 — **3색으로** | 잎이 「이 행의 열 값」이고 마디 결과가 참·거짓·모름 셋이다. 두 색짜리로는 0-5 를 못 그린다 |
| 값 상자 | 쓴다 — **두 칸으로** | 「값」과 「이름」을 나란히 놓아 0-3 을 그린다 |
| 메모리 줄 | **안 쓴다** | SQL 에 주소가 없다 |
| 스택 프레임 | **안 쓴다** | 호출 스택이 없다 |
| 타입 변환 사다리 | 쓴다 | 0-2·0-6 이 이 하나를 같이 쓴다 |

**새로 필요한 넷.** 이것이 I2 에게 거는 요청이다 — 없으면 0부 여덟 중 넷을 그림 없이 써야 한다.

| 그림 | 무엇을 그리나 | 쓰는 개념 |
|---|---|---|
| **행 격자** | 상자 하나가 값이 아니라 **행**이고, 격자에 순서 표시가 **없다** | 0-1 · 0-7 |
| **진리표 3×3** | `AND`/`OR`/`NOT` 을 참·거짓·모름으로 채운 표 | 0-4 · 0-5 |
| **절 파이프 6칸** | `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`. 칸마다 **남은 행 수**가 붙는다 | 0-8 · §3 의 aggregate·group-by·having |
| **곱 격자** | 왼쪽 m행 × 오른쪽 n행에서 짝이 맞는 칸만 남는 그림. 결과가 왜 늘어나는지 | §3 의 join-inner·join-left (0부는 아니지만 같은 그림이 필요하다) |

**만든다면 절 파이프가 먼저다** — 넷 중 그것 하나만 §11.1 의 「기계」를 그리고 나머지 셋은 개념 하나씩을 그린다.

행 격자와 절 파이프 둘은 **아홉 언어에서 안 쓴다.** SQL 하나를 위해 그리는 값이 있는지는 I2 의 판단 몫이고,
없으면 0-1·0-7·0-8 은 표로만 간다.

---

### §0.6 못 정한 것 — 0부

1. **`cs/type-conversion` 이 없다.** 43장 중 형 변환을 다루는 장이 없다 — `cs/type` 은 「타입이 무엇인가」이고
   `cs/static-vs-dynamic-typing` 은 「언제 확인하나」다. **암묵 변환이 조용히 답을 바꾸는 것**을 설명할 장이 없다.
   SQL 만의 문제가 아니라 아홉 언어의 공통 축 여섯째가 통째로 이 자리를 요구한다 —
   [`README.md`](./README.md) §9 에 신규 후보로 올렸다.
2. **`cs/search-tree` 는 여전히 보류다** (cs.md §10.3). §4 의 `index`·`query-plan` 이 요구하는데 0부는 안 쓴다 —
   그래서 이 세션에서도 안 정했다.
3. **`sql/null-unknown` 과 `sql/null-check` 를 한 장으로 접을지.** 지금은 두 장이다(0부·기초). 접으면 판이 하나 줄고,
   나누면 「무엇인가」와 「어떻게 적나」가 갈린다. §6 이 이미 정한 규칙(**차이가 표기면 전이하고 의미면 끊는다**)의
   층 버전이므로 나눠 뒀지만, 하루 15분 예산에서 판 하나의 값은 반나절이다.
4. ~~**`#{}` 자리표를 언제 고칠지.**~~ → **고쳤다** (2026-09-05 · §12.1). 배제 앵커를 넓히는 대신
   **파스 전에 가린다** — `crates/parse/src/params.rs` 가 `:name` 과 `#{name}` 을 같은 너비의 글자 값으로
   바꿔 파서에게만 넘기고, 쿼리와 발췌는 원문을 본다. `sql/comparison` 이 표본 리포 매퍼 9파일에서
   **6 → 53 사용처**가 됐고 값 자리 50곳이 `field`(열!) 대신 `literal` 로 잡힌다.

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
| **24-a** | **`sql/self-join`** | 같은 표를 두 번 적기 / Self join | `JOIN` (같은 표) | — | 3 | 2, 4 | 같은 표의 행 **둘**을 견주려면 그 표를 두 번 적고 별명을 둘 둔다. 한 번만 적으면 각 행이 자기 자신하고만 견줘진다. **근거가 가장 두꺼운 어려움인데 §3 에 자리가 없었다** — Taipalus & Seppänen 2020 의 SE2(네 편)가 「자기 조인이 전체에서 가장 어려운 쿼리 개념」이라 적었고 Miedema 2024 의 유병률이 14%다. **두 표본 다 사용처 0** 이라 카드는 합성이고, 「네 코드엔 없다」를 화면이 말한다(D186 ④) |

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
(§0 의 0부 여덟은 전부 깊이 ≤ 2 라 이 수는 **22/24** 가 된다 — 상한에 붙지만 안 넘는다.)

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
| **T1** (클론 코딩) | **성립하되 두 곳을 고쳐야** | ① `packages/cards/src/t1-block.ts:56-57` 의 `commentPrefix()` 가 파이썬이면 `#`, **그 밖은 전부 `//`** 를 준다 — SQL 주석은 `--` 라 「이어짐」 머리글이 문법 오류로 붙는다. ② `block.kind` 가 `function\|method\|class\|file\|segment` 인데 SQL 에는 앞 셋이 없다. `_blocks.scm` 은 `(statement)` 를 블록으로 잡아야 한다. 그리고 D152 ⓑ(들여쓰기 유지)가 **거꾸로다** — SQL 은 공백이 완전히 무의미하고 키워드 대소문자도 무의미하다(`select` 와 `SELECT` 가 같은 트리). 채점은 **공백과 키워드 대소문자를 둘 다 정규화**해야 한다. **다만 4·5단의 AST 승격은 면제다** — 실행이 결과 표를 주므로 텍스트 동등을 물을 이유가 없다([`sql-learning.md`](./sql-learning.md) §11.5.2 ③ · §12.2) |
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

**해야 할 일 셋.** ① ~~`.scm` 에 `(ERROR)` 형제를 배제하는 앵커를 넣는다~~ → **다르게 고쳤다** (§12.1).
배제는 「틀린 것을 안 가르치는」 대신 **사용처를 통째로 버리는** 값을 치른다 — 실제로 그 대가가
표본 리포 매퍼에서 47/53 이었다. 그래서 앵커가 아니라 **파스 전 가리기**로 갔다:
`crates/parse/src/params.rs` 가 `:name` 과 `#{name}` 을 같은 너비의 글자 값으로 바꿔 파서에게만 넘기고,
쿼리 술어와 발췌는 원문을 본다. 자리가 살고 값이 값으로 잡힌다. ② `sql/named-param`·`sql/on-conflict`·
`sql/transaction` 셋은 **문법이 고쳐질 때까지 사전에 올리지 않는다** — 32개 중 3개다.
(①이 고쳐졌어도 `sql/named-param` 은 그대로 보류다: 자리표가 이제 `literal` 로 잡히므로 「이것은 자리표다」를
가르칠 노드가 여전히 없다.)
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
| 13 | `WITH x AS (…)` 로 이름을 지었으면 아래에서 그냥 쓸 수 있다 → **`FROM` 에 그 이름을 적어야** 쓰인다. 정의만으로는 아무 일도 안 난다 | Miedema 2024 §4.5.1(scoping) · §6.4.4 유병률 **26 %** |
| 14 | 같은 표 안에서 짝을 찾을 때 표를 한 번만 적으면 된다 → 별명 둘로 **같은 표를 두 번** 적어야 한다. 한 번만 적으면 각 행이 자기 자신하고만 견줘진다 | Miedema 2024 §6.4.11 **14 %** · Taipalus & Seppänen 2020 SE2(네 편) |
| 15 | `DISTINCT` 를 붙이면 여러 값 중 **첫 것**이 온다 → 중복만 접는다. 값이 여럿이면 여전히 여럿이고 서브쿼리는 그대로 여러 행을 낸다 | Miedema 2024 §4.5.1 · §6.4.5 **11 %** |

**13·14·15 는 Miedema 2024 의 유병률 조사에서 왔다** — 열둘 중 **읽기에서 살아남는 넷**(`missing_join` 52 % ·
`scoping_with` 26 % · `scoping_selfjoin` 14 % · `distinct` 11 %) 중 우리에게 없던 셋이다
([`sql-learning.md`](./sql-learning.md) §11.4.1). ⑫ 와 ⑮ 는 **다른 오개념**이라 둘 다 남긴다 — 앞은 괄호의 문제,
뒤는 몇 행이 오나의 문제다. 사전에서는 ⑬ 이 `sql/clause-order` 의 `misconceptions` 에, ⑭ 가 `sql/self-join` 에,
⑮ 가 `sql/row-and-set` 에 실려 있다.

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
- **표본 둘째 계수 (§0.3)** — `MonggleMonggle` `.sql` 27파일 2,953줄(내용 해시 유니크 14) · 매퍼 XML 9파일 581줄 ·
  문장 태그 49 · `#{…}` 114곳/8파일. **읽기만 했다** (`git ls-files` · `grep` · `md5`, 쓰기 0)
- **표본 둘째 파싱 (§0.3)** — MySQL·MyBatis 조각 14개를 `tree-sitter-sequel 0.3.11` 로 직접 파싱.
  ABI 14 · 노드 종류 729 로 §8 과 같은 값이 나왔고, ERROR 가 난 것은 자리표 셋(`#{}`·`:name`)뿐이다
- Miedema, Aivaloglou, Fletcher (2021) *Identifying SQL Misconceptions of Novices: Findings from a Think-Aloud Study*,
  ICER '21. DOI <https://doi.org/10.1145/3446871.3469759> (CC BY 4.0, ICER '21 Honorable Mention).
  네 범주(선행 과목 지식 · 일반화 · 언어 · 불완전한 심성 모형)와 학생 21명 규모까지 확인
- **Miedema (2024) *On Learning SQL*, TU/e 박사학위논문(오픈액세스) — 전문 확인.** 4장이 위 ICER '21
  논문이고 6장이 그 열둘의 **유병률 조사**(n = 249)다. §9 의 13·14·15 가 여기서 왔고 출처 열에 절 번호와
  유병률을 적었다 — `scoping_with` §4.5.1·§6.4.4 **26 %** · `scoping_selfjoin` §6.4.11 **14 %** ·
  `distinct` §4.5.1·§6.4.5 **11 %**. 읽기에서 살아남는 넷 중 우리에게 있던 것은 `missing_join`(52 %)
  하나뿐이었다 ([`sql-learning.md`](./sql-learning.md) §11.4.1)
- Taipalus & Seppänen (2020) — 「자기 조인이 전체에서 가장 어려운 쿼리 개념」(SE2, 네 편). §3 24-a 의 근거
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

- ~~Miedema et al. 의 **개별 오개념 목록**(번호와 문장)~~ → **열었다** (2026-09-05). 학위논문
  *On Learning SQL* 로 우회해 열두 라벨과 유병률을 전부 대조했다([`sql-learning.md`](./sql-learning.md) §11.4.1).
  §9 의 2·3·4 는 여전히 ICER '21 요약에 근거하지만, 그 요약이 학위논문 4장과 어긋나지 않는 것까지 확인했다
- Ahadi et al. 2016 본문 — 초록과 2차 인용만 봤다
- progmiscon.org — D148 대로 **재사용 라이선스가 없어** 열지 않았다
- 「바이브 코딩 SQL 의 생김새」는 이제 **표본 둘**이다(이 리포 SQLite · `MonggleMonggle` MySQL+MyBatis).
  둘 다 개인 프로젝트라 **Postgres 리포와 ORM 만 쓰는 리포는 여전히 안 쟀다.**
  §0.3 이 확인한 것 — 자리표 문제는 안 사라지고 **모양만 바뀐다**(`:name` → `#{}`, 더 나쁘게 깨진다).
  안 확인한 것 — 표본 둘 다 한 사람이 만든 리포이므로 「바이브 코딩 SQL」의 분포라기보다 **이 두 리포의 분포**일 수 있다

---

## §11 학습법 — 이 언어를 이해한다는 것

800줄 상한을 넘어 [`sql-learning.md`](./sql-learning.md) 로 분리했다 — 기계 한 문장 · 교재가 수렴한 순서 ·
SQL 특유의 연습 · Miedema 2024 분류표 대조 · 2단과 4단의 재정의 · 바꿀 것 diff.

---

## §12 실물이 된 것 — 실측 (2026-09-05)

§0~§11 은 조사였다. 이 절은 그중 **코드가 된 것**과 그때 잰 수치다. 안 된 것도 적는다.

### §12.1 `#{}` 결함 수리 — 배제가 아니라 가리기

**결함이 있던 자리는 셋이었다.** ① 문법(`tree-sitter-sequel 0.3.11`)이 `:name`·`#{name}` 을 못 읽는다.
② `crates/parse` 가 그 바이트를 그대로 파서에 넘긴다. ③ `dictionary/sql/comparison.scm` 이 그 대가를
`(#not-match? @site "[:#]")` 로 치르고 있었다 — 자리표가 있는 사용처를 **통째로 버렸다**.

**고친 자리는 ② 하나다.** `crates/parse/src/params.rs`(신규) 가 파스 **전에** 자리표를 같은 너비의
글자 값으로 가린다 — `#{userId}`(9바이트) → `'_userId'`(9바이트) · `:id`(3) → `'i'`(3).
바이트 수가 같으므로 캡처의 자리·줄·열이 원문 그대로이고, 쿼리 술어와 발췌는 **원문 버퍼**를 본다.
그래서 학습자는 `#{userId}` 를 보고 사전은 그 자리를 「값」이라고 가르친다. 문자열 리터럴·따옴표 식별자·
`--` 주석·`/* */` 안은 안 건드린다 (`'12:30'` 이 반토막 나면 안 된다).

`@name` 도 파싱은 되지만 **`field`(열 참조)로 잡힌다** — 같은 거짓말의 다른 모자라 안 썼다.
`?` 만 `(parameter)` 인데 이름이 사라져 발췌가 원문과 어긋난다. 글자 값이 남은 하나였다.

| 잰 것 | 수리 전 | 수리 후 |
|---|---:|---:|
| `sql/comparison` 사용처 — 표본 리포 매퍼 9파일 | **6** | **53** |
| 그중 값 쪽이 `literal` 로 잡힌 것 | 3 | **50** (나머지 3은 진짜 조인이라 `field` 가 맞다) |
| 매퍼 9파일의 `in_error` 캡처 | 0 | 0 |
| `sql/comparison` 사용처 — 이 리포 `.sql` 27파일 | **229** | **480** |
| 이 리포 27파일의 `ERROR` 노드 | **800** (26파일) | **92** (18파일) |

남은 92개는 §8 이 이미 적은 다른 사각지대다 — `PRAGMA` · `AUTOINCREMENT` · `ON CONFLICT (col)` ·
`INSERT OR REPLACE` · 트랜잭션 구문. 자리표는 이제 그 목록에 없다.

**골든이 지킨다.** `fixtures/golden/mybatis/`(신규 디렉터리, 문법 `mybatis_sql`)의
`comparison/pos-find-by-id.xml` 이 `#{cartId}` 자리에서 `nodeKind: "literal"` · `inError: false` 를
기대 파일로 못박는다. 되돌리면 그 한 줄이 빨개진다.

### §12.2 sqlite 러너 — D175 규칙 넷이 SQL 에서 달라지는 곳

`packages/grading/src/sql-runner.ts`(신규) + `crates/store/src/run.rs`(신규 엔진) +
`apps/desktop/src-tauri/src/commands/sqlrun.rs`(신규 명령). `RunSpec` 에 `lang:'sql'`·`dialect`·`db`·`cases`
넷이 붙었고 `RunResult` 에 `reason` 이 붙었다.

| D175 규칙 | 자바 | SQL | 왜 달라지나 |
|---|---|---|---|
| ① 동의 게이트 | Gradle 배포본 내려받기를 첫 회에 묻는다 | **없다** | 엔진이 앱에 이미 실려 있고 네트워크를 안 쓴다. 대신 게이트가 **방언**으로 옮겨 간다 — 러너는 언어마다 하나가 아니라 방언마다 하나다(정본 §5) |
| ② 타임아웃 | 기본 180초 · 첫 회 600초 · Rust 방벽 600초 | **기본 5초 · Rust 방벽 30초** | 컴파일이 없다. 5초를 넘는 것은 느린 것이 아니라 재귀 CTE 같은 사고다 |
| ③ 작업본 | 리포를 통째로 복사해 그 안에서 돈다 | **작업본이 없다** | 데이터베이스가 메모리에만 서고 판마다 새로 세워진다. 「원본은 읽기만」이 「원본을 안 연다」가 된다. 대신 규칙이 하나 생긴다 — 문항이 표를 고칠 수 있으므로 **문항마다 한 번씩 세운다** |
| ④ 테스트가 이긴다 (D180) | JUnit 통과가 AST 제약을 이긴다 | **결과 표가 이긴다** | 판정용 테스트를 따로 쓸 자리가 없다. 실행이 곧 답이라 T1 사다리와 AST 승격이 **면제**된다 — 열 언어 중 처음이다 |

**러너가 없거나 방언이 안 맞으면 화면이 말한다** (D186 ④). `RunResult.reason` 에
`dialect-unsupported`(이 앱이 든 데이터베이스는 SQLite 하나다) · `no-fixture-db`(돌려 볼 행이 없다)가
실리고 `run.reason.*` 로 ko·en 문구가 붙는다.

**채점은 대칭 차집합이되 SQL 로 안 한다.** `EXCEPT` 양방향과 **같은 판정**을 TS 에서 센다 —
`EXCEPT` 는 집합 의미라 중복 행 수를 못 보고 순서를 못 본다([`sql-learning.md`](./sql-learning.md) §11.5.2 ③).
행을 받아 세면 `order:'none'` 이 진짜 다중집합 비교가 되고 `order:'given'` 이 자리까지 본다.
열 **이름**은 안 견준다 — 별명이 다르다고 오답이라 하면 D180 이 피하려는 방향(맞는데 틀렸다)의 오류가 난다.

| 잰 것 | 값 |
|---|---|
| 러너 시험 | **23개** (`sql-runner.test.ts`, 진짜 sqlite 로 돈다) + **5개**(`crates/store/src/run.rs` 단위) |
| 왕복 시간 — 세우기 2문 + 묻기 2문 한 번 | **1 ms 미만** (자바 러너의 초~분 단위와 견주는 자리) |
| 상한 | Rust 30초 · 표당 5,000행에서 깎는다. TS 기본은 5초 · 500행 |

### §12.3 픽스처 행 시드

`fixtures/db/v0009.db` 는 **표 42개에 행 31개**였고 그중 20표가 0행이었다. 결과 표를 견주는 채점은
행이 없으면 아무것도 못 잰다. `scripts/seed-fixture-db.mjs`(신규)가 **id 100 이상**에만 사는 결정론적 행을
넣는다 — 원래 있던 행(id 1~99)은 「그때의 앱이 실제로 쓴 바이트」라 안 건드린다.

| | 전 | 후 |
|---|---:|---:|
| 행 | **31** | **101** (+70) |
| 행이 있는 표 | 22 | **26** |
| `integrity_check` · `foreign_key_check` | ok · 0건 | ok · 0건 |

넣은 것: 커밋 7 · 파일 10 · 커밋-파일 13 · 사용처 23 · 파일 간선 6 · 블록 6 · 대지-파일 6.
**일부러 비워 둔 열이 셋**이다 — `git_commit.author_email` 둘 · `file.parse_quality`·`skip_reason` ·
`concept_site.form` 절반. 0-4(없음이 아니라 모름)와 0-5(견주기가 내는 답이 셋)를 그 열로 묻는다.
내용은 결정론적이지만 **바이트는 아니다** — sqlite 헤더의 변경 카운터가 쓸 때마다 오른다.
그래서 이 스크립트는 「다시 만드는 도구」이지 「돌려서 diff 가 비어야 하는 검사」가 아니다.

Taipalus & Seppänen 2020 의 WL3 는 **여러 데이터셋에 돌리라**고 한다. 여기 있는 것은 첫 하나다 —
데이터가 하나면 틀린 쿼리가 우연히 맞는 표를 낼 수 있다는 그 위험은 아직 남아 있다.

### §12.4 4·5단 「수정」의 정답지 — 표본 리포 `fix:` 커밋은 **안 된다**

sql-learning §11.5.2 ④ 가 `ff93223`(「fix: 월별 분석 페이지 중복 호출 및 SQL 오류 수정」)을 후보로 올렸다.
실물을 열어 보고 **탈락**으로 판정한다. 이유 넷이고 앞의 둘이 결정적이다.

1. **방언이 안 맞는다.** 더해진 다섯 줄이 `ON DUPLICATE KEY UPDATE … VALUES(col)` 로 MySQL 이다.
   sqlite 판은 `ON CONFLICT (…) DO UPDATE SET col = excluded.col` 이라 **문장 모양이 다르다.**
   러너가 sqlite 하나뿐이므로 이 정답지는 **돌려 볼 수가 없고**, D180 의 「테스트가 이긴다」에는
   이길 테스트가 없다.
2. **돌릴 데이터가 없다.** 같은 문서 §11.5.2 ② 의 실측 — 표본 리포의 MySQL 덤프 151줄은 sqlite 에서
   **표 0개**이고 규칙 여덟으로 깎아도 0이다. 정답지가 맞는지 판정할 표가 서지 않는다.
3. **고친 이유가 diff 밖에 있다.** `ON DUPLICATE KEY UPDATE` 는 `(user_id, year, month)` 에 UNIQUE 가
   있어야 발동하는데 그 제약은 **스키마 파일**에 있고 이 hunk 에 없다. hunk 만 읽는 학습자는 왜 그것이
   답인지 끌어낼 수 없다.
4. **최소가 아니다.** 커밋 전체가 6파일 +231/−59 이고, 중복 호출을 없앤 것은 Java 서비스 51줄 쪽이다.
   매퍼 hunk(+6/−1)만 떼면 「그 커밋이 고친 것」이 아니게 된다.

**그럼 무엇에 쓰나 — 1~3단이다.** `sql/on-conflict`(§3 ㉔)의 드문 실물이고, 3단 예측 판
「이 다섯 줄이 없으면 두 번째 저장에서 무슨 일이 나나」가 실행 없이 답해진다.
`5bfbebd`(매퍼 +2/−1, `UPDATE … SET` 목록에 열 하나 추가)도 같다 — 편집 범위는 `patch-line` 에 맞지만
방언과 데이터가 같은 벽에 걸린다.

**4·5단의 정답지는 이 리포에서 온다.** `packages/store-sql/statements/` 의 178문과
`migrations/` 아홉 판은 sqlite 이고, `fixtures/db/v0009.db` 에 이제 행이 있다(§12.3).
표본 리포는 **읽는 재료**이고 **돌리는 재료**는 이 리포다 — 두 표본이 하는 일이 갈린다.

### §12.5 사전에 실제로 든 것

0부 여덟 전부와 `sql/self-join` 을 올렸다. `essential` 이 3 → **11** 이 됐고 전부 깊이 ≤ 2 라
D184 의 프롤로그에 그대로 든다.

| 개념 | 사용처 — 이 리포 `.sql` (파일) | 사용처 — 표본 매퍼 (파일) | 구멍 |
|---|---:|---:|---|
| `sql/row-and-set` | 27 (12) | 2 (2) | `LIMIT` |
| `sql/column-type` | 476 (6) | 0 (0) | 없음 — `no_hole_reason`(종류 이름이 사용처마다 다르다) |
| `sql/value-and-name` | 32 (15) | 0 (0) | 없음 — `no_hole_reason`(가르는 것이 낱말이 아니라 따옴표다) |
| `sql/null-unknown` | 31 (13) | 23 (6) | `NULL` |
| `sql/three-valued-comparison` | 103 (18) | 19 (8) | `AND` |
| `sql/implicit-cast` | 34 (13) | 2 (2) | 없음 — `no_hole_reason`(변환이 이 줄에 글자로 없다) |
| `sql/expression-per-row` | 200 (18) | 37 (8) | `WHERE` |
| `sql/clause-order` | 105 (16) | 22 (8) | 없음 — `no_hole_reason`(답이 낱말이 아니라 절 셋의 차례다) |
| `sql/self-join` | **0 (0)** | **0 (0)** | `JOIN` |
| `sql/from-table`(기존) | 181 (20) | 23 (9) | `FROM` |
| `sql/comparison`(기존) | 480 (21) | 53 (8) | `=` |
| `sql/null-check`(기존) | 19 (9) | 22 (6) | `IS` |

**선행은 §0.2 의 표를 따르되 한 칸이 다르다.** `sql/comparison` 에 0-5 와 0-6 을 **둘 다** 걸면
깊이가 3 이 되어 D184 의 프롤로그(깊이 ≤ 2)에서 빠진다. 0-6 하나만 걸고 0-5 는
`sql/null-check` 쪽 사슬(0-3 → 0-4 → 0-5)에 남겼다.

**`sql/self-join` 은 두 표본 다 0곳이다.** 근거가 가장 두꺼운 어려움인데 실물이 없다 —
그래서 카드는 합성이고, 화면이 「네 코드엔 없다」를 말한다(D186 ④). 이 빈자리는 조사의 실패가 아니라
**바이브 코딩으로 나온 SQL 이 고급 구문을 안 쓴다**는 §0.3 의 결론이 한 번 더 확인된 것이다.

**골든** — `fixtures/golden/sql/` 에 개념 아홉 × (양성 2~3 · 음성 1~2), `fixtures/golden/mybatis/` 에 둘.
`sql` 디렉터리는 이제 **사전의 `.scm` 을 그대로 돌린다**(`crates/parse/tests/support/mod.rs` 의 `lang`)
— 옆에 `.query.scm` 을 두면 그쪽이 먼저다.
