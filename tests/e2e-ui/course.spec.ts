/**
 * 코스 화면 한 바퀴 (D171) — 목차 → 읽기 단 판정 → 2단 판 → 채점 → 원장.
 *
 * 재는 것은 하나다: **단 하나가 화면에서 원장까지 간다.** `chapter.stage_reached` 가 0 에서
 * 2 가 되고 `stage_log` 에 두 행이 서면 목차·패널·오버레이·채점·`recordStageResult` 가 다
 * 돌았다는 뜻이다. 확인은 화면과 원장 양쪽에서 한다.
 *
 * 시드(`tiny`)에는 챕터가 없다 — 챕터는 인제스트가 기능 폐포에서 쓰는데(D160·A8) 픽스처 리포에
 * HTTP 호출이 없다. 그래서 이 스펙이 **자기 DB 사본에** 챕터 한 장을 심는다: `unit` 하나 ·
 * `chapter` 한 행 · 어휘 하나(겹 1) · 요청 줄기 하나 · 2단 판 한 장. 코스가 만드는 것(판정·
 * 원장·해금)은 하나도 손대지 않는다.
 */
import { expect, openHome, test } from '../support/ui.js';
import { NOW } from '../support/build-seed-const.js';

const UNIT = 100;

/** 2단 `exec` 판 — t0 지목 모양 (`payload.track='t0'`, 열 `track='t3'`, D164 ②). */
const EXEC_PAYLOAD = {
  track: 't0', kind: 'point', file: 'src/index.ts', focus: 3,
  lines: [
    { n: 2, t: 'export function main(): void {' },
    { n: 3, seg: [{ t: '  const ' }, { t: 'total', pick: 1 }, { t: ' = ' }, { t: 'sum(items)', pick: 2 }, { t: ';' }], target: true },
    { n: 4, t: '  print(total);' },
  ],
  q: '`main()` 을 부르면 이 창에서 가장 먼저 도는 자리는?',
  hint: '정의는 실행이 아니다 — 부르는 자리부터.',
  answer: 0,
  why: [null, { t: '값을 만드는 호출은 그 줄이 돌 때 돈다 — 첫째가 아니다.' }],
  ok: '부르면 첫 줄의 왼쪽, 이름을 만드는 자리부터 돈다.',
  rule: '정의는 실행이 아니다. 도는 것은 부르는 자리이고, 그 안에서는 위에서 아래다.',
  prereq: [], uses: [], promptLines: ['export function main(): void {', '  const total = sum(items);', '  print(total);'],
};

