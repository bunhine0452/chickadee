/**
 * **학습질 성질 게이트 셋** (D186 ③). 「완벽한 학습 소프트웨어」의 셋째 축을 재는 코드다.
 *
 * 재는 것 셋 —
 *   (ㄱ) **내 코드 비율** — 0장 판 중 내 리포의 자리를 짚는 판이 몇 할인가. 정본 §1 의
 *        「내 코드가 교재」가 숫자로 서는 유일한 자리다. 파서가 안 걸린 언어는 뺀다 (D187 ㉑).
 *   (ㄴ) **2단에 값 추적 판이 있다** — 연구의 tracing 은 값·상태 굴리기인데 앱의 2단 넷은
 *        전부 경로였다(D185 ③). `trace-table` 이 실제로 서는지, 못 서면 **사유가 남는지**.
 *   (ㄷ) **오답마다 진단이 계산된다** — 카탈로그 전 장에 `siblings`·`variants`·`langAlt`
 *        중 하나 이상. 하나도 없으면 그 사실이 판에 적혀야 한다 (D186 ④).
 *
 * **셋 다 수치를 표로 찍는다.** D181(줄 예산 폐지)·D184(0장 상한 폐지)가 택한 태도가
 * 「상수로 막지 말고 센서스로 보라」이고, 문턱은 상수가 아니라 `tests/gates/quality.allow.json`
 * 에 만료일과 함께 적는다 — 예외에 만료가 없으면 반년 뒤 규칙 자체가 무력해진다(06 §2).
 *
 * **vitest 에서만 돈다.** 사전 번들이 Vite 의 `import.meta.glob` 으로 만들어져 Playwright
 * 로더에서는 열리지 않는다 — `build-seed.ts` 가 같은 벽에 부딪힌 자리다(D108). 브라우저
 * 게이트(`tests/gates/quality.spec.ts`)는 이 파일을 **자식 프로세스로** 돌려 그 결과를 읽는다.
 */
import { createRequire } from 'node:module';

import { zeroChapterPlates, type ZeroChapterPlate } from '@chickadee/concepts';
import { isLinkedGrammar, loadDict, type Dict } from '@chickadee/dictionary';
import type BetterSqlite3 from 'better-sqlite3';

import {
  buildAllValueItems, fundCensus, FUND_AXES, FUND_LANGS,
  type FundAxis, type FundDiagnosis,
} from '../../packages/cards/src/fundamentals.js';
import { buildLadderTrace, buildTraces } from '../../packages/cards/src/trace-table.js';
import type { StageBlock, StageFile, StageRequest } from '../../packages/cards/src/stage-types.js';
import { buildSeed } from './build-seed.js';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

/** 시드 리포 하나. `projectox` 는 덤프가 `blocks.json` 뿐이라 0장을 못 세운다 — 그것도 사실이다. */
export interface SeedSpec {
  name: string;
  lang: string;
  /** 덤프가 모자라 이 시드로는 못 재는 것. 표에 그대로 찍힌다. */
  note: string | null;
}

export const SEEDS: readonly SeedSpec[] = [
  { name: 'tiny', lang: 'ts', note: null },
  { name: 'projectox', lang: 'java', note: '덤프가 `blocks.json` 하나뿐이라 사용처가 없다 (`fixtures/ipc/projectox`)' },
];

// ───────── (ㄱ) 내 코드 비율 ─────────

export interface MyCodeRow {
  seed: string;
  lang: string;
  grammarLinked: boolean;
  plates: number;
  mine: number;
  synthetic: number;
  share: number | null;
  note: string | null;
}

/** 0장 판을 시드의 원장에서 세운다 — `zeroChapterPlates` 를 앱과 같은 입력으로 부른다. */
function zeroPlatesOf(db: BetterSqlite3.Database, dict: Dict, lang: string): ZeroChapterPlate[] {
  const meta = dict.langs.get(lang);
  if (meta === undefined) return [];
  const best = new Map<string, { siteId: number; unknown: number; lineStart: number; lineEnd: number }>();
  const rows = db.prepare(
    `SELECT concept_id AS c, id, unknown_count AS u, line_start AS a, line_end AS b
       FROM concept_site WHERE is_alive = 1 ORDER BY unknown_count ASC, id ASC`,
  ).all() as { c: string; id: number; u: number; a: number; b: number }[];
  for (const r of rows) {
    if (!best.has(r.c)) best.set(r.c, { siteId: r.id, unknown: r.u, lineStart: r.a, lineEnd: r.b });
  }
  return zeroChapterPlates({
    essential: meta.essential,
    prereqOf: (id) => dict.concepts.get(id)?.prereq ?? [],
    bestSiteOf: (id) => best.get(id) ?? null,
  });
}

// ───────── (ㄴ) 2단 값 추적 ─────────

export interface TraceRow {
  where: string;
  attempted: number;
  baked: number;
  missingWithReason: number;
  missingWithoutReason: number;
  note: string | null;
}

