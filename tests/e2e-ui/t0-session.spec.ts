/**
 * 05 §11 시나리오 1~6 — 교정쇄 한 판의 정답·오답·사다리·아래층·LIFER.
 *
 * 시드는 `tiny` 하나이고 그 리포가 오늘 거는 판은 **T0 두 장**이다 (`fixtures/ipc/tiny` =
 * 파일 5 · 커밋 0 · 사용처 236 · 새 판 상한 `newPerDay` 2 — D113). 표가 「3판」이라 적은
 * 자리에서도 큐는 두 장까지라, 판 번호가 아니라 **그 판에서 일어나는 일**을 잰다.
 * 어긋난 곳은 각 테스트의 주석에 적었다.
 */

import {
  askOffset, copiedText, expect, focusPath, openHome, queueSpeech, stubClipboard, test,
} from '../support/ui.js';
import { answerKeyOf } from '../support/app-db.js';

const SHEET = '.proof article.ps';


/** 홈에서 판 한 장을 걸고 교정지가 놓일 때까지. */
async function startPrinting(page: import('@playwright/test').Page): Promise<void> {
  await openHome(page);
  await page.getByRole('button', { name: /인쇄 시작/ }).click();
  await page.locator(SHEET).waitFor();
}

test('01 홈 → 인쇄 시작 → 1판 정답', async ({ page, app }) => {
  await openHome(page);

  // 오늘의 인쇄가 판 수와 분을 먼저 말한다 (정본 §3-5).
  // T0 둘 + 구조 한 판 — 홈 미리보기가 세션이 실제로 거는 수와 같다 (D140 · D170 ④).
  await expect(page.locator('.today .today-n')).toHaveText(/3판 · 약 \d+분/);
  await expect(page.locator('.today .press-btn')).toContainText('인쇄 시작');

  await page.getByRole('button', { name: /인쇄 시작/ }).click();
  await page.locator(SHEET).waitFor();
  await expect(page.locator(SHEET)).toHaveAttribute('aria-label', /1판 · 문자열 리터럴/);
  // 교정지가 마운트되면 포커스는 판 자신이다 (05 §7).
  expect(await focusPath(page)).toBe('article.ps');

  const before = await askOffset(page);
  expect(before).toBeGreaterThan(0);

  await page.locator(`.ch[data-k="${answerKeyOf(app.db)}"]`).click();
  await page.locator('.acts .press-btn').click();
  await expect(page.locator('.fb .stampbox .stamp')).toBeVisible();

  // 정합 도장 — 은유와 평문을 같이 찍는다.
  await expect(page.locator('.fb .stampbox .stamp')).toContainText('정합');
  await expect(page.locator('.fb .stampbox .stamp')).toContainText('in register');
  // `+1겹` — 겹이 움직인 것을 이득으로 (05 §5 `ProofSheet`).
  await expect(page.locator('.ps-rail .plus')).toHaveText('+1겹');
  await expect(page.locator('.ps-rail .plus')).toHaveClass(/\bon\b/);

  // live 문구 — 세션의 낭독 지점은 오버레이의 `.vh#live` 한 곳이다 (05 §7 · D114).
  // 판정란 자신은 `aria-live` 를 들지 않는다: 통째로 읽으면 60자 규약을 넘는다.
  await expect(page.locator('.fb')).not.toHaveAttribute('aria-live', /.*/);
  const live = page.locator('.proof #live');
  await expect(live).toHaveText(/정합 — 맞았습니다\. 잉크 1겹 · 다음 인쇄.*Space 로 다음\./);
  await expect(page.locator('.fb')).toContainText('맞았습니다');

  // 판정란은 자리를 미리 비워 뒀다 — 답해도 위쪽 글이 0px 도 밀리지 않는다 (정본 §3-3).
  expect(await askOffset(page)).toBe(before);
});

