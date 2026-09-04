/**
 * 인제스트 한 바퀴 (01 §3.3 「TS 파생 층」). Rust 가 사실을 쓰고 나면 여기가 이어받는다.
 *
 * 화면이 보는 4단계는 Rust 의 `walk·parse·git·write` 2칸과 여기의 `derive`·`cards`
 * 2칸이다 (D47). 이 파일은 그중 `derive` 를 소유한다 — `cards` 는 M2.
 */
import { keyOf, kindOf, langOf, langSpecs, loadDict, type Dict } from '@chickadee/dictionary';
import { fnv1a64 } from '@chickadee/text';
import {
  ipc, log, on, type BatchOp, type Capture, type IngestDone, type IngestProgress, type JobId,
} from '@chickadee/ipc-client';

import { inBatches } from './batch.js';
import { type Identity } from './commits.js';
import { reclassifyCommits } from './identities.js';
import { deriveFile, type DerivedSite, type RawBlock } from './derive.js';
import { buildGaps, type CountableSite } from './gaps.js';
import { resolveImports, type FileImports } from './resolve-imports.js';
import { EXCLUDE_GLOBS, GENERATED_MARKERS, LIMITS } from './ingest-defaults.js';
import { assignUnits } from './units.js';
import { knownSet, unknownCount, type MasteryRow } from './unknown-rank.js';
import {
  ZERO_CHAPTER_ORDER, ZERO_CHAPTER_UNIT, shouldOpen as shouldOpenZeroChapter, zeroChapterPlates,
} from './zero-chapter.js';

/** `store_batch` 한 번의 상한 (01 §3.2). */

export type Phase = IngestProgress['phase'] | 'derive' | 'cards';

export interface IngestReport extends IngestDone {
  sites: number;
  gaps: number;
  units: number;
  /** 사전에서 건너뛴 파일 — 있으면 개발자 패널이 보여 준다. */
  dictProblems: number;
}

export interface IngestOptions {
  repoId: number;
  rootPath: string;
  mode: 'full' | 'incremental';
  sinceHead: string | null;
  /** 리포 `package.json` 의 의존성. 프레임워크 사전의 게이트다 (D59). */
  dependencies?: readonly string[];
  identities?: readonly Identity[];
  /**
   * 사용자가 더한 제외 글롭 (05 §2.1 · D122). 기본 목록을 **덮지 않고 덧붙인다** —
   * 비어 있는 설정이 「아무것도 제외하지 않는다」가 되면 `node_modules` 가 딸려 온다.
   */
  excludeGlobs?: readonly string[];
  now: number;
  /**
   * 진행 한 칸. `currentRelPath` 는 **지금 읽는 파일**이고 없을 수 있다 — Rust 의 `git` 단계는
   * 파일 단위가 아니라 커밋 단위라 그 자리를 비운다 (01 §3.1).
   */
  onProgress?: (phase: Phase, done: number, total: number, currentRelPath?: string) => void;
  onWarning?: (relPath: string, reason: string) => void;
  /**
   * 잡 id 가 정해지자마자 한 번. **취소는 이것 없이는 불가능하다** — `ingest_cancel` 이
   * id 를 요구하는데 그 값은 이 함수 안에서만 났다 (03 §1.8).
   */
  onJob?: (jobId: JobId) => void;
}

/**
 * 사전을 DB 에 물질화한다 — 개념 행이 있어야 사용처의 외래키가 선다.
 *
 * 네임스페이스는 `_lang.yaml` 이 있는 것만이 아니다: `common/`·`arch/` 는 개념만 있고
 * 문법에 매이지 않는다. 그래도 `concept.dict_version_id` 가 NOT NULL 이라 판 행은 필요하다.
 */
