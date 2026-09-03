/**
 * 06 §2 키보드 완결 게이트 — **마우스 0** 으로 E5 를 재생하고, 매 단계 포커스가 살아 있는지
 * 본다. `axe-core` serious 이상 0 도 여기서 같이 잰다.
 *
 * 이 파일에는 `page.mouse` 도 `locator.click()` 도 없다. 있으면 게이트가 뜻을 잃는다 —
 * 「키보드만으로 끝난다」는 주장은 마우스를 한 번이라도 쓰면 증명되지 않는다.
 */
import AxeBuilder from '@axe-core/playwright';

import { test, expect } from '../support/fixture.js';
import type { Page } from '@playwright/test';

import {
  T1_SKIP, T2_SKIP, answerKey, gotoDev, loadAllow, startSession, toNight,
} from '../support/gates.js';

const axeAllow = loadAllow('axe.allow.json').entries;

/** 06 §2 — serious 이상 0. minor·moderate 는 보고만 하고 막지 않는다. */
const BLOCKING = new Set(['serious', 'critical']);

/** 지금 포커스가 어디인가. `body` 면 포커스를 잃은 것이다 (05 §9). */
const focusPath = (page: Page): Promise<string> => page.evaluate(() => {
  const el = document.activeElement;
  if (el === null) return '(null)';
  const cls = typeof el.className === 'string' && el.className !== '' ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
  return `${el.tagName.toLowerCase()}${cls}`;
});

/** 한 걸음 뒤에 포커스가 살아 있는지. 어디에 있는지도 같이 돌려준다 — 실패 보고가 그것이다. */
async function focusHolds(page: Page, step: string): Promise<string> {
  const at = await focusPath(page);
  expect(at, `${step} 뒤에 포커스가 body 로 떨어졌다`).not.toBe('body');
  return at;
}

test('키보드 완결 — 마우스 0 으로 홈 → T0 → 사다리 → 정합 → 요약 → 홈', async ({ page, app }) => {
  const trail: string[] = [];
  await gotoDev(page);

  // ① 홈의 조작기들이 실제로 포커스를 받는다.
  //
  //    맨 Tab 으로 재지 않는 이유: WebKit 은 시스템의 「전체 키보드 접근」 설정에 따라 Tab 이
  //    버튼을 건너뛴다(실측 — 홈에서 Tab 한 번 뒤 activeElement 가 body). 그것은 엔진의
  //    정책이지 화면의 성질이 아니라, 재면 게이트가 앱이 아니라 엔진을 재게 된다.
  const themeSwitch = page.getByRole('switch', { name: '주간반 · 야간반 전환' });
  await themeSwitch.focus();
  trail.push(`홈 스위치 → ${await focusHolds(page, '홈 스위치')}`);

  // ② 인쇄 시작 (Enter). 마우스를 쓰지 않으려고 이름으로 찾아 포커스만 옮긴다.
  await startSession(page);
  trail.push(`교정지 마운트 → ${await focusHolds(page, '교정지 마운트')}`);

  // ③ 모르겠어요 = 사다리 토글 (`?` = Shift+Slash, 05 §7).
  await page.keyboard.press('Shift+Slash');
  await page.locator('.reprint').waitFor();
  trail.push(`사다리 열림 → ${await focusHolds(page, '사다리 열림')}`);

  // ④ 단 이동은 tablist 관례 — `→` 로 옮기고 `Enter` 로 연다.
  await page.keyboard.press('ArrowRight');
  trail.push(`사다리 2단 → ${await focusHolds(page, '사다리 → ')}`);
  await page.keyboard.press('Enter');
  trail.push(`사다리 2단 열기 → ${await focusHolds(page, '사다리 Enter')}`);

  // ⑤ 사다리를 접고 답한다. Esc 가 05 §2.3 의 2단계이고, 접은 뒤 포커스를 「모르겠어요」로
  //    돌려보내는 것도 그 경로다 (`SessionOverlay` ③).
  await page.keyboard.press('Escape');
  await expect(page.locator('.reprint')).toHaveCount(0);
  const afterFold = await focusHolds(page, '사다리 접힘');
  expect(afterFold).toContain('dunno');
  trail.push(`사다리 접힘 → ${afterFold}`);

  await page.keyboard.press(`Digit${answerKey(app)}`);
  trail.push(`보기 고르기 → ${await focusHolds(page, '보기 고르기')}`);
  await page.keyboard.press('Enter');
  await page.locator('.fb.on').waitFor();
  trail.push(`채점 → ${await focusHolds(page, '채점')}`);

  // ⑥ 첫 정합이면 LIFER 가 그 위에 뜬다 — 2중 트랩이라 포커스는 베일 안이다 (05 §7).
  //    아무 키로 닫히고, 닫히면 포커스가 돌아와야 한다.
  const veil = page.locator('.lifer-veil');
  if (await veil.count() > 0) {
    const inVeil = await focusHolds(page, 'LIFER 열림');
    expect(inVeil).toContain('lifer-card');
    trail.push(`LIFER → ${inVeil}`);
    await page.keyboard.press('Escape');
    await veil.waitFor({ state: 'detached' });
  }

  // 05 §7 — 고른 보기가 `disabled` 로 굳으므로 포커스는 다음 동작 버튼에 있어야 한다.
  const afterGrade = await focusHolds(page, '판정 뒤');
  expect(afterGrade).toContain('press-btn');
  trail.push(`판정 뒤 → ${afterGrade}`);

  // ⑦ Space 로 다음 → 마지막 판이라 요약.
  await page.keyboard.press('Space');
  await page.locator('article.ps[aria-label="인쇄 완료"]').waitFor();
  trail.push(`요약 → ${await focusHolds(page, '요약')}`);

  // ⑧ 요약에서 Enter 는 홈으로 (05 §7). 돌아온 뒤의 포커스는 아래 `test.fail` 이 따로 본다.
  await page.keyboard.press('Enter');
  await expect(page.locator('article.ps[aria-label="인쇄 완료"]')).toHaveCount(0);
  await expect(page.locator('.masthead')).toBeVisible();
  trail.push('홈 복귀');

  // 통과했을 때도 무엇을 밟았는지 남긴다 — 게이트가 무엇을 덮는지가 곧 그 값이다.
  test.info().annotations.push({ type: '주행', description: trail.join('\n') });
});

