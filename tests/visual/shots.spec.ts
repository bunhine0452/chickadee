/**
 * 시각 회귀 (06 §1.7 · 05 §11) — **10장 × 주간/야간 × 엔진 2 = 40장**.
 *
 * 기준선은 **Linux 것만** 커밋한다(06 §1.7 — OS 별 3벌은 유지비가 3배다). 이 리포에서
 * 처음 만드는 사람은 `tests/visual/README.md` 를 먼저 읽어라: macOS·Windows 에서 만든 PNG 를
 * 커밋하면 CI 가 영원히 빨갛다.
 *
 * 결정성의 근거:
 * - 시각 `NOW`(`tests/support/build-seed-const.ts`)가 시드에 굳어 있고, 화면에 남는 실시각
 *   (날짜·연속 인쇄·경과 시간)은 `mask` 로 가린다.
 * - 노드 지터(`--dy/--rot/--d`)는 개념 id 해시로 정해지고(05 §10), 도장 각도는 상수다
 *   (`STAMP_ROTATE`). 리포 어디에도 `Math.random` 이 없다.
 * - `animations: 'disabled'`(playwright.config.ts) + `reducedMotion: 'reduce'` +
 *   `document.fonts.ready` + 스크롤 정지 대기.
 */
import { test, expect } from '../support/fixture.js';
import type { Locator, Page } from '@playwright/test';

import {
  answerKey, gotoDev, settled, settleLifer, startSession, toNight, toSummary, toggleTrim,
} from '../support/gates.js';

type Theme = 'day' | 'night';
/** 무엇을 가릴지는 지금 보이는 화면이 정한다 — 오버레이 뒤의 홈까지 가리면 그 위가 지워진다. */
type Scope = 'home' | 'session' | 'summary';

/**
 * 실시각이 남는 자리. 06 §1.7 은 「날짜·스트릭」이라고만 적었지만 세션의 남은 시간과
 * 요약의 걸린 시간도 초마다 바뀐다 — 가리지 않으면 기준선이 하루도 못 산다.
 *
 * `mask` 는 z-순서를 모른다. 홈의 마스트헤드를 세션 화면에서 같이 가리면 교정쇄 위에
 * 분홍 사각형이 얹힌다 — 그래서 화면별로 나눠 든다.
 */
function masksOf(page: Page, scope: Scope): Locator[] {
  if (scope === 'home') {
    return [
      page.locator('.ticket .tk').nth(1), // 마스트헤드 날짜
      page.locator('.ticket .tk').nth(2), // 마스트헤드 연속 인쇄
      page.locator('.stamp-date'), // 오늘의 인쇄 도장 날짜
    ];
  }
  const band = [page.locator('.jobband .time')]; // 작업 띠 남은 시간
  if (scope === 'session') return band;
  return [
    ...band,
    page.locator('.done-head p'), // 「N판을 걸었고 M분 걸렸습니다」
    page.locator('.done-head .stamp'), // 요약 도장 (부제가 날짜)
    page.locator('.tally > div').nth(2), // 걸린 시간
    page.locator('.tally > div').nth(3), // 연속 인쇄
    page.locator('.streak-line'), // 연속 인쇄 문장
  ];
}

/**
 * 폰트·전환·**스크롤**이 다 멈출 때까지. WebKit 은 `fonts.ready` 뒤에도 한 프레임 늦다.
 *
 * 스크롤을 기다리는 이유: `SessionOverlay.css` 의 `.bench` 는 `scroll-behavior: smooth` 라
 * 포커스가 옮겨갈 때 부드럽게 움직인다. 그 도중에 찍으면 같은 화면이 매번 다른 자리에서
 * 찍힌다(실측 — 전체 픽셀의 6~16%가 달랐다). `open()` 이 부드러운 스크롤을 꺼 두고,
 * 여기서 자리가 멈춘 것을 확인한 뒤에 찍는다.
 */
async function stable(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
  await page.waitForFunction(() => {
    const holder = window as unknown as { __scrollKey?: string };
    const key = [...document.querySelectorAll('*')]
      .filter((el) => el.scrollHeight > el.clientHeight)
      .map((el) => el.scrollTop)
      .concat(window.scrollY)
      .join(',');
    const same = holder.__scrollKey === key;
    holder.__scrollKey = key;
    return same;
  });
  await page.evaluate(() => new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => { r(); }));
  }));
}

interface Shot { scope: Scope; fullPage?: boolean; anchor?: string }

/**
 * 한 장. `anchor` 를 주면 그 요소를 컨테이너 맨 위로 올려놓고 찍는다 — 스크롤 자리를
 * 앱의 포커스 이동에 맡기면 엔진마다 몇 픽셀씩 다르게 멈춘다.
 */
async function shoot(page: Page, name: string, shot: Shot): Promise<void> {
  // 자리를 세우기 **전에** 한 번 멈춰야 한다 — 포커스 이동이 늦게 스크롤을 걸면 세워 둔
  // 자리를 그것이 덮어쓴다(실측 — 요약이 5번에 1번 10px 어긋났다).
  await stable(page);
  if (shot.anchor !== undefined) {
    await page.evaluate((sel) => {
      const bench = document.querySelector('.bench');
      const el = document.querySelector(sel);
      if (bench === null || el === null) return;
      // `scrollIntoView` 는 스크롤 조상 전부를 건드리고 엔진마다 몇 px 다르게 멈춘다(실측 10px).
      // 산술로 직접 세우면 그 여지가 없다.
      bench.scrollTop += el.getBoundingClientRect().top - bench.getBoundingClientRect().top;
    }, shot.anchor);
  }
  await stable(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    mask: masksOf(page, shot.scope),
    fullPage: shot.fullPage ?? false,
  });
}