export async function materializeDict(dict: Dict, now: number): Promise<void> {
  const spaces = new Set([...dict.langs.keys(), ...[...dict.concepts.keys()].map(langOf)]);
  const ops: BatchOp[] = [...spaces].sort().map((lang) => {
    const meta = dict.langs.get(lang);
    return {
      name: 'derive.dict_version_upsert',
      params: {
        lang,
        version: meta?.version ?? '0',
        // 번들 사전은 빌드 산출물이라 파일 해시 대신 버전·ABI 로 식별한다.
        sha256: `${meta?.version ?? '0'}:${meta?.grammar_abi ?? 0}`,
        conceptCount: [...dict.concepts.keys()].filter((id) => langOf(id) === lang).length,
        loadedAt: now,
      },
    };
  });
  await inBatches(ops);

  const versionIds = new Map<string, number>();
  for (const lang of spaces) {
    const [row] = await ipc.store.query('derive.dict_version_id', {
      lang, version: dict.langs.get(lang)?.version ?? '0',
    });
    if (row) versionIds.set(lang, row.id);
  }

  // 보편 개념이 먼저다 — `concept.universal_id` 가 `concept(id)` 를 참조하므로
  // 언어 개념을 먼저 넣으면 외래키가 걸린다.
  const ordered = [...dict.concepts.values()].sort(
    (a, b) => Number(kindOf(a.id) === 'lang') - Number(kindOf(b.id) === 'lang')
      || a.id.localeCompare(b.id),
  );
  const writes: BatchOp[] = [];
  for (const concept of ordered) {
    const lang = langOf(concept.id);
    const dictVersionId = versionIds.get(lang);
    if (dictVersionId === undefined) continue;
    writes.push({
      name: 'derive.concept_upsert',
      params: {
        id: concept.id,
        lang,
        nameKo: concept.name.ko,
        token: concept.token,
        kind: kindOf(concept.id),
        universalId: concept.universal,
        trackDefault: concept.track_default,
        dictVersionId,
      },
    });
  }
  await inBatches(writes);

  // 선행은 개념이 전부 있고 난 뒤에 — 외래키가 양쪽을 요구한다.
  const edges: BatchOp[] = [];
  for (const concept of dict.concepts.values()) {
    edges.push({ name: 'derive.prereq_clear', params: { conceptId: concept.id } });
    for (const prereqId of concept.prereq) {
      if (!dict.concepts.has(prereqId)) continue;
      edges.push({ name: 'derive.prereq_insert', params: { conceptId: concept.id, prereqId } });
    }
  }
  await inBatches(edges);
}

/**
 * 리포 하나를 읽고 파생까지 끝낸다. 진행은 `onProgress` 로 나가고, 화면은 그것을
 * 시간 비례 큐로 그린다 (05 §2.1).
 */
export async function runIngest(options: IngestOptions): Promise<IngestReport> {
  const dict = loadDict({ dependencies: options.dependencies ?? [] });
  await materializeDict(dict, options.now);

  const stops: (() => void)[] = [];
  const done = await new Promise<IngestDone>((resolve, reject) => {
    void (async () => {
      stops.push(await on('ingest_progress', (p) => {
        options.onProgress?.(p.phase, p.done, p.total, p.currentRelPath);
      }));
      stops.push(await on('ingest_warning', (w) => {
        options.onWarning?.(w.relPath, w.reason);
      }));
      stops.push(await on('ingest_done', resolve));
      stops.push(await on('ingest_error', reject));
      const { jobId } = await ipc.ingest.start({
        repoId: options.repoId,
        rootPath: options.rootPath,
        mode: options.mode,
        sinceHead: options.sinceHead,
        langs: langSpecs(dict, LIMITS.maxFileBytes),
        maxCommits: LIMITS.maxCommits,
        maxFilesPerCommit: LIMITS.maxFilesPerCommit,
        maxFiles: LIMITS.maxFiles,
        maxLineBytes: LIMITS.maxLineBytes,
        excludeGlobs: [...EXCLUDE_GLOBS, ...(options.excludeGlobs ?? [])],
        generatedMarkers: [...GENERATED_MARKERS],
      });
      options.onJob?.(jobId);
    })().catch(reject);
  }).finally(() => {
    for (const stop of stops) stop();
  });

  const derived = await deriveRepo(dict, options);
  return { ...done, ...derived, dictProblems: dict.problems.length };
}

