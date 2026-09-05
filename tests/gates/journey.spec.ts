/**
 * 여정 게이트 (D186 ①) — **막힘 0**.
 *
 * 「막힘」은 **다음 행동이 없는 화면**이다. 학습자가 서 있는 자리마다 주 단추(`.press-btn`)
 * 가 있어야 하고, 포커스가 `<body>` 로 떨어져 있으면 안 된다 (정본 §3-8 · 05 §9).
 * 이 파일이 재는 것은 그 둘과 **첫 판까지의 클릭 수**다.
 *
 * **끝난 화면은 막힘이 아니다.** 오늘 몫을 다 푼 홈은 주 단추가 없다 — 그것이 정답이기
 * 때문이다(정본 §3 「없는 것을 억지로 채우지 않는다」). 대신 그 자리는 **끝났다고 말하고
 * 어디에 더 있는지 이름으로 가리켜야** 한다(`.today-off`). 게이트는 그 표식을 다음 행동으로
 * 친다 — 표식도 단추도 없으면 그때가 막힘이다.
 *
 * 걷는 길: 첫 실행 → 홈 → 세션(첫 판 → 채점 → 요약) → 홈 → 코스 → 챕터 → 1단 → 2단 오버레이.
 *
 * **못 재는 것을 먼저 적는다.**
 * - 리포 등록은 OS 폴더 대화상자를 지나므로 하네스에서 못 누른다(`dialog_pick_folder` 는
 *   `app-db` 가 모르는 명령이다). 첫 실행 화면은 **다음 행동이 있는가**까지만 본다.
 *   폴더를 고른 뒤의 인제스트 → 홈은 실제 바이너리 쪽(`e9-journey.e2e.ts`)이 걷는다.
 * - 코스 2~5단의 판은 `tiny` 시드가 못 굽는다(요청 줄기 0 · 값이 두 번 바뀌는 자리 0).
 *   그래서 **판 하나를 손으로 심어** 오버레이까지 간다 — 여기서 재는 것은 생성기가 아니라
 *   화면이다. 심지 않은 채로도 막히지 않아야 하고, 그것을 앞의 시험이 따로 본다.
 * - 실제 창(Tauri)의 포커스 정책은 다르다 — WKWebView 는 시스템 설정에 따라 `<button>` 을
 *   포커스 대상에서 뺀다(`tests/support/ui.ts`). 그래서 여기서는 **프로그램 포커스**만 본다.
 */
import type { Locator, Page } from '@playwright/test';

import { expect } from '@playwright/test';

import { answerKeyOf, type AppDb } from '../support/app-db.js';
import { test } from '../support/fixture.js';
import { settled } from '../support/gates.js';
import { passT2Plate } from '../support/ui.js';

/** 시드의 고정 시각 — 심는 판의 `created_at`. */
const NOW = 1_772_755_200_000;

/** 홈에서 첫 판까지 허락하는 클릭 수. 늘어나면 이 게이트가 그 자리에서 죽는다. */
const CLICK_BUDGET = 2;

async function boot(page: Page): Promise<void> {
  await page.goto('/?dev=1');
  await page.locator('main.shell:not([aria-busy="true"]), .masthead, .firstrun').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => '__audit' in window);
  await settled(page);
}

/** 지금 포커스가 앉은 요소의 태그·클래스. `body` 면 포커스를 잃은 것이다. */
const focusPath = (page: Page): Promise<string> => page.evaluate(() => {
  const el = document.activeElement;
  if (el === null) return '(null)';
  const cls = typeof el.className === 'string' && el.className !== ''
    ? `.${el.className.trim().split(/\s+/).join('.')}`
    : '';
  return `${el.tagName.toLowerCase()}${cls}`;
});

/**
 * 이 화면에 다음 행동이 있나 — **막힘 0 의 정의**.
 *
 * 「보이는 주 단추 하나 이상」과 「포커스가 문서 안 어딘가」 둘 다여야 한다. 단추가 있어도
 * 포커스가 `<body>` 면 키보드로는 그 단추까지 갈 길이 열려 있지 않고(WKWebView 는 Tab 이
 * 단추를 건너뛴다), 포커스가 있어도 단추가 없으면 갈 곳이 없다.
 */
async function hasNextStep(page: Page, where: string, scope?: Locator): Promise<void> {
  const root = scope ?? page.locator('body');
  const primary = root.locator('button.press-btn:not([disabled]), .today-off');
  await expect(primary.first(), `${where} — 주 단추도 「끝났다」 표식도 없다 (막힘)`).toBeVisible();
  await expect
    .poll(() => focusPath(page), { message: `${where} — 포커스가 body 로 떨어졌다` })
    .not.toBe('body');
}

/** 나가는 문 — 되돌아가지 않고 이 화면을 뜰 수 있나. */
async function hasExit(page: Page, where: string, name: RegExp): Promise<void> {
  await expect(
    page.getByRole('button', { name }).first(),
    `${where} — 나가는 문이 없다`,
  ).toBeVisible();
}

// ───────── 첫 실행 ─────────

