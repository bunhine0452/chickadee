/**
 * 인제스트 한 바퀴 (01 §3.3 「TS 파생 층」). Rust 가 사실을 쓰고 나면 여기가 이어받는다.
 *
 * 화면이 보는 4단계는 Rust 의 `walk·parse·git·write` 2칸과 여기의 `derive`·`cards`
 * 2칸이다 (D47). 이 파일은 그중 `derive` 를 소유한다 — `cards` 는 M2.
 */
import { keyOf, kindOf, langOf, langSpecs, loadDict, type Dict } from '@chickadee/dictionary';
import {
  ipc, on, type BatchOp, type Capture, type IngestDone, type IngestProgress,
} from '@chickadee/ipc-client';

import { classify, isMine, type Identity } from './commits.js';
import { deriveFile, type DerivedSite } from './derive.js';
import { buildGaps, type CountableSite } from './gaps.js';
import { EXCLUDE_GLOBS, GENERATED_MARKERS, LIMITS } from './ingest-defaults.js';
import { assignUnits } from './units.js';
import { knownSet, unknownCount, type MasteryRow } from './unknown-rank.js';

/** `store_batch` 한 번의 상한 (01 §3.2). */
const BATCH = 200;

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
  now: number;
  onProgress?: (phase: Phase, done: number, total: number) => void;
  onWarning?: (relPath: string, reason: string) => void;
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
        options.onProgress?.(p.phase, p.done, p.total);
      }));
      stops.push(await on('ingest_warning', (w) => {
        options.onWarning?.(w.relPath, w.reason);
      }));
      stops.push(await on('ingest_done', resolve));
      stops.push(await on('ingest_error', reject));
      await ipc.ingest.start({
        repoId: options.repoId,
        rootPath: options.rootPath,
        mode: options.mode,
        sinceHead: options.sinceHead,
        langs: langSpecs(dict, LIMITS.maxFileBytes),
        maxCommits: LIMITS.maxCommits,
        maxFilesPerCommit: LIMITS.maxFilesPerCommit,
        maxFiles: LIMITS.maxFiles,
        maxLineBytes: LIMITS.maxLineBytes,
        excludeGlobs: [...EXCLUDE_GLOBS],
        generatedMarkers: [...GENERATED_MARKERS],
      });
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
): Promise<{ sites: number; gaps: number; units: number }> {
  const { repoId, now } = options;
  const heuristic = new Set(
    [...dict.concepts.values()]
      .filter((c) => c.grammars.some((g) => dict.queries.get(keyOf(c.id, g))?.includes('#match?')))
      .map((c) => c.id),
  );
  const files = await ipc.store.query('derive.files', { repoId });
  let siteCount = 0;
  let step = 0;

  for (const file of files) {
    const captures = await ipc.store.query('derive.captures_by_file', { fileId: file.id });
    const result = deriveFile(
      file.path,
      captures.map(toCapture),
      (id) => (heuristic.has(id) ? 'heuristic' : 'syntactic'),
    );
    // 사전에 없는 개념의 캡처는 버린다 — 사전이 줄어들면 사용처도 줄어야 한다.
    const sites = result.sites.filter((s) => dict.concepts.has(s.conceptId));
    await writeSites(repoId, file, sites, now);
    siteCount += sites.length;
    step += 1;
    options.onProgress?.('derive', step, files.length);
  }

  await classifyCommits(repoId, options.identities ?? []);
  const units = await writeUnits(repoId, files);
  const gaps = await writeGaps(dict, repoId, files.length, now);
  return { sites: siteCount, gaps, units };
}

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

async function classifyCommits(repoId: number, identities: readonly Identity[]): Promise<void> {
  const rows = await ipc.store.query('derive.commits', { repoId });
  const ops = rows.map((row) => {
    const facts = {
      sha: row.sha,
      parentCount: row.parent_count,
      authorEmail: row.author_email,
      authorName: row.author_name,
      message: row.message,
      filesN: row.files_n,
      insertions: row.insertions,
    };
    return {
      name: 'derive.commit_classify' as const,
      params: {
        repoId,
        sha: row.sha,
        kind: classify(facts),
        authorMatched: isMine(facts, identities),
      },
    };
  });
  await inBatches(ops);
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
    const key = `${unit} ${site.concept_id}`;
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

/** `store_batch` 는 한 번에 200 op 까지다 (01 §3.2). */
async function inBatches(ops: readonly BatchOp[]): Promise<void> {
  for (let at = 0; at < ops.length; at += BATCH) {
    await ipc.store.batch(ops.slice(at, at + BATCH));
  }
}