/** 캡처 → 사용처 → 대지 → 구멍. 취소된 인제스트 뒤에도 그대로 돈다. */
export async function deriveRepo(
  dict: Dict,
  options: IngestOptions,
): Promise<{ sites: number; blocks: number; edges: number; gaps: number; units: number }> {
  const { repoId, now } = options;
  const heuristic = new Set(
    [...dict.concepts.values()]
      .filter((c) => c.grammars.some((g) => dict.queries.get(keyOf(c.id, g))?.includes('#match?')))
      .map((c) => c.id),
  );
  const files = await ipc.store.query('derive.files', { repoId });
  // 증분이면 이번 실행이 손댄 파일만 다시 파생한다 (03 §1.6-4). Rust 가 바뀐 파일만
  // `file_upsert` 하므로 `updated_at` 이 곧 「이번에 바뀐 것」의 표시다.
  const target = options.mode === 'incremental'
    ? await ipc.store.query('derive.files_changed_since', { repoId, since: options.now })
    : files;
  let siteCount = 0;
  let blockCount = 0;
  let step = 0;
  const imports: FileImports[] = [];

  for (const file of target) {
    const captures = await ipc.store.query('derive.captures_by_file', { fileId: file.id });
    const result = deriveFile(
      file.path,
      captures.map(toCapture),
      (id) => (heuristic.has(id) ? 'heuristic' : 'syntactic'),
    );
    // 사전에 없는 개념의 캡처는 버린다 — 사전이 줄어들면 사용처도 줄어야 한다.
    const sites = result.sites.filter((s) => dict.concepts.has(s.conceptId));
    await writeSites(repoId, file, sites, now);
    await writeBlocks(repoId, file, result.blocks, now);
    // 지정자는 모아 두었다가 파일 집합이 다 모인 뒤 한 번에 푼다 — `./x` 가 어느 파일인지는
    // 그 파일이 인제스트에 들어왔는지를 알아야 답할 수 있다 (04 §7.1).
    imports.push({ path: file.path, imports: result.imports });
    blockCount += result.blocks.length;
    siteCount += sites.length;
    step += 1;
    options.onProgress?.('derive', step, target.length, file.path);
  }

  const edges = await writeEdges(repoId, files, imports, target.map((f) => f.id));
  await reclassifyCommits(repoId, options.identities ?? []);
  // 대지와 구멍은 리포 전체를 본다 — 증분이어도 「몇 파일 중 몇 곳」의 분모는 전체다.
  const units = await writeUnits(repoId, files);
  const gaps = await writeGaps(dict, repoId, files.length, now);
  return { sites: siteCount, blocks: blockCount, edges, gaps, units };
}

/**
 * import 지도 (02 `import_edge` · 04 §7.1).
 *
 * 해석은 **리포 전체 파일 집합**에 대고 한다 — 증분이라도 그렇다. 이번에 안 바뀐 파일이
 * 이번에 바뀐 파일을 가리킬 수 있고, 그 엣지는 여전히 유효하다. 다만 **쓰는 것**은 이번에
 * 다시 판 파일에서 나가는 엣지뿐이다: 안 바뀐 파일의 엣지를 지웠다 다시 넣으면 증분이
 * 전체 인제스트가 된다.
 */
async function writeEdges(
  repoId: number,
  files: readonly { id: number; path: string }[],
  imports: readonly FileImports[],
  touched: readonly number[],
): Promise<number> {
  const idOf = new Map(files.map((f) => [f.path, f.id]));
  const resolved = resolveImports({ paths: files.map((f) => f.path), files: imports });
  const mine = new Set(touched);

  // 다시 판 파일의 엣지를 먼저 지운다. 지정자가 하나도 안 남은 파일도 지워져야 하므로
  // 「해석 결과가 있는 파일」이 아니라 「이번에 판 파일」이 기준이다.
  const ops: BatchOp[] = [];
  for (const fileId of touched) ops.push({ name: 'derive.edge_clear', params: { fileId } });
  let unknown = 0;
  for (const edge of resolved) {
    const fromFileId = idOf.get(edge.from);
    const toFileId = idOf.get(edge.to);
    if (fromFileId === undefined || toFileId === undefined) {
      // 해석기가 `file` 행이 없는 경로를 냈다는 뜻이다. 엣지 하나 때문에 인제스트를 세우지는
      // 않되 조용히 넘어가지도 않는다 — 04 §7.1 의 go 처럼 노드 단위가 파일이 아닌 언어가
      // 들어오면 여기서 전부 사라지고, 개수를 안 세면 그것을 눈치챌 방법이 없다.
      unknown += 1;
      continue;
    }
    if (!mine.has(fromFileId)) continue;
    ops.push({
      name: 'derive.edge_insert',
      params: { repoId, fromFileId, toFileId, kind: edge.kind, confidence: edge.confidence },
    });
  }
  // 경로는 싣지 않는다 (01 §6) — 개수만 남긴다.
  if (unknown > 0) log.info('가리키는 파일이 없는 import', { n: unknown });
  await inBatches(ops);
  return ops.length - touched.length;
}

