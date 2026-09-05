/**
 * 디자인 품질 게이트의 손잡이 (06 §2). 재는 코드는 앱 안(`apps/desktop/src/devtools/gates.ts`)에
 * 있다 — **앱과 테스트가 같은 코드**를 쓰는 것이 06 §2 의 요구다. 여기 있는 것은 그 코드를
 * 부르는 다리와, 화면 여섯 개를 여는 손이다.
 *
 * `window.__audit` 은 `?dev=1` 에서만 붙으므로(`installAudit`) 게이트는 `gotoDev` 로 들어간다.
 * `fixture.ts` 의 `waitForHome` 은 `/` 로 가므로 여기서 쓸 수 없다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Page } from '@playwright/test';

import { answerKeyOf, type AppDb } from './app-db.js';
import { passT2Plate } from './ui.js';

/**
 * 앱의 게이트 보고를 그대로 받는 모양. 앱 타입을 import 하지 않는 이유는 `tests/` 가
 * `apps/desktop` 의 소스 경로를 모르기 때문이고, 어긋나면 `gates.spec.ts` 가 먼저 깨진다.
 */
export interface FontFinding { sel: string; px: number; text: string }
export interface ContrastRow {
  sel: string; fg: string; bg: string; ratio: number; px: number; onInk: boolean; text: string;
}
export interface MeasureRow {
  sel: string; px: number; chars: number; fs: string; lh: string; font: string; note: boolean;
}
export interface GateReport {
  fonts: { checked: number; below13: FontFinding[] };
  contrast: {
    checked: number;
    paper: { min: number | null; below7: ContrastRow[]; below45: ContrastRow[] };
    onInk: { min: number | null; below45: ContrastRow[]; rows: ContrastRow[] };
    worst: ContrastRow[];
  };
  measure: MeasureRow[];
  measureViolations: MeasureRow[];
  pass: boolean;
}
export interface DeeReport {
  size: number; ly: number; smallMark: boolean; headMark: boolean;
  bandCols: number; cheekPx: number; darkPx: number; pass: boolean; ascii: string;
}
export interface MotionRow { sel: string; kind: 'animation' | 'transition'; ms: number; name: string }

// ───────── 다리 ─────────

/**
 * 움직이는 것이 하나도 남지 않을 때까지.
 *
 * 이것 없이 재면 **전환·등장 도중의 색**을 잰다. 실측 둘:
 * - 야간반으로 바꾼 직후 `.sw span` 이 낮의 `--ink-soft`(#4A433A)를 밤의 `--paper-3` 위에
 *   얹고 있어 1.91:1 이 나왔다(`transition: color .12s`).
 * - 교정지가 뜨는 0.34초 동안 `.ps` 가 `opacity` 를 올리는 중이라 axe 가 `.pill` 을
 *   3.04:1 로 읽었다(`animation: sheetin .34s`). 다 뜨면 6.87:1 이다.
 *
 * 둘 다 화면의 결함이 아니라 **잰 시점**의 문제다. 상시 애니메이션은 0개이므로(05 §10)
 * 이 대기는 반드시 끝난다.
 */
export const settled = (page: Page): Promise<unknown> =>
  // `pending` 은 lib.dom 의 `AnimationPlayState` 에 없지만 **엔진에는 있다**(시작 대기 중).
  // 타입에 없다고 빼면 갓 시작한 애니메이션을 「끝났다」로 읽는다 — 그래서 문자열로 비교한다.
  page.waitForFunction(() => document.getAnimations()
    .every((a) => (a.playState as string) !== 'running' && (a.playState as string) !== 'pending'));

/** `?dev=1` 로 들어가 홈이 그려질 때까지. 이 문에서만 `window.__audit` 이 붙는다. */
export async function gotoDev(page: Page): Promise<void> {
  await page.goto('/?dev=1');
  await page.locator('main.shell:not([aria-busy="true"]), .masthead').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => '__audit' in window);
  await settled(page);
}

