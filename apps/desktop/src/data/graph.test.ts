/**
 * M4 「끝났다는 증거」 — **Rust 가 실제로 뱉은 것**(`fixtures/ipc/<리포>/t2.json`)을 받아
 * 해석 → 배치 → 문제 4종까지 간다 (06 §1.4 의 Q4 와 같은 규칙).
 *
 * `data/pipeline.test.ts` 가 T0 에 대해 하는 일을 T2 에 대해 한다: 덤프는 Rust 계약이고,
 * 그것이 깨지면 화면이 아니라 여기가 먼저 빨개진다. 덤프 자체가 Rust 와 같은지는 CI 의
 * `git diff --exit-code fixtures/ipc` 가 본다.
 *
 * 두 리포가 서로 다른 것을 증명한다:
 *   · `projectox-like` — 파일 63 · 커밋 95. 지도가 서고 네 종이 다 나온다.
 *   · `two-commits`   — 파일 1 · 커밋 2. **아무것도 안 나온다**(06 §1.2 의 「빈 상태」).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { deriveFile, resolveImports, assignUnits, type FileImports } from '@chickadee/concepts';
import {
  buildGraph, generateT2, isT2Card,
  type CommitFileRow, type CommitRow, type GraphEdge, type GraphFile, type T2Kind,
} from '@chickadee/cards';
import { describe, expect, test } from 'vitest';

import type { Capture } from '@chickadee/ipc-client';
import type { ConceptId } from '@chickadee/store-sql';

/** Rust 덤프의 snake_case 한 행 → 01 §3.1 의 `Capture` (`pipeline.test.ts` 와 같은 표). */
interface DumpCapture {
  query_id: string; match_id: number; name: string; pattern_index: number;
  form: string | null; node_kind: string; in_error: number;
  start_byte: number; end_byte: number; start_line: number; end_line: number;
  start_col: number; end_col: number; excerpt: string;
}

const toCapture = (r: DumpCapture): Capture => ({
  queryId: r.query_id, matchId: r.match_id, name: r.name, patternIndex: r.pattern_index,
  form: r.form, nodeKind: r.node_kind, inError: r.in_error === 1,
  startByte: r.start_byte, endByte: r.end_byte, startLine: r.start_line, endLine: r.end_line,
  startCol: r.start_col, endCol: r.end_col, excerpt: r.excerpt,
});

interface Dump { files: { path: string; captures: DumpCapture[] }[]; commits: number }

const load = (name: string): Dump =>
  JSON.parse(readFileSync(join(process.cwd(), 'fixtures/ipc', name, 't2.json'), 'utf8')) as Dump;

/**
 * 덤프의 캡처를 **실제 경로 그대로** `RawImport` 로 바꾼다 — 따옴표를 벗기는 것은
 * `deriveFile` 의 일이고(D18) 그 걸음을 건너뛰면 지정자가 `"'./x'"` 인 채로 해석기에 가
 * 전부 external 이 된다. 처음 쓸 때 실제로 그렇게 됐고 엣지가 0건이었다.
 */
const importsOf = (dump: Dump): FileImports[] => dump.files.map((f) => ({
  path: f.path,
  imports: deriveFile(f.path, f.captures.map(toCapture)).imports,
}));

/** 덤프 → 지도 재료. 앱의 `loadGraph` 가 statement 로 하는 일을 여기서는 덤프로 한다. */
function graphOf(dump: Dump, unitName: string): {
  files: GraphFile[]; edges: GraphEdge[]; unitPaths: string[]; unitRoot: string;
} {
  const paths = dump.files.map((f) => f.path);
  const resolved = resolveImports({ paths, files: importsOf(dump) });
  const { units, byPath } = assignUnits(paths);
  const unitPaths = paths.filter((p) => byPath.get(p) === unitName);
  const near = new Set(unitPaths);
  for (const edge of resolved) {
    if (near.has(edge.from)) near.add(edge.to);
    if (near.has(edge.to)) near.add(edge.from);
  }
  const files: GraphFile[] = [...near].sort().map((path, i) => ({
    fileId: i + 1, path, inUnit: byPath.get(path) === unitName,
  }));
  const edges = resolved.filter((e) => near.has(e.from) && near.has(e.to));
  return {
    files, edges, unitPaths,
    unitRoot: units.find((u) => u.name === unitName)?.rootPath ?? '',
  };
}

/**
 * 「유닛 하나로」의 그 유닛 — **연결이 가장 많은** 대지다. 파일 수가 아니라 엣지 수로 고른다:
 * `projectox-like` 의 `gen`·`panels` 는 파일이 30개씩이지만 전부 `core/time.ts` 하나만
 * 가리키는 **별 모양**이라 깊이가 2 다. 그런 대지에서는 04 §8.3 의 영향 반경(들어오는
 * 화살표가 있는 대지 파일)과 흐름 추적(3~6 노드 경로)이 만들어질 수 없다 — 규칙이 아니라
 * 그 리포의 모양이 그렇다. `.steps` 마지막 세 커밋의 `cart` 가 층이 있는 대지다.
 */
function biggestUnit(dump: Dump): string {
  const paths = dump.files.map((f) => f.path);
  const resolved = resolveImports({ paths, files: importsOf(dump) });
  const { units, byPath } = assignUnits(paths);
  const score = new Map<string, number>();
  for (const edge of resolved) {
    for (const side of [edge.from, edge.to]) {
      const name = byPath.get(side);
      if (name !== undefined) score.set(name, (score.get(name) ?? 0) + 1);
    }
  }
  return [...units]
    .sort((a, b) => (score.get(b.name) ?? 0) - (score.get(a.name) ?? 0)
      || a.name.localeCompare(b.name))[0]?.name ?? '';
}

