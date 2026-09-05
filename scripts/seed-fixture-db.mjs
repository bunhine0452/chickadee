/**
 * 픽스처 DB 행 시드 — `fixtures/db/v0009.db` (SQL 4·5단이 돌 데이터).
 *
 * 왜 필요한가: 시드 DB 는 **표만 있고 행이 거의 없었다** (42표 · 31행, 그중 20표가 0행).
 * 결과 표를 견주는 채점(`packages/grading/src/sql-runner.ts`)은 행이 있어야 아무것도
 * 잴 수 있고, 0부 예제의 「이 쿼리가 몇 줄을 내나」도 마찬가지다. Taipalus & Seppänen
 * 2020 의 WL3 — 연습 데이터는 자동 생성할 수 있고 **여러 데이터셋에 돌려야** 한다 —
 * 이 그 자리를 가리킨다. 여기서 만드는 것은 그 첫 데이터셋 하나다.
 *
 * 규칙 셋.
 * ① **결정론적이다 — 내용이.** 난수도 현재 시각도 안 쓰므로 두 번 돌리면 같은 행이 나온다.
 *    바이트까지 같지는 **않다**: sqlite 헤더의 변경 카운터가 쓸 때마다 오르고 `VACUUM` 도
 *    그것을 되돌리지 않는다. 그래서 이 스크립트는 「필요할 때 다시 만드는 도구」이지
 *    「매번 돌려서 diff 가 비어야 하는 검사」가 아니다. `VACUUM` 은 지운 페이지를 눌러
 *    커밋되는 파일이 쓸데없이 커지지 않게 하는 것뿐이다.
 * ② **다시 돌릴 수 있다.** 시드 행은 id 100 이상에만 산다 — 지우고 다시 넣는다. 원래
 *    들어 있던 행(id 1~99)은 손대지 않는다. 그 행들은 「그때의 앱이 실제로 쓴 바이트」라
 *    시드의 뜻 그 자체다 (`packages/store-sql/src/migrate-seed.test.ts` 머리글).
 * ③ **끝나고 검사한다.** `integrity_check` 와 `foreign_key_check` 를 돌려 보고 표마다
 *    행 수를 찍는다. 빨간 줄이 하나라도 있으면 0 이 아닌 코드로 끝난다.
 *
 * 쓰기: `node scripts/seed-fixture-db.mjs`
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3');

const AT = join(process.cwd(), 'fixtures/db/v0009.db');
/** 시드 행이 사는 id 아래끝. 이보다 작은 것은 원래 있던 행이다. */
const FROM = 100;
/** 고정 시각 하나에서 파생한다 — 2026-01-01 00:00:00 UTC. */
const T0 = 1_767_225_600_000;
const day = (n) => T0 + n * 86_400_000;

/**
 * 커밋 일곱. `author_email` 이 둘 비어 있는 것이 일부러다 — 0-4(없음이 아니라 모름)와
 * 0-5(견주기가 내는 답이 셋)를 이 열 하나로 물을 수 있다.
 */
const COMMITS = [
  [100, 'a1b2c30', null, 1, day(0), 'kim@example.com', 'Kim', 'feat: 장바구니 담기', 3, 120, 4, 'normal'],
  [101, 'a1b2c31', 'a1b2c30', 1, day(1), 'kim@example.com', 'Kim', 'fix: 수량 0 이면 담지 않는다', 1, 6, 1, 'normal'],
  [102, 'a1b2c32', 'a1b2c31', 1, day(2), null, 'renovate', 'chore: 의존성 올림', 2, 40, 40, 'bot'],
  [103, 'a1b2c33', 'a1b2c32', 1, day(3), 'lee@example.com', 'Lee', 'feat: 주문 내역 화면', 4, 210, 12, 'normal'],
  [104, 'a1b2c34', 'a1b2c33', 2, day(4), 'kim@example.com', 'Kim', 'Merge branch order-history', 0, 0, 0, 'merge'],
  [105, 'a1b2c35', 'a1b2c34', 1, day(5), null, 'Lee', 'fix: 매퍼 자리표 오타', 1, 6, 1, 'normal'],
  [106, 'a1b2c36', 'a1b2c35', 1, day(6), 'kim@example.com', 'Kim', 'refactor: 저장소 층 분리', 5, 88, 96, 'normal'],
];

