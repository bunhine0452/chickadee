#!/usr/bin/env node
/**
 * shoot-screens.mjs — 화면 전수 스크린샷 (D186 ② · 정본 §10).
 *
 * 「디자인이 이상하지 않다」를 사람이 한 번에 보게 만드는 자리다. 게이트 일곱은 **재는 것만**
 * 잡는다 — 넘침·대비·활자·모션·글자·장식·토큰. 「이상하다」의 나머지(무게가 안 맞는다 ·
 * 밝게와 어둡게가 다른 화면처럼 보인다 · 새 판이 옛 판과 다른 손으로 그려졌다)는 아무 자도
 * 못 잰다. 그래서 전수를 찍어 한 폴더에 모으고, README 가 격자로 색인한다.
 *
 *   node --import tsx scripts/shoot-screens.mjs            전부 다시 찍는다
 *   node --import tsx scripts/shoot-screens.mjs --only home,shelf
 *   node --import tsx scripts/shoot-screens.mjs --list     목록만 낸다(찍지 않는다)
 *
 * 하네스는 `tests/support/**` 와 **같은 것**이다: 페이지의 `window.__ipc` → Node 의
 * better-sqlite3(`.seed/ui.sqlite` 사본). 게이트와 다른 화면을 찍으면 그림이 게이트를
 * 대신하지 못한다.
 *
 * 시드에 없는 판(코스 5단 `order`·2단 `trace-table` 처럼 tiny 시드가 굽지 못하는 것)은
 * **합성으로 띄운다** — `card` 행을 그 자리에서 넣고 `chapter.stage_reached` 를 올린다.
 * 화면·채점기는 손대지 않으므로 그림에 찍히는 것은 진짜 판이다.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

import { makeAppDb } from '../tests/support/app-db.js';
import { NOW } from '../tests/support/build-seed-const.js';
import { installInternals } from '../tests/support/internals.js';

/* ───────── 조합 (D186 ② — 720·1440·2560 × 밝게·어둡게) ───────── */

/** 720 은 1440 모니터의 반쪽, 2560 은 27인치 전체. 1440 이 그 사이의 보통 폭이다. */
export const WIDTHS = [720, 1440, 2560];
export const THEMES = ['light', 'dark'];

/** 세로는 하나다 — 높이가 만드는 깨짐은 `responsive.spec.ts` 가 600 에서 따로 잰다. */
const HEIGHT = 900;

/** 세로로 긴 화면도 이 높이에서 자른다. 안 자르면 2560 폭 목차 한 장이 3 MB 가 된다. */
const MAX_SHOT_H = 2000;

export const SHOTS_DIR = 'design/system/shots';
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

export const shotName = (id, theme, w) => `${id}-${theme}-${w}.png`;

/* ───────── 다리 ───────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 움직이는 것이 하나도 안 남을 때까지 (`tests/support/gates.ts` 의 `settled` 와 같다). */
const settled = (page) => page.waitForFunction(() => document.getAnimations()
  .every((a) => a.playState !== 'running' && a.playState !== 'pending'));

async function stable(page) {
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
  await page.evaluate(() => new Promise((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r(undefined)));
  }));
}

/** `?dev=1` 로 들어가 첫 화면이 그려질 때까지. */
async function gotoDev(page) {
  await page.goto(`${BASE}/?dev=1`);
  await page.locator('main.shell:not([aria-busy="true"]), .masthead, .firstrun').first().waitFor();
  await stable(page);
}

/** 홈의 「학습 시작」. 마우스를 쓰지 않는다 — 게이트와 같은 손이다. */
async function startSession(page) {
  const start = page.getByRole('button', { name: /학습 시작|이어 풀기/ });
  await start.waitFor();
  await start.focus();
  await page.keyboard.press('Enter');
  await page.locator('article.ps').waitFor();
  await stable(page);
}

const answerKey = (app) => {
  const row = app.db.prepare(
    `SELECT c.payload_json AS p FROM session_item i JOIN card c ON c.id = i.card_id
      WHERE i.session_id = (SELECT MAX(id) FROM session)
        AND i.status IN ('pending','active') AND c.track = 't0' ORDER BY i.pos LIMIT 1`,
  ).get();
  if (row === undefined) throw new Error('안 끝난 T0 판이 없다');
  return JSON.parse(row.p).answer + 1;
};

async function submit(page, sel) {
  await page.keyboard.press(`Digit${sel}`);
  await page.keyboard.press('Enter');
  await page.locator('.fb.on').waitFor();
  await stable(page);
}

