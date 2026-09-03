/**
 * 디자인 품질 게이트 (06 §2). 목업 `ink-home.html` 의 `window.__audit` 을 옮긴 것이고,
 * **앱과 테스트가 같은 코드**를 쓴다 — 개발자 패널도 Playwright 도 여기를 부른다.
 *
 * 전부 DOM 을 읽는 함수라 브라우저(또는 jsdom) 안에서만 뜻이 있다. 정적으로 잡히는 것은
 * 이미 다른 곳에 있다 — 13px 하한은 stylelint `chickadee/no-font-size-below-13`,
 * 토큰 대비는 `scripts/check-contrast.mjs`, 모션 상한은 `scripts/check-motion.mjs`.
 * 여기서 재는 것은 **합성 배경과 실제 조판** 이다.
 */
import { deeStandalone } from '@chickadee/ui';

/** 본문 대비 하한 (정본 §6 측정 규칙). */
export const PAPER_RATIO = 7;
/** 잉크 면 위 배지 글자는 AA 를 허용한다. */
export const INK_RATIO = 4.5;
/** 본문 행 길이 — 한글 35~45자. */
export const MEASURE_MIN = 35;
export const MEASURE_MAX = 45;
/** `.note` 류 부차 텍스트는 더 짧다. */
export const NOTE_MIN = 22;
export const NOTE_MAX = 24;
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

/** 한글 표본. 라틴 문자로 재면 한 줄 글자 수가 두 배로 나온다. */
const SAMPLE = '한글본문한줄에들어가는글자수를재는표본문장입니다';
const MEASURE_SELECTOR = 'p, .note, .board-note, .forecast p, .detail-in p, .streak-note, .ask, .fb p';

/**
 * 06 §2 본문 행 길이 — 실측 advance 로 나눈다. `--measure: 36em` 이 걸려 있어도
 * 서체가 폴백으로 떨어지면 실제 글자 수가 달라지므로 **재서** 확인한다.
 */