/**
 * 파일 열. 언어가 셋(ts · sql · xml)이고 `parse_quality` 가 갈리며 `skip_reason` 이
 * 대부분 비어 있다 — 「모름이 섞인 열을 어떻게 세나」가 그대로 물어진다.
 */
const FILES = [
  [100, 'src/cart/add.ts', 'ts', 'typescript', 64, 1_480, 'ok', null, 100],
  [101, 'src/cart/remove.ts', 'ts', 'typescript', 38, 820, 'ok', null, 100],
  [102, 'src/order/history.ts', 'ts', 'typescript', 122, 3_010, 'ok', null, 103],
  [103, 'src/order/detail.ts', 'ts', 'typescript', 96, 2_240, 'ok', null, 103],
  [104, 'src/store/schema.sql', 'sql', 'sql', 180, 4_600, 'poor', null, 100],
  [105, 'src/store/queries.sql', 'sql', 'sql', 74, 1_900, 'ok', null, 103],
  [106, 'src/store/mapper/CartMapper.xml', 'xml', 'mybatis_sql', 45, 1_120, 'ok', null, 105],
  [107, 'src/store/mapper/OrderMapper.xml', 'xml', 'mybatis_sql', 61, 1_530, 'ok', null, 105],
  [108, 'vendor/bundle.min.js', null, null, 1, 900_000, null, 'too-large', 102],
  [109, 'docs/notes.md', null, null, 30, 700, null, 'no-grammar', null],
];

/** 어느 커밋이 어느 파일을 건드렸나. 조인이 몇 줄을 내는지 물을 재료다. */
const TOUCHES = [
  [100, 'src/cart/add.ts', 'A', 64, 0],
  [100, 'src/cart/remove.ts', 'A', 38, 0],
  [100, 'src/store/schema.sql', 'A', 18, 0],
  [101, 'src/cart/add.ts', 'M', 6, 1],
  [102, 'vendor/bundle.min.js', 'M', 20, 20],
  [102, 'docs/notes.md', 'M', 20, 20],
  [103, 'src/order/history.ts', 'A', 122, 0],
  [103, 'src/order/detail.ts', 'A', 96, 0],
  [103, 'src/store/queries.sql', 'A', 74, 0],
  [103, 'src/store/schema.sql', 'M', 12, 0],
  [105, 'src/store/mapper/CartMapper.xml', 'M', 6, 1],
  [106, 'src/store/queries.sql', 'M', 40, 52],
  [106, 'src/order/history.ts', 'M', 48, 44],
];

/**
 * 사용처 스물넷. `form` 이 절반쯤 비어 있고 개념이 둘이라 묶기·세기·거르기가 다 선다.
 * 줄 번호는 파일 안에서 오름차순이라 순서 있는 판과 없는 판이 다른 답을 낸다.
 */
const SITES = [];
{
  const plan = [
    [100, 'ts/optional-chaining', [7, 19, 31], 'member'],
    [100, 'ts/member-access', [4, 12], 'member'],
    [101, 'ts/member-access', [9, 21], 'member'],
    [102, 'ts/optional-chaining', [15, 44, 71, 98], 'member'],
    [102, 'ts/member-access', [6, 33], 'member'],
    [103, 'ts/member-access', [11, 28, 55], 'member'],
    [105, 'ts/member-access', [3], 'member'],
    [106, 'ts/optional-chaining', [12, 26], 'member'],
    [107, 'ts/member-access', [8, 24, 40], 'member'],
  ];
  let id = FROM;
  for (const [fileId, conceptId, lines, shape] of plan) {
    for (const [i, line] of lines.entries()) {
      SITES.push([
        id, fileId, conceptId, `sk${id}`, line, line, 4, 20, shape, i,
        `site ${id} on line ${line}`,
        // 절반쯤을 비워 둔다 — 이 열 하나로 「모름은 세어지나」를 물을 수 있다.
        i % 2 === 0 ? 'member' : null,
        line % 3 === 0 ? 106 : null,
      ]);
      id += 1;
    }
  }
}

/** 파일 사이 간선 여섯. 두 방향이 다 있어야 「어느 쪽이 몇 개냐」가 물어진다. */
const EDGES = [
  [100, 104, 'static'],
  [101, 104, 'static'],
  [102, 105, 'static'],
  [103, 105, 'static'],
  [102, 100, 'type'],
  [103, 106, 'dynamic'],
];

