/**
 * T2 지도 정리·배치 (04 §7.2~§7.4) — 순환 · 고립 · 밴드 · 밴드 안 순서 · 24 노드 축약.
 *
 * 난수가 없다. 04 §7.3 이 그렇게 못박았고 04 §9 가 「두 번 부르면 deep-equal」을 골든으로
 * 고정한다. 그래서 첫 걸음은 언제나 입력을 줄 세우는 것이다 — 호출자가 어떤 순서로 넘기든
 * 같은 지도가 나와야 한다. 좌표는 내지 않는다. 밴드 행 `r` 과 「밴드 안 몇 번째인가」
 * (= `files` 배열 순서)까지가 여기 몫이고 기하 상수는 05 의 `DependencyMap` 이 가진다 (D97).
 */
import { assignUnits, OTHER_UNIT } from '@chickadee/concepts';
import type { EdgeKind } from '@chickadee/store-sql';

import { bandNames, BANDS, MAX_NODES } from './t2-types.js';
import type { Band, Graph, GraphEdge, GraphFile } from './t2-types.js';

/**
 * 밴드 패턴을 볼 때 벗기는 접두. 04 §7.2 의 패턴은 리포 뿌리에 매달려 있는데 실제 리포의
 * 절반은 `src/app/page.tsx` 다 — 안 벗기면 그런 리포는 패턴이 통째로 놀고 깊이 폴백뿐이다.
 */
const SRC_PREFIX = 'src/';

/** 04 §7.2 「진입점(`page.*`·`main.*`·`index.*`)」. */
const ENTRY_RE = /^(?:page|main|index)\.[A-Za-z0-9]+$/;

/** SCC 축약 DAG 의 한 노드. `id` 는 대표 경로(멤버 중 사전순 첫 번째)다. */
export interface Scc { id: string; members: string[] }

/**
 * 지도의 범위 (04 §7.4·§7.5).
 *
 * `unit` 은 대지 + 1-hop 이웃이고 노드가 파일이다 — 04 §7.4 가 정한 기본값이다.
 * `repo` 는 리포 전체이고 노드가 **대지·폴더**다 (D142). 파일 2,000장을 24 노드에 넣으려면
 * 뺄 것을 고르는 수밖에 없는데, 접으면 아무것도 빼지 않고 리포 전체 모양이 남는다.
 */
export type GraphScope = 'unit' | 'repo';

/** `buildGraph` 입력. `t2.unit_files` · `t2.edges` 를 경로로 옮긴 것 + 정답지 힌트. */
export interface GraphInput {
  files: readonly GraphFile[];
  edges: readonly GraphEdge[];
  /** 대지 뿌리 경로 (`unit.root_path`). 대지 진입점 판정에 쓴다. `repo` 범위에서는 빈 문자열. */
  unitRoot: string;
  /** 접으면 안 되는 경로 — 정답지(core·sec)에 든 파일 (04 §7.4). */
  keep?: readonly string[];
  /** 그 커밋에서 새로 생긴 파일 → `isNew` 배지. */
  newFiles?: readonly string[];
  /** 기본은 `unit`. */
  scope?: GraphScope;
}

/** 내부용 엣지. `confidence` 는 지도 모양에 영향이 없어 여기서 떨군다. */
interface Edge { from: string; to: string; kind: EdgeKind }

/** `Map<string, T[]>` 에 밀어 넣는다. 자리가 없으면 만든다. */
function pushTo<T>(m: Map<string, T[]>, key: string, v: T): void {
  const bucket = m.get(key);
  if (bucket) bucket.push(v);
  else m.set(key, [v]);
}

const baseOf = (p: string): string => p.slice(p.lastIndexOf('/') + 1);
const dirOf = (p: string): string => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const byPathAsc = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const clampBand = (n: number): Band => Math.min(BANDS - 1, Math.max(0, n)) as Band;

/** 04 §7.2 진입점 판정. 고립이어도 지도에 남기는 노드다. */
export function isEntry(path: string): boolean {
  return ENTRY_RE.test(baseOf(path));
}

