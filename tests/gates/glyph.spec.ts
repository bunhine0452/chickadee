/**
 * 글자 무결성 게이트 (D183 · D182 ⑤).
 *
 * **왜 이 파일이 있나.** 완성본 촬영에서 한글 제목이 검은 상자로 찍혔다 — 「오▮ 15▮」·「▮그인」.
 * 굵기가 400 하나뿐인 디스플레이 서체에 `h1` 의 기본 `bold` 가 걸려 브라우저가 굵기를
 * **합성**했고, 이미 굵은 얼굴의 속공간이 메워져 획 많은 글자(늘·분·로·제)가 덩어리가 됐다.
 * 그때 디자인 게이트는 초록이었다 — 크기·대비·행 길이·모션은 재는데 **글자가 읽히는 모양인지**
 * 는 아무도 안 쟀다. 사람이 스크린샷을 안 봤으면 그대로 나갔다.
 *
 * 그래서 셋을 잰다.
 *   Ⓐ 합성 굵게가 꺼져 있나 — 보이는 글자마다 `font-synthesis-weight: none`
 *   Ⓑ 없는 굵기를 부르는 자리가 없나 — 실린 서체의 굵기 범위 밖을 요구하는 규칙
 *   Ⓒ 두부(.notdef)가 없나 — 어느 서체도 그리지 못해 네모로 찍히는 글자
 *
 * Ⓐ 만으로도 그날의 사고는 막힌다. Ⓑ 를 함께 두는 이유는 합성을 끄면 사고가 **조용해질 뿐**
 * 이기 때문이다 — 600을 부른 자리는 400 으로 그려지고 화면은 멀쩡해 보이지만 CSS 는 계속
 * 거짓말을 한다. Ⓒ 는 다른 사고다: 굵기가 아니라 **글리프 자체가 없을 때** 나는 네모다.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { Page } from '@playwright/test';

import { test, expect } from '../support/fixture.js';
import type { AppDb } from '../support/app-db.js';
import {
  ALLOW_MAX_DAYS, answerKey, expired, gotoDev, loadAllow, overlong, settleLifer, startSession,
  submit, toShelf,
} from '../support/gates.js';

const allowFile = loadAllow('glyph.allow.json');
const allow = allowFile.entries;

export interface GlyphFinding {
  kind: 'synth' | 'weight' | 'tofu';
  sel: string;
  detail: string;
}

function probeGlyphs(): { checked: number; findings: GlyphFinding[] } {
  const out: GlyphFinding[] = [];

  const sel = (el: Element): string => {
    const parts: string[] = [];
    let node: Element | null = el;
    for (let i = 0; i < 3 && node !== null && node.tagName !== 'HTML'; i += 1) {
      const cls = typeof node.className === 'string' && node.className.trim() !== ''
        ? `.${node.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
      parts.unshift(`${node.tagName.toLowerCase()}${cls}`);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };

  /** 실려 있는 서체마다 쓸 수 있는 굵기. `100 900` 같은 가변 범위도 그대로 읽는다. */
  const faces = new Map<string, Array<[number, number]>>();
  document.fonts.forEach((f) => {
    const family = f.family.replace(/^["']|["']$/g, '').toLowerCase();
    const nums = f.weight.match(/\d+/g)?.map(Number) ?? [400];
    const lo = nums[0] ?? 400;
    const hi = nums[1] ?? lo;
    faces.set(family, [...(faces.get(family) ?? []), [lo, hi]]);
  });

  /*
   * 두부를 **너비로 재지 않는다.** 처음에 `measureText(ch) === measureText('￿')` 로
   * 짰다가 등폭 서체에서 `t`·`i`·`0` 이 전부 두부로 잡혔다 — 등폭은 .notdef 상자까지
   * 같은 폭이라 그 비교가 늘 참이다. 그래서 **그려서 본다**: 같은 서체로 글자와 `￿`
   * 를 각각 찍고 픽셀이 똑같으면 같은 .notdef 글리프다.
   *
   * 크기는 24px 로 고정한다 — 글리프가 있고 없고는 크기와 무관하고, 고정하지 않으면
   * (서체×크기) 조합마다 캔버스를 다시 찍는다.
   */
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const NOTDEF = '￿';
  const inkOf = (font: string, ch: string): string => {
    if (ctx === null) return '';
    ctx.clearRect(0, 0, 40, 40);
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(ch, 4, 20);
    const d = ctx.getImageData(0, 0, 40, 40).data;
    let hash = 0;
    let ink = 0;
    for (let i = 3; i < d.length; i += 4) {
      const a = d[i] ?? 0;
      if (a > 8) { ink += 1; hash = ((hash * 31) + i + a) | 0; }
    }
    return ink === 0 ? '' : `${ink}:${hash}`;
  };

  const notdefInk = new Map<string, string>();
  const isTofu = (font: string, ch: string): boolean => {
    if (ctx === null) return false;
    let ref = notdefInk.get(font);
    if (ref === undefined) {
      ref = inkOf(font, NOTDEF);
      notdefInk.set(font, ref);
    }
    // 이 엔진이 .notdef 를 아예 안 그리면 견줄 것이 없다 — 못 재는 것을 실패로 만들지 않는다.
    if (ref === '') return false;
    return inkOf(font, ch) === ref;
  };

  const SKIP = '.monaco-editor, svg, [aria-hidden="true"], [hidden]';
  let checked = 0;
  const seenTofu = new Set<string>();

  for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
    if (el.closest(SKIP) !== null) continue;
    let text = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) text += n.textContent ?? '';
    }
    if (text.trim() === '') continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5 || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    checked += 1;

    // Ⓐ 합성 굵게
    const synth = cs.fontSynthesisWeight;
    if (synth !== '' && synth !== 'none') {
      out.push({ kind: 'synth', sel: sel(el), detail: `font-synthesis-weight: ${synth}` });
    }

    // Ⓑ 실리지 않은 굵기
    const first = (cs.fontFamily.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, '')
      .toLowerCase();
    const spans = faces.get(first);
    const want = Number(cs.fontWeight);
    if (spans !== undefined && Number.isFinite(want)
      && !spans.some(([lo, hi]) => want >= lo && want <= hi)) {
      out.push({
        kind: 'weight',
        sel: sel(el),
        detail: `"${first}" 는 ${spans.map(([a, b]) => (a === b ? a : `${a}–${b}`)).join('·')} 만 실렸는데 ${want} 를 부른다`,
      });
    }

    // Ⓒ 두부. 서체 문자열은 24px 로 고정한다 (크기는 글리프 유무를 바꾸지 않는다).
    const font = `${cs.fontStyle} ${cs.fontWeight} 24px ${cs.fontFamily}`;
    for (const ch of new Set(text.replace(/\s/g, ''))) {
      const key = `${font}\u0000${ch}`;
      if (seenTofu.has(key)) continue;
      seenTofu.add(key);
      if (isTofu(font, ch)) {
        out.push({
          kind: 'tofu',
          sel: sel(el),
          detail: `U+${ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')} "${ch}" 를 그릴 서체가 없다`,
        });
      }
    }
  }
  return { checked, findings: out };
}

