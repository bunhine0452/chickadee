#!/usr/bin/env node
/**
 * check-contrast.mjs — 정적 대비 게이트 (D182 · 정본 §6 · 05 §9 · 06 §2)
 *
 * `apps/desktop/src/styles/tokens.css` 를 파싱해 WCAG 2 상대 휘도로 대비를 계산한다.
 * 층은 넷이고 기준이 각각 다르다 — **왜 다른지를 이름이 말한다.**
 *
 *   본문 7:1     --text · --text-muted 를 모든 바탕 위에서. 정본 §6 의 「대비 7:1」이 이것이다.
 *   보조 4.5:1   --text-faint 는 본문에 못 쓴다(README 금지 목록). 캡션·비활성 라벨 전용이라
 *                기준이 AA 이고, 대신 **재기는 잰다** — 옛 시스템은 --ink-mute/--ink-faint 를
 *                「텍스트 금지」라고 적어 두고 아무 수치도 재지 않았다(D182 가 그것을 뒤집는다).
 *   뜻 7:1       액센트 하나와 상태 넷을 자기 배경 색과 중립 표면 위에서. 색이 뜻을 나르므로
 *                본문과 같은 기준을 받는다. 코드 구문 강조 여섯도 여기 든다(정본 §6 의 예외).
 *   UI 3:1       --focus · --border-strong. 글자가 아니라 테두리라 WCAG 1.4.11 기준이다.
 *
 * 예외는 `apps/desktop/src/styles/contrast.allow.json` 에만 둔다.
 * 06 §2: allowlist 항목은 **만료일 필수(최대 90일)**. 만료됐거나 만료일이 없으면 실패한다 —
 * 만료 없는 예외 목록은 6개월 뒤 규칙 자체를 무력화한다.
 *
 *   node scripts/check-contrast.mjs        (pnpm check:contrast)
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_CSS = 'apps/desktop/src/styles/tokens.css';
const ALLOW_JSON = 'apps/desktop/src/styles/contrast.allow.json';

/** 중립 표면 넷. 본문이 얹힐 수 있는 자리는 이것뿐이다. */
const SURFACES = ['--bg', '--surface', '--surface-2', '--surface-3'];
/** 뜻이 있는 바탕 — 상태 넷의 연한 면과 액센트 연한 면. 여기에도 본문이 얹힌다. */
const TINTS = ['--accent-weak', '--ok-bg', '--bad-bg', '--warn-bg', '--info-bg'];
/** 코드 판 바탕. 구문 강조 여섯이 이 위에 앉는다. */
const CODE_BG = '--code-bg';

const BODY_TEXT = ['--text', '--text-muted'];
const SECONDARY_TEXT = ['--text-faint'];
/** 뜻을 나르는 색 — 액센트 하나 + 상태 넷. 자기 tint 와 중립 표면 위에서 잰다. */
const MEANING = [
  { fg: '--accent', own: '--accent-weak' },
  { fg: '--ok', own: '--ok-bg' },
  { fg: '--bad', own: '--bad-bg' },
  { fg: '--warn', own: '--warn-bg' },
  { fg: '--info', own: '--info-bg' },
];
const SYNTAX = ['--syn-key', '--syn-str', '--syn-num', '--syn-com', '--syn-type', '--syn-fn'];
/** 색면 위에 얹는 글자 — 배지·버튼 라벨이라 AA(4.5) 가 기준이다. */
const ON_FILL = [
  ['--on-accent', '--accent'],
  ['--text-inverse', '--accent'],
];
/** 글자가 아닌 UI 경계 (WCAG 1.4.11). */
const UI_STROKE = ['--focus', '--border-strong'];

const BODY_MIN = 7;
const SECONDARY_MIN = 4.5;
const FILL_MIN = 4.5;
const STROKE_MIN = 3;
const ALLOW_MAX_DAYS = 90;

/* ───────── 토큰 파싱 ───────── */