/** 대지 진입점 — 이 지도의 꼭대기. 깊이의 뿌리이고, 접거나 지도 밖으로 빼지 않는다. */
function isUnitEntry(path: string, root: string): boolean {
  if (!isEntry(path)) return false;
  return root === '' || path === root || path.startsWith(`${root}/`);
}

/**
 * Tarjan SCC + 축약 DAG (04 §7.2 순환). O(V+E) (04 §9).
 *
 * 재귀 대신 명시 스택을 쓴다 — 2,000 파일짜리 import 사슬에서 콜스택이 터지면 카드 생성이
 * 통째로 죽는다. `sccs` 는 **위상 순서**(가져다 쓰는 쪽이 먼저)로 낸다 — 밴드 깊이와 흐름
 * 추적이 둘 다 그 순서를 쓴다. 엣지는 방향만 보므로 `confidence` 없는 내부 엣지도 받는다.
 */
export function condense(
  files: readonly string[],
  edges: readonly Pick<GraphEdge, 'from' | 'to'>[],
): { sccs: Scc[]; of: Map<string, string>; out: Map<string, string[]> } {
  const nodes = [...new Set(files)].sort();
  const adj = new Map<string, string[]>();
  for (const p of nodes) adj.set(p, []);
  for (const e of edges) if (e.from !== e.to && adj.has(e.to)) adj.get(e.from)?.push(e.to);
  for (const [p, kids] of adj) adj.set(p, [...new Set(kids)].sort());

  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const found: string[][] = [];
  let counter = 0;
  /** 처음 본 노드를 열어 둔다 — Tarjan 의 `index`·`lowlink`·스택을 한 번에. */
  const open = (v: string): void => {
    index.set(v, counter);
    low.set(v, counter);
    counter += 1;
    stack.push(v);
    onStack.add(v);
  };

  for (const start of nodes) {
    if (index.has(start)) continue;
    open(start);
    const work: { v: string; i: number }[] = [{ v: start, i: 0 }];
    while (work.length > 0) {
      const top = work[work.length - 1];
      if (!top) break;
      const next = (adj.get(top.v) ?? [])[top.i];
      if (next !== undefined) {
        top.i += 1;
        if (!index.has(next)) {
          open(next);
          work.push({ v: next, i: 0 });
        } else if (onStack.has(next)) {
          low.set(top.v, Math.min(low.get(top.v) ?? 0, index.get(next) ?? 0));
        }
        continue;
      }
      work.pop();
      const parent = work[work.length - 1];
      if (parent) low.set(parent.v, Math.min(low.get(parent.v) ?? 0, low.get(top.v) ?? 0));
      if (low.get(top.v) !== index.get(top.v)) continue;
      const members: string[] = [];
      for (let w = stack.pop(); w !== undefined; w = stack.pop()) {
        onStack.delete(w);
        members.push(w);
        if (w === top.v) break;
      }
      found.push(members.sort());
    }
  }

  // Tarjan 은 싱크부터 뱉는다 — 뒤집으면 위상 순서.
  const sccs: Scc[] = found.reverse().map((members) => ({ id: members[0] ?? '', members }));
  const of = new Map<string, string>();
  for (const scc of sccs) for (const m of scc.members) of.set(m, scc.id);
  const out = new Map<string, string[]>();
  for (const scc of sccs) out.set(scc.id, []);
  for (const [v, kids] of adj) {
    const a = of.get(v) ?? v;
    for (const w of kids) {
      const b = of.get(w) ?? w;
      if (b !== a) out.get(a)?.push(b);
    }
  }
  for (const [id, kids] of out) out.set(id, [...new Set(kids)].sort());
  return { sccs, of, out };
}

const TOP_DIRS: Record<string, Band> = {
  app: 0, pages: 0, views: 0, screens: 0,
  components: 1,
  hooks: 2, services: 2,
  lib: 3, utils: 3, server: 3, db: 3, types: 3,
};

/**
 * 04 §7.2 ① 경로 패턴. 문서는 0→3 으로 적었지만 **좁은 패턴이 먼저**다 —
 * `app/api/**\/route.*` 를 `app/**` 뒤에 두면 API 라우트가 「화면」이 되고 `components/ui/**`
 * 를 `components/**` 뒤에 두면 공용 버튼이 「기능」이 된다. 목업의 12개 파일이 이 순서라야 맞다.
 */