/**
 * T1 필사 단위 (02 `block` · 04 §3.1). `_blocks` 캡처를 그대로 담는다 —
 * **분절·순위·마스크는 여기서 하지 않는다**: 그 셋은 `@chickadee/cards` 의 몫이고
 * (01 §2 의 의존 방향이 `cards → concepts` 라 여기서 부를 수도 없다) 판을 걸 때 정해진다.
 *
 * `text_hash` 는 `fnv1a64(파일 content_hash · 줄 범위)` 다. 블록 원문을 읽지 않는 이유는
 * 파일 377개짜리 리포에서 블록마다 IPC 를 한 번 더 하게 되기 때문이고, 파일의
 * `content_hash` 가 git blob oid 라(D20) 본문이 바뀌면 해시도 바뀐다 — 「같은 자리 같은
 * 본문이면 같은 행」이라는 UNIQUE 의 뜻이 그대로 지켜진다.
 */
async function writeBlocks(
  repoId: number,
  file: { id: number; content_hash: string | null },
  blocks: readonly RawBlock[],
  now: number,
): Promise<void> {
  const hashes = blocks.map((b) => blockHash(file.content_hash, b));
  const ops = blocks.map((block, i) => ({
    name: 'block.upsert' as const,
    params: {
      repoId,
      fileId: file.id,
      rev: null,
      name: block.name ?? '',
      kind: 'function',
      lineStart: block.lineStart,
      lineEnd: block.lineEnd,
      textHash: hashes[i] as string,
      // AST 는 판을 걸 때 `parse_snippet` 으로 채운다 (04 §3.1 · D14) — 인제스트가
      // 블록마다 파서를 한 번 더 돌리면 10만 줄 예산이 무너진다.
      astJson: null,
      updatedAt: now,
    },
  }));
  await inBatches(ops);
  await ipc.store.exec('block.retire_missing', {
    fileId: file.id,
    keep: JSON.stringify(hashes),
    at: now,
  });
}

const blockHash = (contentHash: string | null, block: RawBlock): string =>
  fnv1a64(`${contentHash ?? ''}:${block.lineStart}:${block.lineEnd}`);

async function writeSites(
  repoId: number,
  file: { id: number; path: string; is_dirty: number; parse_quality: string | null },
  sites: readonly DerivedSite[],
  now: number,
): Promise<void> {
  const ops = sites.map((site) => ({
    name: 'derive.site_upsert' as const,
    params: {
      repoId,
      fileId: file.id,
      conceptId: site.conceptId,
      siteKey: site.siteKey,
      lineStart: site.lineStart,
      lineEnd: site.lineEnd,
      colStart: site.colStart,
      colEnd: site.colEnd,
      tsNodeKind: site.tsNodeKind,
      form: site.form,
      shape: site.shape,
      occurrence: site.occurrence,
      excerpt: site.excerpt,
      picksJson: JSON.stringify(site.picks),
      holeJson: site.hole === null ? null : JSON.stringify(site.hole),
      ctxJson: JSON.stringify(site.ctx),
      lineConceptsJson: JSON.stringify(site.lineConcepts),
      uncoveredRatio: site.uncoveredRatio,
      confidence: site.confidence,
      parseQuality: file.parse_quality === 'poor' ? 'poor' : 'ok',
      isDirty: file.is_dirty === 1,
      isOversize: site.isOversize,
      // 미지 개수는 겹을 알아야 나온다 — 전체 재계산이 뒤에 따로 돈다.
      unknownCount: 0,
      updatedAt: now,
    },
  }));
  await inBatches(ops);
  await ipc.store.exec('derive.site_retire_missing', {
    repoId,
    fileId: file.id,
    keys: sites.map((s) => s.siteKey),
    updatedAt: now,
  });
}

/**
 * 미지 개념 수를 다시 센다 (02 §6.1). 겹이 바뀌면 값이 바뀌므로 인제스트 뒤와
 * 세션 뒤 두 시점에 돈다 — 여기서는 앞의 것이다.
 */
