/**
 * 06 §2 감축 모션 게이트 — **전환만 없애고 최종 포즈는 남긴다**.
 *
 * 「모션 0」이 아니다. 답을 낸 뒤 판정란이 그 자리에 서 있어야 하고(최종 상태), 서는 데
 * 걸리는 시간만 사라져야 한다. 둘 중 하나만 봐서는 게이트가 서지 않는다 — 애니메이션을
 * 통째로 지우면 「지속 0」은 통과하지만 도장이 안 찍히고, 최종 상태만 보면 1.3초짜리
 * 연출이 남아 있어도 통과한다.
 */
import { test, expect } from '../support/fixture.js';

import { answerKey, gotoDev, startSession, submit } from '../support/gates.js';

/** 감축 모드에서 남아도 되는 지속. 사실상 0 이지만 CSS 는 `.001ms` 로 적는다. */
const RESIDUAL_MS = 1;

const msOf = (value: string | null): number => {
  if (value === null) return 0;
  return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
};

test('감축 모션 — 정답 뒤 최종 포즈가 남고 판정란의 전환은 사라진다', async ({ page, app }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoDev(page);
  await startSession(page);
  await submit(page, answerKey(app));

  // ① 최종 포즈 — 판정란이 켜져 있고 도장이 찍혀 있다.
  await expect(page.locator('.fb.on')).toBeVisible();
  await expect(page.locator('.fb .stampbox .stamp')).toBeVisible();

  // ② 선언 — 판정란과 도장은 감축 모드에서 지속을 지운다(`FeedbackSlot.css`·`Stamp.css`).
  const declared = await page.evaluate(() => {
    const read = (sel: string, prop: 'transitionDuration' | 'animationDuration'): string | null => {
      const el = document.querySelector(sel);
      return el === null ? null : getComputedStyle(el)[prop];
    };
    return { fb: read('.fb', 'transitionDuration'), stamp: read('.fb .stampbox .stamp', 'animationDuration') };
  });
  expect(declared.fb).not.toBeNull();
  expect(declared.stamp).not.toBeNull();
  for (const [name, value] of Object.entries(declared)) {
    expect(msOf(value), `${name} = ${String(value)}`).toBeLessThanOrEqual(RESIDUAL_MS);
  }
});

/**
 * 06 §2 의 나머지 절반 — 감축 모드에서 **돌고 있는 것이 하나도 없어야** 한다.
 *
 * 앞서는 실패했다 — `components/plate/Choices.css` 의 `.ch` 와 `packages/ui/src/
 * PressButton.css` 의 `.press-btn` 이 `prefers-reduced-motion` 블록을 갖고 있지 않아
 * 80~120ms 전환이 그대로 남았다(실측). 06 §2 는 이 게이트에 **예외를 두지 않으므로**
 * allowlist 가 아니라 CSS 를 고쳤다 (D111).
 *
 * `submit()` 헬퍼를 쓰지 않는다 — 그것은 다 멈출 때까지 기다리므로 「잔존」을 잴 수 없다.
 * 재는 것은 **답한 직후**다.
 */
test('감축 모션 — 잔존 애니메이션 0',
  async ({ page, app }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoDev(page);
    await startSession(page);
    await page.keyboard.press(`Digit${answerKey(app)}`);
    await page.keyboard.press('Enter');
    await page.locator('.fb.on').waitFor();

    const running = await page.evaluate((limit) => document.getAnimations()
      .map((a) => ({
        name: a.constructor.name,
        ms: Number(a.effect?.getComputedTiming().duration ?? 0),
        target: (a.effect as KeyframeEffect | null)?.target?.className ?? '',
      }))
      .filter((r) => r.ms > limit), RESIDUAL_MS);
    expect(running, JSON.stringify(running, null, 1)).toEqual([]);
  });