test('첫 실행 — 리포를 넣는 문 하나가 서 있고 포커스가 화면 안이다', async ({ page, app }) => {
  // 리포 0개가 곧 첫 실행이다 (D119). 외래키를 끄고 지운다 — 파생 행은 그대로 둔다.
  app.db.pragma('foreign_keys = OFF');
  app.db.exec('DELETE FROM repo');

  await boot(page);
  await expect(page.locator('.firstrun')).toBeVisible();
  await hasNextStep(page, '첫 실행');
  // 「무엇을 하는 프로그램인가」를 먼저 말한다 — 물음 둘보다 앞이다 (정본 §3-7).
  await expect(page.locator('.firstrun-note')).toBeVisible();
});

// ───────── 홈 → 첫 판 ─────────

test('홈 → 첫 판 — 클릭 한 번, 그리고 판마다 다음 행동이 있다', async ({ page, app }) => {
  await boot(page);
  await hasNextStep(page, '홈');

  let clicks = 0;
  await page.getByRole('button', { name: /학습 시작|이어 풀기/ }).click();
  clicks += 1;
  const sheet = page.locator('article.ps').first();
  await sheet.waitFor();
  await settled(page);

  expect(clicks, '홈에서 첫 판까지의 클릭').toBeLessThanOrEqual(CLICK_BUDGET);
  // 판이 걸리면 포커스는 교정지다 (05 §7) — Tab 없이 숫자 키가 바로 먹는다.
  expect(await focusPath(page)).toContain('ps');
  await hasExit(page, '세션', /나가기/);

  // 답 → 채점 → 다음. 채점 뒤에도 화면에 다음 행동이 있다.
  await page.keyboard.press(`Digit${String(answerKeyOf(app.db))}`);
  await page.keyboard.press('Enter');
  await page.locator('.fb.on').waitFor();
  await settled(page);
  await hasNextStep(page, '채점 뒤');
});

test('세션을 끝내면 요약이 서고 거기서도 다음 행동이 있다', async ({ page, app }) => {
  await boot(page);
  await page.getByRole('button', { name: /학습 시작|이어 풀기/ }).click();
  await page.locator('article.ps').waitFor();

  const done = page.locator('article.ps[aria-label="오늘 학습 완료"]');
  for (let left = 12; left > 0 && await done.count() === 0; left -= 1) {
    // T2 지도 판은 보기 번호가 없다 (D140) — 상자 하나를 골라 채점하고 지나간다.
    if (!await passT2Plate(page)) {
      await page.keyboard.press(`Digit${String(answerKeyOf(app.db))}`);
      await page.keyboard.press('Enter');
      await page.locator('.fb.on').waitFor();
      await settled(page);
    }
    const was = await page.locator('article.ps').first().getAttribute('aria-label');
    await page.keyboard.press('Space');
    await page.waitForFunction(
      (prev) => document.querySelector('article.ps[aria-label="오늘 학습 완료"]') !== null
        || document.querySelector('article.ps')?.getAttribute('aria-label') !== prev,
      was,
    );
    await settled(page);
  }

  if (await done.count() === 0) {
    // 요약까지 못 갔으면 그 자체가 막힘은 아니다 — 지금 걸린 판에 다음 행동이 있으면 된다.
    await hasNextStep(page, '세션 중간');
    return;
  }
  await hasNextStep(page, '요약');
  await page.keyboard.press('Enter');
  await page.locator('.masthead').waitFor();
  await settled(page);
  await hasNextStep(page, '요약 뒤 홈');
});

// ───────── 코스 ─────────

/** 심는 2단 값 추적 판 하나. 시드가 못 굽는 것을 화면 시험을 위해 손으로 놓는다. */
const TRACE = {
  track: 't3', kind: 'trace', stage: 2,
  q: 'time.ts — ms 가 가리키는 값이 언제 바뀌나',
  hint: '값이 바뀌는 칸만 비어 있습니다.',
  file: 'src/core/time.ts',
  lines: [17, 18, 19].map((n) => ({ n, t: `line ${String(n)}` })),
  cols: [{ k: 'c_ms', axis: 'var', t: 'ms 의 값' }],
  rows: [17, 18, 19].map((n) => ({ k: `r${String(n)}`, line: n, t: `line ${String(n)}` })),
  cells: [
    { r: 'r17', c: 'c_ms', v: { t: 'int', v: '0' }, carry: null },
    { r: 'r18', c: 'c_ms', v: { t: 'int', v: '1' }, carry: null },
    { r: 'r19', c: 'c_ms', v: { t: 'int', v: '1' }, carry: 'r18' },
  ],
  hidden: ['r17|c_ms', 'r18|c_ms'],
  ok: '18 줄에서 ms 가 바뀝니다.',
  rule: '대입은 그 줄에서만 값을 바꿉니다.',
  promptLines: [],
};

