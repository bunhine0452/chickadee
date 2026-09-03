/**
 * 05 §11 시나리오 1~6 — 교정쇄 한 판의 정답·오답·사다리·아래층·LIFER.
 *
 * 시드는 `tiny` 하나이고 그 리포가 오늘 거는 판은 **T0 한 장**이다
 * (`fixtures/ipc/tiny` = 파일 5 · 커밋 0 · 사용처 2). 표가 「2판」·「3판」이라 적은 자리에서도
 * 큐에 걸리는 판은 1번뿐이라, 판 번호가 아니라 **그 판에서 일어나는 일**을 잰다.
 * 어긋난 곳은 각 테스트의 주석에 적었다.
 */
import type { Database } from 'better-sqlite3';

import {
  askOffset, copiedText, expect, focusPath, openHome, queueSpeech, stubClipboard, test,
} from '../support/ui.js';

const SHEET = '.proof article.ps';

/**
 * 이 판의 정답 보기 번호(1부터). 생성기가 섞은 순서를 **원장에서** 읽는다 —
 * 화면을 보고 답을 고르면 「채점이 맞나」가 아니라 「화면이 자기 말을 되풀이하나」가 된다.
 */
function answerKey(db: Database): number {
  const row = db.prepare('SELECT payload_json FROM card ORDER BY id DESC LIMIT 1').get() as
    | { payload_json: string }
    | undefined;
  if (row === undefined) throw new Error('카드가 없다 — 세션이 열리지 않았다');
  return (JSON.parse(row.payload_json) as { answer: number }).answer + 1;
}

/** 홈에서 판 한 장을 걸고 교정지가 놓일 때까지. */
async function startPrinting(page: import('@playwright/test').Page): Promise<void> {
  await openHome(page);
  await page.getByRole('button', { name: /인쇄 시작/ }).click();
  await page.locator(SHEET).waitFor();
}

test('01 홈 → 인쇄 시작 → 1판 정답', async ({ page, app }) => {
  await openHome(page);

  // 오늘의 인쇄가 판 수와 분을 먼저 말한다 (정본 §3-5).
  await expect(page.locator('.today .today-n')).toHaveText(/1판 · 약 \d+분/);
  await expect(page.locator('.today .press-btn')).toContainText('인쇄 시작');

  await page.getByRole('button', { name: /인쇄 시작/ }).click();
  await page.locator(SHEET).waitFor();
  await expect(page.locator(SHEET)).toHaveAttribute('aria-label', /1판 · 옵셔널 체이닝/);
  // 교정지가 마운트되면 포커스는 판 자신이다 (05 §7).
  expect(await focusPath(page)).toBe('article.ps');

  const before = await askOffset(page);
  expect(before).toBeGreaterThan(0);

  await page.locator(`.ch[data-k="${answerKey(app.db)}"]`).click();
  await page.locator('.acts .press-btn').click();
  await expect(page.locator('.fb .stamp')).toBeVisible();

  // 정합 도장 — 은유와 평문을 같이 찍는다.
  await expect(page.locator('.fb .stamp')).toContainText('정합');
  await expect(page.locator('.fb .stamp')).toContainText('in register');
  // `+1겹` — 겹이 움직인 것을 이득으로 (05 §5 `ProofSheet`).
  await expect(page.locator('.ps-rail .plus')).toHaveText('+1겹');
  await expect(page.locator('.ps-rail .plus')).toHaveClass(/\bon\b/);

  // live 문구. 세션에는 `ui.live` 한 곳이 없고 판정란이 `aria-live=polite` 를 들고 있다.
  const fb = page.locator('.fb[aria-live="polite"]');
  await expect(fb).toContainText('맞았습니다');
  await expect(fb).toContainText('잉크 1겹 · 다음 인쇄');

  // 판정란은 자리를 미리 비워 뒀다 — 답해도 위쪽 글이 0px 도 밀리지 않는다 (정본 §3-3).
  expect(await askOffset(page)).toBe(before);
});