/** `selector { … }` 안의 커스텀 속성만 뽑는다. */
function readCustomProps(css, selector) {
  const head = new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`);
  const m = head.exec(css);
  if (!m) throw new Error(`${TOKENS_CSS} 에서 \`${selector}\` 블록을 찾지 못했습니다.`);
  const open = m.index + m[0].length;
  const close = css.indexOf('\n}', open);
  if (close < 0) throw new Error(`\`${selector}\` 블록이 닫히지 않았습니다.`);
  const body = css.slice(open, close);

  const props = {};
  const decl = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let d = decl.exec(body);
  while (d !== null) {
    props[d[1]] = d[2].trim();
    d = decl.exec(body);
  }
  return props;
}

/** `var(--x)` 별칭을 끝까지 푼다 (옛 이름 별칭 한 판이 아직 남아 있다). */
function resolve(map, token, seen = new Set()) {
  const raw = map[token];
  if (raw === undefined) throw new Error(`토큰이 없습니다: ${token}`);
  const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(raw);
  if (!m) return raw;
  if (seen.has(token)) throw new Error(`var() 순환 참조: ${[...seen, token].join(' → ')}`);
  seen.add(token);
  if (map[m[1]] !== undefined) return resolve(map, m[1], seen);
  if (m[2]) return m[2].trim();
  throw new Error(`${token} 이 가리키는 ${m[1]} 이 정의돼 있지 않습니다.`);
}

/* ───────── WCAG 2 ───────── */

function toRgb(value) {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const short = /^#([0-9a-f]{3})$/i.exec(value);
  if (short) return [...short[1]].map((c) => parseInt(c + c, 16));
  throw new Error(`색으로 읽을 수 없는 값입니다: \`${value}\` (대비 계산 대상은 불투명 색이어야 합니다)`);
}

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminance(value) {
  const [r, g, b] = toRgb(value);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const round2 = (n) => Math.round(n * 100) / 100;

/* ───────── allowlist ───────── */

async function readAllowlist() {
  const abs = path.join(ROOT, ALLOW_JSON);
  if (!existsSync(abs)) {
    throw new Error(`allowlist 파일이 없습니다: ${ALLOW_JSON} (예외가 없으면 \`[]\` 로 두세요)`);
  }
  const parsed = JSON.parse(await readFile(abs, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${ALLOW_JSON} 은 배열이어야 합니다.`);

  const today = new Date();
  const byPair = new Map();
  const problems = [];

  parsed.forEach((entry, n) => {
    const where = `${ALLOW_JSON}[${n}]`;
    for (const field of ['pair', 'ratio', 'reason', 'expires']) {
      if (entry?.[field] === undefined || entry[field] === '') {
        problems.push(`${where}: \`${field}\` 가 없습니다. (06 §2: 예외는 선택자·사유·만료일이 모두 필요)`);
      }
    }
    if (typeof entry?.expires !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.expires)) {
      if (entry?.expires !== undefined) problems.push(`${where}: \`expires\` 는 YYYY-MM-DD 여야 합니다 — \`${entry.expires}\``);
      return;
    }
    const expires = new Date(`${entry.expires}T23:59:59Z`);
    if (Number.isNaN(expires.getTime())) {
      problems.push(`${where}: \`expires\` 를 날짜로 읽을 수 없습니다 — \`${entry.expires}\``);
      return;
    }
    if (expires < today) {
      problems.push(`${where}: 만료됐습니다 (${entry.expires}). 예외를 없애든지 다시 결정하세요 — ${entry.pair}`);
      return;
    }
    const days = Math.ceil((expires - today) / 86400000);
    if (days > ALLOW_MAX_DAYS) {
      problems.push(`${where}: 만료일이 ${days}일 뒤입니다. 최대 ${ALLOW_MAX_DAYS}일 (06 §2) — ${entry.pair}`);
      return;
    }
    byPair.set(entry.pair, entry);
  });

  return { byPair, problems };
}

