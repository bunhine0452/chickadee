/**
 * 클론 코스 이어하기 (`clone-gates-e2e` · D120).
 *
 * 재는 것 하나: **조각 중간에 나갔다 돌아오면 그 자리다.** 그 한 줄이 P4 의 전부이고,
 * 그것이 서면 초안 저장(`clone_step.draft_text`)·이어하기(`clone.run_open`)·목차가 다
 * 돌았다는 뜻이다. 확인은 화면과 원장 **양쪽**에서 한다 — 화면만 보면 「다시 그렸다」와
 * 「원장에서 되읽었다」를 못 가른다.
 *
 * 시드에 손대는 자리가 둘이다. 둘 다 **픽스처가 못 담은 사실을 되돌리는 것**이고 코스가
 * 만드는 것은 하나도 손대지 않는다 — 목차·조각·판·채점·이어하기는 전부 앱이 만든다.
 *
 *  1. `file.line_count` 가 0 이다. 시드는 IPC 덤프에서 굽는데(D108) 그 덤프에 줄 수가 없고,
 *     실제 앱에서는 `crates/parse` 가 그 값을 채운다. `clone.course_files` 는 `line_count > 0`
 *     으로 「필사할 수 있는 파일」을 가르므로 그 한 칸이 비면 목차가 아예 서지 않는다.
 *     블록의 마지막 줄에서 되살린다 — 블록이 없는 파일은 0 그대로이고 목차에서 빠진다.
 *  2. `file_read_lines` 가 던진다(픽스처 리포가 디스크에 없다). 답을 하나 심는다.
 *     **모든 호출에 같은 답**이라는 것이 오히려 요점이다: `text_hash` 는 원문이 같으면 같아야
 *     하고, 그래야 다시 열었을 때 조각이 `stale` 로 무효화되지 않는다.
 */
import { expect, openHome, stubCommands, test } from '../support/ui.js';

/** 20줄짜리 함수 하나. 40줄 이하라 `segment()` 가 조각 하나로 둔다 (04 §3.1). */
const LINES = [
  'export function totalOf(items: Item[]): number {',
  '  // 장바구니 합계',
  '  let total = 0;',
  '  for (const item of items) {',
  '    if (item.removed) continue;',
  '    total += item.price * item.count;',
  '  }',
  '  if (total < 0) {',
  '    throw new Error("negative");',
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

const TYPED = '내가 치던 줄 하나';

/**
 * `crates/parse` 가 채웠을 줄 수를 되돌린다. 이 한 칸이 없으면 `clone.course_files` 의
 * `line_count > 0` 이 픽스처의 모든 파일을 걸러 내 목차가 0 줄로 선다.
 */
function restoreLineCounts(db: import('better-sqlite3').Database): void {
  db.prepare(
    `UPDATE file SET line_count =
       (SELECT COALESCE(MAX(b.line_end), 0) FROM block b WHERE b.file_id = file.id)
     WHERE line_count = 0`,
  ).run();
}

/** 홈 → 설정 → 서가 → 코스. 코스로 들어가는 문은 지금 서가 하나다 (D120 진입). */
async function openCourse(page: import('@playwright/test').Page): Promise<void> {
  await openHome(page);
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: '서가에서 관리' }).click();
  await page.locator('.shelf').waitFor();
  await page.getByRole('button', { name: /코스 열기$/ }).first().click();
  await page.locator('main.course').waitFor();
}

test('코스는 조각 중간에 나갔다 와도 그 자리다', async ({ page, app }) => {
  restoreLineCounts(app.db);
  await stubCommands(page, { file_read_lines: CHUNK });
  await openCourse(page);

  // 목차가 서고 조각이 하나 걸린다. 조각이 안 나오면 화면이 빈 상태를 그린다 —
  // 그 경우 아래 단언이 아니라 여기서 먼저 멈추는 편이 원인을 말해 준다.
  await expect(page.locator('.course-empty')).toHaveCount(0);
  await expect(page.getByLabel('코스 목차')).toBeVisible();
  await page.locator('.monaco-editor').first().waitFor();

  const step = () =>
    app.db.prepare(
      `SELECT s.id, s.seq, s.part, s.status, s.draft_text, s.text_hash, f.path
         FROM clone_step s JOIN file f ON f.id = s.file_id
        WHERE s.run_id = (SELECT MAX(id) FROM clone_run)
          AND s.status IN ('pending','active')
        ORDER BY s.seq, s.part LIMIT 1`,
    ).get() as { id: number; seq: number; part: number; status: string; draft_text: string | null; text_hash: string; path: string } | undefined;

  const before = step();
  expect(before, '이어할 조각이 원장에 있어야 한다').toBeTruthy();

  // 조각 **중간**까지 친다. 채점하지 않는다 — 마친 조각으로 돌아오는 것은 이어하기가 아니다.
  // Monaco 의 textarea 는 1px 라 `fill()` 이 닿지 않는다. 실제로 하는 것처럼 친다.
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.type(TYPED);

  // `ClonePad` 는 400ms 디바운스 뒤에 `onChange` 를 낸다 — 그 전에 나가면 화면이 아직
  // 옛 초안을 들고 있다. 에디터 아래 줄이 「저장됨」으로 바뀌는 것이 그 신호다.
  await expect(page.locator('.ed-status')).toContainText('저장됨');

  await page.keyboard.press('Escape');
  await page.locator('.masthead').waitFor();

  await expect
    .poll(() => step()?.draft_text, { message: '나가기가 초안을 원장에 내려야 한다' })
    .toBe(TYPED);

  // 코스는 버려지지 않고 멈춘다 — `clone.run_open` 이 `paused` 도 집는다.
  const run = app.db
    .prepare('SELECT status FROM clone_run ORDER BY id DESC LIMIT 1')
    .get() as { status: string };
  expect(run.status).toBe('paused');

  // ── 돌아온다. 새 코스를 열지 않고 그 실행을 잇는다.
  await openCourse(page);

  const runs = app.db.prepare('SELECT COUNT(*) AS n FROM clone_run').get() as { n: number };
  expect(runs.n, '이어하기는 새 실행을 만들지 않는다').toBe(1);

  const after = step();
  expect(after?.id, '같은 조각으로 돌아온다').toBe(before?.id);
  // 원문이 그대로면 해시도 그대로다 — 어긋나면 그 조각이 `stale` 로 무효화된다.
  expect(after?.text_hash).toBe(before?.text_hash);

  // 화면에도 그 초안이 돌아온다. Monaco 의 값은 그린 줄에서 읽는다 — 숨은 textarea 의
  // `inputValue()` 는 지금 보이는 창만 담는다.
  await expect(page.locator('.monaco-editor .view-lines').first()).toContainText(TYPED);
});

test('코스 세션은 일일 큐를 건드리지 않는다 (D120)', async ({ page, app }) => {
  restoreLineCounts(app.db);
  await stubCommands(page, { file_read_lines: CHUNK });
  await openCourse(page);
  await page.locator('.editor textarea, .monaco-editor textarea').first().waitFor();

  const session = app.db
    .prepare('SELECT status, budget_min, planned_min FROM session ORDER BY id DESC LIMIT 1')
    .get() as { status: string; budget_min: number; planned_min: number };

  // 세션은 태어날 때부터 `done` 이다 — `active` 면 `session.open_today` 가 그것을 집어
  // 일일 큐가 코스 판을 찍는다. 예산 0 이라 `stats.days` 의 하루 합계도 안 움직인다.
  expect(session.status).toBe('done');
  expect(session.budget_min).toBe(0);
  expect(session.planned_min).toBe(0);
});
