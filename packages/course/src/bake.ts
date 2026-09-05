/**
 * 코스 카드 굽기 — 원장과 생성기 사이 (D172 ①).
 *
 * 챕터(=기능 대지) 하나의 재료를 statement 로 긷고(`loadMaterials`), 순수 조립
 * (`assembleStageRequest`)을 거쳐 생성기(`buildCourseCards`, D164)에 넘기고, 나온 판을
 * `card.insert_stage` 로 넣는다. 같은 `content_hash` 는 `ON CONFLICT DO NOTHING` 이라 증분
 * 인제스트가 같은 챕터를 다시 굽지 않는다 — `changes` 가 0 이면 건너뛴 것이다.
 *
 * 사용처 없는 개념(규약 `proto/` · 프레임워크 `spring/` · 기계 `cs/`)은 `bakeSiteless` 가 같은
 * 재료 위에서 굽는다 — D154 가 연 큐 가지에 카드가 든다. 도는 네임스페이스는
 * `COMPUTED_NAMESPACES` 하나가 정한다(D176) — 자기 생성기가 있는 셋만 뺀다.
 */
import {
  GEN_VERSION, buildCourseCards, genMeaning, isFailure, isTestPath, makeProtoCard,
} from '@chickadee/cards';
import type {
  FocusLine, LineWindow, SiteInput, StageDrop, StageEdge, StageSite, StageTestFile,
} from '@chickadee/cards';
import { COMPUTED_NAMESPACES, langOf, type Dict } from '@chickadee/dictionary';
import { ipc, type AstLite } from '@chickadee/ipc-client';
import { astLiteSchema, fromConceptSiteRow, type ConceptId, type StageNo } from '@chickadee/store-sql';
import { fnv1a32 } from '@chickadee/text';

import { borrowedInput, evidenceBlock, lenders, pickLender, type LenderSite } from './borrow.js';
import { lineDiff } from './diff.js';
import { hopRanges, mergeRanges, toMethodHops, trunkHops, type LineRange } from './hops.js';
import {
  AST_MAX_BLOCKS, AST_MAX_LINES, FULL_READ_MAX, RANGE_PAD, assembleStageRequest, astGrammar,
  type BindingRow, type BlockRow, type ColumnRow, type FileText, type Materials,
} from './materials.js';
import type { Hop, MethodHop, StageCommit } from './deps.js';

export interface BakeDeps {
  repoId: number;
  rootPath: string;
  dict: Dict;
  now: number;
  /** 다시 찍기마다 +1 (04 §2.3). 처음은 0. */
  attempt?: number;
}

export interface StageTally {
  stageNo: StageNo;
  /** 새로 들어간 판. */
  baked: number;
  /** 같은 해시가 이미 있어 건너뛴 판. */
  skipped: number;
  byType: Record<string, number>;
}

export interface ChapterBake {
  unitId: number;
  unitName: string;
  stages: StageTally[];
  dropped: StageDrop[];
}

export interface SitelessBake {
  proto: number;
  cs: number;
  skipped: number;
  /** 네임스페이스별로 새로 들어간 판. `proto`·`cs` 는 여기서 뽑은 값이다. */
  byNamespace: Record<string, number>;
  /** 빌릴 창이 없어 못 구운 개념 — 결함이 아니라 cs.md §2 ③ 이다. */
  noWindow: string[];
}

/**
 * 사용처 없는 개념을 이 파일이 굽는 네임스페이스 (D176). `COMPUTED_NAMESPACES` 가 단일 출처이고,
 * **자기 생성기가 따로 있는 셋만 뺀다** — `exec/` 는 `t0-exec` 이 실행 사실에서 굽고, `common/`·
 * `arch/` 는 언어 개념의 `universal` 축이 나른다. 네임스페이스가 늘면 여기를 다시 안 고친다.
 */
const SELF_BAKED = new Set(['common/', 'arch/', 'exec/']);
export const SITELESS_NAMESPACES: readonly string[] = COMPUTED_NAMESPACES
  .filter((ns) => !SELF_BAKED.has(ns)).map((ns) => ns.slice(0, -1));