const allowed = (f: GlyphFinding): boolean =>
  allow.some((e) => (e.sel !== undefined && f.sel.includes(e.sel) && (e.rule === undefined || e.rule === f.kind))
    || (e.rule === f.kind && e.sel === undefined));

/** 화면 다섯. 서체가 갈리는 자리(제목·코드·배지)를 다 지나간다. */
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
  { name: '서가', open: async (page) => { await gotoDev(page); await toShelf(page); } },
  {
    name: '설정',
    open: async (page) => {
      await gotoDev(page);
      await page.getByRole('button', { name: /^설정$/ }).first().click();
      await page.locator('main.settings').waitFor();
      await page.evaluate(() => document.fonts.ready);
    },
  },
];

const REPORT = process.env['GLYPH_REPORT'] ?? '';

for (const screen of SCREENS) {
  test(`${screen.name} — 합성 굵게 0 · 없는 굵기 0 · 두부 0`, async ({ page, app }) => {
    await screen.open(page, app);
    await page.evaluate(() => document.fonts.ready);
    const { checked, findings } = await page.evaluate(probeGlyphs);
    if (REPORT !== '') {
      mkdirSync(dirname(REPORT), { recursive: true });
      writeFileSync(`${REPORT}.${screen.name.replace(/[^가-힣A-Za-z0-9]/g, '_')}.json`,
        JSON.stringify({ checked, findings }, null, 1));
      return;
    }
    expect(checked, '글을 담은 요소가 0건이다 — 화면이 안 그려졌다').toBeGreaterThan(10);
    const bad = findings.filter((f) => !allowed(f));
    const table = bad.map((f) => `[${f.kind}] ${f.sel} — ${f.detail}`).join('\n');
    expect(bad, `${bad.length}건\n${table}`).toEqual([]);
  });
}

