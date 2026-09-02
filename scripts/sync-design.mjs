#!/usr/bin/env node
/**
 * sync-design.mjs — 디자인 목업 → 앱 토큰 단일 출처 잇기 (05 §12, D41)
 *
 * 목업(`design/ink-home.html`)이 원본이고 **읽기 전용**이다. 이 스크립트는
 *   design/ink-home.html      :root{…} / [data-theme="dark"]{…}  → apps/desktop/src/styles/tokens.css
 *                                                                → apps/desktop/src/styles/tokens.ts
 *   design/src/ink/mascot.svg.html                               → apps/desktop/src/assets/mascot.svg
 * 를 생성한다. 어느 경우에도 design/ 아래를 쓰지 않는다.
 *
 *   node scripts/sync-design.mjs           생성 (pnpm design:sync)
 *   node scripts/sync-design.mjs --check   디스크와 바이트 단위 비교, 다르면 exit 1 (pnpm design:check)
 *
 * 05 §12: CI 는 --check 로 디자인과 앱의 토큰이 바이트 단위로 같은지 검사해 드리프트를 빌드 실패로 만든다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SRC_MOCKUP = 'design/ink-home.html';
const SRC_MASCOT = 'design/src/ink/mascot.svg.html';
const OUT_CSS = 'apps/desktop/src/styles/tokens.css';
const OUT_TS = 'apps/desktop/src/styles/tokens.ts';
const OUT_MASCOT = 'apps/desktop/src/assets/mascot.svg';

const SYNC_CMD = 'pnpm design:sync';

/* ══════════════════════════════════════════════════════════════════════════
   결정된 오버라이드 표 — 감사 가능한 단일 리터럴

   목업은 아직 05 「목업 정리」 패스를 거치지 않았다(별도 마일스톤 항목).
   그래서 아래 네 가지 토큰 사실이 확정 결정과 다르다. 추출한 결과 위에
   이 표를 그대로 얹고, 적용한 항목을 한 줄씩 출력한다.

   op: 'set'    값 교체 (mockupValue 가 실제와 다르면 실패 — 목업이 정리되면 바로 알아챈다)
       'add'    목업에 없는 토큰 추가 (블록 끝에 오버라이드 절로 모아 넣는다)
       'remove' 목업에 있는 토큰 삭제
   ══════════════════════════════════════════════════════════════════════════ */
const OVERRIDES = [
  // D11 / 05 §4.1 / 정본 §6 — paper-3 위 6.82:1 로 7:1 을 못 넘겨 #664300 으로 확정
  { op: 'set', theme: 'light', prop: '--yellow-text', mockupValue: '#6B4600', value: '#664300',
    source: 'D11 / 05 §4.1 / 정본 §6' },

  // D11 / 05 §4.1·4.2 — 판정 색은 트랙 색과 독립. 목업엔 .gl.exact{background:var(--pink)} 처럼
  // 원색이 박혀 있어 T1 색을 바꾸면 판정 색까지 딸려 바뀐다.
  { op: 'add', theme: 'light', prop: '--verdict-exact', value: '#FF2E7E', source: 'D11 / 05 §4.1·4.2' },
  { op: 'add', theme: 'light', prop: '--verdict-equiv', value: '#1250C8', source: 'D11 / 05 §4.1·4.2' },
  { op: 'add', theme: 'light', prop: '--verdict-differ', value: '#C08F00', source: 'D11 / 05 §4.1·4.2' },
  { op: 'add', theme: 'dark', prop: '--verdict-exact', value: '#FF3A86', source: 'D11 / 05 §4.1·4.2' },
  { op: 'add', theme: 'dark', prop: '--verdict-equiv', value: '#3B82FF', source: 'D11 / 05 §4.1·4.2' },
  { op: 'add', theme: 'dark', prop: '--verdict-differ', value: '#C09600', source: 'D11 / 05 §4.1·4.2' },

  // 판정 **글자** 색 — D11 의 --verdict-* 는 면(도장 테두리·거터 틱)이고, `.stamp` 의 글자는
  // 종이 위 7:1 이 필요하다. 값은 05 §4.1 의 --pink-text/--blue-text/--yellow-text 와 같다 (D56).
  { op: 'add', theme: 'light', prop: '--verdict-exact-text', value: '#960B42', source: 'D56 / 05 §4.1' },
  { op: 'add', theme: 'light', prop: '--verdict-equiv-text', value: '#0F3F9E', source: 'D56 / 05 §4.1' },
  { op: 'add', theme: 'light', prop: '--verdict-differ-text', value: '#664300', source: 'D56 / 05 §4.1' },
  { op: 'add', theme: 'dark', prop: '--verdict-exact-text', value: '#FFA3CE', source: 'D56 / 05 §4.1' },
  { op: 'add', theme: 'dark', prop: '--verdict-equiv-text', value: '#9CC2FF', source: 'D56 / 05 §4.1' },
  { op: 'add', theme: 'dark', prop: '--verdict-differ-text', value: '#FFD866', source: 'D56 / 05 §4.1' },

  // 05 §4.1 마지막 문단 — 목업은 야간반에만 정의해 주간반에서 var() 가 무효값이 된다
  { op: 'add', theme: 'light', prop: '--glow-t0', value: 'transparent', source: '05 §4.1 마지막 문단' },
  { op: 'add', theme: 'light', prop: '--glow-t1', value: 'transparent', source: '05 §4.1 마지막 문단' },
  { op: 'add', theme: 'light', prop: '--glow-t2', value: 'transparent', source: '05 §4.1 마지막 문단' },

  // 05 §4.1 「삭제 확정」 — DeeSprite 는 --dee-paper/-gray/-blank 만 쓴다
  { op: 'remove', theme: 'light', prop: '--dee-k', source: '05 §4.1 「삭제 확정」' },
  { op: 'remove', theme: 'light', prop: '--dee-blue', source: '05 §4.1 「삭제 확정」' },
  { op: 'remove', theme: 'light', prop: '--dee-blue-deep', source: '05 §4.1 「삭제 확정」' },
  { op: 'remove', theme: 'light', prop: '--dee-pink', source: '05 §4.1 「삭제 확정」' },
  { op: 'remove', theme: 'dark', prop: '--dee-blue', source: '05 §4.1 「삭제 확정」' },
  { op: 'remove', theme: 'dark', prop: '--dee-pink', source: '05 §4.1 「삭제 확정」' },
];