/** 주간/야간 두 벌. 야간은 마스트헤드 스위치로 켠다 — `data-theme` 을 손으로 세우지 않는다. */
async function open(page: Page, theme: Theme): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoDev(page);
  // 부드러운 스크롤은 시간이 있는 움직임이라 스냅샷에는 잡음이다. 자리는 그대로다.
  await page.addStyleTag({ content: '*, *::before, *::after { scroll-behavior: auto !important }' });
  if (theme === 'night') await toNight(page);
}

/** 사다리 N 단을 연다. tablist 관례대로 `→` 로 옮기고 `Enter` 로 연다 (05 §7). */
async function openRung(page: Page, rung: 1 | 2 | 3 | 4): Promise<void> {
  await page.keyboard.press('Shift+Slash');
  await page.locator('.reprint').waitFor();
  for (let i = 1; i < rung; i += 1) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.locator('.reprint [role="tabpanel"], .rung-body').first().waitFor();
}

for (const theme of ['day', 'night'] as const) {
  test(`홈 · ${theme}`, async ({ page, app: _app }) => {
    await open(page, theme);
    await shoot(page, `home-${theme}`, { scope: 'home', fullPage: true });
  });

  test(`홈 부속 숨김 · ${theme}`, async ({ page, app: _app }) => {
    await open(page, theme);
    await toggleTrim(page);
    await shoot(page, `home-trim-${theme}`, { scope: 'home', fullPage: true });
  });

  test(`T0 미답 · ${theme}`, async ({ page, app: _app }) => {
    await open(page, theme);
    await startSession(page);
    await shoot(page, `t0-ask-${theme}`, { scope: 'session', anchor: 'article.ps' });
  });

  test(`T0 사다리 1단 · ${theme}`, async ({ page, app: _app }) => {
    await open(page, theme);
    await startSession(page);
    await openRung(page, 1);
    await shoot(page, `t0-ladder1-${theme}`, { scope: 'session', anchor: '.reprint' });
  });

  test(`T0 사다리 2단 · ${theme}`, async ({ page, app: _app }) => {
    await open(page, theme);
    await startSession(page);
    await openRung(page, 2);
    await shoot(page, `t0-ladder2-${theme}`, { scope: 'session', anchor: '.reprint' });
  });

  test(`T0 사다리 4단 · ${theme}`, async ({ page, app: _app }) => {
    await open(page, theme);
    await startSession(page);
    await openRung(page, 4);
    await shoot(page, `t0-ladder4-${theme}`, { scope: 'session', anchor: '.reprint' });
  });

  test(`T0 정합 · ${theme}`, async ({ page, app }) => {
    await open(page, theme);
    await startSession(page);
    await page.keyboard.press(`Digit${answerKey(app)}`);
    await page.keyboard.press('Enter');
    await page.locator('.fb.on').waitFor();
    await settleLifer(page);
    await shoot(page, `t0-right-${theme}`, { scope: 'session', anchor: 'article.ps' });
  });

  test(`T0 어긋남 · ${theme}`, async ({ page, app }) => {
    await open(page, theme);
    await startSession(page);
    const count = await page.locator('.choices .ch').count();
    // 정답이 아닌 아무 보기. 보기 수를 세어 고르므로 카드가 바뀌어도 따라간다.
    const wrong = (answerKey(app) % Math.max(1, count)) + 1;
    await page.keyboard.press(`Digit${wrong}`);
    await page.keyboard.press('Enter');
    await page.locator('.fb.on').waitFor();
    await shoot(page, `t0-wrong-${theme}`, { scope: 'session', anchor: 'article.ps' });
  });

  // 첫 기록은 판정란 안이라 정합 한 장에 이미 들어 있다 — 그래도 따로 찍는다.
  // 이 장이 재는 것은 도장·일련번호·Dee 가 판정문과 **한 칸 안에서** 어긋나지 않는가다 (D131).
  test(`LIFER 첫 기록 · ${theme}`, async ({ page, app }) => {
    await open(page, theme);
    await startSession(page);
    await page.keyboard.press(`Digit${answerKey(app)}`);
    await page.keyboard.press('Enter');
    await page.locator('.lifer-note').waitFor();
    await settleLifer(page);
    await shoot(page, `lifer-${theme}`, { scope: 'session', anchor: '.slot' });
  });

  test(`요약 · ${theme}`, async ({ page, app }) => {
    await open(page, theme);
    await startSession(page);
    await page.keyboard.press(`Digit${answerKey(app)}`);
    await page.keyboard.press('Enter');
    await page.locator('.fb.on').waitFor();
    await settleLifer(page);
    await toSummary(page, app);
    await shoot(page, `summary-${theme}`, { scope: 'summary', anchor: 'article.ps' });
  });
}