/**
 * 시드의 캡처 발췌로 줄을 되세운다.
 *
 * 시드에는 **원문이 없다** — 픽스처 리포가 없어 `build-seed.ts` 가 맥락 줄을 못 읽는다.
 * 그래서 이 게이트가 재는 것은 「이 시드로 값 추적 판이 구워지나」가 아니라
 * **「구워지거나, 못 구운 사유가 남거나」**다. 사유 없는 침묵이 D186 ④ 가 막으려는 것이다.
 */
function linesOf(db: BetterSqlite3.Database, fileId: number): { n: number; t: string }[] {
  const rows = db.prepare(
    `SELECT start_line AS n, excerpt AS t FROM capture WHERE file_id = ? ORDER BY start_line, LENGTH(excerpt) DESC`,
  ).all(fileId) as { n: number; t: string }[];
  const byLine = new Map<number, string>();
  for (const r of rows) if (!byLine.has(r.n)) byLine.set(r.n, r.t.split('\n')[0] ?? '');
  return [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([n, t]) => ({ n: n + 1, t }));
}

function traceRowOf(db: BetterSqlite3.Database, dict: Dict, seed: SeedSpec): TraceRow {
  const blocks = db.prepare(
    `SELECT b.id, b.file_id AS fileId, f.path, f.grammar, b.name, b.line_start AS a,
            b.line_end AS z, b.text_hash AS hash
       FROM block b JOIN file f ON f.id = b.file_id WHERE b.is_alive = 1 ORDER BY b.id`,
  ).all() as {
    id: number; fileId: number; path: string; grammar: string; name: string;
    a: number; z: number; hash: string;
  }[];
  if (blocks.length === 0) {
    return {
      where: seed.name, attempted: 0, baked: 0,
      missingWithReason: 0, missingWithoutReason: 0, note: '시드에 블록이 없다',
    };
  }

  const files = new Map<string, StageFile>();
  const stageBlocks: StageBlock[] = [];
  for (const b of blocks) {
    if (!files.has(b.path)) {
      files.set(b.path, { fileId: b.fileId, path: b.path, grammar: b.grammar, lines: linesOf(db, b.fileId) });
    }
    stageBlocks.push({
      path: b.path, blockId: b.id, name: b.name, ast: null, grammar: b.grammar,
      hash: b.hash, window: { from: b.a, to: b.z }, concepts: [],
    });
  }
  const paths = [[...new Set(blocks.map((b) => b.path))].map((path, i) => ({
    path, line: 1, kind: 'call' as const, order: i,
  }))];

  const req = {
    repoId: 1, unitId: 1, unitName: seed.name, dictVersion: 'q', attempt: 0,
    files, paths, edges: [], concepts: dict.concepts, blocks: stageBlocks,
  } as unknown as StageRequest;

  const { cards, drops } = buildTraces(req);
  const baked = cards.length;
  const missing = baked > 0 ? 0 : 1;
  const withReason = drops.filter((d) => d.reason.trim() !== '').length > 0 ? missing : 0;
  return {
    where: seed.name, attempted: 1, baked,
    missingWithReason: withReason, missingWithoutReason: missing - withReason,
    note: null,
  };
}

// ───────── (ㄷ) 진단 커버리지 ─────────

export interface DiagRow {
  lang: string;
  items: number;
  siblings: number;
  variants: number;
  langAlt: number;
  none: number;
  byAxis: Record<FundAxis, number>;
}

// ───────── 한 벌 ─────────

export interface QualityReport {
  myCode: MyCodeRow[];
  /** 파서가 걸린 언어만 모은 비율. 게이트가 재는 수다. */
  myCodeShare: number | null;
  trace: TraceRow[];
  /** 0부 사다리로 값 추적 판이 서는 언어 수. 코스 배선과 무관하게 오늘 서는 판이다. */
  ladderLangs: number;
  diag: DiagRow[];
  diagTotal: Record<FundDiagnosis, number>;
  catalogItems: number;
  /** 축마다 식이 셋에 못 미치는 자리. `sql/assignment` 처럼 사유가 있는 것은 예외 목록에 있다. */
  axisGaps: string[];
}