/* ───────── 실행 ───────── */

function themeMaps(css) {
  const light = readCustomProps(css, ':root');
  const dark = { ...light, ...readCustomProps(css, '[data-theme="dark"]') };
  return { light, dark };
}

function buildPairs() {
  const pairs = [];
  const all = [...SURFACES, ...TINTS, CODE_BG];
  for (const theme of ['light', 'dark']) {
    for (const fg of BODY_TEXT) {
      for (const bg of all) pairs.push({ theme, fg, bg, min: BODY_MIN, kind: '본문' });
    }
    for (const fg of SECONDARY_TEXT) {
      for (const bg of all) pairs.push({ theme, fg, bg, min: SECONDARY_MIN, kind: '보조 라벨' });
    }
    for (const { fg, own } of MEANING) {
      for (const bg of [...SURFACES, own]) pairs.push({ theme, fg, bg, min: BODY_MIN, kind: '뜻을 나르는 색' });
    }
    for (const fg of SYNTAX) {
      pairs.push({ theme, fg, bg: CODE_BG, min: BODY_MIN, kind: '코드 구문 강조' });
    }
    for (const [fg, bg] of ON_FILL) {
      pairs.push({ theme, fg, bg, min: FILL_MIN, kind: '색면 위 글자' });
    }
    for (const fg of UI_STROKE) {
      for (const bg of SURFACES) pairs.push({ theme, fg, bg, min: STROKE_MIN, kind: 'UI 경계' });
    }
  }
  return pairs;
}

async function main() {
  const css = await readFile(path.join(ROOT, TOKENS_CSS), 'utf8');
  const maps = themeMaps(css);
  const { byPair, problems } = await readAllowlist();

  const rows = buildPairs().map((p) => {
    const fgv = resolve(maps[p.theme], p.fg);
    const bgv = resolve(maps[p.theme], p.bg);
    const ratio = round2(contrast(fgv, bgv));
    return { ...p, fgv, bgv, ratio, name: `${p.theme} ${p.fg} on ${p.bg}` };
  });

  const failed = [];
  const excused = [];
  for (const r of rows) {
    if (r.ratio >= r.min) continue;
    const allow = byPair.get(r.name);
    if (allow) excused.push({ ...r, allow });
    else failed.push(r);
  }

  const byKind = new Map();
  for (const r of rows) {
    const at = byKind.get(r.kind) ?? { n: 0, min: r.min, worst: r };
    at.n += 1;
    if (r.ratio / r.min < at.worst.ratio / at.worst.min) at.worst = r;
    byKind.set(r.kind, at);
  }

  console.log(`대비 검사 — ${TOKENS_CSS}`);
  for (const [kind, at] of byKind) {
    console.log(
      `  ${kind.padEnd(14)} ${String(at.n).padStart(3)}쌍 ≥ ${at.min}:1` +
        `   가장 빠듯: ${at.worst.name} ${at.worst.ratio.toFixed(2)}:1`,
    );
  }
  for (const e of excused) {
    console.log(`  예외 적용      ${e.name} ${e.ratio.toFixed(2)}:1 — ${e.allow.reason} (만료 ${e.allow.expires})`);
  }

  if (problems.length > 0 || failed.length > 0) {
    console.error('');
    for (const p of problems) console.error(`allowlist/설정 오류: ${p}`);
    for (const f of failed) {
      console.error(
        `대비 미달: ${f.name} — ${f.fgv} on ${f.bgv} = ${f.ratio.toFixed(2)}:1 < ${f.min}:1 (${f.kind})`,
      );
    }
    console.error(`\n실패 ${failed.length}쌍 · 설정 오류 ${problems.length}건.`);
    process.exitCode = 1;
    return;
  }

  console.log(`통과 — ${rows.length}쌍 모두 기준을 넘었습니다.`);
}

main().catch((err) => {
  console.error(`check-contrast 실패: ${err.message}`);
  process.exitCode = 1;
});