/** `Tab` 으로 그 선택자에 닿는다. 마우스를 안 쓰는 것이 이 하네스의 규약이다. */
async function tabTo(page, selector, limit = 40) {
  for (let i = 0; i < limit; i += 1) {
    if (await page.evaluate((sel) => document.activeElement?.matches(sel) === true, selector)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab 으로 ${selector} 에 닿지 못했다`);
}

/** 지금 판이 T2 지도 판이면 상자 하나를 골라 채점하고 참을 돌려준다 (D140). */
async function passT2Plate(page) {
  if (await page.locator('.map .nd').count() === 0) return false;
  await page.locator('.map .nd').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
  await tabTo(page, '.map .nd');
  await page.keyboard.press('Enter');
  await tabTo(page, '.acts .press-btn');
  await page.keyboard.press('Enter');
  await page.locator('.map .nd.missed, .map .nd.ok, .map .nd.wrong').first().waitFor();
  await stable(page);
  return true;
}

/** 다음 판으로. 판이 실제로 바뀔 때까지 기다린다. */
async function nextPlate(page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  await stable(page);
}

/** 서가 (D119). 마스트헤드 스위처를 열고 목록 끝의 「전부 보기」로. */
async function toShelf(page) {
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
  await page.locator('main.shelf ul.shelf-list li, main.shelf p.shelf-empty').first().waitFor();
  await stable(page);
}

/**
 * 원문 읽기를 답해 준다 — 픽스처 리포는 디스크에 없다. 코스·클론이 이 명령 하나로
 * 「원문을 못 읽었다」에 떨어지므로 화면을 보려면 여기가 필요하다
 * (`responsive.spec.ts` 의 `toCourse` 와 같은 손이다).
 */
async function stubFileRead(page) {
  await page.addInitScript((chunk) => {
    const win = window;
    const inner = win.__TAURI_INTERNALS__.invoke.bind(win.__TAURI_INTERNALS__);
    win.__TAURI_INTERNALS__.invoke = (cmd, args) => (cmd === 'file_read_lines'
      ? Promise.resolve(JSON.parse(JSON.stringify(chunk)))
      : inner(cmd, args));
  }, {
    relPath: 'src/core/cart.ts', rev: null, from: 1, to: SRC.length,
    lines: SRC, totalLines: SRC.length, hadInvalidUtf8: false,
  });
}

/** 코스 화면 (D171). 마스트헤드의 「코스」가 그 문이다 — 서가의 「코스 열기」는 클론 코스다. */
async function toCourse(page, app) {
  app.db.prepare(
    `UPDATE file SET line_count =
       (SELECT COALESCE(MAX(b.line_end), 0) FROM block b WHERE b.file_id = file.id)
     WHERE line_count = 0`,
  ).run();
  await stubFileRead(page);
  await gotoDev(page);
  await page.getByRole('button', { name: /^코스$/ }).first().click();
  await page.locator('main.cc .cc-toc, main.cc .cc-empty').first().waitFor();
  await stable(page);
}

/** 클론 코스 (D120). 서가 카드의 「코스 열기」가 그 문이다. */
async function toClone(page, app) {
  app.db.prepare(
    `UPDATE file SET line_count =
       (SELECT COALESCE(MAX(b.line_end), 0) FROM block b WHERE b.file_id = file.id)
     WHERE line_count = 0`,
  ).run();
  await stubFileRead(page);
  await gotoDev(page);
  await toShelf(page);
  await page.getByRole('button', { name: /코스 열기$/ }).first().click();
  await page.locator('main.clone .ctoc-part, main.clone .clone-empty, .clone-err, main').first().waitFor();
  await stable(page);
}

/* ───────── 합성 판 (시드에 없는 유형) ───────── */

const SRC = [
  'export function totalOf(items: Item[]): number {',
  '  let total = 0;',
  '  for (const item of items) {',
  '    if (item.removed) continue;',
  '    total += item.price * item.count;',
  '  }',
  '  return total;',
  '}',
];

/** `CodeLine` 은 `{n, t}` 다 (`schemas.ts` `codeLineSchema`). */
const codeLines = (focus) => SRC.map((t, i) => ({ n: i + 1, t, ...(i + 1 === focus ? { target: true } : {}) }));

const FILE = 'src/core/cart.ts';

/**
 * 합성 판 여덟. **payload 는 스키마를 그대로 통과하는 진짜 모양**이라 화면·채점기를 한 줄도
 * 안 고친다 — 그림에 찍히는 것은 진짜 판이고, 다른 것은 이 payload 를 누가 만들었나뿐이다.
 * `card.kind` 는 `stage-types.ts` 의 `KIND_OF` 표를 그대로 따른다(형식 둘은 값을 빌린다).
 */
const PLATES = {
  exec: {
    stage: 2, kind: 'point',
    payload: {
      track: 't0', kind: 'point', file: FILE, focus: 5, lines: codeLines(5),
      q: '합계가 실제로 늘어나는 줄은 어디입니까?',
      hint: '고르는 것은 보기가 아니라 **코드 줄**입니다 — 창 안의 줄을 누릅니다.',
      answer: 4,
      why: [null, null, null, null,
        { t: '`+=` 는 왼쪽에 있던 값에 더해서 다시 담습니다.' }, null, null, null],
      ok: '`+=` 는 「지금 값에 더해서 다시 담는다」입니다.',
      rule: '복합 대입은 읽기 한 번 · 쓰기 한 번입니다.',
      prereq: [], uses: [], promptLines: SRC.slice(0, 6),
    },
  },
  hop: {
    stage: 2, kind: 'flow',
    payload: {
      track: 't2', kind: 'flow', q: '「합계」 요청은 어느 파일을 차례로 지나갑니까?',
      hint: '화살표는 언제나 가져다 쓴다(import) 방향입니다.',
      bands: [{ l: '화면', s: 'src/' }, { l: '기능', s: 'src/cart/' }, { l: '동작', s: 'src/core/' },
        { l: '공용', s: 'src/util/' }],
      files: [{ p: 'src/cart/CartPage.tsx', r: 0 }, { p: 'src/cart/useCart.ts', r: 1 },
        { p: 'src/core/cart.ts', r: 2 }, { p: 'src/util/money.ts', r: 3 }],
      edges: [['src/cart/CartPage.tsx', 'src/cart/useCart.ts', 'static'],
        ['src/cart/useCart.ts', 'src/core/cart.ts', 'static'],
        ['src/core/cart.ts', 'src/util/money.ts', 'static']],
      core: {}, sec: {}, trap: {}, hints: [],
      flow: {
        answer: ['src/cart/CartPage.tsx', 'src/cart/useCart.ts', 'src/core/cart.ts'],
        deck: ['src/core/cart.ts', 'src/cart/CartPage.tsx', 'src/util/money.ts', 'src/cart/useCart.ts'],
      },
    },
  },
  caller: {
    stage: 2, kind: 'radius',
    payload: {
      track: 't2', kind: 'radius', q: '«src/core/cart.ts» 를 바꾸면 어느 파일이 영향을 받나요?',
      hint: '지도에서 파일 상자를 눌러 고릅니다.',
      bands: [{ l: '화면', s: 'src/' }, { l: '기능', s: 'src/cart/' }, { l: '동작', s: 'src/core/' },
        { l: '공용', s: 'src/util/' }],
      files: [{ p: 'src/cart/CartPage.tsx', r: 0 }, { p: 'src/cart/useCart.ts', r: 1 },
        { p: 'src/core/cart.ts', r: 2 }, { p: 'src/util/money.ts', r: 3 }],
      edges: [['src/cart/CartPage.tsx', 'src/cart/useCart.ts', 'static'],
        ['src/cart/useCart.ts', 'src/core/cart.ts', 'static'],
        ['src/core/cart.ts', 'src/util/money.ts', 'static']],
      core: { 'src/cart/useCart.ts': ['부른다', '합계를 여기서 가져온다'] },
      sec: { 'src/cart/CartPage.tsx': ['건너 부른다', '훅을 거쳐 닿는다'] },
      trap: { 'src/util/money.ts': '이 파일이 부르는 쪽입니다 — 방향이 반대입니다.' },
      hints: [],
    },
  },
  'trace-table': {
    stage: 2, kind: 'flow',
    payload: {
      track: 't3', kind: 'trace', stage: 2,
      q: '각 줄이 돌고 난 뒤 total 과 item 의 값을 채우세요.',
      hint: '빈 칸만 채우면 됩니다 — 바뀐 칸만 비워 두었습니다.',
      file: FILE, lines: codeLines(5),
      cols: [{ k: 'total', axis: 'var', t: 'number' }, { k: 'item', axis: 'obj', t: 'Item' }],
      rows: [{ k: 'r1', line: 2, t: '초기화' }, { k: 'r2', line: 5, t: '첫 바퀴' },
        { k: 'r3', line: 5, t: '둘째 바퀴' }, { k: 'r4', line: 7, t: '반환 직전' }],
      cells: [
        { r: 'r1', c: 'total', v: { t: 'int', v: '0' }, carry: null },
        { r: 'r1', c: 'item', v: { t: 'none', accept: ['없음', '-'] }, carry: null },
        { r: 'r2', c: 'total', v: { t: 'int', v: '1200' }, carry: null },
        { r: 'r2', c: 'item', v: { t: 'box', label: '사과', accept: ['사과'] }, carry: null },
        { r: 'r3', c: 'total', v: { t: 'int', v: '3200' }, carry: null },
        { r: 'r3', c: 'item', v: { t: 'box', label: '우유', accept: ['우유'] }, carry: null },
        { r: 'r4', c: 'total', v: { t: 'int', v: '3200' }, carry: 'r3' },
        { r: 'r4', c: 'item', v: { t: 'box', label: '우유', accept: ['우유'] }, carry: 'r3' },
      ],
      hidden: ['r2|total', 'r3|total', 'r3|item'],
      ok: '`+=` 가 도는 동안 상자는 하나이고 값만 갈립니다.',
      rule: '반복은 이름을 새로 만들지 않습니다 — 같은 상자를 다시 씁니다.',
      promptLines: SRC,
    },
  },
  cut: {
    stage: 3, kind: 'cut',
    payload: {
      track: 't3', kind: 'cut', stage: 3, file: FILE, focus: 4, lines: codeLines(4),
      q: '4번 줄을 지우면 무엇이 달라집니까?',
      hint: '지운 줄이 막고 있던 것을 먼저 보세요.',
      options: [{ t: '지운 항목까지 합계에 들어간다' }, { t: '합계가 언제나 0 이 된다' },
        { t: '아무것도 달라지지 않는다' }, { t: '반복이 한 바퀴만 돈다' }],
      answer: 0,
      why: [null, { t: '`total` 은 다른 줄에서 더해집니다.' },
        { t: '`continue` 가 막던 항목이 들어옵니다.' }, { t: '`continue` 는 반복을 끝내지 않습니다.' }],
      ok: '`continue` 는 이번 바퀴만 건너뜁니다.',
      rule: '조건 안의 흐름 제어는 「무엇을 빼는가」로 읽습니다.',
      promptLines: SRC,
    },
  },
  repair: {
    stage: 4, kind: 'repair',
    payload: {
      track: 't3', kind: 'repair', type: 'patch-line', stage: 4,
      q: '지운 항목이 합계에 섞여 들어갑니다. 한 줄을 고치세요.',
      file: FILE, grammar: 'typescript', goal: '지운 항목을 합계에서 뺀다',
      commit: { h: '9f2c1ab', d: '2026-02-18', m: 'fix: 지운 항목이 합계에 섞이던 것' },
      lines: SRC, from: 1, target: 3, expected: ['    if (item.removed) continue;'],
      promptLines: SRC,
    },
  },
  'reimpl-spec': {
    stage: 5, kind: 'reimpl',
    payload: {
      track: 't3', kind: 'reimpl', type: 'reimpl-spec', stage: 5,
      file: FILE, grammar: 'typescript', fn: 'totalOf', original: SRC, from: 1,
      signature: ['export function totalOf(items: Item[]): number'],
      mustHold: [
        { text: '지운 항목(`removed`)은 합계에 들어가지 않는다', source: 'dict', anchor: [4] },
        { text: '금액은 `price × count` 다', source: 'ast', anchor: [5] },
      ],
      links: [], context: [], question: '같은 계약을 지키는 함수를 백지에서 써 보세요.',
      promptLines: SRC, blockId: null,
    },
  },
  order: {
    stage: 5, kind: 'reorder',
    payload: {
      track: 't3', kind: 'order', stage: 5,
      q: '합계를 구하는 걸음을 차례대로 놓으세요.',
      hint: '먼저 있어야 하는 것이 무엇인지부터 봅니다.',
      pieces: [
        { id: 'a', t: '합계 상자를 0 으로 만든다', fact: '`total` 은 더하기 전에 있어야 한다' },
        { id: 'b', t: '항목을 하나씩 꺼낸다', fact: '반복은 상자가 선 뒤에 돈다' },
        { id: 'c', t: '지운 항목이면 건너뛴다', fact: '거르기는 더하기 앞이다' },
        { id: 'd', t: '금액을 합계에 더한다', fact: '더하기는 거르기 뒤다' },
        { id: 'e', t: '합계를 돌려준다', fact: '반환은 반복이 끝난 뒤다' },
      ],
      answer: ['a', 'b', 'c', 'd', 'e'],
      deck: ['c', 'e', 'a', 'd', 'b'],
      ok: '상자를 세우고 · 돌면서 거르고 · 더하고 · 돌려줍니다.',
      rule: '누적은 「상자 → 반복 → 거르기 → 더하기 → 반환」의 다섯 걸음입니다.',
      promptLines: SRC,
    },
  },
};

/**
 * 판 한 장을 챕터의 한 단에 심는다. 열은 `card.insert_stage` 가 쓰는 것 그대로다 —
 * `card.kind` 는 CHECK 목록 안의 이름을 빌리고(`stage-types.ts` §5), 화면은 `payload.kind`
 * 로 갈리므로 두 뜻이 안 섞인다.
 */
function plantCard(app, unitId, spec, tag) {
  const repo = app.db.prepare('SELECT id FROM repo LIMIT 1').get();
  const concept = app.db.prepare('SELECT id FROM concept ORDER BY id LIMIT 1').get();
  app.db.prepare(
    `INSERT INTO card (repo_id, unit_id, track, kind, concept_id, level, payload_json,
                       gen_version, content_hash, created_at, stage_no)
     VALUES (?, ?, 't3', ?, ?, 1, ?, 1, ?, ?, ?)`,
  ).run(repo.id, unitId, spec.kind, concept.id, JSON.stringify(spec.payload),
    `shot-${tag}`, NOW, spec.stage);
}

/** 판을 심을 챕터. 시드에 챕터가 하나뿐이라 고를 것이 없다. */
function pickUnit(app) {
  const row = app.db.prepare('SELECT unit_id AS id FROM chapter ORDER BY unit_id LIMIT 1').get();
  if (row === undefined) throw new Error('챕터가 없다 — 시드에 코스가 안 구워졌다');
  return row.id;
}

/**
 * 심은 판을 화면에서 연다. 「다음 단」은 `stage_reached + 1` 이라 그 값을 한 단 낮춘다 —
 * 화면·판정은 그대로 두고 **원장만** 그 자리에 세운다.
 */
async function openPlanted(page, app, type) {
  const spec = PLATES[type];
  const unitId = pickUnit(app);
  app.db.prepare('DELETE FROM card WHERE unit_id = ? AND stage_no = ?').run(unitId, spec.stage);
  plantCard(app, unitId, spec, type);
  app.db.prepare(
    'UPDATE chapter SET stage_reached = ?, deferred_day = NULL, due_at = NULL WHERE unit_id = ?',
  ).run(spec.stage - 1, unitId);
  await toCourse(page, app);
  await page.locator('main.cc .cc-rowbtn').first().click();
  await page.getByRole('button', { name: /단 .*시작/ }).first().click();
  await page.locator('.course-run article.ps').waitFor();
  await stable(page);
}

/* ───────── 무엇이 무엇을 그리나 ───────── */

/**
 * 유형 열여덟 → 그것을 **그리는 판 일곱** (`StageOverlay.tsx` 의 분기 그대로).
 *
 * 전수 스크린샷이 재는 것은 유형이 아니라 **모양**이다 — `cut`·`reorder`·`contract` 는
 * 같은 `ChoicePlate` 를 다른 문항으로 채운 것이라 셋을 다 찍어도 사람이 보는 것은 한 장이다.
 * 대신 `stage-types.ts` 의 유형이 하나라도 늘면 이 표에 자리가 없어 게이트가 걸린다.
 */
export const RENDERER_OF = {
  point: 'choice', twin: 'choice', blank: 'choice', exec: 'choice',
  origin: 'choice', cut: 'choice', reorder: 'choice', contract: 'choice',
  hop: 'hop', caller: 'caller', 'trace-table': 'trace-table', order: 'order',
  'patch-line': 'repair', 'patch-place': 'repair', rollback: 'repair',
  'reimpl-spec': 'reimpl', 'reimpl-layer': 'reimpl', handoff: 'reimpl',
};

/**
 * 아직 못 찍는 것과 **그 이유**. 목록에서 빼지 않는다 (D186 ④ 정직성) — 빼면 다음 사람이
 * 「전수」를 다 봤다고 믿는다. `tests/gates/shots.spec.ts` 가 이 표를 읽어, 사유가 없는
 * 빈자리는 통과시키지 않는다.
 */
export const NOT_SHOT = [
  {
    what: '그림 일곱 (진열대)',
    why: '`packages/ui/src/dev/Gallery.tsx` 가 **어느 화면에도 마운트되지 않는다** — 앱 어디에서도 '
      + '`Diagram`·`BitField`·`EvalTree` 를 부르지 않아 그림이 화면에 오른 적이 없다. 띄울 문을 '
      + 'S1 이 내면(`?gallery=1`) 여기에 한 줄만 더하면 된다.',
  },
  {
    what: 'T1 필사 (`transcribe`) — 편집기 · 채점 카드 · 어긋난 줄',
    why: 'tiny 시드에 `block` 행이 없어 T1 판이 큐에 안 선다(`gates.ts` `T1_SKIP`). 합성으로 '
      + '띄우려면 Monaco 모델과 원본 블록이 함께 있어야 해서 판 하나가 아니라 화면 한 벌이다.',
  },
  {
    what: '값 · 걸음 · 표 (`value`·`step`·`table`)',
    why: '`CardPayload` 에 그 셋의 모양이 없다 — `fundamentals.md` §6 이 설계했고 마이그레이션 '
      + '(`0010`)이 서면 생긴다. 없는 판을 찍을 수는 없다.',
  },
];

/* ───────── 화면 목록 (D186 ② — 이 표가 README 첫 절의 원본이다) ───────── */

/**
 * `group` 은 README 격자의 묶음이고 `note` 는 그 화면이 무엇을 보이는가다.
 * `open` 이 없는 항목은 **아직 못 찍는 화면**이고 `why` 가 그 이유를 적는다 —
 * 목록에서 빼지 않는 이유는 정직성(D186 ④)이다.
 */
export const SCREENS = [
  {
    id: 'firstrun', name: '첫 실행', group: '화면', route: 'first-run',
    note: '리포가 0개일 때. 언어 고르기 + 「프로그래밍이 처음인가요」 한 문항.',
    open: async (page, app) => {
      app.db.pragma('foreign_keys = OFF');
      app.db.prepare('DELETE FROM repo').run();
      app.db.pragma('foreign_keys = ON');
      await page.goto(`${BASE}/?dev=1`);
      await page.locator('.firstrun').waitFor();
      await stable(page);
    },
  },
  {
    id: 'ingest', name: '리포 추가 — 읽는 중', group: '화면', route: 'ingest',
    note: '시간 비례 큐 하나로 진행을 말한다. 스피너 없음(정본 §3-7).',
    open: async (page) => {
      await page.addInitScript(() => {
        const win = window;
        const inner = win.__TAURI_INTERNALS__.invoke.bind(win.__TAURI_INTERNALS__);
        win.__TAURI_INTERNALS__.invoke = (cmd, args) => {
          if (cmd === 'plugin:dialog|open') return Promise.resolve('/w/repos/cart-api');
          // 새 폴더는 디스크에 없다 — 하네스가 던지는 자리를 여기서 답해 준다.
          if (cmd === 'repo_probe' && args?.path === '/w/repos/cart-api') {
            return Promise.resolve({ rootPath: args.path, fingerprint: 'shot-fp', headCommit: null });
          }
          if (cmd === 'ingest_start') {
            // 진행만 흘리고 끝내지 않는다 — 「읽는 중」이 이 화면의 그림이다.
            setTimeout(() => {
              void inner('plugin:event|emit', {
                event: 'ingest_progress',
                payload: { phase: 'parse', done: 128, total: 402, currentRelPath: 'src/core/cart.ts' },
              });
            }, 60);
            return Promise.resolve({ jobId: 'shot-job' });
          }
          return inner(cmd, args);
        };
      });
      await gotoDev(page);
      await toShelf(page);
      await page.getByRole('button', { name: /리포 등록|폴더 고르기|추가/ }).first().click();
      await page.locator('main.ingest').waitFor({ timeout: 20_000 });
      await page.locator('.ingest-now code').waitFor({ timeout: 20_000 }).catch(() => undefined);
      await stable(page);
    },
  },
  {
    id: 'home', name: '홈 — 대지 · 색인 띠', group: '화면', route: 'home',
    note: '오늘 할 것 한 장 + 구멍 목록 + 대지. 한 화면에 primary 하나.',
    open: async (page) => { await gotoDev(page); },
  },
  {
    id: 'shelf', name: '서가', group: '화면', route: 'repos',
    note: '등록된 리포 카드. 넓어지면 단이 는다(`.l-cols`).',
    open: async (page) => { await gotoDev(page); await toShelf(page); },
  },
  {
    id: 'settings', name: '설정', group: '화면', route: 'settings',
    note: '예산 · 시간대 · 모양 · 사전 언어 · 키. 옆 패널 + 본문 두 단.',
    open: async (page) => {
      await gotoDev(page);
      await page.getByRole('button', { name: /^설정$/ }).first().click();
      await page.locator('main.settings').waitFor();
      await stable(page);
    },
  },
  {
    id: 'course-toc', name: '코스 — 챕터 목차', group: '화면', route: 'course',
    note: '부 · 챕터 · 진도. 왼쪽 목차 + 오른쪽 패널.',
    open: async (page, app) => { await toCourse(page, app); },
  },
  {
    id: 'clone-course', name: '클론 코스 — 파일 목차', group: '화면', route: 'clone',
    note: '리포 하나를 순서대로 필사하는 모드(D120). 코스와 다른 화면이다.',
    open: async (page, app) => { await toClone(page, app); },
  },

  {
    id: 't0-ask', name: '0장 판 — 미답', group: '세션 오버레이',
    note: '교정쇄 한 장: 물음 · 코드 창 · 보기 · 빈 판정란.',
    open: async (page) => { await gotoDev(page); await startSession(page); },
  },
  {
    id: 't0-right', name: '0장 판 — 정답 판정란', group: '세션 오버레이',
    note: '판정란이 미리 비워 둔 자리에 들어온다 — 위 글이 0px 도 안 밀린다.',
    open: async (page, app) => {
      await gotoDev(page);
      await startSession(page);
      await submit(page, answerKey(app));
      if (await page.locator('.lifer-note').count() > 0) await stable(page);
    },
  },
  {
    id: 't0-wrong', name: '0장 판 — 오답 판정란', group: '세션 오버레이',
    note: '오답은 빨간 면이 아니라 왼쪽 선과 낱말이다(정본 §3-1).',
    open: async (page, app) => {
      await gotoDev(page);
      await startSession(page);
      const n = await page.locator('.choices .ch').count();
      await submit(page, (answerKey(app) % Math.max(1, n)) + 1);
    },
  },
  {
    id: 't0-ladder', name: '사다리 열림', group: '세션 오버레이',
    note: '「?」로 여는 4단 재인쇄 사다리. 판 위에 겹치지 않고 아래로 선다.',
    open: async (page) => {
      await gotoDev(page);
      await startSession(page);
      await page.keyboard.press('Shift+Slash');
      await page.locator('.reprint').waitFor();
      await page.keyboard.press('Enter');
      await page.locator('.reprint [role="tabpanel"], .rung-body').first().waitFor();
      await stable(page);
    },
  },
  {
    id: 't0-leave', name: '이탈 확인 (Esc)', group: '세션 오버레이',
    note: 'Esc 네 겹의 마지막 — 나갈지 묻는 자리.',
    open: async (page) => {
      await gotoDev(page);
      await startSession(page);
      await page.keyboard.press('Escape');
      await stable(page);
    },
  },
  {
    id: 't2-map', name: '구조 판 — 영향 반경 지도', group: '세션 오버레이',
    note: '보기 번호가 없는 판. 파일 상자를 골라 답한다 — 지도가 화면에서 가장 큰 요소다.',
    open: async (page, app) => {
      await gotoDev(page);
      await startSession(page);
      for (let left = 8; left > 0; left -= 1) {
        if (await page.locator('.map .nd').count() > 0) break;
        if (await page.locator('.fb.on').count() === 0) await submit(page, answerKey(app));
        await nextPlate(page);
      }
      await page.locator('.map .nd').first().waitFor();
      await stable(page);
    },
  },
  {
    id: 'summary', name: '학습 요약', group: '세션 오버레이',
    note: '오늘 걸은 판 · 다음 인쇄일. 숫자와 막대가 진도를 말한다.',
    open: async (page, app) => {
      await gotoDev(page);
      await startSession(page);
      const done = page.locator('article.ps[aria-label="오늘 학습 완료"]');
      // 판 수를 상수로 두지 않는다 — 큐 길이는 시드가 정하고 오답이 한 장을 더 넣는다.
      for (let left = 14; left > 0 && await done.count() === 0; left -= 1) {
        if (await page.locator('.fb.on').count() === 0 && !(await passT2Plate(page))) {
          await submit(page, answerKey(app));
        }
        await nextPlate(page);
      }
      await done.waitFor({ timeout: 10_000 });
      await stable(page);
    },
  },
  {
    id: 'stage-exec', name: '코스 2단 — 실행 결과(exec)', group: '코스 판', renders: 'choice',
    note: '코드 창 + 보기 넷. 0장 판과 같은 재료로 서야 한다.',
    open: async (page, app) => { await openPlanted(page, app, 'exec'); },
  },
  {
    id: 'stage-hop', name: '코스 2단 — 경로 추적(hop)', group: '코스 판', renders: 'hop',
    note: '지도 모양을 빌린 판. 판 너비가 `wide` 다.',
    open: async (page, app) => { await openPlanted(page, app, 'hop'); },
  },
  {
    id: 'stage-caller', name: '코스 2단 — 부르는 쪽(caller)', group: '코스 판', renders: 'caller',
    note: '영향 반경 지도. 상자를 골라 답한다.',
    open: async (page, app) => { await openPlanted(page, app, 'caller'); },
  },
  {
    id: 'stage-trace-table', name: '코스 2단 — 값 추적 격자(trace-table)', group: '코스 판', renders: 'trace-table',
    note: '새 판 ①(D187 ⑱). 시간 × 열 격자 — 720 에서 표만 흐르고 문서는 안 밀려야 한다.',
    open: async (page, app) => { await openPlanted(page, app, 'trace-table'); },
  },
  {
    id: 'stage-cut', name: '코스 3단 — 예측 선택형(cut)', group: '코스 판', renders: 'choice',
    note: '선택형 다섯의 대표. 1·3단이 같은 모양을 쓴다.',
    open: async (page, app) => { await openPlanted(page, app, 'cut'); },
  },
  {
    id: 'stage-repair', name: '코스 4단 — 한 줄 수정(patch-line)', group: '코스 판', renders: 'repair',
    note: '코드 창 안의 그 줄만 입력칸이 된다. 실행 상태 넷이 여기 실린다.',
    open: async (page, app) => { await openPlanted(page, app, 'repair'); },
  },
  {
    id: 'stage-reimpl', name: '코스 5단 — 백지 재구현(reimpl-spec)', group: '코스 판', renders: 'reimpl',
    note: '가장 오래 머무는 자리. 사양 위 · 편집기 아래.',
    open: async (page, app) => {
      await openPlanted(page, app, 'reimpl-spec');
      // 편집기는 지연 로드다(Monaco 2.3 MB) — 안 기다리면 그 자리가 빈 채로 찍힌다.
      await page.locator('.editor.mono .mono-host, .editor.plain').first().waitFor({ timeout: 30_000 });
      await page.waitForTimeout(600);
      await stable(page);
    },
  },
  {
    id: 'stage-order', name: '코스 5단 — 순서 맞추기(order)', group: '코스 판', renders: 'order',
    note: '새 판 ②(D187 ⑱). 조각을 끌어 놓는 대신 자리를 눌러 넣는다.',
    open: async (page, app) => { await openPlanted(page, app, 'order'); },
  },
  {
    id: 'stage-stuck', name: '코스 판 — 막힘 패널', group: '코스 판',
    note: '「모르겠어요」가 여는 처방. 사다리와 같은 자리·같은 종이.',
    open: async (page, app) => {
      await openPlanted(page, app, 'cut');
      await page.getByRole('button', { name: '모르겠어요' }).first().click();
      await page.locator('.cc-stuck').waitFor();
      await stable(page);
    },
  },
  {
    id: 'stage-done', name: '코스 — 단 완료', group: '코스 판',
    note: '몇 문제 중 몇 개 · 통과 여부 · 다음 단. 낱말이 먼저고 색이 뒤다.',
    open: async (page, app) => {
      await openPlanted(page, app, 'cut');
      await page.locator('.choices .ch').first().click();
      await page.locator('.acts .press-btn').first().click();
      await page.locator('.fb.on').waitFor();
      await stable(page);
      await page.keyboard.press('Space');
      await page.locator('.cc-done').waitFor({ timeout: 15_000 });
      await stable(page);
    },
  },
];

/* ───────── 실행 ───────── */

async function ensureServer() {
  const up = await fetch(BASE).then(() => true, () => false);
  if (up) return () => undefined;
  const child = spawn('pnpm', ['--filter', '@chickadee/desktop', 'exec', 'vite', 'preview',
    '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i += 1) {
    if (await fetch(BASE).then(() => true, () => false)) return () => child.kill();
    await sleep(500);
  }
  child.kill();
  throw new Error(`vite preview 가 ${BASE} 에 안 떴다 — 먼저 \`pnpm build\` 를 돌려라`);
}

/** 한 화면 한 테마. 창만 바꿔 가며 폭 셋을 찍는다. */
async function shootOne(browser, screen, theme, out) {
  const app = makeAppDb();
  // 고른 값(`theme_mode`)과 계산된 값(`theme`)을 둘 다 못박는다 — D187 ⑫ 뒤로 기본이
  // 「시스템 따름」이라, 안 박으면 그림의 테마가 이 기계의 설정에 달린다.
  const setSetting = app.db.prepare(
    `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET value_json = excluded.value_json`,
  );
  setSetting.run('theme', JSON.stringify(theme), NOW);
  setSetting.run('theme_mode', JSON.stringify(theme), NOW);
  const context = await browser.newContext({
    viewport: { width: WIDTHS[0], height: HEIGHT },
    colorScheme: theme,
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.exposeFunction('__ipc', (cmd, args) => {
    try {
      return { ok: app.handle(cmd, args) };
    } catch (e) {
      return { err: { code: e?.code ?? 'UNKNOWN', message: String(e?.message), detail: null, retryable: false } };
    }
  });
  // tsx 가 컴파일한 함수는 `__name` 헬퍼를 참조한다. `addInitScript` 는 함수를 **문자열로**
  // 넘기므로 그 헬퍼가 페이지에 없으면 다리가 그 자리에서 죽는다 — 항등 함수 하나로 막는다.
  await page.addInitScript(() => { globalThis.__name = (f) => f; });
  await page.addInitScript(installInternals);
  await page.addInitScript(() => {
    const win = window;
    const raw = win.__ipc.bind(win);
    win.__ipc = async (cmd, args) => {
      const r = await raw(cmd, args);
      if (r.err !== undefined) throw r.err;
      return r.ok;
    };
  });
  // 부드러운 스크롤은 시간이 있는 움직임이라 그림에는 잡음이다. 자리는 그대로다.
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = '*, *::before, *::after { scroll-behavior: auto !important }';
    document.addEventListener('DOMContentLoaded', () => document.head.append(style));
  });

  try {
    await screen.open(page, app);
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: HEIGHT });
      await stable(page);
      // 오버레이가 서 있는 화면은 **창만** 찍는다. `fullPage` 는 문서 전체를 이어 붙이는데
      // `position: fixed` 인 판은 첫 창에만 그려지므로, 뒤에 남은 화면(`inert` 인 홈·코스)이
      // 그림 아래쪽에 딸려 나온다 — 있지도 않은 화면이 찍힌다.
      const over = await page.evaluate(() => document.querySelector('.proof') !== null);
      const h = await page.evaluate(() => Math.ceil(Math.max(
        document.documentElement.scrollHeight, document.body.scrollHeight,
      )));
      const clip = !over && h > MAX_SHOT_H ? { x: 0, y: 0, width: w, height: MAX_SHOT_H } : undefined;
      await page.screenshot({
        path: join(out, shotName(screen.id, theme, w)),
        ...(clip ? { clip } : { fullPage: !over }),
      });
    }
  } finally {
    await context.close();
    app.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const only = (argv.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length);
  const wanted = only === '' ? null : new Set(only.split(','));
  const list = SCREENS.filter((s) => s.open !== undefined && (wanted === null || wanted.has(s.id)));

  if (argv.includes('--list')) {
    for (const s of SCREENS) console.log(`${s.open ? ' ' : '!'} ${s.id.padEnd(16)} ${s.group.padEnd(12)} ${s.name}`);
    console.log(`\n화면 ${SCREENS.length} · 찍는 것 ${SCREENS.filter((s) => s.open).length} × ${THEMES.length} 테마 × ${WIDTHS.length} 폭 = ${SCREENS.filter((s) => s.open).length * 6} 장`);
    return;
  }

  if (!existsSync('.seed/ui.sqlite')) throw new Error('시드가 없다 — 먼저 `pnpm test:seed`');
  const out = join(process.cwd(), SHOTS_DIR);
  mkdirSync(out, { recursive: true });
  if (wanted === null) {
    for (const f of readdirSync(out)) if (f.endsWith('.png')) rmSync(join(out, f));
  }

  const stop = await ensureServer();
  const browser = await chromium.launch();
  const failed = [];
  try {
    for (const screen of list) {
      for (const theme of THEMES) {
        process.stdout.write(`${screen.id} · ${theme} … `);
        try {
          await shootOne(browser, screen, theme, out);
          console.log('ok');
        } catch (e) {
          console.log(`실패 — ${String(e?.message).split('\n')[0]}`);
          failed.push(`${screen.id}/${theme}: ${String(e?.message).split('\n')[0]}`);
        }
      }
    }
  } finally {
    await browser.close();
    stop();
  }
  const n = readdirSync(out).filter((f) => f.endsWith('.png')).length;
  console.log(`\n${n} 장을 ${SHOTS_DIR} 에 두었다.`);
  if (failed.length > 0) {
    console.error(`못 찍은 것 ${failed.length}건:\n  ${failed.join('\n  ')}`);
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith('shoot-screens.mjs')) await main();