/**
 * 설정으로 켠 감축(`<html data-motion="reduce">`)이 **미디어 쿼리와 같은 결과**를 내는지.
 *
 * 두 길이 있다는 것이 이 게이트가 필요한 이유다 — CSS 파일마다
 * `@media (prefers-reduced-motion: reduce)` 블록과 `[data-motion="reduce"]` 규칙이 짝으로
 * 있고, 한쪽에만 선택자를 더하면 설정 스위치가 조용히 아무것도 안 하게 된다. 여기서는
 * **시스템 설정을 끈 채로** 속성만 세워 잰다.
 */
test('감축 모션 — 설정으로 켠 것도 미디어 쿼리와 같다 (05 §2.1)', async ({ page, app }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await gotoDev(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'reduce'));
  await startSession(page);
  await page.keyboard.press(`Digit${answerKey(app)}`);
  await page.keyboard.press('Enter');
  await page.locator('.fb.on').waitFor();

  // ① 최종 포즈는 남는다 — 「모션 0」이 아니다.
  await expect(page.locator('.fb.on')).toBeVisible();
  await expect(page.locator('.fb .stampbox .stamp')).toBeVisible();

  // ② 돌고 있는 것은 없다.
  const running = await page.evaluate((limit) => document.getAnimations()
    .map((a) => ({
      ms: Number(a.effect?.getComputedTiming().duration ?? 0),
      target: (a.effect as KeyframeEffect | null)?.target?.className ?? '',
    }))
    .filter((r) => r.ms > limit), RESIDUAL_MS);
  expect(running, JSON.stringify(running, null, 1)).toEqual([]);
});

/**
 * 「시스템 따름」은 아무것도 걸지 않는다 — 속성이 `system` 이면 감축 규칙이 붙으면 안 된다.
 * 이것이 없으면 위 테스트는 「속성이 무엇이든 늘 감축」을 통과로 읽는다.
 */
test('감축 모션 — data-motion="system" 은 아무것도 줄이지 않는다', async ({ page, app: _app }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await gotoDev(page);
  await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'system'));
  const ms = await page.evaluate(() => {
    const el = document.querySelector('.press-btn');
    return el === null ? null : getComputedStyle(el).transitionDuration;
  });
  expect(ms).not.toBeNull();
  expect(msOf(ms), `press-btn = ${String(ms)}`).toBeGreaterThan(RESIDUAL_MS);
});

/**
 * 감축 모드가 **꺼져 있을 때**도 같은 자리가 서는지. 이것이 없으면 위 테스트는
 * 「감축 모드에서 아무것도 안 그린다」를 통과로 읽는다.
 */
test('감축 모션 아님 — 같은 자리에 판정란과 도장이 선다', async ({ page, app }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await gotoDev(page);
  await startSession(page);
  await submit(page, answerKey(app));
  await expect(page.locator('.fb.on')).toBeVisible();
  await expect(page.locator('.fb .stampbox .stamp')).toBeVisible();
});

/**
 * 정본 §3-3 — 답해도 위쪽 글이 0px 도 밀리지 않는다. 판정란이 자리를 미리 잡고 있다는
 * 사실은 감축 모드의 「최종 포즈」가 뜻을 갖는 전제다.
 *
 * 뷰포트 좌표가 아니라 **교정지 기준 좌표**로 잰다 — 채점 뒤 포커스가 `.acts` 로 옮겨가며
 * `.bench` 가 스크롤하므로 뷰포트 y 는 밀린 것처럼 보인다(실측 12px).
 */
test('피드백 슬롯 0px — 제출 전후 `.ask` 의 자리가 같다', async ({ page, app }) => {
  await gotoDev(page);
  await startSession(page);
  const askTop = (): Promise<number> => page.evaluate(() => {
    const ask = document.querySelector('.ask');
    const sheet = document.querySelector('article.ps');
    if (ask === null || sheet === null) throw new Error('.ask 나 교정지가 없다');
    return ask.getBoundingClientRect().top - sheet.getBoundingClientRect().top;
  });

  const before = await askTop();
  await submit(page, answerKey(app));
  // WebKit 은 같은 자리를 재도 서브픽셀이 흔들린다(실측 0.000002px 차). 0px 는 「밀리지
  // 않았다」는 뜻이지 부동소수점이 같다는 뜻이 아니다.
  expect(await askTop()).toBeCloseTo(before, 2);
});
