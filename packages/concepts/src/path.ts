/**
 * 요청 한 줄기 — 2단 추적의 재료 (D162 · `docs/program/exercises.md` §2 `hop`).
 *
 * 「버튼을 누르면 어느 파일 어느 줄이 순서대로 도나」에 답하려면 폐포가 아니라 **한 줄기**가
 * 있어야 한다. 폐포는 스무 파일이 뭉친 덩어리이고 순서가 없다.
 *
 * 줄기는 진입점에서 **가장 멀리** 닿는 곳까지의 경로다. 왜 가장 먼 곳인가 — 요청은 화면에서
 * 시작해 저장소에서 끝나고, 그 사이가 학습자가 봐야 하는 전부다. 짧은 갈래(DTO 한 장을 쓰고
 * 마는 것)를 고르면 「유기적으로 연결되어 있다」가 안 보인다.
 *
 * **지금 한계 — 첫 칸만 요청별이고 꼬리는 기능별이다.** 간선이 파일 단위라 로그인과 회원가입이
 * 두 번째 칸부터 같은 줄기를 쓴다. 줄 번호도 그 요청을 처리하는 메서드가 아니라 **import 줄**이다.
 * 메서드 단위로 내리려면 호출 그래프가 필요하고(`AuthController.login` → `AuthService.login` →
 * `UserDao.findByLoginId` → 매퍼의 `id="findByLoginId"`), 매퍼의 `id` 가 DAO 메서드 이름과
 * 글자 그대로 같다는 것이 그 실마리다 (D159 의 `_blocks.scm` 이 이미 그 이름을 잡는다).
 */
import type { BlockRef, CallEdge, CallGraph, CallKind } from './calls.js';
import type { ResolvedEdge } from './resolve-imports.js';

/** 줄기의 한 칸. */
export interface Hop {
  /** 이 칸의 파일. */
  path: string;
  /**
   * 다음 칸으로 넘어가는 글자가 적힌 줄 (1-based). 마지막 칸은 `null` —
   * 거기서 넘어가지 않는다.
   */
  line: number | null;
  /** 다음 칸으로 가는 간선의 종류. 마지막 칸은 `null`. */
  kind: ResolvedEdge['kind'] | null;
}

/**
 * 요청 하나마다 줄기 하나 — HTTP 호출 자리가 곧 요청이다.
 *
 * 기능당 하나로 접으면 안 된다: `authService.js` 는 같은 컨트롤러를 여섯 번 부르고
 * 그 여섯이 로그인·회원가입·로그아웃…이다. 접으면 첫 호출이 기능 전체를 대표하게 되고
 * 실측에서 그것이 `signup` 이었다.
 */
export function requestPaths(edges: readonly ResolvedEdge[]): Hop[][] {
  const out: Hop[][] = [];
  for (const call of edges.filter((e) => e.kind === 'http')) {
    const rest = pathFrom(call.to, edges);
    // 둘째 칸은 **라우트가 선언된 줄**이다 — 없으면 `import` 줄을 가리켜 로그인과 회원가입이
    // 같은 자리를 보게 된다 (D162).
    const [entered, ...tail] = rest;
    const second: Hop[] = entered === undefined
      ? []
      : [{ ...entered, ...(call.toLine === undefined ? {} : { line: call.toLine }) }];
    out.push([{ path: call.from, line: call.line, kind: 'http' }, ...second, ...tail]);
  }
  return out.sort((a, b) => (a[0]?.path ?? '').localeCompare(b[0]?.path ?? '')
    || (a[0]?.line ?? 0) - (b[0]?.line ?? 0));
}

/** 진입점에서 가장 멀리 닿는 곳까지. 두 칸이 안 되면 문항이 안 되므로 빈 배열이다. */
export function featurePath(entry: string, edges: readonly ResolvedEdge[]): Hop[] {
  const rest = pathFrom(entry, edges);
  return rest.length > 1 ? rest : [];
}