export async function recountUnknown(
  dict: Dict,
  repoId: number,
  mastery: readonly MasteryRow[],
): Promise<number> {
  const known = knownSet(mastery);
  const layerOf = (id: string): number => (known.has(id) ? 1 : 0);
  const rows = await ipc.store.query('derive.sites_for_rank', { repoId });
  const ops = rows.map((row) => ({
    name: 'derive.unknown_count_set' as const,
    params: {
      repoId,
      siteKey: row.site_key,
      unknownCount: unknownCount(
        {
          conceptId: row.concept_id,
          lineConcepts: JSON.parse(row.line_concepts_json) as string[],
          uncoveredRatio: row.uncovered_ratio,
          lineStart: row.line_start,
          lineEnd: row.line_end,
        },
        layerOf,
        dict,
      ),
    },
  }));
  await inBatches(ops);
  return ops.length;
}

/**
 * 원장의 겹 전량을 `MasteryRow` 로. `universal_id` 는 원장에 없으므로 사전에서 붙인다.
 *
 * 인제스트 뒤 계산(`recountUnknown` · `writeZeroChapter`)은 **실제 겹**을 봐야 한다 —
 * 빈 배열을 넘기면 이미 배운 개념이 전부 「모르는 것」이 되어 미지 수가 부풀고, 0장이
 * 그 언어를 이미 아는 사람에게도 열린다.
 */
export async function loadMastery(dict: Dict): Promise<MasteryRow[]> {
  const rows = await ipc.store.query('review.mastery_all', {});
  return rows.map((row) => ({
    conceptId: row.concept_id,
    layer: row.layer,
    universalId: dict.concepts.get(row.concept_id)?.universal ?? null,
  }));
}

/**
 * 「0장 — 이 언어의 바닥」 대지를 갱신한다 (D136).
 *
 * `recountUnknown` **뒤에** 돌아야 한다 — 담을 판을 고르는 기준이 `unknown_count` 이고,
 * 그 값을 채우는 것이 `recountUnknown` 이다. `writeUnitNodes` 뒤이기도 해야 한다: 그쪽이
 * `derive.unit_nodes_clear` 로 이 리포의 스티커를 통째로 비운다.
 *
 * 대지를 **여는 것은 한 번뿐**이다(그 언어 essential 이 전부 0겹일 때). 그 뒤로는 이미
 * 있는 대지의 스티커만 다시 쓴다 — 끝났다고 대지가 사라지지 않는다.
 */
export async function writeZeroChapter(
  dict: Dict,
  repoId: number,
  mastery: readonly MasteryRow[],
): Promise<number> {
  const known = knownSet(mastery);
  const layerOf = (id: string): number => (known.has(id) ? 1 : 0);
  const existing = await ipc.store.query('derive.unit_manual_names', { repoId });
  const opened = existing.some((row) => row.name === ZERO_CHAPTER_UNIT);

  const essential = [...dict.langs.values()].flatMap((meta) => meta.essential);
  if (!opened && !shouldOpenZeroChapter(essential, layerOf)) return 0;

  const rows = await ipc.store.query('derive.sites_for_rank', { repoId });
  const best = new Map<string, { siteId: number; unknown: number }>();
  for (const row of rows) {
    const at = best.get(row.concept_id);
    if (at === undefined || row.unknown_count < at.unknown) {
      best.set(row.concept_id, { siteId: row.id, unknown: row.unknown_count });
    }
  }

  const plates = zeroChapterPlates({
    essential,
    prereqOf: (id) => dict.concepts.get(id)?.prereq ?? [],
    bestSiteOf: (id) => {
      const hit = best.get(id);
      return hit === undefined
        ? null
        : { siteId: hit.siteId, unknown: hit.unknown, lineStart: 0, lineEnd: 0 };
    },
  });
  // 판이 하나도 없으면 대지를 만들지 않는다 — 빈 대지는 색인 띠에서 죽은 칩이다.
  if (plates.length === 0) return 0;

  const ops: BatchOp[] = [{
    name: 'derive.unit_manual_upsert',
    params: { repoId, name: ZERO_CHAPTER_UNIT, orderIdx: ZERO_CHAPTER_ORDER },
  }];
  plates.forEach((plate, i) => {
    ops.push({
      name: 'derive.unit_node_insert',
      params: {
        repoId, name: ZERO_CHAPTER_UNIT, conceptId: plate.conceptId, track: 't0', nodeOrder: i,
      },
    });
  });
  await inBatches(ops);
  return plates.length;
}