/**
 * 자 자체. 합성 굵게를 되살린 자리를 게이트가 못 잡는다면 위의 초록은 뜻이 없다 —
 * 한 요소에 `font-synthesis-weight: auto` 를 심고 잡히는지 본다.
 */
test('자 검증 — 합성 굵게를 되살리면 잡히고, 없는 글자는 두부로 잡힌다', async ({ page, app: _app }) => {
  await gotoDev(page);
  const synths = (r: { findings: GlyphFinding[] }): number =>
    r.findings.filter((f) => f.kind === 'synth').length;
  const tofus = (r: { findings: GlyphFinding[] }): number =>
    r.findings.filter((f) => f.kind === 'tofu').length;

  const before = await page.evaluate(probeGlyphs);

  // 화면의 요소를 고치지 않는다 — **틀린 요소를 하나 새로 심고** 그것만 세면 화면이
  // 이미 몇 건이든 자의 감도를 잰다. `\u{10FFFD}` 는 어느 서체에도 없는 사적 코드포인트다.
  await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'gate-probe';
    probe.textContent = '\u{10FFFD}';
    probe.setAttribute(
      'style',
      'font-synthesis-weight: auto; font-weight: 700; font-size: 24px; width: 60px; height: 40px',
    );
    document.body.append(probe);
  });
  const after = await page.evaluate(probeGlyphs);
  const mine = after.findings.filter((f) => f.sel.includes('.gate-probe'));

  expect(synths({ findings: mine }), '합성 굵게를 되살렸는데 안 잡힌다').toBe(1);
  expect(tofus({ findings: mine }), '없는 글자를 심었는데 두부로 안 잡힌다').toBe(1);
  // 심기 전에는 그 선택자가 없었다는 것도 함께 못박는다.
  expect(before.findings.filter((f) => f.sel.includes('.gate-probe'))).toEqual([]);
});

// ───────── 예외 목록 규약 (06 §2 — 만료일 필수, 최대 90일) ─────────

test('glyph.allow.json — 파일이 스스로 무엇인지 말한다', () => {
  expect(allowFile.$why.length).toBeGreaterThan(20);
});

test('glyph.allow.json — 항목마다 사유 · 만료일이 있고 만료되지 않았다', () => {
  const broken = allow.filter((e) => (e.sel === undefined && e.rule === undefined)
    || (e.why ?? '').trim().length < 10
    || !/^\d{4}-\d{2}-\d{2}$/.test(e.expires ?? ''));
  expect(broken, JSON.stringify(broken, null, 1)).toEqual([]);
  expect(expired(allow).map((e) => e.sel ?? e.rule)).toEqual([]);
  expect(overlong(allow).map((e) => e.sel ?? e.rule),
    `만료일은 ${ALLOW_MAX_DAYS}일보다 멀 수 없다`).toEqual([]);
});