function pathFrom(entry: string, edges: readonly ResolvedEdge[]): Hop[] {
  const out = new Map<string, ResolvedEdge[]>();
  for (const e of edges) out.set(e.from, [...(out.get(e.from) ?? []), e]);

  // 너비 우선이라 각 칸까지의 **최단** 경로가 잡힌다. 그래야 「이 줄기」가 유일해진다 —
  // 깊이 우선으로 가장 긴 것을 찾으면 같은 리포에서 실행마다 다른 줄기가 나올 수 있다.
  const parent = new Map<string, { from: string; edge: ResolvedEdge }>();
  const seen = new Set([entry]);
  let queue = [entry];
  let last = entry;
  while (queue.length > 0) {
    const next: string[] = [];
    // 같은 깊이에서는 경로 이름으로 끊는다 — 같은 입력에 같은 줄기가 나와야 한다.
    for (const at of [...queue].sort()) {
      for (const edge of [...(out.get(at) ?? [])].sort((a, b) => a.to.localeCompare(b.to))) {
        if (seen.has(edge.to)) continue;
        seen.add(edge.to);
        parent.set(edge.to, { from: at, edge });
        next.push(edge.to);
        last = edge.to;
      }
    }
    queue = next;
  }
  if (last === entry) return [{ path: entry, line: null, kind: null }];

  const back: Hop[] = [{ path: last, line: null, kind: null }];
  for (let at = last; parent.has(at); ) {
    const step = parent.get(at) as { from: string; edge: ResolvedEdge };
    back.push({ path: step.from, line: step.edge.line, kind: step.edge.kind });
    at = step.from;
  }
  return back.reverse();
}

// ───────── 메서드 단위 (D168) ─────────

/** 메서드 줄기의 한 칸. 파일이 아니라 **블록**이다 — 정의 줄 범위가 곧 화면이 보여 줄 줄이다. */
export interface MethodHop {
  path: string;
  name: string;
  lineStart: number;
  lineEnd: number;
  /** 이 칸을 부른 자리 — 앞 칸의 파일과 줄. 맨 위 칸은 `null`. */
  calledAt: { path: string; line: number } | null;
  /** 맨 위 칸이 0, 한 번 부를 때마다 +1. 화면은 이 값으로 들여쓴다. */
  depth: number;
  /** 이 칸으로 들어온 간선의 종류. 맨 위 칸은 `null`. */
  kind: CallKind | null;
}

/** 위로 몇 칸까지 오르나 — 화면 핸들러 → 스토어 → 서비스 셋이면 충분하고, 더 오르면 공유 부품이다. */
const UP_LIMIT = 4;
/** 아래로 몇 겹까지 내려가나. 실측 로그인이 라우트에서 매퍼까지 4겹이다. */
const DOWN_LIMIT = 8;
/** 줄기 한 개의 칸 상한 — 문항이 보여 줄 수 있는 양이다 (04 §8.3 의 노드 상한과 같은 뜻). */
const HOP_LIMIT = 24;

/**
 * HTTP 호출 자리마다 메서드 줄기 하나 (D168).
 *
 * 호출 자리에서 **위로** 호출자가 유일할 때만 오르고(`authService.login` ← `authStore.login`
 * ← `LandingView.handleSubmit`), 라우트 메서드에서 **아래로** 소스 순서 깊이 우선으로 내려간다
 * (`AuthController.login` → `AuthService.login` → `UserDao.findByLoginId` → `UserMapper#findByLoginId`
 * → … `JwtUtil.generateToken`). 사용자가 물은 「버튼을 누르면 어느 파일 어느 줄이 순서대로 도나」의
 * 답이 이 배열이다 — 파일 줄기(`requestPaths`)와 달리 로그인과 회원가입이 첫 칸부터 갈린다.
 *
 * 위로는 유일할 때만인 이유: 호출자가 둘이면 어느 화면에서 왔는지 코드가 말하지 않는다.
 * 아래로 깊이 우선인 이유: 그것이 실제 실행 순서다 — `findByLoginId` 가 끝나야 다음 줄이 돈다.
 */