export function measure(): MeasureRow[] {
  return [...document.querySelectorAll(MEASURE_SELECTOR)]
    .filter((el) => visible(el)
      && ((el.textContent ?? '').match(/[가-힣]/g) ?? []).length >= 15
      && el.closest('.dev') === null)
    .map((el) => {
      const cs = getComputedStyle(el);
      const span = document.createElement('span');
      span.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre';
      span.style.fontFamily = cs.fontFamily;
      span.style.fontSize = cs.fontSize;
      span.style.fontWeight = cs.fontWeight;
      span.style.letterSpacing = cs.letterSpacing;
      span.textContent = SAMPLE;
      document.body.appendChild(span);
      const adv = span.getBoundingClientRect().width / SAMPLE.length;
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

/** 행 길이 위반. `.note` 류는 더 짧은 범위를 쓴다 (06 §2). */
export const measureViolations = (rows: readonly MeasureRow[]): MeasureRow[] =>
  rows.filter((r) => (r.note
    ? r.chars < NOTE_MIN || r.chars > NOTE_MAX
    : r.chars < MEASURE_MIN || r.chars > MEASURE_MAX));

// ───────── 16px 실루엣 (06 §2) ─────────

/** 캔버스 바탕. 스티커가 놓이는 종이 색이다 (목업 `audit.dee`). */
const DEE_CANVAS_BG = '#FDFAF0';

/** 먹 판정 — 어두운 **무채색**만. 청판(#374FC4)은 먹이 아니다. */
const INK_MAX_CHANNEL = 96;
/** 종이 판정 — 밝기 0.72 위. 회색 경계 픽셀은 둘 다 아니다. */
const PAPER_MIN_L = 0.72;

export interface DeeReport {
  size: number;
  ly: number;
  smallMark: boolean;
  headMark: boolean;
  /** 먹 → 종이 → 먹 3단이 나오는 열의 수. 캡–뺨–턱받이가 살아 있는지. */
  bandCols: number;
  /** 그 열들에서 가장 두꺼운 흰 띠(뺨)의 높이 px. */
  cheekPx: number;
  darkPx: number;
  pass: boolean;
  /** 실패했을 때 사람이 보는 것. 숫자만으로는 어디가 뭉갰는지 모른다. */
  ascii: string;
}

/**
 * 자립형 SVG 는 `@chickadee/ui` 가 만든다 — 스티커의 배경 그림(D115)과 **같은 문자열**이어야
 * 게이트가 재는 것과 화면에 뜨는 것이 같다. 여기서는 이름만 다시 내보낸다.
 */
export { deeStandalone };

/**
 * 06 §2 16px 실루엣 — 자립형 SVG 를 캔버스에 그 크기로 찍고 **열(column)을 훑어**
 * 먹 → 종이 → 먹 3단이 남았는지 센다. 합격 = 그런 열 2개 이상 + 뺨 띠 2px 이상.
 *
 * 왜 눈이 아니라 래스터인가: 16px 에서 무너지는 것은 곡선이 아니라 **획 사이의 흰 틈**이고,
 * 그것은 실제로 찍어 봐야 보인다. 사람이 보는 것은 `ascii` 에 남는다.
 */
export function dee(size = 16, ly = 4, smallMark = size <= 24, headMark = size <= 20)
: Promise<DeeReport> {
  const svg = deeStandalone(ly, headMark ? 'head' : 'badge');
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => { reject(new Error('실루엣 SVG 를 이미지로 못 읽었다')); };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx === null) { reject(new Error('2d 컨텍스트가 없다')); return; }
      ctx.fillStyle = DEE_CANVAS_BG;
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      resolve(scanSilhouette(ctx.getImageData(0, 0, size, size).data, size, ly, smallMark, headMark));
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/**
 * 열 훑기 그 자체 (06 §2 의 판정). 래스터가 아니라 **규칙**이라 따로 뽑아 테스트한다.
 */
export function scanSilhouette(
  data: Uint8ClampedArray, size: number, ly: number, smallMark: boolean, headMark: boolean,
): DeeReport {
  const at = (x: number, y: number): [number, number, number] => {
    const i = (y * size + x) * 4;
    return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
  };
  const isInk = (x: number, y: number): boolean => Math.max(...at(x, y)) < INK_MAX_CHANNEL;
  const isPaper = (x: number, y: number): boolean => {
    const [r, g, b] = at(x, y);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > PAPER_MIN_L;
  };

  const lines: string[] = [];
  let darkPx = 0;
  for (let y = 0; y < size; y += 1) {
    let line = '';
    for (let x = 0; x < size; x += 1) {
      const ink = isInk(x, y);
      line += ink ? '#' : isPaper(x, y) ? '.' : '+';
      if (ink) darkPx += 1;
    }
    lines.push(line);
  }

  // 열 하나를 위에서 아래로 훑으며 먹(캡) → 종이(뺨) → 먹(턱받이) 3단을 찾는다.
  let bandCols = 0;
  let cheekPx = 0;
  for (let x = 0; x < size; x += 1) {
    let stage = 0;
    let run = 0;
    let best = 0;
    for (let y = 0; y < size; y += 1) {
      const ink = isInk(x, y);
      const paper = isPaper(x, y);
      if (stage === 0 && ink) stage = 1;
      else if (stage === 1 && paper) { stage = 2; run = 1; }
      else if (stage === 2 && paper) run += 1;
      else if (stage === 2 && ink) { best = Math.max(best, run); stage = 3; break; }
      // 회색 경계 픽셀(먹도 종이도 아닌 것)은 띠를 끊지 않는다.
    }
    if (stage === 3) {
      bandCols += 1;
      cheekPx = Math.max(cheekPx, best);
    }
  }

  return {
    size, ly, smallMark, headMark, bandCols, cheekPx, darkPx,
    pass: bandCols >= 2 && cheekPx >= 2,
    ascii: lines.join('\n'),
  };
}

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
