/**
 * 반응형 게이트 (정본 §6 · D182) — **폭 720~2560 · 높이 600 이상에서 깨지지 않는다**.
 *
 * 사용자 요구가 그대로 수치다: 「전체화면, 반쪽화면 이런 상태에서도 디자인이 깨지면 안 돼」.
 * 1440 폭 모니터의 반쪽이 720 이고, 27인치 전체가 2560 이다. 그 사이 어디에서도 아래 넷이
 * 0 이어야 한다.
 *
 *   ① 가로 스크롤 — `document.scrollingElement.scrollWidth > clientWidth`
 *   ② 뷰포트 이탈 — 요소의 사각형이 창 좌우 밖으로 나간다
 *   ③ 겹침 — 흐름 안의 형제 둘이 서로를 덮는다
 *   ④ 글자 넘침 — 글을 담은 상자가 `scrollWidth > clientWidth` 인데 스크롤도 못 한다
 *
 * **재는 코드가 여기 있는 이유.** `design.spec.ts` 는 앱 안(`devtools/gates.ts`)의 코드를
 * 부른다 — 앱과 테스트가 같은 자를 쓰라는 06 §2 다. 반응형은 반대다: 재는 대상이 창 크기라
 * 앱 안에서는 잴 수 없고(앱은 자기 창 하나만 안다) 창을 바꿀 수 있는 것은 러너뿐이다.
 * 그래서 자를 여기 두고, 대신 앱에는 **아무 훅도 심지 않는다**.
 *
 * **한 화면에 한 번 열고 창만 바꾼다.** 조합마다 새로 열면 7화면 × 12조합 = 84회 항해라
 * 게이트가 분 단위가 된다. 여는 값은 조합과 무관하므로 한 번 열고 `setViewportSize` 로
 * 훑는다 — CSS 레이아웃은 그것으로 다시 계산된다.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { Page } from '@playwright/test';

import { test, expect } from '../support/fixture.js';
import type { AppDb } from '../support/app-db.js';
import {
  ALLOW_MAX_DAYS, answerKey, expired, gotoDev, loadAllow, overlong, settled, settleLifer,
  startSession, submit, toShelf, toSummary, type AllowEntry,
} from '../support/gates.js';

const allowFile = loadAllow('responsive.allow.json');
const allow = allowFile.entries;

// ───────── 조합 (정본 §6) ─────────

/**
 * 폭. **720 과 2560 은 뺄 수 없다** — 정본이 못박은 양 끝이고, 깨지는 자리는 늘 끝에 있다.
 * 사이 넷은 브레이크포인트의 양쪽을 하나씩 집는다(900 경계 앞뒤 · 1400 경계 앞뒤).
 */
const WIDTHS = [720, 900, 1280, 1440, 1920, 2560] as const;

/** 높이. 600 이 정본의 하한이고 1200 은 세로로 큰 창이다. */
const HEIGHTS = [600, 900] as const;

/**
 * 실행 시간을 위해 전 조합(6×2=12)을 다 도는 것은 **양 끝 폭에서만**이다. 사이 폭은 600 만
 * 본다 — 높이가 만드는 깨짐(세로로 눌린 판)은 가장 낮은 높이에서 가장 먼저 난다.
 */
const COMBOS: Array<{ w: number; h: number }> = WIDTHS.flatMap((w) =>
  (w === 720 || w === 2560 ? HEIGHTS : [600]).map((h) => ({ w, h })));

// ───────── 자 ─────────

export interface Violation {
  kind: 'hscroll' | 'outside' | 'overlap' | 'clip';
  sel: string;
  detail: string;
}
export interface Probe { checked: number; violations: Violation[] }

/**
 * 페이지 안에서 도는 자. **`page.evaluate` 로 통째로 넘어가므로 바깥 이름을 못 쓴다** —
 * 안에서 쓰는 것은 전부 이 함수 안에 있다.
 *
 * `checked` 를 함께 돌려주는 이유는 `design.spec.ts` 와 같다 — **「검사 0건」은 통과가
 * 아니라 화면이 안 그려진 것**이고, 그 둘을 구별할 수 있는 것은 이 숫자뿐이다.
 */