export function patternBand(path: string): Band | null {
  const p = path.startsWith(SRC_PREFIX) ? path.slice(SRC_PREFIX.length) : path;
  const segs = p.split('/');
  const base = segs[segs.length - 1] ?? '';
  const top = segs.length > 1 ? segs[0] : undefined;

  // `**/api/**` — `app/api/**\/route.*` 를 포함한다. 라우트는 `app/**` 밑이어도 화면이 아니다.
  if (segs.slice(0, -1).includes('api')) return 2;
  if (top === 'components' && segs[1] === 'ui') return 3;
  if (top === 'features' && base.endsWith('.tsx')) return 1;
  const byTop = top === undefined ? undefined : TOP_DIRS[top];
  if (byTop !== undefined) return byTop;
  // `**/use*.ts` 를 글자 그대로 옮기면 `user.ts`·`users.ts` 까지 훅으로 본다. 훅 관용구인
  // `use` + 대문자만 받는다.
  if (/^use[A-Z][^/]*\.ts$/.test(base)) return 2;
  if (/Api\.[^./]+$/.test(base)) return 2;
  if (base.startsWith('schema')) return 3;
  return null;
}

// ───────── 리포 지도 (04 §7.5 · D142) ─────────

/**
 * 폴더 노드의 04 §7.2 ① 패턴 층. 파일용 `patternBand` 와 다른 점은 하나다 — **마지막**
 * `src/` 까지를 벗긴다.
 *
 * 04 §7.2 의 패턴은 리포 뿌리에 매달려 있는데 모노리포의 폴더 노드는
 * `apps/desktop/src/components/` 라서 앞을 안 벗기면 `components/**` 가 통째로 논다
 * (실측: `apps/desktop/src` 다섯 노드 전부 미매칭). 파일 쪽 규칙은 **건드리지 않는다** —
 * 이미 구운 카드의 밴드가 바뀌면 `contentHash` 가 전량 달라진다.
 */
export function folderBand(folder: string): Band | null {
  const at = folder.lastIndexOf(`/${SRC_PREFIX}`);
  const tail = at === -1 ? '' : folder.slice(at + 1 + SRC_PREFIX.length);
  return patternBand(tail === '' ? folder : tail);
}

/**
 * 안에 든 파일들이 **가장 많이** 앉은 층. 04 §7.2 ① 이 폴더 이름을 모를 때 쓴다.
 *
 * 최댓값도 최솟값도 아닌 이유는 둘 다 파일 하나에 끌려가기 때문이다 — 최댓값은 `.tsx`
 * 넷과 `types.ts` 하나가 든 기능 폴더를 통째로 「공용 · 데이터」로 가라앉히고(실측: 여섯
 * 노드 중 넷), 최솟값은 아무도 안 가져다 쓰는 파일 하나(깊이 0 → 「화면」)가 폴더를
 * 꼭대기로 끌어올린다. 동점이면 위쪽 — 아래로 밀 일은 `relax` 가 민다.
 */