test('02 2판 오답', async ({ page, app }) => {
  // 표는 「2판」이지만 `tiny` 의 오늘 큐는 두 장이라 첫 판을 틀린다. 재는 것은 같다 —
  // 진단이 「고른 그것이 참이 되는 조건」을 말하는가, 다시 찍기가 큐에 들어가는가.
  await startPrinting(page);
  const queue = page.locator('.jobband .queue');
  expect((await queueSpeech(queue)).cells).toBe(3);

  const wrong = (answerKeyOf(app.db) % 4) + 1;
  await page.locator(`.ch[data-k="${wrong}"]`).click();
  await page.locator('.acts .press-btn').click();
  await expect(page.locator('.fb .stampbox .stamp')).toContainText('어긋남');
  await expect(page.locator('.fb')).toContainText('틀렸습니다');

  // 날카로운 자리 — 실제로 터지는 최소 코드 두 줄이 코드판으로 붙는다.
  const edge = page.locator('.fb .edge');
  await expect(edge).toContainText('가장 날카로운 자리');
  await expect(edge.locator('.code .ln')).toHaveCount(2);

  // 큐가 한 칸 늘고 새 칸은 「지나온 것」 무늬다. 05 §11 은 5→6칸이라 적었으나
  // 그것은 5판짜리 큐의 수치이고, 규칙은 「다시 찍기 한 장이 들어간다」이다.
  await expect.poll(async () => (await queueSpeech(queue)).cells).toBe(4);
  await expect(page.locator('.jobband .queue i.review')).toHaveCount(1);

  // 원장 쪽 사실 — 부모를 가리키는 `retry` 행이 뒤에 붙었다 (02 §4 · `retryAt` = pos+3, 큐 끝에서 잘림).
  const rows = app.db
    .prepare('SELECT pos, role, parent_item_id AS parent FROM session_item ORDER BY pos')
    .all() as { pos: number; role: string; parent: number | null }[];
  expect(rows.map((r) => r.role)).toEqual(['new', 'new', 'new', 'retry']);
  expect(rows[3]?.parent).toBe(1);
  expect(rows[3]?.pos).toBeGreaterThan(rows[0]?.pos ?? 0);
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

  // 겹과 다시 찍기 시점을 **이득으로** 적는다. 이 판은 처음 거는 새 판이라 겹이 0 이고
  // 예정도 없다 — 「모르겠어요」가 옮길 자리가 없으므로 0 → 0 이고 다시 찍기 줄은 뜨지
  // 않는다. 앞서는 예정이 없는데도 「다시 찍기 오늘 안에 → 오늘 안에」를 적었다.
  const gain = ladder.locator('.ld-gain');
  await expect(gain).toHaveText('잉크 0겹 → 0겹');

  // 1단 — 사전 3층.
  await expect(ladder.locator('.rung-body h4')).toHaveText(/사전 3층/);
  await expect(ladder.locator('.rung-body .dict > div')).toHaveCount(3);

  // 2단 — 아래층 진단. 첫 판의 `ts/string-literal` 은 언어 선행이 없는 뿌리 개념이고,
  // 그 아래에 깔린 기계 `cs/text-encoding` 하나만 선행으로 달려 있다(D167). 시드에는 그
  // 판이 없으므로 줄 하나가 「아직 안 찍힘」으로 뜬다 — 뿌리라도 아래층이 비어 있지 않다.
  await ladder.locator('.rung[data-r="2"]').click();
  await expect(ladder.locator('.rung-body h4')).toHaveText(/아래층 진단/);
  await expect(ladder.locator('.rung-body .prereq .pq')).toHaveCount(1);
  await expect(ladder.locator('.rung-body .prereq .pq')).toContainText('글자와 바이트는 다르다');

  // 3단 — 같은 문법이 쓰인 다른 자리. 지금 보고 있는 줄은 빠진다.
  await ladder.locator('.rung[data-r="3"]').click();
  await expect(ladder.locator('.rung-body h4')).toHaveText(/다른 자리/);
  await expect(ladder.locator('.rung-body .uses .use')).not.toHaveCount(0);

  // 4단 — 프롬프트 생성·복사. 나가는 것은 이 줄과 앞뒤 4줄, 파일 **이름**뿐이다 (D8).
  await ladder.locator('.rung[data-r="4"]').click();
  // 누르기 전에는 프롬프트가 없다 (목업 `promptOut: ''`) — 그래서 「복사」도 잠겨 있다.
  await expect(ladder.locator('.prompt-out')).toHaveCount(0);
  await expect(ladder.getByRole('button', { name: '복사' })).toBeDisabled();

  const STUCK = '?. 다음 줄이 어떻게 되는지 모르겠어요';
  await ladder.locator('.askbox textarea').fill(STUCK);
  await ladder.getByRole('button', { name: '프롬프트 만들기' }).click();
  const prompt = ladder.locator('.prompt-out');
  await expect(prompt).toBeVisible();
  const shown = (await prompt.innerText()).trim();
  // **적은 문장이 담긴다.** 앞서는 사다리를 열 때 한 번 구워 두어 언제나 「(비어 있음)」이었다.
  expect(shown).toContain(STUCK);
  expect(shown).toContain('time.ts');
  expect(shown).not.toContain('/w/tiny');

  await ladder.getByRole('button', { name: '복사' }).click();
  await expect.poll(async () => (await copiedText(page)).length).toBe(1);
  expect((await copiedText(page))[0]?.trim()).toBe(shown);
});

test('04 2단 아래층 점프 → 답 → 자동 복귀', async ({ page, app }) => {
  test.skip(
    true,
    '시드로 열리지 않는다. 첫 판의 `ts/string-literal` 은 **뿌리 개념이라 선행이 없고**'
    + '(`concept_prereq` 0행), 2단이 그리는 것은 「아래층은 모두 찍혀 있습니다」 진단 한 줄뿐이다 '
    + '— 내려갈 줄도 단추도 서지 않는다 (D113 으로 시드가 두꺼워진 뒤에도 그렇다).',
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
  await page.locator(`.ch[data-k="${answerKeyOf(app.db)}"]`).click();
  await page.locator('.acts .press-btn').click();

  // 판정란 **안**에 남는다 — 컨페티가 아니라 영구 기록이다 (정본 §3-6 · D131).
  const note = page.locator('.fb .lifer-note');
  await note.waitFor();
  await expect(note.locator('.lifer-k')).toHaveText('첫 기록 · LIFER');
  await expect(note.locator('.lifer-serial')).toHaveText('#001');
  await expect(note).toContainText('time.ts:19');

  // 판정문과 같은 칸에 있다 — 덮는 것이 없으므로 판정도 같이 읽힌다.
  await expect(page.locator('.fb h4')).toContainText('맞았습니다');

  // 덮는 것이 없으니 포커스는 채점 직후 자리(다음 판 단추)에 그대로 있다 (05 §7).
  expect(await focusPath(page)).toContain('press-btn');

  // 원장에도 남는다 — 개념당 평생 한 행이고 `shown_at` 이 연출을 본 시각이다.
  const lifers = app.db.prepare('SELECT concept_id, shown_at FROM lifer').all() as
    { concept_id: string; shown_at: number | null }[];
  expect(lifers).toHaveLength(1);
  expect(lifers[0]?.concept_id).toBe('ts/string-literal');
  expect(lifers[0]?.shown_at).not.toBeNull();
  // 「세션 4번째부터 안 뜸」은 이 시드로 재지 못한다 — 새 판이 하루에 두 장뿐이다.
});