function plantStageCard(app: AppDb): void {
  app.db
    .prepare(
      `INSERT INTO card (repo_id, unit_id, track, kind, concept_id, level, payload_json,
                         gen_version, content_hash, created_at, stage_no)
       VALUES (1, 1, 't3', 'flow', 'common/reassignment', 1, ?, 1, 'journey-trace', ?, 2)`,
    )
    .run(JSON.stringify(TRACE), NOW);
}

test('코스 — 판이 없어도 막히지 않는다', async ({ page, app }) => {
  void app;
  await boot(page);
  await page.getByRole('button', { name: '코스' }).click();
  await page.locator('main.cc').waitFor();
  await page.locator('.cc-panel, .cc-empty').first().waitFor();
  await settled(page);

  await hasNextStep(page, '코스');
  await hasExit(page, '코스', /홈으로/);
  // 「오늘 15분」이 비었으면 **왜** 비었는지를 적고 그 자리에 다음 행동을 낸다 (D186 ①·④).
  await expect(page.locator('.cc-today')).toBeVisible();
  await expect(page.locator('.cc-today'), '「오늘 15분」에 아무 말도 없다').not.toBeEmpty();
});

test('코스 — 1단 판정 → 2단 오버레이까지 걷는다', async ({ page, app }) => {
  plantStageCard(app);
  await boot(page);
  await page.getByRole('button', { name: '코스' }).click();
  await page.locator('main.cc').waitFor();
  await page.locator('.cc-panel').waitFor();
  await settled(page);

  // 1단 — 이 챕터에 찍을 어휘가 없으면 판정 한 번이면 통과다.
  const judge = page.locator('.cc-panel').getByRole('button', { name: /읽기 단 판정/ });
  await expect(judge, '1단에서 다음 행동이 없다').toBeVisible();
  await judge.click();
  const toStage2 = page.locator('.cc-panel').getByRole('button', { name: /2단/ });
  await expect(toStage2).toBeVisible();
  await settled(page);
  // 누른 단추가 사라진 자리에서 포커스를 잃지 않는다 (05 §9).
  await hasNextStep(page, '1단 통과 뒤');

  // 2단 — 단 오버레이.
  await toStage2.click();
  const plate = page.locator('article.ps').first();
  await plate.waitFor();
  await settled(page);
  expect(await focusPath(page)).toContain('ps');
  await hasExit(page, '단 오버레이', /나가기/);
  await hasNextStep(page, '단 오버레이', plate);

  // Esc 하나로 나온다 (정본 §3-4) — 그리고 나온 자리에도 다음 행동이 있다.
  await page.keyboard.press('Escape');
  await expect(page.locator('article.ps')).toHaveCount(0);
  await settled(page);
  await hasNextStep(page, '오버레이에서 나온 뒤');
});

// ───────── 설정 · 서가 ─────────

for (const screen of [
  { name: '설정', button: '설정', root: 'main.settings' },
  { name: '서가', button: '서가', root: 'main.shelf' },
] as const) {
  test(`${screen.name} — 들어가면 포커스가 화면 안이고 나오는 문이 있다`, async ({ page, app }) => {
    void app;
    await boot(page);
    await page.getByRole('button', { name: screen.button }).click();
    await page.locator(screen.root).waitFor();
    await settled(page);

    expect(
      await focusPath(page),
      `${screen.name} — 들어가자마자 포커스가 body 다`,
    ).not.toBe('body');
    await hasExit(page, screen.name, /홈으로/);
  });
}

// ───────── 밝기는 헤더가 아니라 설정에 있다 (D187 ⑫) ─────────

/**
 * S2 가 스크린샷 144장에서 잡은 회귀 — 어둡게 23화면이 밝게와 **바이트까지 같았다**.
 * 뿌리는 `applyTheme()` 을 부르는 곳이 설정 화면의 훅뿐이라, 헤더 스위치가 빠진 뒤로
 * (D187 ⑫) 설정에 들어갔다 나오기 전에는 홈이 밝게로 굳은 것이었다. 부팅이 세우게 고쳤고,
 * 여기서 **홈에서 바로** 그것을 못박는다.
 */
test('시스템이 어두우면 설정에 들어가지 않아도 홈이 어둡다', async ({ page, app }) => {
  void app;
  await page.emulateMedia({ colorScheme: 'dark' });
  await boot(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // 「시스템 따름」인 동안에는 시스템이 바뀌면 따라간다.
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('설정에서 고르면 시스템이 바뀌어도 안 따라간다 (덮어쓰기)', async ({ page, app }) => {
  void app;
  await page.emulateMedia({ colorScheme: 'light' });
  await boot(page);
  await page.getByRole('button', { name: '설정' }).click();
  await page.locator('main.settings').waitFor();
  await page.getByRole('radio', { name: '어둡게' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('헤더에 밝기 스위치가 없고 설정의 기본이 시스템 따름이다', async ({ page, app }) => {
  void app;
  await boot(page);
  await expect(page.locator('header.masthead [role="switch"]')).toHaveCount(0);

  await page.getByRole('button', { name: '설정' }).click();
  await page.locator('main.settings').waitFor();
  await expect(page.getByRole('radio', { name: '시스템 따름' }))
    .toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: '어둡게' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