function seedChapter(db: import('better-sqlite3').Database): void {
  db.prepare(`INSERT INTO unit (id, repo_id, name, root_path, source, order_idx) VALUES (?, 1, '로그인', NULL, 'dir', 0)`).run(UNIT);
  db.prepare(`INSERT INTO chapter (unit_id, origin, stage_reached, updated_at) VALUES (?, 'entry', 0, ?)`).run(UNIT, NOW);
  // 어휘 하나, 이미 1겹 — 읽기 단의 조건이 차 있어 「판정하기」가 바로 뜬다.
  db.prepare(`INSERT INTO unit_node (unit_id, concept_id, track, node_order) VALUES (?, 'ts/string-literal', 't0', 0)`).run(UNIT);
  db.prepare(`INSERT OR REPLACE INTO mastery (concept_id, layer, updated_at) VALUES ('ts/string-literal', 1, ?)`).run(NOW);
  const path = db.prepare(
    `INSERT INTO request_path (repo_id, unit_id, entry_file_id, entry_line, label, hop_count, updated_at)
     VALUES (1, ?, 2, 3, 'POST /login', 2, ?)`,
  ).run(UNIT, NOW);
  const hop = db.prepare(
    `INSERT INTO request_hop (path_id, ord, file_id, name, line_start, line_end, called_line, depth, kind)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  hop.run(path.lastInsertRowid, 0, 2, 'main', 1, 10, null, 0, null);
  hop.run(path.lastInsertRowid, 1, 3, 'grade', 1, 20, 3, 1, 'call');
  db.prepare(
    `INSERT INTO card (repo_id, unit_id, track, kind, concept_id, level, file_id, payload_json,
                       gen_version, content_hash, created_at, stage_no)
     VALUES (1, ?, 't3', 'point', 'exec/order', 1, 2, ?, 1, 'course-e2e-exec', ?, 2)`,
  ).run(UNIT, JSON.stringify(EXEC_PAYLOAD), NOW);
}

test('코스 — 목차에서 2단 판 하나가 원장까지 간다', async ({ page, app }) => {
  seedChapter(app.db);
  await openHome(page);

  // 마스트헤드의 「코스」가 새 코스를 연다 (D171 ⑧). 클론 코스는 대지 카드·서가에 남는다.
  await page.getByRole('button', { name: '코스', exact: true }).click();
  await page.locator('main.cc').waitFor();
  await expect(page.getByLabel('코스 목차')).toBeVisible();
  // 시드에는 폴더 챕터(「기타」)가 이미 있어 그것이 오늘 챕터다 — 심은 챕터를 골라 연다.
  await page.locator('.cc-toc').getByRole('button', { name: /로그인/ }).click();
  await expect(page.locator('.cc-row.cur .cc-name')).toHaveText('로그인');
  // 진도는 단이다 — 「아직」.
  await expect(page.locator('.cc-row.cur .cc-st')).toHaveText('아직');
  // 요청 줄기가 패널에 선다.
  await expect(page.locator('.cc-paths summary')).toContainText('요청 줄기 1개');

  // 1단 — 어휘가 전부 1겹 이상이라 판정 단추가 뜬다. 누르면 원장에 한 행, 진도 1.
  await page.getByRole('button', { name: '읽기 단 판정하기' }).click();
  await expect(page.locator('.cc-progress')).toContainText('1단 읽기');
  expect((app.db.prepare('SELECT stage_reached FROM chapter WHERE unit_id = ?').get(UNIT) as { stage_reached: number }).stage_reached).toBe(1);

  // 2단 — 판 한 장을 걸고, 짚고, 확인하고, 다음으로.
  await page.getByRole('button', { name: /2단 추적 시작/ }).click();
  await page.locator('.proof article.ps').waitFor();
  await expect(page.locator('.proof article.ps')).toHaveAttribute('aria-label', /1번 · 로그인/);
  await page.locator('.proof .tk[data-k="1"]').click();
  await page.locator('.proof .acts .press-btn').click();
  await expect(page.locator('.proof .fb')).toContainText('맞았습니다');
  await page.locator('.proof .acts .press-btn').click();

  // 단 판정 카드 — 통과, 그리고 원장.
  await expect(page.locator('.cc-done')).toBeVisible();
  await expect(page.locator('.cc-done .cc-tally')).toContainText('1문항 중 1 맞음');
  await expect(page.locator('.cc-done .pass')).toHaveText('통과');
  const row = app.db.prepare('SELECT stage_reached FROM chapter WHERE unit_id = ?').get(UNIT) as { stage_reached: number };
  expect(row.stage_reached).toBe(2);
  const logs = app.db.prepare('SELECT stage, passed, kind FROM stage_log WHERE unit_id = ? ORDER BY id').all(UNIT) as { stage: number; passed: number; kind: string }[];
  expect(logs).toEqual([{ stage: 1, passed: 1, kind: 'first' }, { stage: 2, passed: 1, kind: 'first' }]);

  // 목차로 — 진도가 2단으로 적힌다.
  await page.getByRole('button', { name: '목차로' }).click();
  await expect(page.locator('.cc-row.cur .cc-st')).toHaveText('2단 추적');

  // 홈으로 돌아가는 문은 하나다.
  await page.getByRole('button', { name: '홈으로' }).click();
  await page.locator('.masthead').waitFor();
});