function probeInPage(): Probe {
  const out: Violation[] = [];
  const W = window.innerWidth;
  const EPS = 1.5;

  /** 조상 4대까지의 태그·클래스. `design.spec.ts` 의 `pathOf` 와 같은 모양이다. */
  const sel = (el: Element): string => {
    const parts: string[] = [];
    let node: Element | null = el;
    for (let i = 0; i < 4 && node !== null && node.tagName !== 'HTML'; i += 1) {
      const cls = typeof node.className === 'string' && node.className.trim() !== ''
        ? `.${node.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
      parts.unshift(`${node.tagName.toLowerCase()}${cls}`);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };

  /**
   * 재지 않는 것.
   *   `.monaco-editor`·`.monaco-aria-container` — 편집기가 스스로 관리하는 가상 스크롤과,
   *     낭독용으로 창 왼쪽 16,000px 밖에 두는 상자. 둘 다 「이탈」이 설계다.
   *   `.vh` — 화면에서만 숨기는 1×1 상자(`reset.css`). 잘림이 그 기법 자체다.
   *   `svg` 내부 — 좌표계가 CSS 픽셀이 아니다.
   */
  const SKIP = [
    '.monaco-editor', '.monaco-aria-container', 'svg', '.vh', '.sr-only',
    '[aria-hidden="true"]', '[hidden]', '.chrome-drag',
  ].join(', ');
  const skipped = (el: Element): boolean => el.closest(SKIP) !== null;

  const shown = (el: Element, cs: CSSStyleDeclaration, r: DOMRect): boolean =>
    r.width > 0.5 && r.height > 0.5 && cs.visibility !== 'hidden' && cs.opacity !== '0';

  /** 가로로 스크롤되는 조상이 있으면 그 안의 이탈은 그 상자의 몫이지 창의 몫이 아니다. */
  const inScroller = (el: Element): boolean => {
    for (let p = el.parentElement; p !== null && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
    }
    return false;
  };

  /** 직접 자식으로 빈칸이 아닌 글을 가진 상자인가. 글자 넘침은 이런 상자에서만 뜻이 있다. */
  const hasText = (el: Element): boolean => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && (n.textContent ?? '').trim() !== '') return true;
    }
    return false;
  };

  /**
   * 말줄임(`text-overflow: ellipsis`)은 **전문을 다른 데서 읽을 수 있을 때만** 잘림이
   * 아니다. 파일 경로처럼 길이가 데이터에 달린 것은 줄여 보이는 편이 옳지만, 줄인 글을
   * 되찾을 길이 없으면 그냥 잃어버린 글이다 — `title`·`aria-label` 을 요구한다.
   */
  const namedTruncation = (el: Element, cs: CSSStyleDeclaration): boolean => {
    if (cs.textOverflow !== 'ellipsis') return false;
    let node: Element | null = el;
    for (let i = 0; i < 3 && node !== null; i += 1) {
      if (node.hasAttribute('title') || node.hasAttribute('aria-label')) return true;
      node = node.parentElement;
    }
    return false;
  };

  // ① 가로 스크롤
  const root = document.scrollingElement ?? document.documentElement;
  if (root.scrollWidth > root.clientWidth + EPS) {
    out.push({
      kind: 'hscroll',
      sel: 'html',
      detail: `scrollWidth ${root.scrollWidth} > clientWidth ${root.clientWidth}`,
    });
  }

  const all = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
  let checked = 0;

  for (const el of all) {
    if (skipped(el)) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!shown(el, cs, r)) continue;
    checked += 1;

    // ② 뷰포트 좌우 이탈
    if (!inScroller(el) && (r.right > W + EPS || r.left < -EPS)) {
      out.push({
        kind: 'outside',
        sel: sel(el),
        detail: `left ${Math.round(r.left)} right ${Math.round(r.right)} / 창 ${W}`,
      });
    }

    // ④ 글자 넘침 — 스스로 스크롤할 수 없는 상자가 제 글을 못 담는다
    const ox = cs.overflowX;
    const scrollable = ox === 'auto' || ox === 'scroll';
    const inlineBox = cs.display === 'inline';
    if (!scrollable && !inlineBox && !namedTruncation(el, cs)
      && hasText(el) && el.scrollWidth > el.clientWidth + EPS) {
      out.push({
        kind: 'clip',
        sel: sel(el),
        detail: `scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth} — "${(el.textContent ?? '').trim().slice(0, 24)}"`,
      });
    }
  }

  /*
   * ③ 겹침 — 흐름 안의 형제끼리만. 띄운 것(absolute·fixed·sticky)은 덮으라고 있는 것이다.
   *
   * `display: inline` 은 뺀다. 인라인 상자의 `getBoundingClientRect()` 는 **줄바꿈된 조각을
   * 하나로 묶은 합집합**이라, 한 문단 안에서 줄을 갈아탄 `<b>` 와 `<span>` 이 서로 겹친 것으로
   * 읽힌다(720 폭 판정란에서 실제로 잡혔다 — 27×22px). 겹치는 것은 사각형이지 글이 아니다.
   */
  const flowRect = (el: Element): DOMRect | null => {
    if (skipped(el)) return null;
    const cs = getComputedStyle(el);
    if (cs.position !== 'static' && cs.position !== 'relative') return null;
    if (cs.float !== 'none' || cs.pointerEvents === 'none' || cs.display === 'inline') return null;
    const r = el.getBoundingClientRect();
    return shown(el, cs, r) ? r : null;
  };

  const parents = new Set<Element>([document.body, ...all]);
  for (const parent of parents) {
    const kids = Array.from(parent.children).filter((k) => k.nodeType === 1);
    if (kids.length < 2 || kids.length > 60) continue;
    const rects = kids.map(flowRect);
    for (let i = 0; i < kids.length; i += 1) {
      const a = rects[i];
      if (a === null || a === undefined) continue;
      for (let j = i + 1; j < kids.length; j += 1) {
        const b = rects[j];
        if (b === null || b === undefined) continue;
        const ow = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oh = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ow < 4 || oh < 4) continue;
        const area = ow * oh;
        const smaller = Math.min(a.width * a.height, b.width * b.height);
        if (smaller <= 0 || area < smaller * 0.15) continue;
        out.push({
          kind: 'overlap',
          sel: `${sel(kids[i] as Element)} ✕ ${sel(kids[j] as Element)}`,
          detail: `${Math.round(ow)}×${Math.round(oh)}px 겹침`,
        });
      }
    }
  }
  return { checked, violations: out };
}

/**
 * 예외 하나. 여기 `screen` 이 있는 이유는 `html` 때문이다 — 가로 스크롤의 선택자는 늘
 * `html` 이라, 화면을 안 적으면 코스 하나를 봐주려던 예외가 **일곱 화면 전부의**
 * 가로 스크롤을 봐준다. 종류(`rule`)와 화면(`screen`)을 둘 다 요구한다.
 */
interface RespAllow extends AllowEntry { screen?: string }

/** 예외 목록에 걸리나. 종류까지 맞아야 한다 — 「이 선택자는 전부 봐준다」를 막는다. */
const allowed = (v: Violation, screen: string): boolean =>
  (allow as RespAllow[]).some((e) => e.sel !== undefined && v.sel.includes(e.sel)
    && (e.rule === undefined || e.rule === v.kind)
    && (e.screen === undefined || e.screen === screen));

export interface Row extends Violation { w: number; h: number }

/** 한 화면을 열어 둔 채 창만 바꿔 가며 전 조합을 훑는다. */
export async function sweep(page: Page): Promise<{ rows: Row[]; leastChecked: number }> {
  const rows: Row[] = [];
  let leastChecked = Number.POSITIVE_INFINITY;
  for (const { w, h } of COMBOS) {
    await page.setViewportSize({ width: w, height: h });
    // 창이 바뀌면 레이아웃이 다시 서고, 전환이 걸린 자리는 도중의 사각형을 준다.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await settled(page);
    const { checked, violations } = await page.evaluate(probeInPage);
    // `RESP_SHOT=<앞머리>` 를 주면 조합마다 한 장씩 찍는다. 숫자가 「어디가」를 못 말할 때
    // 쓴다 — 720 코스 화면의 잘린 오른쪽 단은 표가 아니라 이 그림에서 먼저 보였다.
    const shot = process.env['RESP_SHOT'];
    if (shot !== undefined) await page.screenshot({ path: `${shot}-${w}x${h}.png` });
    leastChecked = Math.min(leastChecked, checked);
    rows.push(...violations.map((v) => ({ ...v, w, h })));
  }
  return { rows, leastChecked };
}

// ───────── 화면 ─────────

/** 코스는 소스 한 조각이 있어야 판이 선다 (`clone-course.spec.ts` 와 같은 손이다). */
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

async function toCourse(page: Page, app: AppDb): Promise<void> {
  app.db.prepare(
    `UPDATE file SET line_count =
       (SELECT COALESCE(MAX(b.line_end), 0) FROM block b WHERE b.file_id = file.id)
     WHERE line_count = 0`,
  ).run();
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
  await page.locator('main.course .ctoc-part, main.course .course-empty').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
}

async function toSettings(page: Page): Promise<void> {
  await gotoDev(page);
  await page.getByRole('button', { name: /^설정$/ }).first().click();
  await page.locator('main.settings').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
}

async function toFirstRun(page: Page, app: AppDb): Promise<void> {
  app.db.pragma('foreign_keys = OFF');
  app.db.prepare('DELETE FROM repo').run();
  app.db.pragma('foreign_keys = ON');
  await page.goto('/?dev=1');
  await page.locator('.firstrun').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
}

const SCREENS: Array<{ name: string; open: (page: Page, app: AppDb) => Promise<void> }> = [
  { name: '홈', open: async (page) => { await gotoDev(page); } },
  {
    name: '학습 — 문제·판정',
    open: async (page, app) => {
      await gotoDev(page);
      await startSession(page);
      await submit(page, answerKey(app));
      await settleLifer(page);
    },
  },
  {
    name: '학습 — 요약',
    open: async (page, app) => {
      await gotoDev(page);
      await startSession(page);
      await submit(page, answerKey(app));
      await settleLifer(page);
      await toSummary(page, app);
    },
  },
  { name: '코스', open: toCourse },
  { name: '서가', open: async (page) => { await gotoDev(page); await toShelf(page); } },
  { name: '설정', open: async (page) => { await toSettings(page); } },
  { name: '첫 실행', open: async (page, app) => { await toFirstRun(page, app); } },
];

/**
 * 보고 모드. `RESP_REPORT=<path>` 를 주면 위반을 파일로 쓰고 **실패시키지 않는다** —
 * 「지금 무엇이 깨지는지」를 한 번에 잡을 때 쓴다. CI 는 이 변수를 안 준다.
 */
const REPORT = process.env['RESP_REPORT'] ?? '';

for (const screen of SCREENS) {
  test(`${screen.name} — 720~2560 × 600+ 에서 가로 스크롤·이탈·겹침·넘침 0`, async ({ page, app }) => {
    await screen.open(page, app);
    const { rows, leastChecked } = await sweep(page);
    if (REPORT !== '') {
      mkdirSync(dirname(REPORT), { recursive: true });
      writeFileSync(`${REPORT}.${screen.name.replace(/[^가-힣A-Za-z0-9]/g, '_')}.json`,
        JSON.stringify({ leastChecked, rows }, null, 1));
      return;
    }
    // 「검사 0건」은 통과가 아니다 — 어느 한 조합에서라도 화면이 비면 여기서 갈린다.
    expect(leastChecked, '어느 창 크기에서 화면이 비었다 — 여는 손을 확인하라')
      .toBeGreaterThan(20);
    const bad = rows.filter((r) => !allowed(r, screen.name));
    // 실패했을 때 사람이 보는 것은 「몇 건」이 아니라 「어느 폭에서 어느 선택자가」다.
    const table = bad.map((r) => `${r.w}×${r.h} [${r.kind}] ${r.sel} — ${r.detail}`).join('\n');
    expect(bad, `${bad.length}건\n${table}`).toEqual([]);
  });
}

// ───────── 예외 목록 규약 (06 §2 — 만료일 필수, 최대 90일) ─────────

test('responsive.allow.json — 파일이 스스로 무엇인지 말한다', () => {
  expect(allowFile.$why.length).toBeGreaterThan(20);
});

test('responsive.allow.json — 항목마다 선택자 · 종류 · 화면 · 사유 · 만료일이 있다', () => {
  const broken = (allow as RespAllow[]).filter((e) => e.sel === undefined
    || e.rule === undefined || e.screen === undefined
    || (e.why ?? '').trim().length < 20
    || !/^\d{4}-\d{2}-\d{2}$/.test(e.expires ?? ''));
  // 종류와 화면을 안 적은 예외는 「이 선택자는 어디서든 무엇이든 봐준다」가 된다.
  expect(broken, JSON.stringify(broken, null, 1)).toEqual([]);
});

test('responsive.allow.json — 만료됐거나 90일보다 먼 항목이 없다', () => {
  expect(expired(allow).map((e) => e.sel), '만료된 예외는 되살리거나 화면을 고친다').toEqual([]);
  expect(overlong(allow).map((e) => e.sel), `만료일은 ${ALLOW_MAX_DAYS}일보다 멀 수 없다`).toEqual([]);
});