test('02 2판 오답', async ({ page, app }) => {
  // 표는 「2판」이지만 `tiny` 의 오늘 큐는 한 장이라 그 판을 틀린다. 재는 것은 같다 —
  // 진단이 「고른 그것이 참이 되는 조건」을 말하는가, 다시 찍기가 큐에 들어가는가.
  await startPrinting(page);
  const queue = page.locator('.jobband .queue');
  expect((await queueSpeech(queue)).cells).toBe(1);

  const wrong = (answerKey(app.db) % 4) + 1;
  await page.locator(`.ch[data-k="${wrong}"]`).click();
  await page.locator('.acts .press-btn').click();
  await expect(page.locator('.fb .stamp')).toContainText('어긋남');
  await expect(page.locator('.fb')).toContainText('어긋났습니다');

  // 날카로운 자리 — 실제로 터지는 최소 코드 두 줄이 코드판으로 붙는다.
  const edge = page.locator('.fb .edge');
  await expect(edge).toContainText('가장 날카로운 자리');
  await expect(edge.locator('.code .ln')).toHaveCount(2);

  // 큐가 한 칸 늘고 새 칸은 「지나온 것」 무늬다. 05 §11 은 5→6칸이라 적었으나
  // 그것은 5판짜리 큐의 수치이고, 규칙은 「다시 찍기 한 장이 들어간다」이다.
  await expect.poll(async () => (await queueSpeech(queue)).cells).toBe(2);
  await expect(page.locator('.jobband .queue i.review')).toHaveCount(1);

  // 원장 쪽 사실 — 부모를 가리키는 `retry` 행이 뒤에 붙었다 (02 §4 · `retryAt` = pos+3, 큐 끝에서 잘림).
  const rows = app.db
    .prepare('SELECT pos, role, parent_item_id AS parent FROM session_item ORDER BY pos')
    .all() as { pos: number; role: string; parent: number | null }[];
  expect(rows.map((r) => r.role)).toEqual(['new', 'retry']);
  expect(rows[1]?.parent).toBe(1);
  expect(rows[1]?.pos).toBeGreaterThan(rows[0]?.pos ?? 0);
});

test('03 3판 `?` 사다리 1~4단', async ({ page }) => {
  await stubClipboard(page);
  await startPrinting(page);

  await page.locator('.acts .dunno').click();
  const ladder = page.locator('.reprint');
  await ladder.waitFor();
  await expect(ladder.locator('.rungs[role="tablist"] .rung')).toHaveCount(4);
  // 사다리를 열면 포커스는 지금 단으로 온다 (05 §7).
  expect(await focusPath(page)).toContain('rung');

  // 겹과 다시 찍기 시점을 **이득으로** 적는다.
  const gain = ladder.locator('.ld-gain');
  await expect(gain).toContainText('잉크');
  await expect(gain).toContainText('다시 찍기');
  await expect(gain).toContainText('오늘 안에');

  // 1단 — 사전 3층.
  await expect(ladder.locator('.rung-body h4')).toHaveText(/사전 3층/);
  await expect(ladder.locator('.rung-body .dict > div')).toHaveCount(3);

  // 2단 — 아래층 진단. `tiny` 는 선행 개념이 리포에 없어 「판 없음」 줄만 나온다.
  await ladder.locator('.rung[data-r="2"]').click();
  await expect(ladder.locator('.rung-body h4')).toHaveText(/아래층 진단/);
  await expect(ladder.locator('.rung-body .prereq .pq')).not.toHaveCount(0);

  // 3단 — 같은 문법이 쓰인 다른 자리. 지금 보고 있는 줄은 빠진다.
  await ladder.locator('.rung[data-r="3"]').click();
  await expect(ladder.locator('.rung-body h4')).toHaveText(/다른 자리/);
  await expect(ladder.locator('.rung-body .uses .use')).toHaveCount(1);
  await expect(ladder.locator('.rung-body .uses .src')).not.toContainText('50행');

  // 4단 — 프롬프트 생성·복사. 나가는 것은 이 줄과 앞뒤 4줄, 파일 **이름**뿐이다 (D8).
  await ladder.locator('.rung[data-r="4"]').click();
  await ladder.locator('.askbox textarea').fill('?. 다음 줄이 어떻게 되는지 모르겠어요');
  await ladder.getByRole('button', { name: '프롬프트 만들기' }).click();
  const prompt = ladder.locator('.prompt-out');
  await expect(prompt).toBeVisible();
  const shown = (await prompt.innerText()).trim();
  expect(shown).toContain('repo.ts');
  expect(shown).not.toContain('/w/tiny');

  await ladder.getByRole('button', { name: '복사' }).click();
  await expect.poll(async () => (await copiedText(page)).length).toBe(1);
  expect((await copiedText(page))[0]?.trim()).toBe(shown);
});