async function writeUnits(
  repoId: number,
  files: readonly { id: number; path: string }[],
): Promise<number> {
  const { units, byPath } = assignUnits(files.map((f) => f.path));
  const ops: BatchOp[] = units.map((unit, i) => ({
    name: 'derive.unit_upsert',
    params: { repoId, name: unit.name, rootPath: unit.rootPath || null, orderIdx: i },
  }));
  ops.push({ name: 'derive.unit_delete_missing', params: { repoId, names: units.map((u) => u.name) } });
  ops.push({ name: 'derive.unit_files_clear', params: { repoId } });
  for (const file of files) {
    const name = byPath.get(file.path);
    if (name === undefined) continue;
    ops.push({ name: 'derive.unit_file_insert', params: { repoId, name, fileId: file.id } });
  }
  await inBatches(ops);
  return units.length;
}

/**
 * 대지의 스티커 — 그 대지 파일에 살아 있는 사용처가 있는 개념 (03 §6.5).
 * `order_idx` 의 위상 정렬은 M2 의 새 개념 순위와 같은 그래프를 쓰므로 그때 채운다.
 */
export async function writeUnitNodes(repoId: number): Promise<number> {
  const sites = await ipc.store.query('derive.sites_for_rank', { repoId });
  const files = await ipc.store.query('derive.files', { repoId });
  const { byPath } = assignUnits(files.map((f) => f.path));
  const seen = new Set<string>();
  const ops: BatchOp[] = [];
  for (const site of sites) {
    const unit = byPath.get(site.path);
    if (unit === undefined) continue;
    const key = `${unit}\u0000${site.concept_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ops.push({
      name: 'derive.unit_node_insert',
      params: { repoId, name: unit, conceptId: site.concept_id, track: 't0', nodeOrder: seen.size },
    });
  }
  await ipc.store.exec('derive.unit_nodes_clear', { repoId });
  await inBatches(ops);
  return ops.length;
}

async function writeGaps(
  dict: Dict,
  repoId: number,
  langFileCount: number,
  now: number,
): Promise<number> {
  const rows = await ipc.store.query('derive.sites_for_rank', { repoId });
  const sites: CountableSite[] = rows.map((r) => ({
    conceptId: r.concept_id,
    path: r.path,
    siteKey: r.site_key,
    unknown: r.unknown_count,
  }));
  const all = [];
  for (const lang of dict.langs.keys()) {
    // M1 에는 겹이 없다 — 전부 0겹이므로 사용처가 있는 필수 문법이 곧 구멍이다.
    // M2 가 `mastery` 를 채우면 여기에 진짜 `layerOf` 를 넘겨야 한다 (03 §6).
    all.push(...buildGaps(dict, { lang, sites, langFileCount, layerOf: () => 0 }));
  }
  const ops = all.map((gap) => ({
    name: 'derive.gap_upsert' as const,
    params: {
      repoId,
      conceptId: gap.conceptId,
      siteCount: gap.siteCount,
      minUnknown: gap.minUnknown,
      bestSiteKey: gap.bestSiteKey,
      reason: gap.thin ? 'thin' : null,
      computedAt: now,
    },
  }));
  await inBatches(ops);
  await ipc.store.exec('derive.gap_delete_missing', {
    repoId,
    conceptIds: all.map((g) => g.conceptId),
  });
  return all.length;
}

function toCapture(row: {
  query_id: string; match_id: number; pattern_index: number; name: string; form: string | null;
  node_kind: string; in_error: number; start_byte: number; end_byte: number;
  start_line: number; end_line: number; start_col: number; end_col: number; excerpt: string;
}): Capture {
  return {
    queryId: row.query_id,
    matchId: row.match_id,
    patternIndex: row.pattern_index,
    name: row.name,
    form: row.form,
    nodeKind: row.node_kind,
    inError: row.in_error === 1,
    startByte: row.start_byte,
    endByte: row.end_byte,
    startLine: row.start_line,
    endLine: row.end_line,
    startCol: row.start_col,
    endCol: row.end_col,
    excerpt: row.excerpt,
  };
}

