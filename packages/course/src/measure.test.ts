/**
 * 실측 — 캡처 덤프 → 순수 파이프라인 → 코스 카드 (D172). CI 에서는 돌지 않는다:
 * `COURSE_DUMP`(파일마다 한 줄 `{path, grammar, quality, captures}`) 와 `COURSE_ROOT`(리포 루트)
 * 를 주면 그 리포의 첫 챕터에 단별로 몇 장이 구워지는지 표로 적는다(`COURSE_OUT`).
 * 파서가 없어 AST 가 필요한 유형(exec·reorder)은 여기서 빠진다 — 앱은 `parse_snippet` 으로 채운다.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { buildCourseCards, fnv1a64, genMeaning, isFailure, isTestPath, makeProtoCard } from '@chickadee/cards';
import type { StageCommit, StageEdge, StageSite, StageTestFile } from '@chickadee/cards';
import {
  buildCallGraph, deriveFile, entryUnits, extractSchema, methodPaths, resolveImports,
  type DerivedSite, type EntrySeed, type FileBlocks, type FileImports, type MethodHop, type RawBlock,
} from '@chickadee/concepts';
import { keyOf, loadDict } from '@chickadee/dictionary';
import type { Capture } from '@chickadee/ipc-client';
import type { ConceptSite } from '@chickadee/store-sql';

import { dictVersionOf } from './bake.js';
import { borrowedInput, evidenceBlock, lenders, pickLender, type LenderSite } from './borrow.js';
import { lineDiff } from './diff.js';
import { hopRanges, mergeRanges, trunkHops } from './hops.js';
import { FULL_READ_MAX, RANGE_PAD, assembleStageRequest, type BlockRow, type FileText, type Materials } from './materials.js';

const DUMP = process.env['COURSE_DUMP'];
const ROOT = process.env['COURSE_ROOT'];
const OUT = process.env['COURSE_OUT'] ?? join(process.cwd(), '.seed', 'course-measure.md');
const CHAPTER = process.env['COURSE_CHAPTER'] ?? 'auth';

interface DumpRow { path: string; grammar: string; quality: string; captures: Capture[] }

/** 4·5단 판이 든 판정용 테스트를 갈래별로 센다 (D180). */
function judgeTally(results: readonly { cards: readonly { payload: unknown }[] }[]): string {
  const by = new Map<string, number>();
  let plates = 0;
  for (const r of results) {
    for (const c of r.cards) {
      const p = c.payload as { tests?: { source: string }[] };
      if (p.tests === undefined) continue;
      plates += 1;
      for (const t of p.tests) by.set(t.source, (by.get(t.source) ?? 0) + 1);
    }
  }
  const parts = [...by.entries()].sort().map(([k, n]) => `${k} ${n}`);
  return `${plates}판 · ${parts.length === 0 ? '0장' : parts.join(' · ')}`;
}

