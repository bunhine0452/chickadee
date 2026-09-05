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