/** T1 필사 단위 여섯. `rev` 가 비어 있는 것이 워크트리다. */
const BLOCKS = [
  [100, 100, null, 'addToCart', 'function', 12, 30, 'h100'],
  [101, 100, 'a1b2c36', 'clampQty', 'function', 34, 41, 'h101'],
  [102, 101, null, 'removeFromCart', 'function', 5, 22, 'h102'],
  [103, 102, null, 'OrderHistory', 'class', 8, 96, 'h103'],
  [104, 103, null, 'render', 'method', 20, 55, 'h104'],
  [105, 105, null, 'statements', 'file', 1, 74, 'h105'],
];

function seed(db) {
  // 시드 행만 지운다. 자식이 먼저다 — 외래키를 켜 둔 채로 돌리므로 순서가 곧 규칙이다.
  db.exec(`
    DELETE FROM commit_file WHERE commit_id >= ${FROM};
    DELETE FROM import_edge WHERE from_file_id >= ${FROM} OR to_file_id >= ${FROM};
    DELETE FROM block WHERE id >= ${FROM};
    DELETE FROM concept_site WHERE id >= ${FROM};
    DELETE FROM unit_file WHERE file_id >= ${FROM};
    DELETE FROM file WHERE id >= ${FROM};
    DELETE FROM git_commit WHERE id >= ${FROM};
  `);

  const commit = db.prepare(`INSERT INTO git_commit
    (id, repo_id, sha, parent_sha, parent_count, authored_at, author_email, author_name,
     message, truncated, files_n, insertions, deletions, is_reachable, kind, author_matched)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1, ?, 1)`);
  for (const r of COMMITS) commit.run(r);

  const file = db.prepare(`INSERT INTO file
    (id, repo_id, path, lang, grammar, line_count, byte_size, content_hash, head_oid,
     is_dirty, parse_quality, skip_reason, first_commit_id, is_alive, updated_at)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1, ?)`);
  for (const [id, path, lang, grammar, lines, bytes, quality, skip, firstCommit] of FILES) {
    file.run(id, path, lang, grammar, lines, bytes, `blob${id}`, `blob${id}`, quality, skip, firstCommit, T0);
  }

  const unitFile = db.prepare('INSERT INTO unit_file (unit_id, file_id) VALUES (1, ?)');
  for (const [id] of FILES.slice(0, 6)) unitFile.run(id);

  const touch = db.prepare(`INSERT INTO commit_file
    (commit_id, path, old_path, status, additions, deletions, touched_json)
    VALUES (?, ?, NULL, ?, ?, ?, '[]')`);
  for (const r of TOUCHES) touch.run(r);

  const site = db.prepare(`INSERT INTO concept_site
    (id, repo_id, file_id, concept_id, site_key, line_start, line_end, col_start, col_end,
     shape, occurrence, excerpt, form, commit_id, updated_at)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${T0})`);
  for (const r of SITES) site.run(r);

  const edge = db.prepare(`INSERT INTO import_edge
    (repo_id, from_file_id, to_file_id, kind, confidence) VALUES (1, ?, ?, ?, 'syntactic')`);
  for (const r of EDGES) edge.run(r);

  const block = db.prepare(`INSERT INTO block
    (id, repo_id, file_id, rev, name, kind, line_start, line_end, text_hash, is_alive, updated_at)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 1, ${T0})`);
  for (const r of BLOCKS) block.run(r);
}

const db = new Database(AT);
try {
  db.pragma('foreign_keys = ON');
  db.transaction(seed)(db);
  // 지우고 다시 넣으면 빈 페이지가 남는다. 커밋되는 바이너리라 눌러서 넣는다.
  db.exec('VACUUM');

  const integrity = db.pragma('integrity_check', { simple: true });
  const broken = db.pragma('foreign_key_check');
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all();
  let total = 0;
  const filled = [];
  for (const { name } of names) {
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get();
    total += n;
    if (n > 0) filled.push(`${name}=${n}`);
  }
  process.stdout.write(`${AT}\n`);
  process.stdout.write(`  표 ${names.length}개 · 행 ${total}개 · 행이 있는 표 ${filled.length}개\n`);
  process.stdout.write(`  ${filled.join(' ')}\n`);
  process.stdout.write(`  integrity_check=${integrity} · foreign_key_check=${broken.length}건\n`);
  if (integrity !== 'ok' || broken.length > 0) process.exitCode = 1;
} finally {
  db.close();
}