const BLOCKS = [
  { theme: 'light', selector: ':root', title: '토큰 : 주간반 (밝은 종이)' },
  { theme: 'dark', selector: '[data-theme="dark"]', title: '토큰 : 야간반 (어두운 판지에 형광 잉크)' },
];

// 야간 작업 램프. 목업에서 야간 토큰 블록 바로 뒤에 오는 규칙이고
// [data-theme="dark"] 선택자는 tokens.css 에서만 허용되므로(05 §4.3) 여기 함께 싣는다.
const DARK_BODY_SELECTOR = '[data-theme="dark"] body';

/* ───────── 목업 파싱 ───────── */

/** `selector{…}` 를 중괄호 균형으로 잘라낸다. 선택자는 줄 첫머리에 있어야 한다. */
function extractBlock(source, selector) {
  const needle = `\n${selector}{`;
  const at = source.indexOf(needle);
  if (at < 0) throw new Error(`목업에서 \`${selector}{\` 블록을 찾지 못했습니다: ${SRC_MOCKUP}`);
  const open = at + needle.length;
  let depth = 1;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i);
    }
  }
  throw new Error(`\`${selector}{\` 블록의 닫는 중괄호를 찾지 못했습니다.`);
}

/**
 * 블록 본문 → 순서를 지킨 항목 목록.
 * 항목은 {kind:'comment', text} 또는 {kind:'decl', prop, value} 이다.
 */
function parseBlock(body) {
  const items = [];
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === ';') {
      i += 1;
      continue;
    }
    if (ch === '/' && body[i + 1] === '*') {
      const end = body.indexOf('*/', i + 2);
      if (end < 0) throw new Error('닫히지 않은 주석이 있습니다.');
      items.push({ kind: 'comment', text: body.slice(i + 2, end) });
      i = end + 2;
      continue;
    }
    // 선언: prop : value ;  (문자열·괄호 안의 세미콜론은 없다고 본다 — 토큰 블록엔 url() 이 없다)
    const colon = body.indexOf(':', i);
    if (colon < 0) throw new Error(`선언에 콜론이 없습니다: ${body.slice(i, i + 40)}`);
    let j = colon + 1;
    let depth = 0;
    let quote = '';
    for (; j < body.length; j += 1) {
      const c = body[j];
      if (quote) {
        if (c === quote) quote = '';
        continue;
      }
      if (c === '"' || c === "'") quote = c;
      else if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
      else if (c === ';' && depth === 0) break;
      else if (c === '/' && body[j + 1] === '*' && depth === 0) break;
    }
    const prop = body.slice(i, colon).trim();
    const value = body.slice(colon + 1, j).trim().replace(/\s*\n\s*/g, ' ').replace(/[ \t]{2,}/g, ' ');
    items.push({ kind: 'decl', prop, value });
    i = j + (body[j] === ';' ? 1 : 0);
  }
  return items;
}

/* ───────── 오버라이드 적용 ───────── */