/** 페이지 안에서 본 `window.__audit`. 여기 없는 이름을 부르면 그 자리에서 터진다. */
interface AuditHandle {
  gates: () => GateReport;
  dee: (size: number, ly: number, small: boolean, head: boolean) => Promise<DeeReport>;
  motionOver: (limitMs: number, exempt: readonly string[]) => MotionRow[];
}
type WithAudit = typeof globalThis & { __audit: AuditHandle };

/** 활자·대비·행 길이 한 벌 (06 §2 표의 앞 세 줄). */
export const runGates = (page: Page): Promise<GateReport> =>
  page.evaluate(() => (globalThis as WithAudit).__audit.gates());

/** 16px 실루엣 — `audit.dee(16, 4, true, true)` 그대로 (06 §2). */
export const deeSilhouette = (page: Page, size = 16, ly = 4): Promise<DeeReport> =>
  page.evaluate(
    ([s, l]) => (globalThis as WithAudit).__audit.dee(s, l, true, true),
    [size, ly] as const,
  );

/** 살아 있는 문서에서 상한을 넘은 모션. 정적 전수는 `scripts/check-motion.mjs` 가 본다. */
export const motionOver = (page: Page, limitMs: number, exempt: readonly string[])
: Promise<MotionRow[]> =>
  page.evaluate(
    ([ms, sels]) => (globalThis as WithAudit).__audit.motionOver(ms, sels),
    [limitMs, exempt] as [number, readonly string[]],
  );

// ───────── 화면 여섯 개 (06 §2) ─────────

/**
 * 시드(`fixtures/ipc/tiny`)로 실제로 열리는 화면.
 *
 * T1 은 `block` 행이 하나도 없어 `cardMaker.forBlock()` 이 `null` 을 주고, T2 는 커밋과
 * import 간선이 없어 `makeT2Card` 가 `null` 을 준다 — 둘 다 큐에 자리가 서지 않는다.
 * **없는 커버리지를 있는 것처럼 만들지 않는다**: 그 둘은 `test.skip` 으로 사유와 함께 남긴다.
 */
export const T1_SKIP = '첫날 큐는 새 판(T0)뿐이라 T1 판이 서지 않는다 — 시드에 `block` 은 18행 있다(D113)';
export const T2_SKIP = 'tiny 시드에 커밋·import 간선이 없다 — makeT2Card() 가 null 이라 T2 판이 큐에 안 선다';

/**
 * 홈의 「인쇄 시작」. 마우스를 쓰지 않는다 — 포커스를 옮기고 Enter 를 친다.
 *
 * 이름을 로케일 둘 다로 받는다. 시드는 ko 를 못박지만 en 스모크(`en-smoke.spec.ts`)가
 * 같은 걸음을 걷는다 — 여기가 ko 만 알면 그 스모크는 홈에서 30초를 기다리다 죽는다.
 */
export async function startSession(page: Page): Promise<void> {
  const start = page.getByRole('button', { name: /인쇄 시작|이어 찍기|Start printing|Carry on/ });
  await start.waitFor();
  await start.focus();
  await page.keyboard.press('Enter');
  await page.locator('article.ps').waitFor();
  // 교정지는 0.34초에 걸쳐 뜬다(`ProofSheet.css` `sheetin`). 다 뜬 뒤에 재야 뜻이 있다.
  await settled(page);
}

/**
 * **지금 걸린** T0 판의 보기 번호(1부터). 「큐가 한 장이라 마지막 카드가 그 판」이라는 가정은
 * 두지 않는다 — 첫날 큐가 두 판이 되면서(D113) 그 가정이 다음 판의 답을 집었다.
 *
 * `payload.answer` 는 0부터인 보기 인덱스다(`gradeT0` 이 `sel === card.answer` 로 잰다).
 * 05 §7 의 `1~4` 는 그 인덱스에 1 을 더한 것이다 — 이 한 칸 차이를 여기서 한 번만 넘긴다.
 */