/**
 * 05 §7 은 `?`(Shift+Slash)를 「T0 사다리 토글」로 준다. 여는 쪽은 포커스를 현재 단으로
 * 옮기고, **접는 쪽도 이제 옮긴다**(D111). 앞서는 포커스가 사다리 안에 있을 때 `?` 로 접으면
 * 그 요소가 통째로 사라지며 `body` 로 떨어졌다 — `Escape` 갈래에는 있던 대칭이 빠져 있었다.
 *
 * WKWebView 에서는 `.dunno`(`<button>`)로 옮기는 것만으로 부족하다: macOS 의 「모든 항목에
 * Tab 이동」이 꺼져 있으면 `focus()` 가 조용히 아무 일도 안 한다. 그래서
 * `components/session/focus.ts` 가 `tabindex="-1"` 인 교정쇄 오버레이로 물러선다.
 */
test('키보드 완결 — `?` 로 사다리를 접어도 포커스가 남는다 (D111)', async ({ page, app: _app }) => {
  await gotoDev(page);
  await startSession(page);
  await page.keyboard.press('Shift+Slash');
  await page.locator('.reprint').waitFor();
  await page.keyboard.press('Shift+Slash');
  await expect(page.locator('.reprint')).toHaveCount(0);
  await focusHolds(page, '`?` 로 사다리 접기');
});

/**
 * 05 §7 포커스 규칙의 마지막 줄 — 「세션 닫힘 → `returnFocusId`」. `returnFocusId` **자체는
 * 아직 없다**(`grep returnFocus` 0건) — 「나온 자리」로 정확히 돌아가지는 못한다. 대신
 * `App` 이 홈 뿌리(`.press`, `tabindex="-1"`)로 옮긴다: 「어딘가 문맥 안」이 `body` 보다
 * 낫고, 05 §9 의 게이트가 요구하는 것도 그것이다 (D111).
 */
test('키보드 완결 — 세션을 닫고 홈으로 와도 포커스가 남는다 (D111)', async ({ page, app }) => {
  await gotoDev(page);
  await startSession(page);
  await page.keyboard.press(`Digit${answerKey(app)}`);
  await page.keyboard.press('Enter');
  await page.locator('.fb.on').waitFor();
  const veil = page.locator('.lifer-veil');
  if (await veil.count() > 0) {
    await page.keyboard.press('Escape');
    await veil.waitFor({ state: 'detached' });
  }
  await page.keyboard.press('Space');
  await page.locator('article.ps[aria-label="인쇄 완료"]').waitFor();
  await page.keyboard.press('Enter');
  await expect(page.locator('.masthead')).toBeVisible();
  await focusHolds(page, '세션 닫힘');
});

test.skip(`키보드 완결 T1 구간 — 건너뜀: ${T1_SKIP}`, () => {});
test.skip(`키보드 완결 T2 구간 — 건너뜀: ${T2_SKIP}`, () => {});

// ───────── axe-core (06 §2 — serious 이상 0) ─────────

const AXE_SCREENS: Array<{ name: string; open: (page: Page) => Promise<void> }> = [
  { name: '홈', open: gotoDev },
  {
    name: 'T0 교정지',
    open: async (page) => { await gotoDev(page); await startSession(page); },
  },
  {
    name: '야간반',
    open: async (page) => { await gotoDev(page); await toNight(page); },
  },
];

for (const screen of AXE_SCREENS) {
  test(`${screen.name} — axe-core serious 이상 0`, async ({ page, app: _app }) => {
    await screen.open(page);
    const result = await new AxeBuilder({ page }).analyze();
    const blocking = result.violations
      .filter((v) => BLOCKING.has(v.impact ?? ''))
      .filter((v) => !axeAllow.some((e) => e.rule === v.id))
      .map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
      }));
    expect(blocking, JSON.stringify(blocking, null, 1)).toEqual([]);

    // 막지는 않지만 남긴다 — 다음 사람이 이 목록에서 고를 수 있어야 한다.
    const minor = result.violations.filter((v) => !BLOCKING.has(v.impact ?? ''));
    if (minor.length > 0) {
      test.info().annotations.push({
        type: 'axe minor·moderate',
        description: minor.map((v) => `${v.id} (${v.impact ?? '?'}) — ${v.help}`).join('\n'),
      });
    }
  });
}