/** 4단 정답지로 볼 커밋 수. 실측에서 fix 커밋은 기능당 한 자리다. */
const FIX_COMMITS = 20;
/** 커밋 두 판을 읽는 상한(줄). 넘으면 그 파일의 diff 는 내지 않는다. */
const DIFF_MAX_LINES = 3_000;
/**
 * 클래스 머리 창의 줄 수 상한 (D176). 줄기의 칸은 **메서드 본문**이라 클래스·필드에 붙은
 * 애너테이션이 그 창 밖이다 — 실측(MonggleMonggle): `spring/` 15개 중 근거 낱말이 메서드
 * 본문에서 걸리는 것은 3개뿐이고 11개는 `@Service`·`@RequiredArgsConstructor`·`@Mapper` 처럼
 * 첫 메서드 앞에만 있다. 그래서 첫 칸 앞의 창을 블록으로 하나 더 세운다.
 */
const HEAD_MAX_LINES = 60;
/** 판정용 테스트로 읽어 둘 리포 테스트 파일 수·크기 상한 (D180). 스프링 리포의 테스트는 짧다. */
const TEST_FILES_MAX = 40;
const TEST_LINES_MAX = 600;

/** 앱의 `session-flow.ts` 와 같은 값 — 언어별 사전 판을 이름순으로 잇는다. */
export function dictVersionOf(dict: Dict): string {
  return [...dict.langs.values()].map((l) => `${l.lang}@${l.version}`).sort().join(' ');
}

const isoDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

async function readRange(
  rootPath: string, relPath: string, from: number, to: number, rev?: string,
): Promise<FocusLine[]> {
  try {
    const chunk = await ipc.file.readLines({ rootPath, relPath, from, to, ...(rev === undefined ? {} : { rev }) });
    return chunk.lines.map((t, i) => ({ n: chunk.from + i, t }));
  } catch {
    // 파일이 사라졌거나 못 읽는다 — 그 파일의 문항이 빠질 뿐 굽기는 계속된다.
    return [];
  }
}

interface FileRow { id: number; path: string; grammar: string | null; line_count: number }

/** 파일 하나를 통째로, 또는 범위만. 이미 읽은 것과 합친다. */
async function readInto(
  texts: Map<string, FileText>, rootPath: string, file: FileRow, ranges: readonly LineRange[] | 'all',
): Promise<void> {
  const have = texts.get(file.path);
  const lines = new Map<number, string>();
  for (const l of have?.lines ?? []) lines.set(l.n, l.t);
  const wanted: LineRange[] = ranges === 'all'
    ? [{ path: file.path, from: 1, to: Math.max(1, file.line_count) }]
    : mergeRanges(ranges.filter((r) => r.path === file.path));
  for (const r of wanted) {
    if ([...Array(r.to - r.from + 1).keys()].every((k) => lines.has(r.from + k))) continue;
    for (const l of await readRange(rootPath, file.path, r.from, r.to)) lines.set(l.n, l.t);
  }
  texts.set(file.path, {
    path: file.path, fileId: file.id, grammar: file.grammar, lineCount: file.line_count,
    lines: [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([n, t]) => ({ n, t })),
  });
}

async function astOf(
  block: { id: number; ast_json: string | null }, grammar: string, text: string,
): Promise<AstLite | null> {
  if (block.ast_json !== null) {
    const parsed = astLiteSchema.safeParse(JSON.parse(block.ast_json));
    if (parsed.success) return parsed.data as AstLite;
  }
  try {
    const result = await ipc.parse.snippet({ grammar, text });
    if (result.hadError) return null;
    await ipc.store.exec('block.ast_set', { id: block.id, astJson: JSON.stringify(result.ast) });
    return result.ast;
  } catch {
    return null;
  }
}