export const answerKey = (app: AppDb): number => answerKeyOf(app.db);

/** 고르기 → Enter (정본 §3-8). `sel` 은 보기 번호(1부터)다. */
export async function submit(page: Page, sel: number): Promise<void> {
  await page.keyboard.press(`Digit${sel}`);
  await page.keyboard.press('Enter');
  await page.locator('.fb.on').waitFor();
  await settled(page);
}

/**
 * 첫 기록은 판정란 안에 남는다 (정본 §3-6 · D131) — 닫을 것이 없으므로 이 함수가 하는 일은
 * **연출이 다 놓일 때까지 기다리는 것**뿐이다. 일련번호가 0.7초 뒤에 찍히기 시작하므로
 * `settled` 만으로는 화면이 아직 움직이는 중일 수 있다.
 */
export async function settleLifer(page: Page): Promise<void> {
  if (await page.locator('.lifer-note').count() === 0) return;
  await settled(page);
}

/** 요약까지 걸어 볼 수 있는 판 수의 상한. 넘으면 큐가 안 줄고 있다는 뜻이다. */
const MAX_PLATES = 12;

/**
 * 남은 판을 다 답하고 요약까지 간다 (05 §3). **부르기 전에 지금 판은 채점돼 있어야 한다.**
 *
 * 판 수를 상수로 두지 않는다 — 큐 길이는 시드가 정하고(D113 으로 첫날 두 판이 됐다) 오답은
 * 다시 찍기를 한 장 더 넣는다. 그래서 「요약이 떴나」로 끝을 판정하고, 안 떴으면 새로 걸린
 * 판을 답한 뒤 다시 넘긴다.
 */
export async function toSummary(page: Page, app: AppDb): Promise<void> {
  const done = page.locator('article.ps[aria-label="인쇄 완료"], article.ps[aria-label="Printing done"]');
  for (let left = MAX_PLATES; left > 0; left -= 1) {
    // Space 뒤에 **판이 실제로 바뀔 때까지** 기다린다 — 요약이 서거나 교정지의 이름표가 달라질
    // 때까지. `.fb.on` 만 보면 그 칸이 없는 T2 판에서 옛 판 위에 다음 걸음을 뗀다.
    const prev = await page.locator('article.ps').first().getAttribute('aria-label');
    await page.keyboard.press('Space');
    await page.waitForFunction(
      (was) => document.querySelector('article.ps[aria-label="인쇄 완료"], article.ps[aria-label="Printing done"]') !== null
        || document.querySelector('article.ps')?.getAttribute('aria-label') !== was,
      prev,
    );
    await settled(page);
    if (await done.count() > 0) return;
    // T2 지도 판은 보기 번호가 없다 (D140) — 상자 하나를 고르고 채점해 지나간다.
    if (await passT2Plate(page)) continue;
    await submit(page, answerKey(app));
    await settleLifer(page);
  }
  throw new Error(`판 ${MAX_PLATES}장을 답했는데도 요약이 안 떴다 — 큐가 안 줄고 있다`);
}

/** 야간반 (05 §4.3). 스위치는 마스트헤드에 있고 `<html data-theme>` 하나만 바뀐다. */
export async function toNight(page: Page): Promise<void> {
  const sw = page.getByRole('switch', { name: '주간반 · 야간반 전환' });
  await sw.focus();
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.documentElement.dataset['theme'] === 'dark');
  await settled(page);
}

/**
 * 서가 (D119 · 05 §2.4). 마스트헤드 스위처를 열고 목록 끝의 「전부 보기」로 간다 —
 * 이 화면으로 가는 길 자체가 마우스 없이 열려야 한다.
 */