/** 04 §8.1 이 요구하는 후보 커밋을 흉내 낸다 — 덤프에는 `commit_file` 이 없다. */
function fakeCommits(unitPaths: readonly string[]): {
  commits: CommitRow[]; filesOf: Map<number, CommitFileRow[]>;
} {
  const commits: CommitRow[] = [1, 2, 3, 4].map((id) => ({
    id, sha: `c${id}`.padEnd(7, '0'), authoredAt: 1_700_000_000_000 + id * 1_000,
    message: `feat(unit): 기능 ${id} 을 더한다`, filesN: 4, insertions: 60, deletions: 8,
    truncated: false,
  }));
  const filesOf = new Map<number, CommitFileRow[]>();
  for (const commit of commits) {
    const slice = unitPaths.slice(0, 4);
    filesOf.set(commit.id, slice.map((path, i) => ({
      path, oldPath: null,
      status: (i === 0 && commit.id === 1 ? 'A' : 'M') as CommitFileRow['status'],
      additions: 10 + i * 3, deletions: i, fileId: i + 1,
    })));
  }
  return { commits, filesOf };
}

const KINDS: T2Kind[] = ['placement', 'radius', 'flow', 'direction'];

describe('projectox-like — 유닛 하나로 문제 4종이 생성된다', () => {
  const dump = load('projectox-like');
  const unit = biggestUnit(dump);
  const { files, edges, unitPaths, unitRoot } = graphOf(dump, unit);

  test('Rust 덤프에 실제 import 지정자가 들어 있다 (real_spec 확인)', () => {
    expect(dump.files.length).toBeGreaterThan(20);
    expect(dump.files.some((f) => f.captures.length > 0)).toBe(true);
    // `deriveFile` 을 지나면 따옴표가 벗겨진 지정자가 나온다.
    const specs = importsOf(dump).flatMap((f) => f.imports.map((i) => i.specifier));
    expect(specs.length).toBeGreaterThan(0);
    expect(specs.every((sp) => !sp.startsWith("'") && !sp.startsWith('"'))).toBe(true);
  });

  test('지정자가 파일 대 파일 엣지로 풀린다', () => {
    expect(files.length).toBeGreaterThan(2);
    expect(edges.length).toBeGreaterThan(0);
    // 해석 결과는 언제나 실제 파일을 가리킨다 — 아니면 `import_edge` 쓰기에서 조용히 사라진다.
    const known = new Set(files.map((f) => f.path));
    for (const edge of edges) {
      expect(known.has(edge.from)).toBe(true);
      expect(known.has(edge.to)).toBe(true);
    }
  });

  test('지도가 서고 24 노드를 넘지 않는다', () => {
    const graph = buildGraph({ files, edges, unitRoot });
    expect(graph.files.length).toBeGreaterThan(0);
    expect(graph.files.length).toBeLessThanOrEqual(24);
    expect(graph.bands).toHaveLength(4);
  });

  test.each(KINDS)('%s 문제가 나온다', (kind) => {
    const { commits, filesOf } = fakeCommits(unitPaths);
    const made = generateT2({
      repoId: 1, unitId: 1, unitName: unit, unitRoot,
      conceptId: 'arch/placement' as ConceptId, seed: 7,
      files, edges, commits, filesOf, recent: new Map(),
    }, kind);
    if (!isT2Card(made)) throw new Error(`${kind}: ${made.reason}`);
    expect(made.kind).toBe(kind);
    expect(made.payload.q.length).toBeGreaterThan(0);
    expect(made.payload.files.length).toBeLessThanOrEqual(24);
    // 커밋을 정답지로 쓰는 것은 책임 배치뿐이다 (04 §8.3).
    expect(made.payload.commit === undefined).toBe(kind !== 'placement');
  });

  test('같은 입력으로 두 번 구우면 deep-equal 이다 (배치 결정성 · 난수 0)', () => {
    const { commits, filesOf } = fakeCommits(unitPaths);
    const req = {
      repoId: 1, unitId: 1, unitName: unit, unitRoot,
      conceptId: 'arch/placement' as ConceptId, seed: 7,
      files, edges, commits, filesOf, recent: new Map<number, string[]>(),
    };
    for (const kind of KINDS) expect(generateT2(req, kind)).toEqual(generateT2(req, kind));
  });
});

describe('two-commits — 반례 픽스처 (06 §1.2 · D36)', () => {
  const dump = load('two-commits');

  test('파일 하나뿐이라 import 도 지도도 없다', () => {
    expect(dump.files).toHaveLength(1);
    expect(dump.files[0]?.captures).toHaveLength(0);
    const paths = dump.files.map((f) => f.path);
    expect(resolveImports({ paths, files: importsOf(dump) })).toEqual([]);
  });

  test('책임 배치도 그래프 3종도 나오지 않는다 — 「빈 상태」가 정답이다 (D103)', () => {
    const paths = dump.files.map((f) => f.path);
    const files: GraphFile[] = paths.map((path, i) => ({ fileId: i + 1, path, inUnit: true }));
    const { commits, filesOf } = fakeCommits(paths);
    for (const kind of KINDS) {
      const made = generateT2({
        repoId: 1, unitId: 1, unitName: '기타', unitRoot: '',
        conceptId: 'arch/placement' as ConceptId, seed: 7,
        files, edges: [], commits, filesOf, recent: new Map(),
      }, kind);
      expect(isT2Card(made)).toBe(false);
    }
  });
});