/** 챕터의 재료 전부. */
export async function loadMaterials(deps: BakeDeps, unitId: number, unitName: string): Promise<Materials> {
  const { repoId, rootPath, dict } = deps;
  const all: FileRow[] = await ipc.store.query('derive.files', { repoId });
  const byId = new Map(all.map((f) => [f.id, f]));
  const byPath = new Map(all.map((f) => [f.path, f]));
  const mine = (await ipc.store.query('t2.unit_files', { repoId, unitId }))
    .filter((r) => r.in_unit === 1).map((r) => r.id);
  const mineSet = new Set(mine);

  // 줄기 — 등뼈는 문항으로, 곁가지까지의 줄 범위는 읽기로.
  const method: MethodHop[][] = [];
  for (const p of await ipc.store.query('path.list_by_unit', { unitId })) {
    method.push(toMethodHops(await ipc.store.query('path.hops', { pathId: p.id })));
  }
  const paths: Hop[][] = method.map(trunkHops).filter((h) => h.length >= 2);
  const ranges = hopRanges(method, RANGE_PAD);
  const pathFiles = new Set(ranges.map((r) => r.path));

  // 파일 — 작은 것은 통째, 큰 것은 칸 근처만. 매퍼·DDL 은 늘 통째(문항이 첫머리의 resultMap 을 본다).
  const texts = new Map<string, FileText>();
  const smallOrData = (f: FileRow): boolean =>
    f.line_count <= FULL_READ_MAX || /\.(xml|sql)$/i.test(f.path);
  for (const id of mine) {
    const f = byId.get(id);
    if (f === undefined) continue;
    await readInto(texts, rootPath, f, smallOrData(f) ? 'all' : ranges);
  }
  for (const path of pathFiles) {
    const f = byPath.get(path);
    if (f === undefined || texts.has(path)) continue;
    await readInto(texts, rootPath, f, smallOrData(f) ? 'all' : ranges);
  }

  // 간선 · 사용처 (챕터 파일 안).
  const ids = JSON.stringify(mine);
  const edges: StageEdge[] = (await ipc.store.query('t2.edges', { repoId, ids }))
    .flatMap((e) => {
      const from = byId.get(e.from_file_id)?.path;
      const to = byId.get(e.to_file_id)?.path;
      return from === undefined || to === undefined ? [] : [{ from, to, kind: e.kind as StageEdge['kind'] }];
    });
  const sites: StageSite[] = (await ipc.store.query('card.sites_in_files', { repoId, fileIds: ids }))
    .map((row) => ({ site: fromConceptSiteRow(row), path: row.path }));

  // 블록 — 줄기 위 파일만, AST 는 작은 것부터 상한까지.
  const blocks: BlockRow[] = [];
  let parsed = 0;
  for (const path of [...pathFiles].sort()) {
    const f = byPath.get(path);
    const text = texts.get(path);
    if (f === undefined || text === undefined) continue;
    const grammar = astGrammar(f.grammar);
    for (const b of await ipc.store.query('block.by_file', { fileId: f.id })) {
      const span = text.lines.filter((l) => l.n >= b.line_start && l.n <= b.line_end);
      const complete = span.length === b.line_end - b.line_start + 1;
      let ast: AstLite | null = null;
      if (grammar !== null && complete && span.length <= AST_MAX_LINES && parsed < AST_MAX_BLOCKS) {
        ast = await astOf(b, grammar, span.map((l) => l.t).join('\n'));
        parsed += 1;
      }
      blocks.push({
        path, blockId: b.id, name: b.name === '' ? null : b.name, from: b.line_start, to: b.line_end,
        hash: b.text_hash, ast,
      });
    }
  }

  // 겹 — 블록의 개념 목록이 쓴다.
  const layer = new Map<string, number>();
  for (const m of await ipc.store.query('review.mastery_all', {})) layer.set(m.concept_id, m.layer);

  // 스키마 — 열↔필드와 DDL 줄. 엔티티·DDL 파일은 챕터 밖이어도 읽는다(작다).
  const bindings: BindingRow[] = [];
  for (const b of await ipc.store.query('schema.bindings', { repoId })) {
    if (!mineSet.has(b.file_id)) continue;
    const entity = b.entity_file_id === null ? undefined : byId.get(b.entity_file_id);
    if (entity !== undefined && !texts.has(entity.path) && entity.line_count <= FULL_READ_MAX) {
      await readInto(texts, rootPath, entity, 'all');
    }
    bindings.push({
      path: b.path, line: b.line, column: b.column_name, property: b.property, entity: b.entity,
      entityPath: entity?.path ?? null, table: b.table_name,
    });
  }
  const columns: ColumnRow[] = [];
  const wantedTables = new Set(bindings.flatMap((b) => (b.table === null ? [] : [b.table])));
  for (const t of await ipc.store.query('schema.tables', { repoId })) {
    if (!wantedTables.has(t.name)) continue;
    const ddl = byId.get(t.file_id);
    if (ddl !== undefined && !texts.has(ddl.path) && ddl.line_count <= FULL_READ_MAX) {
      await readInto(texts, rootPath, ddl, 'all');
    }
    for (const c of await ipc.store.query('schema.columns', { tableId: t.id })) {
      columns.push({ table: t.name, column: c.name, path: t.path, line: c.line });
    }
  }

  // 커밋 — fix 커밋의 두 판을 읽어 hunk 를 낸다.
  const commits: StageCommit[] = [];
  for (const c of await ipc.store.query('card.fix_commits', { repoId, unitId, limit: FIX_COMMITS })) {
    if (c.parent_sha === null) continue;
    const files: StageCommit['files'][number][] = [];
    for (const cf of await ipc.store.query('t2.commit_files', { commitId: c.id })) {
      // 경로 위 파일 + 그 커밋이 같이 고친 테스트 파일. 뒤엣것이 판정용 테스트의 첫 갈래다 (D180 ③ⓐ).
      if (cf.status !== 'M') continue;
      if (!pathFiles.has(cf.path) && !isTestPath(cf.path)) continue;
      const f = byPath.get(cf.path);
      if (f === undefined || f.line_count > DIFF_MAX_LINES) continue;
      const before = await readRange(rootPath, cf.path, 1, DIFF_MAX_LINES, c.parent_sha);
      const after = await readRange(rootPath, cf.path, 1, DIFF_MAX_LINES, c.sha);
      if (before.length === 0 || after.length === 0) continue;
      const hunks = lineDiff(before.map((l) => l.t), after.map((l) => l.t));
      if (hunks.length > 0) files.push({ path: cf.path, hunks });
    }
    if (files.length > 0) commits.push({ id: c.id, sha: c.sha, date: isoDate(c.authored_at), message: c.message, files });
  }

  // 리포의 테스트 파일 — 이름이 맞는 것을 4·5단 판정지로 쓴다 (D180 ③ⓑ). 통째로 읽는다.
  const tests: StageTestFile[] = [];
  for (const f of all.filter((x) => isTestPath(x.path)).slice(0, TEST_FILES_MAX)) {
    if (f.line_count > TEST_LINES_MAX) continue;
    const lines = await readRange(rootPath, f.path, 1, TEST_LINES_MAX);
    if (lines.length === 0) continue;
    tests.push({ path: f.path, text: lines.map((l) => l.t).join('\n') });
  }

  return {
    repoId, unitId, unitName, dictVersion: dictVersionOf(dict), attempt: deps.attempt ?? 0,
    concepts: dict.concepts, files: [...texts.values()], paths, edges, sites, blocks, bindings, columns, commits,
    tests,
    layerOf: (id) => layer.get(id) ?? 0,
  };
}

