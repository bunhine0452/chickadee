#!/usr/bin/env node
/**
 * check-contrast.mjs — 정적 대비 게이트 (05 §9 첫 줄, 06 §2)
 *
 * `apps/desktop/src/styles/tokens.css` 를 파싱해 WCAG 2 상대 휘도로 대비를 계산한다.
 *   · 텍스트 토큰 5 × 바탕 4 × 테마 2 = 40쌍 → 7:1
 *   · --on-t* × --t* 6쌍 → 4.5:1
 *   · --ink-mute · --ink-faint 는 **텍스트 금지** — 텍스트 집합에 없음을 단언한다(7:1 로 재지 않는다)
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

const TEXT_TOKENS = ['--ink', '--ink-soft', '--blue-text', '--pink-text', '--yellow-text'];
const BG_TOKENS = ['--paper', '--paper-2', '--paper-3', '--stock'];
/** 05 §4.1: 괘선·점선·하프톤 전용. 텍스트로 쓰면 린트가 막는다. */
const TEXT_FORBIDDEN = ['--ink-mute', '--ink-faint'];
const INK_BADGE_PAIRS = [
  ['--on-t0', '--t0'],
  ['--on-t1', '--t1'],
  ['--on-t2', '--t2'],
  // 판정 「면」 — 트랙 색과 독립이므로 따로 잰다 (D95).
  ['--on-verdict-differ', '--verdict-differ-face'],
];

const PAPER_MIN = 7;
const INK_MIN = 4.5;
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

/** `var(--x)` 별칭을 끝까지 푼다 (--t0: var(--blue) 등). */
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
  for (const theme of ['light', 'dark']) {
    for (const fg of TEXT_TOKENS) {
      for (const bg of BG_TOKENS) {
        pairs.push({ theme, fg, bg, min: PAPER_MIN, kind: '종이 위 텍스트' });
      }
    }
    for (const [fg, bg] of INK_BADGE_PAIRS) {
      pairs.push({ theme, fg, bg, min: INK_MIN, kind: '잉크 배지 위' });
    }
  }
  return pairs;
}

async function main() {
  const css = await readFile(path.join(ROOT, TOKENS_CSS), 'utf8');
  const maps = themeMaps(css);
  const { byPair, problems } = await readAllowlist();

  // 텍스트 금지 토큰이 텍스트 집합에 섞이지 않았는지 단언한다 (05 §4.1 「✗ 린트」).
  for (const token of TEXT_FORBIDDEN) {
    if (TEXT_TOKENS.includes(token)) {
      problems.push(`${token} 은 텍스트 금지 토큰입니다 — 괘선·점선·하프톤 전용이라 7:1 대상이 아닙니다 (05 §4.1).`);
    }
    if (maps.light[token] === undefined || maps.dark[token] === undefined) {
      problems.push(`${token} 이 tokens.css 에 없습니다 — 삭제됐다면 이 목록도 고치세요.`);
    }
  }

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

  const worst = [...rows].sort((a, b) => a.ratio / a.min - b.ratio / b.min).slice(0, 3);
  const yellowOnPaper3 = rows.find((r) => r.name === 'light --yellow-text on --paper-3');

  console.log(`대비 검사 — ${TOKENS_CSS}`);
  console.log(`  종이 위 텍스트 ${rows.filter((r) => r.min === PAPER_MIN).length}쌍 ≥ ${PAPER_MIN}:1`);
  console.log(`  잉크 배지 위   ${rows.filter((r) => r.min === INK_MIN).length}쌍 ≥ ${INK_MIN}:1`);
  console.log(`  텍스트 금지    ${TEXT_FORBIDDEN.join(' · ')} (검사 대상 아님)`);
  if (yellowOnPaper3) {
    console.log(
      `  D11 확인       --yellow-text(${yellowOnPaper3.fgv}) on --paper-3(${yellowOnPaper3.bgv}) = ` +
        `${yellowOnPaper3.ratio.toFixed(2)}:1 → ${yellowOnPaper3.ratio >= PAPER_MIN ? '통과' : '실패'}`,
    );
  }
  console.log(`  가장 빠듯한 3쌍: ${worst.map((r) => `${r.name} ${r.ratio.toFixed(2)}:1`).join(' · ')}`);
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