function applyOverrides(itemsByTheme, log) {
  for (const { theme, selector } of BLOCKS.map((b) => ({ theme: b.theme, selector: b.selector }))) {
    const items = itemsByTheme[theme];
    const mine = OVERRIDES.filter((o) => o.theme === theme);
    const added = [];

    for (const o of mine) {
      const idx = items.findIndex((it) => it.kind === 'decl' && it.prop === o.prop);
      if (o.op === 'set') {
        if (idx < 0) throw new Error(`오버라이드 대상이 목업에 없습니다: ${theme} ${o.prop}`);
        const found = items[idx].value;
        if (found !== o.mockupValue) {
          throw new Error(
            `오버라이드 전제가 깨졌습니다: ${theme} ${o.prop} — 목업 값이 \`${o.mockupValue}\` 일 것으로 봤는데 \`${found}\` 입니다.\n` +
              '목업이 「목업 정리」를 거쳤다면 OVERRIDES 표에서 이 항목을 지우세요.',
          );
        }
        items[idx] = { kind: 'decl', prop: o.prop, value: o.value };
        log.push(`  set    ${theme.padEnd(5)} ${o.prop.padEnd(16)} ${found} → ${o.value}   (${o.source})`);
      } else if (o.op === 'remove') {
        if (idx < 0) throw new Error(`삭제 대상이 목업에 없습니다: ${theme} ${o.prop}`);
        items.splice(idx, 1);
        log.push(`  remove ${theme.padEnd(5)} ${o.prop.padEnd(16)} 삭제                (${o.source})`);
      } else if (o.op === 'add') {
        if (idx >= 0) throw new Error(`추가 대상이 이미 목업에 있습니다: ${theme} ${o.prop}`);
        added.push(o);
        log.push(`  add    ${theme.padEnd(5)} ${o.prop.padEnd(16)} ${o.value.padEnd(13)}       (${o.source})`);
      }
    }

    if (added.length > 0) {
      items.push({ kind: 'comment', text: ` sync-design.mjs OVERRIDES — 목업에 아직 없는 확정 토큰 (${selector}) ` });
      for (const o of added) items.push({ kind: 'decl', prop: o.prop, value: o.value });
    }
  }
}

/* ───────── 출력 ───────── */

const isCustom = (it) => it.kind === 'decl' && it.prop.startsWith('--');

function renderItems(items) {
  const out = [];
  items.forEach((it, n) => {
    const prev = items[n - 1];
    if (it.kind === 'comment') {
      if (n > 0) out.push('');
      const lines = it.text.split('\n').map((l) => l.trim()).filter((l, k, a) => l !== '' || (k > 0 && k < a.length - 1));
      if (lines.length === 1) {
        out.push(`  /* ${lines[0]} */`);
      } else {
        out.push(`  /* ${lines[0]}`);
        for (let k = 1; k < lines.length; k += 1) {
          out.push(k === lines.length - 1 ? `     ${lines[k]} */` : `     ${lines[k]}`);
        }
      }
      return;
    }
    // stylelint-config-standard `custom-property-empty-line-before`:
    // 일반 선언 뒤에 오는 커스텀 속성 앞에는 빈 줄이 필요하다.
    if (prev && isCustom(it) && prev.kind === 'decl' && !isCustom(prev)) out.push('');
    out.push(`  ${it.prop}: ${it.value};`);
  });
  return out.join('\n');
}

function renderCss(itemsByTheme, darkBody) {
  const head = [
    '/* 생성 파일 — 직접 고치지 마세요.',
    ` * 원본:   ${SRC_MOCKUP} 의 :root{…} · [data-theme="dark"]{…}`,
    ' * 생성기: scripts/sync-design.mjs (확정 오버라이드 표 포함 — 05 §4.1, D11)',
    ` * 갱신:   ${SYNC_CMD}   /   검사: pnpm design:check (CI 드리프트 게이트)`,
    ' */',
    '',
  ];
  const parts = [head.join('\n')];
  for (const b of BLOCKS) {
    parts.push(`/* ───────── ${b.title} ───────── */`);
    parts.push(`${b.selector} {\n${renderItems(itemsByTheme[b.theme])}\n}`);
    parts.push('');
  }
  parts.push('/* ───────── 야간 작업 램프 — 대지를 비추는 빛 하나 (05 §4.3: 다크 선택자는 tokens.css 에만) ───────── */');
  parts.push(`${DARK_BODY_SELECTOR} {\n${renderItems(darkBody)}\n}`);
  return `${parts.join('\n')}\n`;
}