/** 한 챕터를 굽는다. 이미 있는 판은 건너뛴다. */
export async function bakeChapter(deps: BakeDeps, unitId: number, unitName?: string): Promise<ChapterBake> {
  const name = unitName ?? (await ipc.store.query('chapter.list', { repoId: deps.repoId }))
    .find((c) => c.unit_id === unitId)?.name ?? String(unitId);
  const materials = await loadMaterials(deps, unitId, name);
  const req = assembleStageRequest(materials);
  const stages: StageTally[] = [];
  const dropped: StageDrop[] = [];
  for (const result of buildCourseCards(req)) {
    const tally: StageTally = { stageNo: result.stageNo, baked: 0, skipped: 0, byType: {} };
    for (const card of result.cards) {
      const info = await ipc.store.exec('card.insert_stage', {
        repoId: deps.repoId, unitId, track: card.track, kind: card.kind, conceptId: card.conceptId, level: 1,
        // 생성기의 자리표(음수)는 원장에 없는 행이다 — 외래키가 깨지므로 NULL 로 (D137 과 같은 규칙).
        siteId: card.siteId !== null && card.siteId > 0 ? card.siteId : null,
        fileId: card.fileId, commitId: card.commitId, payloadJson: JSON.stringify(card.payload),
        genVersion: GEN_VERSION, contentHash: card.contentHash, createdAt: deps.now, stageNo: card.stageNo,
      });
      if (info.changes > 0) {
        tally.baked += 1;
        tally.byType[card.type] = (tally.byType[card.type] ?? 0) + 1;
      } else {
        tally.skipped += 1;
      }
    }
    stages.push(tally);
    dropped.push(...result.dropped);
  }
  return { unitId, unitName: name, stages, dropped };
}

