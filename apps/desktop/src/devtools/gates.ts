/**
 * 디자인 품질 게이트 (06 §2). 목업 `ink-home.html` 의 `window.__audit` 을 옮긴 것이고,
 * **앱과 테스트가 같은 코드**를 쓴다 — 개발자 패널도 Playwright 도 여기를 부른다.
 *
 * 전부 DOM 을 읽는 함수라 브라우저(또는 jsdom) 안에서만 뜻이 있다. 정적으로 잡히는 것은
 * 이미 다른 곳에 있다 — 13px 하한은 stylelint `chickadee/no-font-size-below-13`,
 * 토큰 대비는 `scripts/check-contrast.mjs`, 모션 상한은 `scripts/check-motion.mjs`.
 * 여기서 재는 것은 **합성 배경과 실제 조판** 이다.
 */

/** 본문 대비 하한 (정본 §6 측정 규칙). */
export const PAPER_RATIO = 7;
/** 잉크 면 위 배지 글자는 AA 를 허용한다. */
export const INK_RATIO = 4.5;
/**
 * 본문 행 길이 — **로케일마다 다르다** (05 §9 가 정본, D112 · D117).
 *
 * `ko` 30~45 는 한글 자폭 기준이고, `en` 45~68 은 같은 물리 폭을 라틴으로 환산한 것이다
 * (한글 1자 ≈ 라틴 1.5자). 좁은 패널(폭 ≤ 320px)의 부차 텍스트만 하한을 낮춘다 —
 * 상한은 두 경우가 같다. 06 §2 의 옛 숫자(35~45 · `.note` 22~24)는 D112 가 이리로 맞췄다.
 */
export const MEASURE = {
  ko: { min: 30, max: 45, noteMin: 22 },
  en: { min: 45, max: 68, noteMin: 33 },
} as const;

export type MeasureLocale = keyof typeof MEASURE;
/** 활자 하한 (정본 §6-④ — 13px 미만 토큰은 아예 정의하지 않는다). */
export const MIN_FONT_PX = 13;

interface Rgb { r: number; g: number; b: number; a: number }

export function parseColor(input: string): Rgb | null {
  const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(input);
  if (rgb) {
    return { r: +(rgb[1] ?? 0), g: +(rgb[2] ?? 0), b: +(rgb[3] ?? 0), a: rgb[4] === undefined ? 1 : +rgb[4] };
  }
  const srgb = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/.exec(input);
  if (srgb) {
    return {
      r: +(srgb[1] ?? 0) * 255, g: +(srgb[2] ?? 0) * 255, b: +(srgb[3] ?? 0) * 255,
      a: srgb[4] === undefined ? 1 : +srgb[4],
    };
  }
  return null;
}