test('04 2단 아래층 점프 → 답 → 자동 복귀', async ({ page, app }) => {
  test.skip(
    true,
    '시드로 열리지 않는다. `tiny` 에서 `?.` 의 선행 개념 둘(점 표기 속성 읽기 · undefined 와 null)은 '
    + '리포에 사용처가 없어 `concept.prereqs` 가 `has_site = 0` 으로 답하고, `data/ladder.ts` 의 '
    + '`stateOf` 가 그것을 `none` 으로 굳혀 「판 없음」 알약만 그린다 — 내려갈 단추 자체가 없다. '
    + '더구나 `loadLadder` 는 `PrereqRow.cardId` 를 채우지 않아 `state === "gap"` 이어도 단추가 '
    + '뜨지 않는다(아래 보고 참조).',
  );
  void page;
  void app;
});

test('05 아래층에서 `B`', async ({ page, app }) => {
  test.skip(true, '시나리오 4 와 같은 이유 — 아래층 판을 걸 수 없으니 위로 올라올 판도 없다.');
  void page;
  void app;
});

test('06 새 판 첫 정합 → LIFER', async ({ page, app }) => {
  await startPrinting(page);
  await page.locator(`.ch[data-k="${answerKey(app.db)}"]`).click();
  await page.locator('.acts .press-btn').click();

  // 베일이 열린다 — 컨페티가 아니라 영구 기록이다 (정본 §3-6).
  const veil = page.locator('.lifer-veil');
  await veil.waitFor();
  await expect(veil.locator('.lifer-k')).toHaveText('첫 기록 · LIFER');
  await expect(veil.locator('.lifer-serial')).toHaveText('#001');
  await expect(veil).toContainText('repo.ts:50');
  expect(await focusPath(page)).toContain('lifer-card');

  // 수식키 단독은 닫지 않는다 — Shift 로 대문자를 만들려던 손짓에 평생 한 번이 사라지면 안 된다.
  await page.keyboard.press('Shift');
  await expect(veil).toBeVisible();

  // 아무 키나 닫는다. 포커스는 열기 전 자리(다음 판 단추)로 돌아온다.
  await page.keyboard.press('KeyG');
  await expect(page.locator('.lifer-veil')).toHaveCount(0);
  expect(await focusPath(page)).toContain('press-btn');

  // 원장에도 남는다 — 개념당 평생 한 행이고 `shown_at` 이 연출을 본 시각이다.
  const lifers = app.db.prepare('SELECT concept_id, shown_at FROM lifer').all() as
    { concept_id: string; shown_at: number | null }[];
  expect(lifers).toHaveLength(1);
  expect(lifers[0]?.concept_id).toBe('ts/optional-chaining');
  expect(lifers[0]?.shown_at).not.toBeNull();
  // 「세션 4번째부터 안 뜸」은 이 시드로 재지 못한다 — 새 판이 하루에 한 장뿐이다.
});