/** 코스 전부 — `chapter.list` 순서(= `unit.order_idx`, 챕터 번호)대로. */
export async function bakeCourse(deps: BakeDeps): Promise<ChapterBake[]> {
  const out: ChapterBake[] = [];
  for (const c of await ipc.store.query('chapter.list', { repoId: deps.repoId })) {
    out.push(await bakeChapter(deps, c.unit_id, c.name));
  }
  return out;
}

/** 판이 한 장도 없는 챕터면 굽는다. 화면이 챕터를 열 때 부른다 — 있으면 `null`. */
export async function ensureChapterBaked(deps: BakeDeps, unitId: number): Promise<ChapterBake | null> {
  const counts = await ipc.store.query('card.stage_counts', { unitId });
  if (counts.some((c) => c.n > 0)) return null;
  return bakeChapter(deps, unitId);
}

async function insertT0(
  deps: BakeDeps, card: { kind: string; conceptId: string; payload: unknown; contentHash: string }, fileId: number | null,
): Promise<boolean> {
  const info = await ipc.store.exec('card.insert', {
    repoId: deps.repoId, unitId: null, track: 't0', kind: card.kind, conceptId: card.conceptId, level: 1,
    siteId: null, fileId, commitId: null, payloadJson: JSON.stringify(card.payload),
    genVersion: GEN_VERSION, contentHash: card.contentHash, createdAt: deps.now,
  });
  return info.changes > 0;
}

/**
 * 사용처 없는 개념의 판 (D172 ⑤ · D176). 갈래는 **개념이 든 재료**가 정한다 — 근거 낱말이
 * 있으면 그 낱말이 보이는 블록이 자리이고(`proto/`·`spring/`), 낱말도 없으면 자기를 선행으로
 * 가리키는 언어 개념의 창을 빌린다(`cs/`). 둘 다 `track = 't0'` 이라 D154 의 큐 가지가 집는다.
 */