const git = (args: string[]): string => execFileSync('git', ['-C', ROOT as string, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

describe.skipIf(DUMP === undefined || ROOT === undefined)('실측 — 코스 카드 (COURSE_DUMP · COURSE_ROOT)', () => {
  test(`첫 챕터(${CHAPTER})의 단별 카드 수`, () => {
    const dict = loadDict();
    const heuristic = new Set([...dict.concepts.values()]
      .filter((c) => c.grammars.some((g) => dict.queries.get(keyOf(c.id, g))?.includes('#match?'))).map((c) => c.id));

    // 덤프 — 같은 파일의 문법 여럿을 한 파일로 모은다(인제스트의 `captures_by_file` 과 같다).
    const byPath = new Map<string, { grammar: string; quality: string; captures: Capture[] }>();
    for (const line of readFileSync(DUMP as string, 'utf8').split('\n')) {
      if (line.trim() === '') continue;
      const row = JSON.parse(line) as DumpRow;
      const at = byPath.get(row.path);
      if (at === undefined) byPath.set(row.path, { grammar: row.grammar, quality: row.quality, captures: [...row.captures] });
      else at.captures.push(...row.captures);
    }
    const paths = [...byPath.keys()].sort();
    const fileId = new Map(paths.map((p, i) => [p, i + 1]));

    const imports: FileImports[] = [];
    const blocksOf: FileBlocks[] = [];
    const sitesOf = new Map<string, DerivedSite[]>();
    const rawBlocks = new Map<string, RawBlock[]>();
    for (const path of paths) {
      const f = byPath.get(path) as { grammar: string; quality: string; captures: Capture[] };
      const r = deriveFile(path, f.captures, (id) => (heuristic.has(id) ? 'heuristic' : 'syntactic'));
      imports.push({ path, imports: r.imports });
      blocksOf.push({ path, blocks: r.blocks });
      rawBlocks.set(path, r.blocks);
      sitesOf.set(path, r.sites.filter((s) => dict.concepts.has(s.conceptId)));
    }
    const resolved = resolveImports({ paths, files: imports });
    const seeds: EntrySeed[] = imports.filter((f) => f.imports.some((r) => r.form === 'entry-scheduled')).map((f) => ({ path: f.path }));
    const features = entryUnits(resolved, seeds);
    const graph = buildCallGraph({ files: imports, blocks: blocksOf, edges: resolved });
    const allPaths = methodPaths(graph);
    const unitOf = (path: string): string | null => {
      const own = features.find((u) => u.entry === path);
      if (own !== undefined) return own.name;
      const holding = features.filter((u) => u.files.includes(path)).sort((a, b) => a.files.length - b.files.length);
      return holding[0]?.name ?? null;
    };
    const feature = features.find((u) => u.name === CHAPTER);
    expect(feature, `기능 ${CHAPTER} 이 없다 — 있는 것: ${features.map((u) => u.name).join(' ')}`).toBeDefined();
    const unit = feature as NonNullable<typeof feature>;
    const method: MethodHop[][] = allPaths.filter((hops) => {
      const entry = hops.find((h) => h.kind === 'http')?.calledAt?.path;
      return entry !== undefined && unitOf(entry) === CHAPTER;
    });
    const stagePaths = method.map(trunkHops).filter((h) => h.length >= 2);
    const ranges = hopRanges(method, RANGE_PAD);
    const hopFiles = new Set(ranges.map((r) => r.path));

    // 파일 — bake.ts 와 같은 규칙(작으면 통째, 크면 칸 근처).
    const texts = new Map<string, FileText>();
    const readFile = (path: string): string[] | null => {
      const abs = join(ROOT as string, path);
      return existsSync(abs) ? readFileSync(abs, 'utf8').split('\n') : null;
    };
    const load = (path: string): void => {
      if (texts.has(path)) return;
      const all = readFile(path);
      if (all === null) return;
      const full = all.length <= FULL_READ_MAX || /\.(xml|sql)$/i.test(path);
      const want = full ? [{ path, from: 1, to: all.length }] : mergeRanges(ranges.filter((r) => r.path === path));
      const lines: { n: number; t: string }[] = [];
      for (const r of want) for (let n = r.from; n <= Math.min(r.to, all.length); n += 1) lines.push({ n, t: all[n - 1] as string });
      texts.set(path, {
        path, fileId: fileId.get(path) ?? 0, grammar: byPath.get(path)?.grammar ?? null, lineCount: all.length,
        lines: lines.sort((a, b) => a.n - b.n),
      });
    };
    for (const p of unit.files) load(p);
    for (const p of hopFiles) load(p);

    const mine = new Set(unit.files);
    const edges: StageEdge[] = resolved.filter((e) => mine.has(e.from) && mine.has(e.to)).map((e) => ({ from: e.from, to: e.to, kind: e.kind }));
    let siteId = 0;
    const toSite = (path: string, s: DerivedSite): StageSite => ({
      path,
      site: {
        id: (siteId += 1), repoId: 1, fileId: fileId.get(path) ?? 0, conceptId: s.conceptId as ConceptSite['conceptId'],
        siteKey: s.siteKey, lineStart: s.lineStart, lineEnd: s.lineEnd, colStart: s.colStart, colEnd: s.colEnd,
        tsNodeKind: s.tsNodeKind, form: s.form, shape: s.shape, occurrence: s.occurrence, excerpt: s.excerpt,
        picks: s.picks, hole: s.hole as unknown as ConceptSite['hole'], ctx: s.ctx, lineConcepts: s.lineConcepts as ConceptSite['lineConcepts'],
        uncoveredRatio: s.uncoveredRatio, confidence: s.confidence,
        parseQuality: byPath.get(path)?.quality === 'poor' ? 'poor' : 'ok', isDirty: false, isOversize: s.isOversize,
        commitId: null, unknownCount: 0, isAlive: true, updatedAt: 0,
      },
    });
    const sites: StageSite[] = [...mine].sort().flatMap((p) => (sitesOf.get(p) ?? []).map((s) => toSite(p, s)));
    const blocks: BlockRow[] = [...hopFiles].sort().flatMap((p) => (rawBlocks.get(p) ?? []).map((b, i) => ({
      path: p, blockId: i + 1, name: b.name, from: b.lineStart, to: b.lineEnd, hash: fnv1a64(`${p}:${b.lineStart}:${b.lineEnd}`), ast: null,
    })));

    const schema = extractSchema(imports, resolved);
    const bindings = schema.bindings.filter((b) => mine.has(b.path));
    for (const b of bindings) if (b.entityPath !== null) load(b.entityPath);
    const wanted = new Set(bindings.flatMap((b) => (b.table === null ? [] : [b.table])));
    const columns = schema.tables.filter((t) => wanted.has(t.name)).flatMap((t) => {
      load(t.path);
      return t.columns.map((c) => ({ table: t.name, column: c.name, path: t.path, line: c.line }));
    });

    // 커밋 — 등뼈 위 파일을 고친 fix 커밋 (`card.fix_commits` 와 같은 조건).
    const commits: StageCommit[] = [];
    const logged = git(['log', '--format=%H%x09%P%x09%at%x09%s', '-n', '400', '--', ...hopFiles]).trim().split('\n').filter(Boolean);
    let id = 0;
    for (const line of logged) {
      const [sha, parents, at, ...rest] = line.split('\t');
      const message = rest.join('\t');
      if (sha === undefined || parents === undefined || at === undefined) continue;
      if (!/^(fix|bugfix|hotfix)\b/i.test(message) || parents.split(' ').length !== 1) continue;
      const files: StageCommit['files'][number][] = [];
      for (const row of git(['diff-tree', '--no-commit-id', '--name-status', '-r', sha]).trim().split('\n')) {
        const [status, path] = row.split('\t');
        if (status !== 'M' || path === undefined) continue;
        if (!hopFiles.has(path) && !isTestPath(path)) continue;
        const before = git(['show', `${parents}:${path}`]).split('\n');
        const after = git(['show', `${sha}:${path}`]).split('\n');
        const hunks = lineDiff(before, after);
        if (hunks.length > 0) files.push({ path, hunks });
      }
      if (files.length === 0) continue;
      commits.push({ id: (id += 1), sha, date: new Date(Number(at) * 1000).toISOString().slice(0, 10), message, files });
      if (commits.length >= 20) break;
    }

    // 리포의 테스트 파일 — 4·5단 판정용 테스트의 재료 (D180 ③).
    const repoTests: StageTestFile[] = paths.filter(isTestPath).flatMap((p) => {
      const text = readFile(p);
      return text === null ? [] : [{ path: p, text: text.join('\n') }];
    });

    const m: Materials = {
      repoId: 1, unitId: 1, unitName: CHAPTER, dictVersion: dictVersionOf(dict), attempt: 0, concepts: dict.concepts,
      files: [...texts.values()], paths: stagePaths, edges, sites, blocks, bindings, columns, commits,
      tests: repoTests, layerOf: () => 0,
    };
    const req = assembleStageRequest(m);
    const results = buildCourseCards(req);

    // 사용처 없는 개념 — 규약은 줄기 위 블록, 기계는 빌린 창 (리포 전체).
    const hopBlocks = allPaths.flat().map((h) => {
      const text = readFile(h.path);
      const lines = text === null ? [] : text.slice(h.lineStart - 1, h.lineEnd).map((t, i) => ({ n: h.lineStart + i, t }));
      return { path: h.path, window: { from: h.lineStart, to: h.lineEnd }, lines, hash: fnv1a64(`${h.path}:${h.lineStart}:${h.lineEnd}`) };
    }).filter((b) => b.lines.length > 0);
    const base = { repoId: 1, dictVersion: dictVersionOf(dict), attempt: 0, concepts: dict.concepts, ly: 0 };
    const proto: string[] = [];
    for (const concept of [...dict.concepts.values()].filter((c) => c.id.startsWith('proto/'))) {
      const block = evidenceBlock(concept, hopBlocks);
      if (block === null) continue;
      const made = makeProtoCard({ ...base, concept, lines: block.lines, path: block.path, window: block.window, blockHash: block.hash });
      if (!isFailure(made)) proto.push(`${concept.id} ← ${block.path}:${block.window.from}`);
    }
    const allSites = new Map<string, LenderSite[]>();
    for (const p of paths) {
      for (const s of sitesOf.get(p) ?? []) {
        const site = toSite(p, s);
        allSites.set(s.conceptId, [...(allSites.get(s.conceptId) ?? []), { conceptId: s.conceptId, site: site.site, path: p }]);
      }
    }
    const cs: string[] = [];
    const csNoWindow: string[] = [];
    for (const [target, ids] of lenders(dict.concepts)) {
      const lender = pickLender(ids.flatMap((l) => allSites.get(l) ?? []));
      if (lender === null) { csNoWindow.push(target); continue; }
      const text = readFile(lender.path);
      if (text === null) { csNoWindow.push(target); continue; }
      const enclosing = (rawBlocks.get(lender.path) ?? []).filter((b) => b.lineStart <= lender.site.lineStart && lender.site.lineStart <= b.lineEnd)
        .sort((a, b) => (a.lineEnd - a.lineStart) - (b.lineEnd - b.lineStart))[0];
      const win = enclosing === undefined ? undefined : { from: enclosing.lineStart, to: enclosing.lineEnd };
      const from = Math.max(1, Math.min(win?.from ?? lender.site.lineStart, lender.site.lineStart - 4));
      const to = Math.min(text.length, Math.max(win?.to ?? lender.site.lineStart, lender.site.lineStart + 4));
      const lines = text.slice(from - 1, to).map((t, i) => ({ n: from + i, t }));
      const input = borrowedInput(target, lender, lines, win);
      const made = genMeaning({ ...base, concept: dict.concepts.get(target) as NonNullable<ReturnType<typeof dict.concepts.get>>, sites: [input] }, input);
      if (isFailure(made)) csNoWindow.push(`${target}(${made.reason})`); else cs.push(`${target} ← ${lender.conceptId} ${lender.path}:${lender.site.lineStart}`);
    }

    const lines: string[] = [
      `# 실측 — ${CHAPTER} 챕터 (${new Date().toISOString().slice(0, 10)})`,
      '',
      `- 파일 ${paths.length} · 기능 ${features.length}(${features.map((u) => `${u.name} ${u.files.length}`).join(' · ')})`,
      `- ${CHAPTER}: 파일 ${unit.files.length} · 읽은 파일 ${texts.size} · 줄기 ${method.length}(등뼈 ${stagePaths.length}, 2칸 이상) · 간선 ${edges.length} · 사용처 ${sites.length} · 블록 ${blocks.length} · 바인딩 ${bindings.length} · fix 커밋 ${commits.length}`,
      `- 이름 자리 ${req.names?.length ?? 0} · 응답 키 ${req.responseKeys?.map((k) => `${k.key}(${k.reads.length})`).join(' ') ?? ''}`,
      `- 리포 테스트 파일 ${repoTests.length} · 4·5단 판정용 테스트 ${judgeTally(results)}`,
      '',
      '| 단 | 유형 | 장 | 못 낸 사유 |',
      '|---|---|---|---|',
    ];
    for (const r of results) {
      const byType = new Map<string, number>();
      for (const c of r.cards) byType.set(c.type, (byType.get(c.type) ?? 0) + 1);
      const drops = new Map<string, string[]>();
      for (const d of r.dropped) drops.set(d.type, [...(drops.get(d.type) ?? []), d.reason]);
      const types = new Set([...byType.keys(), ...drops.keys()]);
      for (const t of [...types].sort()) {
        lines.push(`| ${r.stageNo} | ${t} | ${byType.get(t) ?? 0} | ${[...new Set(drops.get(t) ?? [])].join(' / ')} |`);
      }
    }
    lines.push('', `## 등뼈`, '', ...stagePaths.slice(0, 12).map((p) => `- ${p.map((h) => `${h.path.split('/').pop()}${h.line === null ? '' : `:${h.line}`}`).join(' → ')}`));
    lines.push('', `## 규약 카드 ${proto.length}`, '', ...proto.map((p) => `- ${p}`));
    lines.push('', `## 기계 카드 ${cs.length} / 창 없음 ${csNoWindow.length}`, '', ...cs.map((p) => `- ${p}`), '', ...csNoWindow.map((p) => `- (없음) ${p}`));
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${lines.join('\n')}\n`);
    process.stdout.write(`${lines.join('\n')}\n`);

    expect(stagePaths.length).toBeGreaterThan(0);
    expect(results.some((r) => r.cards.some((c) => c.type === 'hop'))).toBe(true);
  });
});