const lin = (c: number): number => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (c: Rgb): number => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** 반투명 글자를 배경 위에 합성한다 — 잉크는 겹쳐 찍히므로 실효 색이 다르다. */
export function over(fg: Rgb, bg: Rgb): Rgb {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

export const hex = (c: Rgb): string =>
  `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 };

/** 조상들을 거슬러 올라가며 실효 배경을 합성한다 (목업 `effectiveBg`). */
export function effectiveBg(el: Element): Rgb {
  let node: Element | null = el;
  let acc: Rgb | null = null;
  while (node && node !== document.documentElement) {
    const c = parseColor(getComputedStyle(node).backgroundColor);
    if (c && c.a > 0.01) {
      if (c.a >= 0.99) return acc ? over(acc, c) : c;
      acc = acc ? over(acc, c) : c;
    }
    node = node.parentElement;
  }
  const body = parseColor(getComputedStyle(document.body).backgroundColor) ?? WHITE;
  return acc ? over(acc, body) : body;
}

function ownText(el: Element): boolean {
  return [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '');
}

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  let node: Element | null = el;
  while (node && node !== document.body) {
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    node = node.parentElement;
  }
  return true;
}

/** 사람이 읽을 선택자. 실패 보고가 「어느 요소인지」를 말해야 고칠 수 있다. */
export function pathOf(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.body && parts.length < 4) {
    let s = node.tagName.toLowerCase();
    if (node.id) s += `#${node.id}`;
    else if (typeof node.className === 'string' && node.className.trim() !== '') {
      s += `.${node.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
    }
    parts.unshift(s);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

const textNodes = (): Element[] =>
  [...document.querySelectorAll('body *')].filter(
    (el) => ownText(el) && visible(el) && el.closest('.dev') === null,
  );

export interface FontFinding { sel: string; px: number; text: string }

/** 06 §2 활자 하한 — 13px 미만이 하나라도 있으면 실패다. 예외는 없다. */
export function fonts(): { checked: number; below13: FontFinding[] } {
  const els = textNodes();
  const below13: FontFinding[] = [];
  for (const el of els) {
    const px = Number.parseFloat(getComputedStyle(el).fontSize);
    if (px < MIN_FONT_PX) {
      below13.push({ sel: pathOf(el), px, text: (el.textContent ?? '').trim().slice(0, 24) });
    }
  }
  return { checked: els.length, below13 };
}

export interface ContrastRow {
  sel: string; fg: string; bg: string; ratio: number; px: number; onInk: boolean; text: string;
}

export interface ContrastReport {
  checked: number;
  paper: { min: number | null; below7: ContrastRow[]; below45: ContrastRow[] };
  onInk: { min: number | null; below45: ContrastRow[]; rows: ContrastRow[] };
  worst: ContrastRow[];
}

/** 06 §2 대비 — 종이 위 7:1, 잉크 배지 위 4.5:1. 배경은 합성해서 잰다. */
export function contrast(): ContrastReport {
  const root = document.documentElement;
  const inkColors = ['t0', 't1', 't2']
    .map((t) => getComputedStyle(root).getPropertyValue(`--${t}`).trim().toUpperCase())
    .filter((v) => v !== '');

  const rows: ContrastRow[] = textNodes().map((el) => {
    const cs = getComputedStyle(el);
    const bg = effectiveBg(el);
    let fg = parseColor(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
    if (fg.a < 1) fg = over(fg, bg);
    return {
      sel: pathOf(el),
      fg: hex(fg),
      bg: hex(bg),
      ratio: Number(contrastRatio(fg, bg).toFixed(2)),
      px: Number.parseFloat(cs.fontSize),
      onInk: inkColors.includes(hex(bg)),
      text: (el.textContent ?? '').trim().slice(0, 22),
    };
  }).sort((a, b) => a.ratio - b.ratio);

  const paper = rows.filter((r) => !r.onInk);
  const ink = rows.filter((r) => r.onInk);
  return {
    checked: rows.length,
    paper: {
      min: paper[0]?.ratio ?? null,
      below7: paper.filter((r) => r.ratio < PAPER_RATIO),
      below45: paper.filter((r) => r.ratio < INK_RATIO),
    },
    onInk: {
      min: ink[0]?.ratio ?? null,
      below45: ink.filter((r) => r.ratio < INK_RATIO),
      rows: ink.slice(0, 8),
    },
    worst: rows.slice(0, 10),
  };
}

export interface MeasureRow {
  sel: string; px: number; chars: number; fs: string; lh: string; font: string; note: boolean;
}

/**
 * 자폭 표본. 한글로 재고 라틴을 세면 글자 수가 두 배로 나오므로 **로케일마다 다른 표본**을
 * 쓴다. en 표본은 영문 평균 자모 분포에 가깝게 고른 문장이다.
 */
const SAMPLE = {
  ko: '한글본문한줄에들어가는글자수를재는표본문장입니다',
  en: 'The quick brown fox jumps over the lazy dog and reads a line of body text',
} as const;

/** `<html data-locale>` 을 세우는 자리는 `data/settings.ts` 의 `applyLocale` 하나다. */
export function measureLocale(): MeasureLocale {
  return document.documentElement.getAttribute('data-locale') === 'en' ? 'en' : 'ko';
}

/** 이 요소가 「본문」이라 할 만큼 글자를 담고 있나. 기준 글자가 로케일마다 다르다. */
function hasBody(el: Element, locale: MeasureLocale): boolean {
  const text = el.textContent ?? '';
  return locale === 'en'
    ? (text.match(/[A-Za-z]/g) ?? []).length >= 40
    : (text.match(/[가-힣]/g) ?? []).length >= 15;
}
const MEASURE_SELECTOR = 'p, .note, .board-note, .forecast p, .detail-in p, .streak-note, .ask, .fb p';

/**
 * 06 §2 본문 행 길이 — 실측 advance 로 나눈다. `--measure: 36em` 이 걸려 있어도
 * 서체가 폴백으로 떨어지면 실제 글자 수가 달라지므로 **재서** 확인한다.
 */
export function measure(): MeasureRow[] {
  const locale = measureLocale();
  return [...document.querySelectorAll(MEASURE_SELECTOR)]
    .filter((el) => visible(el) && hasBody(el, locale) && el.closest('.dev') === null)
    .map((el) => {
      const cs = getComputedStyle(el);
      const span = document.createElement('span');
      span.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre';
      span.style.fontFamily = cs.fontFamily;
      span.style.fontSize = cs.fontSize;
      span.style.fontWeight = cs.fontWeight;
      span.style.letterSpacing = cs.letterSpacing;
      span.textContent = SAMPLE[locale];
      document.body.appendChild(span);
      const adv = span.getBoundingClientRect().width / SAMPLE[locale].length;
      span.remove();
      const w = el.getBoundingClientRect().width
        - Number.parseFloat(cs.paddingLeft) - Number.parseFloat(cs.paddingRight);
      return {
        sel: pathOf(el),
        px: Math.round(w),
        chars: adv > 0 ? Math.round(w / adv) : 0,
        fs: cs.fontSize,
        lh: (Number.parseFloat(cs.lineHeight) / Number.parseFloat(cs.fontSize)).toFixed(2),
        font: (cs.fontFamily.split(',')[0] ?? '').replace(/"/g, ''),
        note: el.classList.contains('note') || el.classList.contains('streak-note'),
      };
    });
}

/** 행 길이 위반. `.note` 류는 하한만 낮다 — 상한은 같다 (05 §9). */
export const measureViolations = (
  rows: readonly MeasureRow[], locale: MeasureLocale = measureLocale(),
): MeasureRow[] => {
  const { min, max, noteMin } = MEASURE[locale];
  return rows.filter((r) => r.chars > max || r.chars < (r.note ? noteMin : min));
};

// 16px 실루엣 게이트는 **지웠다** (D182) — 마스코트가 화면에서 내려갔으므로 잴 대상이
// 없다. `deeStandalone`·`scanSilhouette`·`DeeReport` 도 함께 사라졌다.

// ───────── 모션 (06 §2 · 정본 §3-9) ─────────

/** 정본 §3-9 — 기쁨은 움직임에, 최대 720ms. */
export const MOTION_BUDGET_MS = 720;

export interface MotionRow { sel: string; kind: 'animation' | 'transition'; ms: number; name: string }

/** `1s, 200ms` 처럼 쉼표로 늘어선 지속 중 가장 긴 것을 ms 로. */
export const longestMs = (value: string): number =>
  Math.max(0, ...value.split(',').map((v) => {
    const t = v.trim();
    if (t.endsWith('ms')) return Number.parseFloat(t);
    if (t.endsWith('s')) return Number.parseFloat(t) * 1000;
    return 0;
  }));

/**
 * 살아 있는 문서에서 실제로 걸린 지속을 훑는다. **정적 파싱의 보완이다** —
 * 규칙 자체는 `scripts/check-motion.mjs` 가 CSS 전수로 보고, 여기서는 그 파서가 볼 수 없는
 * 것(인라인 스타일·JS 가 세운 지속·조합된 단축 속성)을 본다.
 *
 * 예외 선택자는 부르는 쪽이 준다 — 예외의 주인은 06 §2 지 이 함수가 아니다.
 */
export function motionOver(limitMs = MOTION_BUDGET_MS, exempt: readonly string[] = []): MotionRow[] {
  const rows: MotionRow[] = [];
  for (const el of document.querySelectorAll('body *')) {
    if (exempt.some((sel) => el.matches(sel))) continue;
    const cs = getComputedStyle(el);
    const anim = longestMs(cs.animationDuration);
    if (anim > limitMs && cs.animationName !== 'none') {
      rows.push({ sel: pathOf(el), kind: 'animation', ms: anim, name: cs.animationName });
    }
    const trans = longestMs(cs.transitionDuration);
    if (trans > limitMs) {
      rows.push({ sel: pathOf(el), kind: 'transition', ms: trans, name: cs.transitionProperty });
    }
  }
  return rows;
}

export interface GateReport {
  fonts: ReturnType<typeof fonts>;
  contrast: ContrastReport;
  measure: MeasureRow[];
  measureViolations: MeasureRow[];
  pass: boolean;
}

/** 한 화면치를 통째로 잰다. Playwright 가 화면마다 이것을 부른다 (06 §2). */
export function runGates(): GateReport {
  const f = fonts();
  const c = contrast();
  const m = measure();
  const bad = measureViolations(m);
  return {
    fonts: f,
    contrast: c,
    measure: m,
    measureViolations: bad,
    pass: f.below13.length === 0 && c.paper.below7.length === 0 && c.onInk.below45.length === 0
      && bad.length === 0,
  };
}