/** 값에 큰따옴표(서체 스택)가 흔하므로 작은따옴표로 감싼다. */
const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function renderTs(itemsByTheme) {
  const entries = (theme) =>
    itemsByTheme[theme]
      .filter((it) => it.kind === 'decl' && it.prop.startsWith('--'))
      .map((it) => `    '${it.prop}': ${quote(it.value)},`)
      .join('\n');

  return [
    '// 생성 파일 — 직접 고치지 마세요.',
    `// 원본: ${SRC_MOCKUP} → ${OUT_CSS} → 이 파일. 갱신: ${SYNC_CMD}`,
    '// 용도: Monaco 테마(05 §8)와 정적 대비 테스트(scripts/check-contrast.mjs, 05 §9).',
    '// 값은 CSS 원문 그대로다 — `var(--blue)` 같은 별칭은 소비자가 푼다.',
    '',
    'export const tokens = {',
    '  light: {',
    entries('light'),
    '  },',
    '  dark: {',
    entries('dark'),
    '  },',
    '} as const;',
    '',
    'export type ThemeName = keyof typeof tokens;',
    "export type TokenName = keyof (typeof tokens)['light'];",
    '',
  ].join('\n');
}

/* ───────── 마스코트 ───────── */

/**
 * 마스코트는 **그대로 복사**한다 (05 §12 「그대로 옮기는 것」, D42).
 * DeeSprite 가 인라인으로 심는 조각이라 손대지 않는다 — 원본은 읽기만 한다.
 */
function copyMascot(html) {
  if (!html.includes('<svg') || !html.includes('</svg>')) {
    throw new Error(`마스코트 원본에 <svg> 가 없습니다: ${SRC_MASCOT}`);
  }
  return html;
}

/* ───────── 실행 ───────── */

async function build() {
  const html = await readFile(path.join(ROOT, SRC_MOCKUP), 'utf8');
  const itemsByTheme = {};
  for (const b of BLOCKS) itemsByTheme[b.theme] = parseBlock(extractBlock(html, b.selector));
  const darkBody = parseBlock(extractBlock(html, DARK_BODY_SELECTOR));

  const log = [];
  applyOverrides(itemsByTheme, log);

  const mascotSrc = await readFile(path.join(ROOT, SRC_MASCOT), 'utf8');

  return {
    log,
    files: [
      [OUT_CSS, renderCss(itemsByTheme, darkBody)],
      [OUT_TS, renderTs(itemsByTheme)],
      [OUT_MASCOT, copyMascot(mascotSrc)],
    ],
  };
}

function diffSummary(rel, expected, actual) {
  if (actual === null) return `  ${rel}: 파일이 없습니다.`;
  const e = expected.split('\n');
  const a = actual.split('\n');
  const lines = [`  ${rel}: 디스크 ${a.length}줄 / 생성 ${e.length}줄`];
  let shown = 0;
  for (let i = 0; i < Math.max(e.length, a.length) && shown < 6; i += 1) {
    if (e[i] !== a[i]) {
      lines.push(`    ${i + 1}행  디스크: ${a[i] ?? '(없음)'}`);
      lines.push(`    ${i + 1}행  생성  : ${e[i] ?? '(없음)'}`);
      shown += 1;
    }
  }
  if (shown === 0) lines.push('    (줄 단위로는 같습니다 — 줄바꿈·공백이 다릅니다)');
  return lines.join('\n');
}

async function main() {
  const check = process.argv.includes('--check');
  const { log, files } = await build();

  if (check) {
    const drifted = [];
    for (const [rel, expected] of files) {
      const abs = path.join(ROOT, rel);
      const actual = existsSync(abs) ? await readFile(abs, 'utf8') : null;
      if (actual !== expected) drifted.push(diffSummary(rel, expected, actual));
    }
    if (drifted.length > 0) {
      console.error('design:check 실패 — 목업과 앱 토큰이 어긋났습니다 (05 §12 드리프트 게이트).');
      console.error(drifted.join('\n'));
      console.error(`\n고치는 법: ${SYNC_CMD} 를 돌리고 결과를 커밋하세요. 목업은 고치지 않습니다.`);
      process.exitCode = 1;
      return;
    }
    console.log(`design:check 통과 — ${files.length}개 생성물이 ${SRC_MOCKUP} 와 바이트 단위로 일치합니다.`);
    return;
  }

  console.log(`원본: ${SRC_MOCKUP} · ${SRC_MASCOT} (읽기 전용)`);
  console.log(`오버라이드 ${log.length}건 적용:`);
  for (const line of log) console.log(line);

  for (const [rel, content] of files) {
    const abs = path.join(ROOT, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, content, 'utf8');
    console.log(`생성: ${rel} (${Buffer.byteLength(content)} B)`);
  }
}

main().catch((err) => {
  console.error(`sync-design 실패: ${err.message}`);
  process.exitCode = 1;
});