export function methodPaths(graph: CallGraph): MethodHop[][] {
  const outOf = new Map<string, CallEdge[]>();
  const inOf = new Map<string, CallEdge[]>();
  for (const e of graph.edges) {
    outOf.set(keyOf(e.from), [...(outOf.get(keyOf(e.from)) ?? []), e]);
    inOf.set(keyOf(e.to), [...(inOf.get(keyOf(e.to)) ?? []), e]);
  }

  const out: MethodHop[][] = [];
  for (const http of graph.edges.filter((e) => e.kind === 'http')) {
    // 위로.
    const up: BlockRef[] = [http.from];
    const seenUp = new Set([keyOf(http.from)]);
    for (let i = 0; i < UP_LIMIT; i += 1) {
      const at = up[0] as BlockRef;
      const callers = (inOf.get(keyOf(at)) ?? []).filter((e) => e.kind === 'call');
      // 같은 파일의 호출자(회원가입 뒤 자동 로그인처럼 옆 함수가 부르는 것)는 화면이 아니다 —
      // 다른 파일의 호출자가 하나면 그쪽으로 오르고, 그것도 여럿이면 멈춘다.
      const cross = [...new Set(callers.filter((e) => e.from.path !== at.path).map((e) => keyOf(e.from)))];
      const distinct = [...new Set(callers.map((e) => keyOf(e.from)))];
      const chosen = cross.length === 1 ? cross[0] : distinct.length === 1 ? distinct[0] : undefined;
      if (chosen === undefined) break;
      const caller = (callers.find((e) => keyOf(e.from) === chosen) as CallEdge).from;
      if (seenUp.has(keyOf(caller))) break;
      seenUp.add(keyOf(caller));
      up.unshift(caller);
    }

    const hops: MethodHop[] = [];
    const visited = new Set<string>();
    const place = (block: BlockRef, calledAt: MethodHop['calledAt'], depth: number, kind: CallKind | null): boolean => {
      if (hops.length >= HOP_LIMIT) return false;
      visited.add(keyOf(block));
      hops.push({
        path: block.path, name: block.name, lineStart: block.lineStart, lineEnd: block.lineEnd,
        calledAt, depth, kind,
      });
      return true;
    };
    // 위 칸들: 각각이 다음 칸을 부른 줄이 `calledAt` 이다.
    up.forEach((block, i) => {
      if (i === 0) {
        place(block, null, 0, null);
        return;
      }
      const prev = up[i - 1] as BlockRef;
      const call = (outOf.get(keyOf(prev)) ?? []).find((e) => e.kind === 'call' && keyOf(e.to) === keyOf(block));
      place(block, { path: prev.path, line: call?.line ?? prev.lineStart }, i, 'call');
    });
    const base = up.length;
    place(http.to, { path: http.from.path, line: http.line }, base, 'http');

    // 아래로 — 소스 순서, 깊이 우선.
    const descend = (block: BlockRef, depth: number): void => {
      if (depth - base >= DOWN_LIMIT) return;
      const next = [...(outOf.get(keyOf(block)) ?? [])]
        .filter((e) => e.kind !== 'http')
        .sort((a, b) => a.line - b.line || byRef(a.to, b.to));
      for (const e of next) {
        if (visited.has(keyOf(e.to))) continue;
        if (!place(e.to, { path: block.path, line: e.line }, depth + 1, e.kind)) return;
        descend(e.to, depth + 1);
      }
    };
    descend(http.to, base);
    out.push(hops);
  }
  return out.sort((a, b) => cmpHop(a[0], b[0]) || cmpHop(a[a.length - 1], b[b.length - 1]));
}

/**
 * 줄기의 **등뼈** — 맨 위 칸에서 첫 매퍼 문(SQL)까지. 매퍼가 없으면 가장 깊은 칸까지.
 * 2단 `hop` 문항이 순서를 묻는 것은 이 등뼈다 — 곁가지(`log.info`·DTO 빌더)는 순서를 재는 데
 * 잡음이다. 첫 매퍼인 이유: 요청은 화면에서 시작해 **저장소에서 끝난다** (`requestPaths` 와 같은 뜻).
 */
export function trunk(hops: readonly MethodHop[]): MethodHop[] {
  if (hops.length === 0) return [];
  const end = hops.find((h) => h.kind === 'mapper')
    ?? hops.reduce((best, h) => (h.depth > best.depth ? h : best), hops[0] as MethodHop);
  const chain: MethodHop[] = [end];
  for (let at = end; at.calledAt !== null;) {
    const called = at.calledAt;
    const prev = hops.find((h) => h.path === called.path && h.lineStart <= called.line && called.line <= h.lineEnd && h.depth === at.depth - 1);
    if (prev === undefined) break;
    chain.unshift(prev);
    at = prev;
  }
  return chain;
}

const keyOf = (b: BlockRef): string => `${b.path}:${b.lineStart}`;
const cmpStr = (a: string, b: string): number => (a < b ? -1 : Number(a > b));
const byRef = (a: BlockRef, b: BlockRef): number => cmpStr(a.path, b.path) || a.lineStart - b.lineStart;
const cmpHop = (a: MethodHop | undefined, b: MethodHop | undefined): number =>
  cmpStr(a?.path ?? '', b?.path ?? '') || (a?.lineStart ?? 0) - (b?.lineStart ?? 0);
