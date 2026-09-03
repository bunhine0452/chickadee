#!/usr/bin/env node
/**
 * sync-design.mjs — 디자인 토큰 단일 출처 → 앱 (05 §12, D41)
 *
 * `design/src/ink/tokens.css` 가 원본이고 **읽기 전용**이다. 같은 파일을 목업 두 장도
 * `design/src/ink/build.py` 로 인라인한다 — 목업과 앱이 한 파일에서 갈라진다.
 *   design/src/ink/tokens.css      :root{…} / [data-theme="dark"]{…}  → apps/desktop/src/styles/tokens.css
 *                                                                     → apps/desktop/src/styles/tokens.ts
 *   design/src/ink/mascot.svg.html                                    → apps/desktop/src/assets/mascot.svg
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

const SRC_TOKENS = 'design/src/ink/tokens.css';
const SRC_MASCOT = 'design/src/ink/mascot.svg.html';
const OUT_CSS = 'apps/desktop/src/styles/tokens.css';
const OUT_TS = 'apps/desktop/src/styles/tokens.ts';
const OUT_MASCOT = 'apps/desktop/src/assets/mascot.svg';

const SYNC_CMD = 'pnpm design:sync';

/* ══════════════════════════════════════════════════════════════════════════
   오버라이드 표 — **비어 있다**.

   D52 가 이 표를 둔 이유는 D11 이 정한 토큰 넷이 아직 목업에 없었기 때문이다.
   05 「목업 정리」가 그 넷과 D95 의 면 색 둘을 `design/src/ink/tokens.css` 안으로
   옮겼으므로 얹을 것이 없다. 값이 바뀌면 tokens.css 를 고친다 — 이 표는 「앱만 다르게
   가야 하는데 목업을 아직 못 고친다」는 예외에만 쓰고, 쓸 때는 결정 등록부에 행을 올린다.

   op: 'set'    값 교체 (mockupValue 가 실제와 다르면 실패)
       'add'    원본에 없는 토큰 추가 (블록 끝에 모아 넣는다)
       'remove' 원본에 있는 토큰 삭제
   ══════════════════════════════════════════════════════════════════════════ */
const OVERRIDES = [];

const BLOCKS = [
  { theme: 'light', selector: ':root', title: '토큰 : 주간반 (밝은 종이)' },
  { theme: 'dark', selector: '[data-theme="dark"]', title: '토큰 : 야간반 (어두운 판지에 형광 잉크)' },
];

// 야간 작업 램프. 원본에서 야간 토큰 블록 바로 뒤에 오는 규칙이고
// [data-theme="dark"] 선택자는 tokens.css 에서만 허용되므로(05 §4.3) 여기 함께 싣는다.
const DARK_BODY_SELECTOR = '[data-theme="dark"] body';

/* ───────── 원본 파싱 ───────── */

/** `selector{…}` 를 중괄호 균형으로 잘라낸다. 선택자는 줄 첫머리에 있어야 한다. */
function extractBlock(source, selector) {
  const needle = `\n${selector}{`;
  const at = source.indexOf(needle);
  if (at < 0) throw new Error(`원본에서 \`${selector}{\` 블록을 찾지 못했습니다: ${SRC_TOKENS}`);
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
        if (idx < 0) throw new Error(`오버라이드 대상이 원본에 없습니다: ${theme} ${o.prop}`);
        const found = items[idx].value;
        if (found !== o.mockupValue) {
          throw new Error(
            `오버라이드 전제가 깨졌습니다: ${theme} ${o.prop} — 원본 값이 \`${o.mockupValue}\` 일 것으로 봤는데 \`${found}\` 입니다.\n` +
              'tokens.css 가 이미 그 값이 되었다면 OVERRIDES 표에서 이 항목을 지우세요.',
          );
        }
        items[idx] = { kind: 'decl', prop: o.prop, value: o.value };
        log.push(`  set    ${theme.padEnd(5)} ${o.prop.padEnd(16)} ${found} → ${o.value}   (${o.source})`);
      } else if (o.op === 'remove') {
        if (idx < 0) throw new Error(`삭제 대상이 원본에 없습니다: ${theme} ${o.prop}`);
        items.splice(idx, 1);
        log.push(`  remove ${theme.padEnd(5)} ${o.prop.padEnd(16)} 삭제                (${o.source})`);
      } else if (o.op === 'add') {
        if (idx >= 0) throw new Error(`추가 대상이 이미 원본에 있습니다: ${theme} ${o.prop}`);
        added.push(o);
        log.push(`  add    ${theme.padEnd(5)} ${o.prop.padEnd(16)} ${o.value.padEnd(13)}       (${o.source})`);
      }
    }

    if (added.length > 0) {
      items.push({ kind: 'comment', text: ` sync-design.mjs OVERRIDES — 원본에 아직 없는 확정 토큰 (${selector}) ` });
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
    ` * 원본:   ${SRC_TOKENS} 의 :root{…} · [data-theme="dark"]{…}`,
    ' * 생성기: scripts/sync-design.mjs (05 §12 — 목업 두 장도 같은 원본을 인라인한다)',
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
    `// 원본: ${SRC_TOKENS} → ${OUT_CSS} → 이 파일. 갱신: ${SYNC_CMD}`,
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
  const html = await readFile(path.join(ROOT, SRC_TOKENS), 'utf8');
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
      console.error('design:check 실패 — 디자인과 앱 토큰이 어긋났습니다 (05 §12 드리프트 게이트).');
      console.error(drifted.join('\n'));
      console.error(`\n고치는 법: ${SYNC_CMD} 를 돌리고 결과를 커밋하세요. 원본은 ${SRC_TOKENS} 입니다.`);
      process.exitCode = 1;
      return;
    }
    console.log(`design:check 통과 — ${files.length}개 생성물이 ${SRC_TOKENS} 와 바이트 단위로 일치합니다.`);
    return;
  }

  console.log(`원본: ${SRC_TOKENS} · ${SRC_MASCOT} (읽기 전용)`);
  if (log.length > 0) {
    console.log(`오버라이드 ${log.length}건 적용:`);
    for (const line of log) console.log(line);
  }

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
