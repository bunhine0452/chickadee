/**
 * 05 §11 시나리오 15 — 「키보드만으로 1~13」.
 *
 * 이 파일은 **마우스 금지 픽스처**(`keyboardOnly`)로 돈다. 두 겹이다:
 *   ① `page.mouse`·`page.click` 류를 건드리면 그 자리에서 던진다.
 *   ② 페이지 안에서 `isTrusted` 마우스 이벤트를 세고, 끝에 0 이 아니면 실패한다 —
 *      `locator.click()` 은 `page.mouse` 를 안 거치지만 이 그물에는 걸린다.
 *
 * 주행은 1~13 중 `tiny` 시드로 열리는 갈래 전부다: 홈 → 세션(1) → 사다리 1~4단(3) →
 * Esc 겹 벗기기(13) → 정합(1)과 LIFER(6) → 요약(11) → 홈 → 야간반(12).
 * 4·5(아래층)와 7~10(T1·T2)은 시드로 열리지 않아 여기서도 빠진다.
 */

import {
  expect, finishSession, focusPath, keyboardOnly as test, openHome, tabTo,
} from '../support/ui.js';
import { answerKeyOf } from '../support/app-db.js';

const SHEET = '.proof article.ps';


test('15 키보드만으로 1~13', async ({ page, app }) => {
  await openHome(page);

  // ── 1. 홈 → 인쇄 시작. 「인쇄 시작」에 탭으로 닿고 Enter 로 연다 (05 §7).
  await tabTo(page, '.today button.press-btn');
  await page.keyboard.press('Enter');
  await page.locator(SHEET).waitFor();
  // 판이 걸리면 포커스는 교정지 자신이다 — 여기서 아래 키들이 문맥을 갖는다.
  expect(await focusPath(page)).toBe('article.ps');

  // ── 3. `?` 로 사다리. 물리 키 판정이라 `Shift+Slash` 다 (05 §7).
  await page.keyboard.press('Shift+Slash');
  const ladder = page.locator('.reprint');
  await ladder.waitFor();
  expect(await focusPath(page)).toContain('rung');

  // 단 이동은 tablist 관례 — `←→` 로 포커스만 옮기고 `Enter` 로 연다.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(ladder.locator('.rung-body h4')).toHaveText(/아래층 진단/);

  // `1~4` 는 **포커스가 사다리 안일 때만** 단 선택이다 (D11) — 보기 고르기로 새지 않는다.
  await page.keyboard.press('Digit3');
  await expect(ladder.locator('.rung-body h4')).toHaveText(/다른 자리/);
  await page.keyboard.press('Digit4');
  await expect(ladder.locator('.rung-body h4')).toHaveText(/직접 물어보기/);
  await expect(page.locator('.ch.sel')).toHaveCount(0);

  // 4단의 입력 칸까지 탭으로 간다.
  await tabTo(page, '.askbox textarea');
  await page.keyboard.type('여기서 막혔습니다');
  await expect(page.locator('.askbox textarea')).toHaveValue('여기서 막혔습니다');

  // ── 13. Esc 는 한 번에 한 겹만 벗긴다.
  // ① 입력에서 빠져나오기 — 사다리도 세션도 그대로다.
  await page.keyboard.press('Escape');
  await expect(page.locator('.askbox textarea')).not.toBeFocused();
  await expect(ladder).toHaveCount(1);

  // ② 사다리 접기. 포커스를 사다리 안으로 되돌려 놓아야 이 겹이 벗겨진다 —
  //    ① 의 `blur()` 가 포커스를 `<body>` 로 떨어뜨린다(보고 참조).
  await tabTo(page, '.reprint .rung[aria-selected="true"]');
  await page.keyboard.press('Escape');
  await expect(ladder).toHaveCount(0);
  expect(await focusPath(page)).toContain('dunno');
  await expect(page.locator('.proof')).toHaveCount(1);

  // ── 1. 보기를 고르고 Enter 로 확인. `1~4` 는 사다리가 접혔으니 다시 보기 고르기다.
  const key = answerKeyOf(app.db);
  await page.keyboard.press(`Digit${key}`);
  await expect(page.locator(`.ch[data-k="${key}"]`)).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(page.locator('.fb .stampbox .stamp')).toContainText('같음');
  await expect(page.locator('.ps-rail .plus')).toHaveText('+1단계');

  // ── 6. LIFER — 판정란 안에 남으므로 벗길 겹이 없고, 포커스는 채점 자리에 그대로다 (D131).
  await page.locator('.fb .lifer-note').waitFor();
  expect(await focusPath(page)).toContain('press-btn');

  // ── 11. Space 로 다음. 남은 판까지 답하면 요약 (D113). Enter 로 홈.
  await finishSession(page, app.db);
  const done = page.locator('[aria-label="오늘 학습 완료"]');
  await expect(done.locator('.shifts .shift')).toHaveCount(3);
  expect(await focusPath(page)).toContain('press-btn');
  await page.keyboard.press('Enter');
  await page.locator('.masthead').waitFor();
  await expect(page.locator('.proof')).toHaveCount(0);

  // ── 12. 야간반도 키보드로 — 스위치는 `role=switch` 이고 `←→` 로 넘어간다.
  await tabTo(page, 'button.sw[aria-label="밝게 · 어둡게 전환"]');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // 어느 단계에서도 포커스를 잃지 않았다 (05 §9 「포커스 유실」).
  expect(await focusPath(page)).not.toBe('body');
});
