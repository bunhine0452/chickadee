/**
 * 코스 화면의 조판 게이트 (06 §2 · D120).
 *
 * `design.spec.ts` 의 순회에 코스가 없다 — 06 §2 의 여섯 화면은 코스가 생기기 전에 정해졌고,
 * 그 파일은 갈래 셋이 같이 만지는 자리라 여기 따로 세운다. 재는 코드는 같다
 * (`devtools/gates.ts` · `runGates`).
 *
 * 이 게이트가 없으면 못 잡는 것이 하나 있다. **`--ink-soft` 를 책상(`--desk`) 위에 놓으면
 * 6.19:1 로 종이 기준 7:1 에 못 미치는데**, `scripts/check-contrast.mjs` 의 배경 집합에
 * `--desk` 가 없어 정적 게이트는 그것을 못 본다. 코스는 목업이 없는 화면이라 조판을 서가에서
 * 빌려 왔고, 빌린 조판이 실제로 규칙 안에 있는지는 브라우저에서만 드러난다.
 *
 * 시드에 손대는 두 자리(`file.line_count` · `file_read_lines`)의 사유는
 * `tests/e2e-ui/clone-course.spec.ts` 머리에 적혀 있다 — 같은 이유다.
 */
import { test, expect } from '../support/fixture.js';
import type { Page } from '@playwright/test';

import { allowedBySel, gotoDev, loadAllow, runGates, toShelf } from '../support/gates.js';
import type { AppDb } from '../support/app-db.js';

const contrastAllow = loadAllow('contrast.allow.json').entries;
const measureAllow = loadAllow('measure.allow.json').entries;

const LINES = [
  'export function totalOf(items: Item[]): number {',
  '  // 장바구니 합계',
  '  let total = 0;',
  '  for (const item of items) {',
  '    if (item.removed) continue;',
  '    total += item.price * item.count;',
  '  }',
  '  return total;',
  '}',
];

const CHUNK = {
  relPath: 'src/core/cart.ts',
  rev: null,
  from: 1,
  to: LINES.length,
  lines: LINES,
  totalLines: LINES.length,
  hadInvalidUtf8: false,
};

/** `crates/parse` 가 채웠을 줄 수. 시드의 IPC 덤프에 없어 0 으로 남아 있다. */
function restoreLineCounts(db: AppDb['db']): void {
  db.prepare(
    `UPDATE file SET line_count =
       (SELECT COALESCE(MAX(b.line_end), 0) FROM block b WHERE b.file_id = file.id)
     WHERE line_count = 0`,
  ).run();
}

/** 홈 → 서가 → 코스. 서가까지는 `design.spec.ts` 와 같은 손(키보드)이다. */
async function toCourse(page: Page, app: AppDb): Promise<void> {
  restoreLineCounts(app.db);
  await page.addInitScript((chunk: unknown) => {
    const win = window as unknown as {
      __TAURI_INTERNALS__: { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> };
    };
    const inner = win.__TAURI_INTERNALS__.invoke.bind(win.__TAURI_INTERNALS__);
    win.__TAURI_INTERNALS__.invoke = (cmd, args) =>
      (cmd === 'file_read_lines'
        ? Promise.resolve(JSON.parse(JSON.stringify(chunk)) as unknown)
        : inner(cmd, args));
  }, CHUNK);

  await gotoDev(page);
  await toShelf(page);
  await page.getByRole('button', { name: /코스 열기$/ }).first().click();
  // 판까지 서야 잰 것이 있다 — 머리만 뜬 화면을 재면 「검사 0건」에 가까워진다.
  await page.locator('main.course .ctoc-part, main.course .course-empty').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

test('코스 — 빈 상태가 아니라 판까지 선다', async ({ page, app }) => {
  await toCourse(page, app);
  // 이 게이트의 전제다. 빈 상태만 재고 초록이면 판의 조판은 한 번도 안 봤다는 뜻이다.
  await expect(page.locator('.course-empty')).toHaveCount(0);
  await expect(page.locator('article.ps')).toBeVisible();
});

test('코스 — 활자 하한 13px', async ({ page, app }) => {
  await toCourse(page, app);
  const report = await runGates(page);
  expect(report.fonts.checked).toBeGreaterThan(10);
  expect(report.fonts.below13, JSON.stringify(report.fonts.below13, null, 1)).toEqual([]);
});

test('코스 — 대비 종이 7:1 · 잉크 배지 4.5:1', async ({ page, app }) => {
  await toCourse(page, app);
  const { contrast } = await runGates(page);
  expect(contrast.checked).toBeGreaterThan(10);

  const paper = contrast.paper.below7.filter((r) => !allowedBySel(contrastAllow, r.sel));
  const ink = contrast.onInk.below45.filter((r) => !allowedBySel(contrastAllow, r.sel));
  expect(paper, JSON.stringify(paper, null, 1)).toEqual([]);
  expect(ink, JSON.stringify(ink, null, 1)).toEqual([]);
});

test('코스 — 본문 행 길이 ko 30~45 (.note 는 하한 22)', async ({ page, app }) => {
  await toCourse(page, app);
  const report = await runGates(page);
  expect(report.measure.length, '행 길이를 잰 요소가 0건이다 — 로케일을 확인하라')
    .toBeGreaterThan(0);
  const bad = report.measureViolations.filter((r) => !allowedBySel(measureAllow, r.sel));
  expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
});