const modeBand = (bands: readonly Band[]): Band => {
  const n = new Map<Band, number>();
  for (const b of bands) n.set(b, (n.get(b) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
};

/**
 * 파일 하나가 어느 폴더 노드로 접히는가. 접을 자리가 없으면(리포 뿌리 바로 밑 파일) 없다.
 *
 * **새 휴리스틱을 만들지 않는다.** 대지 판정은 `assignUnits`(03 §6.5 · D29) 그대로 — 홈이
 * 인쇄 시트를 세는 규칙과 지도가 폴더를 세는 규칙이 갈라지면 같은 리포의 두 그림이
 * 서로 다른 이야기를 한다. 어느 대지에도 안 드는 파일(`기타`, 뿌리 경로가 없다)만 제
 * 디렉터리로 접는다.
 */
export function repoFolders(paths: readonly string[]): Map<string, string> {
  const { units, byPath } = assignUnits([...paths]);
  const rootOf = new Map(units.map((u) => [u.name, u.rootPath]));
  const out = new Map<string, string>();
  for (const path of paths) {
    const root = rootOf.get(byPath.get(path) ?? '') ?? '';
    // 대지 이름이 같은 뿌리 둘(`app/cart/` 와 `features/cart/`)은 `assignUnits` 에서 한
    // 이름으로 합쳐지고 뿌리는 먼저 본 쪽이 이긴다. 그 뿌리 **밑에 있지 않은** 파일까지
    // 거기 접으면 폴더 노드가 제 안에 없는 파일을 품는다 — 그때는 제 디렉터리로 접는다.
    const under = root !== '' && (path === root || path.startsWith(`${root}/`));
    const dir = under ? root : dirOf(path);
    if (dir !== '') out.set(path, `${dir}/`);
  }
  return out;
}

/**
 * 이 리포에서 지도가 서는가 (D142).
 *
 * 대지가 `기타` 하나뿐이면 — `assignUnits` 의 네 규칙이 전부 물지 않았거나 2단계
 * 디렉터리가 `MIN_FILES_FOR_UNIT` 에 못 미쳤다는 뜻이다 — 접어 봐야 「기타」 한 덩어리라
 * 「이 프로젝트는 이런 구조구나」가 나오지 않는다. 지도가 안 서는 리포에 지도 문제를
 * 내면 틀린 지도를 정답이라고 우기게 된다.
 */
export function repoMapStands(paths: readonly string[]): boolean {
  return assignUnits([...paths]).units.some((u) => u.name !== OTHER_UNIT);
}

/**
 * 엣지 종의 세기. 폴더 쌍은 선 하나로 접는데, 같은 두 폴더 사이에 `static` 과 `type` 이
 * 둘 다 있으면 **실제로 실행되는 쪽**이 이긴다 — 점선으로 그려 놓고 「타입만 가져온다」고
 * 하면 거짓말이다.
 */
const KIND_RANK: readonly EdgeKind[] = ['static', 'http', 'dynamic', 'type'];

/** 파일 엣지를 폴더 쌍으로 집계한다. 쌍마다 한 선, 종은 가장 센 것. */
function foldEdges(
  edges: readonly Edge[],
  moved: ReadonlyMap<string, string>,
  alive: ReadonlySet<string>,
): Edge[] {
  const best = new Map<string, Edge>();
  for (const e of edges) {
    const from = moved.get(e.from) ?? e.from;
    const to = moved.get(e.to) ?? e.to;
    if (from === to || !alive.has(from) || !alive.has(to)) continue;
    const key = `${from} ${to}`;
    const had = best.get(key);
    if (had === undefined || KIND_RANK.indexOf(e.kind) < KIND_RANK.indexOf(had.kind)) {
      best.set(key, { from, to, kind: e.kind });
    }
  }
  return [...best.values()]
    .sort((a, b) => byPathAsc(a.from, b.from) || byPathAsc(a.to, b.to));
}

/** SCC 축약 DAG 에서 뿌리로부터의 최장 경로 (04 §7.2 ②). 대지 진입점은 언제나 깊이 0. */
function sccDepths(sccs: readonly Scc[], out: ReadonlyMap<string, string[]>, root: string): Map<string, number> {
  const forced = new Set(sccs.filter((s) => s.members.some((m) => isUnitEntry(m, root))).map((s) => s.id));
  const depth = new Map<string, number>();
  // `sccs` 가 위상 순서라 한 바퀴면 최장 경로가 확정된다.
  for (const scc of sccs) {
    const here = forced.has(scc.id) ? 0 : depth.get(scc.id) ?? 0;
    depth.set(scc.id, here);
    for (const kid of out.get(scc.id) ?? []) depth.set(kid, Math.max(depth.get(kid) ?? 0, here + 1));
  }
  return depth;
}

/** 그 밴드 파일들의 최장 공통 디렉터리 (04 §7.2 마지막 문장). 없으면 빈 문자열. */
function commonDir(paths: readonly string[]): string {
  const dirs = paths.map((p) => (p.endsWith('/') ? p.slice(0, -1) : dirOf(p)).split('/').filter(Boolean));
  let common = dirs[0] ?? [];
  for (const segs of dirs) {
    let i = 0;
    while (i < common.length && i < segs.length && common[i] === segs[i]) i += 1;
    common = common.slice(0, i);
  }
  return common.length > 0 ? `${common.join('/')}/` : '';
}

const median = (xs: readonly number[]): number => {
  const m = xs.length >> 1;
  return xs.length % 2 === 1 ? xs[m] ?? 0 : ((xs[m - 1] ?? 0) + (xs[m] ?? 0)) / 2;
};

/**
 * 초기 = 경로 사전순 → 무게중심 스윕 아래 2회·위 2회, 동점은 경로 사전순 (04 §7.3).
 *
 * x 는 밴드 안 색인으로 센다. 이웃은 방향을 가리지 않는다 — 역방향(아래→위) 엣지도 선이
 * 꼬이는 건 마찬가지다. 볼 이웃이 없는 노드는 제 색인을 키로 삼아 제자리에 남는다.
 */
function orderRows(rows: string[][], band: ReadonlyMap<string, Band>, edges: readonly Edge[]): void {
  const nb = new Map<string, string[]>();
  for (const e of edges) {
    pushTo(nb, e.from, e.to);
    pushTo(nb, e.to, e.from);
  }
  const pos = new Map<string, number>();
  const reindex = (row: readonly string[]): void => { row.forEach((p, i) => pos.set(p, i)); };
  rows.forEach(reindex);
  const sweep = (down: boolean): void => {
    for (const r of down ? [1, 2, 3] : [2, 1, 0]) {
      const row = rows[r];
      if (!row || row.length < 2) continue;
      const key = new Map<string, number>();
      row.forEach((p, i) => {
        const xs = (nb.get(p) ?? [])
          .filter((q) => { const b = band.get(q); return b !== undefined && (down ? b < r : b > r); })
          .map((q) => pos.get(q) ?? 0)
          .sort((a, b) => a - b);
        key.set(p, xs.length > 0 ? median(xs) : i);
      });
      row.sort((a, b) => (key.get(a) ?? 0) - (key.get(b) ?? 0) || byPathAsc(a, b));
      reindex(row);
    }
  };
  sweep(true);
  sweep(true);
  sweep(false);
  sweep(false);
}

/** 살아 있는 노드 사이의 엣지만, 자기 자신은 버리고, 중복 없이, 사전순으로. */
function normalizeEdges(edges: readonly Edge[], alive: ReadonlySet<string>): Edge[] {
  const seen = new Set<string>();
  const out: Edge[] = [];
  for (const e of edges) {
    const key = `${e.from} ${e.to} ${e.kind}`;
    if (e.from === e.to || !alive.has(e.from) || !alive.has(e.to) || seen.has(key)) continue;
    seen.add(key);
    out.push({ from: e.from, to: e.to, kind: e.kind });
  }
  return out.sort((a, b) =>
    byPathAsc(a.from, b.from) || byPathAsc(a.to, b.to) || byPathAsc(a.kind, b.kind));
}

/** 노드별 들어오는·나가는 엣지 수. 고립 판정과 「밴드 3 잎」 판정이 같은 것을 본다. */
function degrees(edges: readonly Edge[]): Map<string, { i: number; o: number }> {
  const deg = new Map<string, { i: number; o: number }>();
  const at = (p: string): { i: number; o: number } => {
    const v = deg.get(p) ?? { i: 0, o: 0 };
    deg.set(p, v);
    return v;
  };
  for (const e of edges) { at(e.from).o += 1; at(e.to).i += 1; }
  return deg;
}

// ───────── 본체 ─────────

export function buildGraph(input: GraphInput): Graph {
  const keep = new Set(input.keep ?? []);
  const isNew = new Set(input.newFiles ?? []);
  const root = input.unitRoot.replace(/\/+$/, '');

  // 0. 정규화. 입력 순서가 결과를 바꾸면 04 §9 의 결정성이 깨진다 — 여기서 한 번만 줄 세운다.
  const byPath = new Map<string, GraphFile>();
  for (const f of input.files) if (!byPath.has(f.path)) byPath.set(f.path, f);
  const paths = [...byPath.keys()].sort();
  let edges = normalizeEdges(input.edges, new Set(paths));

  // 1. 순환 — 크기 > 1 인 SCC 의 멤버.
  const { sccs, of, out } = condense(paths, edges);
  let cycles = new Set<string>();
  for (const scc of sccs) if (scc.members.length > 1) for (const m of scc.members) cycles.add(m);

  // 2. 고립 — in=out=0 은 지도에서 뺀다. 진입점은 남긴다(04 §7.2). 정답지 파일도 남긴다:
  //    core 가 지도에 없으면 그 문제는 애초에 성립하지 않는다.
  const deg0 = degrees(edges);
  let offMap = 0;
  let live = paths.filter((p) => {
    const d = deg0.get(p);
    if ((d && (d.i > 0 || d.o > 0)) || isEntry(p) || keep.has(p)) return true;
    offMap += 1;
    return false;
  });

  // 3. 밴드 — ① 경로 패턴이 먼저, 미매칭은 ② 깊이 폴백.
  const band = new Map<string, Band>();
  const fixed = new Set<string>();
  for (const p of live) {
    const b = patternBand(p);
    if (b !== null) {
      band.set(p, b);
      fixed.add(p);
    }
  }
  const depth = sccDepths(sccs, out, root);
  for (const p of live) if (!fixed.has(p)) band.set(p, clampBand(depth.get(of.get(p) ?? p) ?? 0));
  // `band ≥ 모든 importer 의 band`. 패턴 밴드는 고정이라 안 움직인다. 이 규칙은 내리기만
  // 하고(밴드 번호는 커지기만 한다) 밴드는 0..3 이므로 네 바퀴 안에 더 내려갈 곳이 없다.
  // 접기(3-5) 뒤에 폴더 노드로 한 번 더 돌린다 — 층 규칙은 노드가 무엇이든 같다.
  const relax = (holdPattern: boolean): void => {
    for (let round = 0; round < BANDS; round += 1) {
      let moved = false;
      for (const e of edges) {
        const from = band.get(e.from);
        const to = band.get(e.to);
        if ((holdPattern && fixed.has(e.to)) || from === undefined || to === undefined
          || to >= from) continue;
        band.set(e.to, from);
        moved = true;
      }
      if (!moved) break;
    }
  };
  relax(true);

  // 접힌 폴더 노드 → 그 안의 파일. 3-5(리포 지도)와 4(24 노드 상한)가 같은 표를 쓴다.
  const foldedOf: Record<string, string[]> = {};

  // 3-5. 리포 지도 — 노드가 파일이 아니라 대지·폴더다 (04 §7.5 · D142).
  //
  //      **밴드가 정해진 뒤에 접는다.** 폴더 경로에 `patternBand` 를 다시 물으면
  //      `src/features/cart/` 처럼 04 §7.2 ① 이 이름으로 모르는 폴더가 통째로 깊이
  //      폴백으로 떨어진다 — 안에 있는 `*.tsx` 는 패턴이 「기능」이라고 이미 말했는데도.
  //      층은 안에 든 파일들의 층에서 나와야 한다.
  if (input.scope === 'repo') {
    const moved = repoFolders(live);
    if (moved.size > 0) {
      for (const p of live) {
        const folder = moved.get(p);
        if (folder === undefined) continue;
        const bucket = foldedOf[folder];
        if (bucket) bucket.push(p);
        else foldedOf[folder] = [p];
      }
      // 폴더의 층 — 04 §7.2 ① 이 **폴더 이름**을 아는 경우(`lib/`·`components/`·`hooks/`·
      // `app/**`)에는 그것이 이기고, 모르면 안에 든 파일이 앉은 가장 위 층에서 시작한다.
      // 안 파일들의 최댓값을 쓰면 `.tsx` 넷과 `types.ts` 하나가 든 기능 폴더가 통째로
      // 「공용 · 데이터」로 가라앉는다 — 실측에서 여섯 노드 중 넷이 그렇게 됐다.
      // 아래로 밀 일이 있으면 `relax` 가 민다. 폴더는 고정하지 않는다: 패턴이 말한 층과
      // 지도가 앉힌 층이 **갈리는 것을 보이게** 두어야 「왜 있나」 문제의 게이트가 일한다.
      for (const [folder, inside] of Object.entries(foldedOf)) {
        inside.sort(byPathAsc);
        band.set(folder, folderBand(folder)
          ?? modeBand(inside.map((m) => band.get(m) ?? 0)));
      }
      live = [...new Set(live.map((p) => moved.get(p) ?? p))].sort(byPathAsc);
      edges = foldEdges(edges, moved, new Set(live));
      relax(false);

      // 고립을 폴더 단위로 다시 센다. 폴더 안에서 닫힌 import 는 접히면서 자기 고리가 되어
      // 사라지므로, 파일로는 고립이 아니었던 폴더가 폴더로는 고립일 수 있다.
      const deg = degrees(edges);
      live = live.filter((p) => {
        const d = deg.get(p);
        if (d !== undefined && (d.i > 0 || d.o > 0)) return true;
        offMap += foldedOf[p]?.length ?? 1;
        delete foldedOf[p];
        return false;
      });
      edges = normalizeEdges(edges, new Set(live));

      // 순환도 폴더 단위로 다시 센다. 한 폴더 안에서 닫힌 파일 순환은 「두 폴더가 서로를
      // 가져다 쓴다」가 아니다 — `⟲` 배지가 지도가 말하는 것과 다른 이야기를 하면 안 된다.
      cycles = new Set<string>();
      for (const scc of condense(live, edges).sccs) {
        if (scc.members.length > 1) for (const m of scc.members) cycles.add(m);
      }
    }
  }

  // 4. 24 노드 상한 ① — 대지 밖 노드를 디렉터리로 접는다 (04 §7.4).
  if (live.length > MAX_NODES) {
    const groups = new Map<string, string[]>();
    for (const p of live) {
      if (byPath.get(p)?.inUnit !== false || keep.has(p) || isUnitEntry(p, root)) continue;
      const dir = dirOf(p);
      if (dir !== '') pushTo(groups, dir, p); // 뿌리 바로 밑 파일은 접을 디렉터리가 없다
    }
    // 많이 줄어드는 폴더부터 — 24 를 맞추는 데 접히는 파일이 적을수록 지도가 덜 뭉개진다.
    const order = [...groups.entries()]
      .filter(([, members]) => members.length > 1)
      .sort((a, b) => b[1].length - a[1].length || byPathAsc(a[0], b[0]));
    const moved = new Map<string, string>();
    for (const [dir, members] of order) {
      if (live.length <= MAX_NODES) break;
      const folder = `${dir}/`;
      foldedOf[folder] = [...members].sort();
      for (const m of members) moved.set(m, folder);
      // 폴더는 안의 어느 파일보다 얕지 않다 — `band ≥ importer` 를 안 깨는 유일한 선택.
      band.set(folder, clampBand(Math.max(...members.map((m) => band.get(m) ?? 0))));
      live = [...live.filter((p) => !moved.has(p)), folder].sort();
    }
    if (moved.size > 0) {
      edges = normalizeEdges(
        edges.map((e) => ({ ...e, from: moved.get(e.from) ?? e.from, to: moved.get(e.to) ?? e.to })),
        new Set(live),
      );
    }
  }

  // 5. 24 노드 상한 ② — 정답지 밖 · in-degree 1 인 밴드 3 잎을 지도 밖으로.
  //    「잎」은 나가는 엣지가 없는 노드로 읽는다. 하나 빼면 그 위가 새 잎이라 매번 다시 센다.
  while (live.length > MAX_NODES) {
    const deg = degrees(edges);
    const victim = live.find((p) => {
      const d = deg.get(p);
      if (keep.has(p) || isUnitEntry(p, root) || band.get(p) !== 3) return false;
      return d !== undefined && d.i === 1 && d.o === 0;
    });
    if (victim === undefined) break;
    offMap += foldedOf[victim]?.length ?? 1;
    delete foldedOf[victim];
    live = live.filter((p) => p !== victim);
    edges = edges.filter((e) => e.from !== victim && e.to !== victim);
  }

  // 5-2. ①도 ②도 물지 않는 입력이 남는다 — 전부 대지 안이거나(접을 것이 없다) 잎이 밴드 3
  //      이 아닐 때다. 04 §7.4 에는 세 번째 걸음이 없지만 「한 문제 지도 ≤ 24 노드」는 상한이지
  //      권고가 아니다(00 §5 의 게이트). 여기서 멈추면 25번째 노드가 화면 밖으로 흘러 지도가
  //      스크롤 상자가 된다 — 「30초만 훑어보는 그림」이라는 전제가 깨진다.
  //
  //      빼는 순서는 「덜 중요한 것부터」다: 정답지(`keep`)와 대지 진입점은 끝까지 남기고,
  //      그다음 대지 밖 · 아래 밴드 · 차수 낮은 순 · 경로 사전순으로 뺀다. 마지막 둘이
  //      난수 없이 순서를 완전히 결정한다 (04 §9).
  if (live.length > MAX_NODES) {
    const deg = degrees(edges);
    // 값이 작을수록 먼저 빠진다. **차수가 대지 소속보다 앞이다**: 이 자리에서 남겨야 하는
    // 것은 「내 파일」이 아니라 **지도의 뼈대**다. `projectox-like` 의 `gen` 대지가 그 반례였다 —
    // 서비스 파일 30개가 전부 `core/time.ts` 하나를 가리키는 별 모양인데, 대지 소속을 앞에
    // 두면 대지 밖인 그 허브가 **가장 먼저** 빠지고 엣지가 통째로 사라진다. 잎을 빼는 것이
    // 축약이지 허브를 빼는 것은 지도를 지우는 것이다.
    const rank = (p: string): number[] => [
      keep.has(p) || isUnitEntry(p, root) ? 1 : 0,
      (deg.get(p)?.i ?? 0) + (deg.get(p)?.o ?? 0),
      byPath.get(p)?.inUnit === true ? 1 : 0,
      -(band.get(p) ?? 0),
    ];
    const doomed = [...live]
      .sort((a, b) => {
        const [ra, rb] = [rank(a), rank(b)];
        for (let i = 0; i < ra.length; i += 1) {
          const diff = (ra[i] as number) - (rb[i] as number);
          if (diff !== 0) return diff;
        }
        return byPathAsc(a, b);
      })
      .slice(0, live.length - MAX_NODES);
    for (const victim of doomed) {
      offMap += foldedOf[victim]?.length ?? 1;
      delete foldedOf[victim];
    }
    const gone = new Set(doomed);
    live = live.filter((p) => !gone.has(p));
    edges = edges.filter((e) => !gone.has(e.from) && !gone.has(e.to));
  }

  // 6. 밴드 라벨. 파일이 없는 밴드도 자리를 지킨다 — `files` 의 `r` 이 이 배열의 색인이다.
  const rows: string[][] = Array.from({ length: BANDS }, () => []);
  for (const p of live) rows[band.get(p) ?? 0]?.push(p);
  for (const row of rows) row.sort(byPathAsc);
  const names = bandNames();
  const bands = rows.map((row, r) => ({ l: names[r] ?? '', s: commonDir(row) }));

  // 7. 밴드 안 순서를 그대로 `files` 배열 순서로 굽는다.
  orderRows(rows, band, edges);
  // exactOptionalPropertyTypes — 참일 때만 키를 넣어야 `contentHash` 가 안정된다.
  const files: Graph['files'] = rows.flatMap((row, r) => row.map((p) => {
    const node: Graph['files'][number] = { p, r: r as Band };
    if (isNew.has(p)) node.isNew = true;
    const inside = foldedOf[p];
    if (inside) node.folded = inside.length;
    if (cycles.has(p) || inside?.some((m) => cycles.has(m))) node.cycle = true;
    return node;
  }));

  return {
    bands,
    files,
    edges: edges.map((e): [string, string, EdgeKind] => [e.from, e.to, e.kind]),
    offMap,
    foldedOf,
  };
}