export async function bakeSiteless(deps: BakeDeps): Promise<SitelessBake> {
  const { repoId, rootPath, dict } = deps;
  const out: SitelessBake = { proto: 0, cs: 0, skipped: 0, byNamespace: {}, noWindow: [] };
  const bump = (id: string): void => {
    const ns = langOf(id) ?? '?';
    out.byNamespace[ns] = (out.byNamespace[ns] ?? 0) + 1;
  };
  const all: FileRow[] = await ipc.store.query('derive.files', { repoId });
  const byPath = new Map(all.map((f) => [f.path, f]));
  const byId = new Map(all.map((f) => [f.id, f]));
  const base = { repoId, dictVersion: dictVersionOf(dict), attempt: deps.attempt ?? 0, concepts: dict.concepts, ly: 0 };
  const mine = new Set(SITELESS_NAMESPACES);

  // 줄기의 칸이 곧 블록이다. 리포 전체 줄기를 한 번만 읽는다 — 두 갈래가 같이 쓴다.
  const hops: MethodHop[][] = [];
  for (const p of await ipc.store.query('path.list_by_repo', { repoId })) {
    hops.push(toMethodHops(await ipc.store.query('path.hops', { pathId: p.id })));
  }
  const seen = new Set<string>();
  const blocks: { path: string; window: LineWindow; lines: FocusLine[]; hash: string }[] = [];
  for (const chain of hops) {
    for (const h of chain) {
      const key = `${h.path}:${h.lineStart}-${h.lineEnd}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const lines = await readRange(rootPath, h.path, h.lineStart, h.lineEnd);
      if (lines.length > 0) blocks.push({ path: h.path, window: { from: h.lineStart, to: h.lineEnd }, lines, hash: String(fnv1a32(key)) });
    }
  }

  // 클래스 머리 — 첫 칸 앞. 프레임워크의 근거 낱말은 메서드 본문이 아니라 여기 붙는다.
  const firstHop = new Map<string, number>();
  for (const chain of hops) {
    for (const h of chain) {
      const at = firstHop.get(h.path);
      if (at === undefined || h.lineStart < at) firstHop.set(h.path, h.lineStart);
    }
  }
  for (const [path, start] of [...firstHop.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (start <= 1) continue;
    const to = start - 1;
    const from = Math.max(1, to - HEAD_MAX_LINES + 1);
    const lines = await readRange(rootPath, path, from, to);
    if (lines.length > 0) blocks.push({ path, window: { from, to }, lines, hash: String(fnv1a32(`${path}:head:${from}-${to}`)) });
  }

  // 갈래 ①  **근거 낱말**이 있는 개념 — 그 낱말이 보이는 블록이 자리다 (`proto/`·`spring/`).
  const baked = new Set<string>();
  const evidenced = [...dict.concepts.values()]
    .filter((c) => mine.has(langOf(c.id) ?? '') && c.evidence.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const concept of evidenced) {
    const block = evidenceBlock(concept, blocks);
    if (block === null) continue;
    const made = makeProtoCard({ ...base, concept, lines: block.lines, path: block.path, window: block.window, blockHash: block.hash });
    if (isFailure(made)) continue;
    baked.add(concept.id);
    const ok = await insertT0(deps, made.card, byPath.get(block.path)?.id ?? null);
    if (ok) bump(concept.id); else out.skipped += 1;
  }

  // 갈래 ②  낱말도 없는 개념 — 자기를 선행으로 가리키는 언어 개념의 창을 **빌린다** (`cs/`).
  for (const ns of SITELESS_NAMESPACES) {
    for (const [target, langIds] of lenders(dict.concepts, ns)) {
      const concept = dict.concepts.get(target);
      if (concept === undefined || baked.has(target)) continue;
      const candidates: LenderSite[] = [];
      for (const lenderId of langIds.slice(0, 6)) {
        for (const row of await ipc.store.query('card.sites_for_concept', { repoId, conceptId: lenderId, limit: 3 })) {
          candidates.push({ conceptId: lenderId, site: fromConceptSiteRow(row), path: row.path });
        }
      }
      const lender = pickLender(candidates);
      if (lender === null) { out.noWindow.push(target); continue; }
      const file = byId.get(lender.site.fileId);
      const enclosing = file === undefined ? undefined : (await ipc.store.query('block.by_file', { fileId: file.id }))
        .filter((b) => b.line_start <= lender.site.lineStart && lender.site.lineStart <= b.line_end)
        .sort((a, b) => (a.line_end - a.line_start) - (b.line_end - b.line_start))[0];
      const win: LineWindow | undefined = enclosing === undefined ? undefined : { from: enclosing.line_start, to: enclosing.line_end };
      const from = Math.max(1, Math.min(win?.from ?? lender.site.lineStart, lender.site.lineStart - 4));
      const to = Math.max(win?.to ?? lender.site.lineStart, lender.site.lineStart + 4);
      const lines = await readRange(rootPath, lender.path, from, to);
      if (lines.length === 0) { out.noWindow.push(target); continue; }
      const input: SiteInput = borrowedInput(target, lender, lines, win);
      const made = genMeaning({ ...base, concept, sites: [input] }, input);
      if (isFailure(made)) continue;
      baked.add(target);
      const ok = await insertT0(deps, made.card, lender.site.fileId);
      if (ok) bump(target); else out.skipped += 1;
    }
  }

  out.proto = out.byNamespace['proto'] ?? 0;
  out.cs = out.byNamespace['cs'] ?? 0;
  return out;
}

export type { ConceptId };