export async function runQualityCensus(): Promise<QualityReport> {
  const dict = loadDict();
  const myCode: MyCodeRow[] = [];
  const trace: TraceRow[] = [];

  for (const seed of SEEDS) {
    // 파서 없는 언어는 뺀다 (D187 ㉑) — 캡처가 0곳이라 「내 코드」를 짚을 자리가 아예 없고,
    // 그 0 을 분모에 넣으면 게이트가 **커리큘럼의 결정을 결함으로** 읽는다.
    const grammars = dict.langs.get(seed.lang)?.grammars ?? [];
    const linked = grammars.some((g) => isLinkedGrammar(g));

    // 재료가 없다고 적힌 시드는 **굽지 않는다.** `buildSeed` 는 `fixtures/ipc/tiny` 하나를
    // 굽는 함수라, 여기서 부르면 다른 시드의 이름으로 tiny 의 수를 세게 된다 — 없는 커버리지를
    // 있는 것처럼 만드는 짓이다. 사유만 표에 남긴다.
    if (seed.note !== null) {
      myCode.push({
        seed: seed.name, lang: seed.lang, grammarLinked: linked,
        plates: 0, mine: 0, synthetic: 0, share: null, note: seed.note,
      });
      trace.push({
        where: seed.name, attempted: 0, baked: 0,
        missingWithReason: 0, missingWithoutReason: 0, note: seed.note,
      });
      continue;
    }

    const out = `${process.env['TMPDIR'] ?? '/tmp/'}chickadee-quality-${seed.name}.sqlite`;
    // 시드를 굽는 손은 하나다 — 게이트가 자기 원장을 따로 만들면 재는 것이 앱이 아니게 된다.
    await buildSeed(Database, out);
    const db = new Database(out);
    const plates = zeroPlatesOf(db, dict, seed.lang);
    const mine = plates.filter((p) => p.siteId !== null).length;
    myCode.push({
      seed: seed.name, lang: seed.lang, grammarLinked: linked,
      plates: plates.length, mine, synthetic: plates.length - mine,
      share: plates.length === 0 ? null : mine / plates.length,
      note: null,
    });
    trace.push(traceRowOf(db, dict, seed));
    db.close();
  }

  const counted = myCode.filter((r) => r.grammarLinked && r.share !== null);
  const totalPlates = counted.reduce((a, r) => a + r.plates, 0);
  const totalMine = counted.reduce((a, r) => a + r.mine, 0);

  const census = fundCensus();
  const axisGaps: string[] = [];
  for (const L of census.langs) {
    for (const axis of FUND_AXES) if (L.byAxis[axis] < 3) axisGaps.push(`${L.lang}/${axis}`);
  }

  return {
    myCode,
    myCodeShare: totalPlates === 0 ? null : totalMine / totalPlates,
    trace,
    ladderLangs: FUND_LANGS.filter((l) => buildLadderTrace(l).length > 0).length,
    diag: census.langs.map((L) => ({
      lang: L.lang, items: L.items,
      siblings: L.diagnosis.siblings, variants: L.diagnosis.variants,
      langAlt: L.diagnosis.langAlt, none: L.diagnosis.none, byAxis: L.byAxis,
    })),
    diagTotal: census.diagnosis,
    catalogItems: buildAllValueItems().length,
    axisGaps,
  };
}

// ───────── 표 (D181 센서스 태도 — 통과해도 찍는다) ─────────

const pct = (x: number | null): string => (x === null ? '   —  ' : `${(100 * x).toFixed(1).padStart(5)}%`);
const pad = (s: string | number, n: number): string => String(s).padEnd(n);
const num = (s: string | number, n: number): string => String(s).padStart(n);

export function renderQuality(r: QualityReport): string {
  const out: string[] = [];
  out.push('(ㄱ) 내 코드 비율 — 0장 판 중 내 리포의 자리를 짚는 판');
  out.push(`     ${pad('시드', 12)}${pad('언어', 7)}${pad('파서', 5)}${num('판', 5)}${num('내 코드', 8)}${num('합성', 6)}   비율`);
  for (const m of r.myCode) {
    out.push(`     ${pad(m.seed, 12)}${pad(m.lang, 7)}${pad(m.grammarLinked ? '있음' : '없음', 5)}`
      + `${num(m.plates, 5)}${num(m.mine, 8)}${num(m.synthetic, 6)}  ${pct(m.share)}`
      + (m.note === null ? '' : `   — ${m.note}`));
  }
  out.push(`     합(파서 있는 언어만) ${pct(r.myCodeShare)}`);
  out.push('');
  out.push('(ㄴ) 2단 값 추적 판');
  out.push(`     ${pad('자리', 12)}${num('시도', 5)}${num('구움', 5)}${num('사유 있음', 10)}${num('사유 없음', 10)}`);
  for (const t of r.trace) {
    out.push(`     ${pad(t.where, 12)}${num(t.attempted, 5)}${num(t.baked, 5)}${num(t.missingWithReason, 10)}${num(t.missingWithoutReason, 10)}`
      + (t.note === null ? '' : `   — ${t.note}`));
  }
  out.push(`     0부 사다리로 값 추적 판이 서는 언어 ${r.ladderLangs}/10`);
  out.push('');
  out.push(`(ㄷ) 오답 진단 커버리지 — 카탈로그 ${r.catalogItems}장`);
  out.push(`     ${pad('언어', 8)}${num('장', 5)}${num('형제', 6)}${num('다른 판', 8)}${num('다른 규칙', 10)}${num('없음', 6)}`);
  for (const d of r.diag) {
    out.push(`     ${pad(d.lang, 8)}${num(d.items, 5)}${num(d.siblings, 6)}${num(d.variants, 8)}${num(d.langAlt, 10)}${num(d.none, 6)}`);
  }
  out.push(`     합 ${pad('', 5)}${num(r.catalogItems, 5)}${num(r.diagTotal.siblings, 6)}`
    + `${num(r.diagTotal.variants, 8)}${num(r.diagTotal.langAlt, 10)}${num(r.diagTotal.none, 6)}`);
  out.push(`     축마다 식 셋 미만인 자리: ${r.axisGaps.length === 0 ? '없음' : r.axisGaps.join(' · ')}`);
  return out.join('\n');
}