export async function toShelf(page: Page): Promise<void> {
  // The first test of a file on CI's Linux WebKit sometimes presses Enter before the
  // switcher's handler is live and the listbox never opens. Retrying the same keystroke
  // keeps the path keyboard-only; a click here would stop measuring what this gate is for.
  const list = page.locator('ul[role="listbox"]');
  for (let attempt = 0; ; attempt += 1) {
    await page.locator('button.repo-switch').focus();
    await page.keyboard.press('Enter');
    try {
      await list.waitFor({ timeout: 4_000 });
      break;
    } catch (e) {
      if (attempt >= 4) throw e;
    }
  }
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  // 목록이 설 때까지 기다린다 — `main.shelf` 는 머리말만으로도 먼저 뜨므로 여기서 멈추면
  // 「검사 0건」에 가까운 화면을 재게 된다.
  await page.locator('main.shelf ul.shelf-list li, main.shelf p.shelf-empty').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
}

/** 인쇄 부속 숨김 (05 §4.3 — 텍스트·레이아웃은 1px 도 바뀌지 않는다). */
export async function toggleTrim(page: Page): Promise<void> {
  const sw = page.getByRole('switch', { name: '인쇄 부속 보이기 · 숨기기' });
  await sw.focus();
  await page.keyboard.press('Space');
  await settled(page);
}

// ───────── allowlist (06 §2 — 만료일 필수, 최대 90일) ─────────

/** 「만료 없는 예외 목록은 6개월 뒤 규칙 자체를 무력화한다」(06 §2). */
export const ALLOW_MAX_DAYS = 90;

export interface AllowEntry {
  /** 대비·행 길이는 선택자로, axe 는 규칙 id 로 적는다. 하나는 반드시 있어야 한다. */
  sel?: string;
  rule?: string;
  why: string;
  /** `YYYY-MM-DD`. 이 날이 지나면 게이트가 실패한다. */
  expires: string;
}

export interface AllowFile { $why: string; entries: AllowEntry[] }

const ALLOW_DIR = join(process.cwd(), 'tests/gates');

export function loadAllow(name: string): AllowFile {
  return JSON.parse(readFileSync(join(ALLOW_DIR, name), 'utf8')) as AllowFile;
}

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` 를 그날 끝(UTC)으로. 만료일 당일은 아직 살아 있다. */
export function expiryMs(entry: AllowEntry): number {
  const at = Date.parse(`${entry.expires}T23:59:59Z`);
  if (Number.isNaN(at)) throw new Error(`만료일이 YYYY-MM-DD 가 아니다: ${entry.expires}`);
  return at;
}

/**
 * 만료된 항목. **여기서만 실제 시계를 쓴다** — 06 §1.9-4 의 고정 날짜를 쓰면 예외가
 * 영원히 살아 있고, 그러면 만료일을 적는 뜻이 없다.
 */
export const expired = (entries: readonly AllowEntry[], now = Date.now()): AllowEntry[] =>
  entries.filter((e) => expiryMs(e) < now);

/**
 * 90일보다 멀리 잡은 항목. 상한이 없으면 「2099-12-31」로 규칙을 끌 수 있다.
 *
 * **날짜 단위로 센다** — 시각으로 재면 오전에 적은 「정확히 90일 뒤」가 그날 끝(23:59:59)
 * 이라 반나절 초과로 걸린다. 사람이 적는 것은 날짜지 시각이 아니다.
 */
const dayIndex = (ms: number): number => Math.floor(ms / DAY_MS);
export const overlong = (entries: readonly AllowEntry[], now = Date.now()): AllowEntry[] =>
  entries.filter((e) => dayIndex(expiryMs(e)) - dayIndex(now) > ALLOW_MAX_DAYS);

/** 선택자가 allowlist 에 있나. 부분 일치다 — `pathOf` 는 조상 4대까지만 적는다. */
export const allowedBySel = (entries: readonly AllowEntry[], sel: string): boolean =>
  entries.some((e) => e.sel !== undefined && sel.includes(e.sel));
