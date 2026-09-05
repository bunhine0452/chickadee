/**
 * 요청 줄기 행 → 문항 생성기의 `Hop[][]` (D172 ②).
 *
 * `request_hop` 은 메서드 단위 줄기(D168)를 저장한 것이고, 문항 생성기(D164)는 파일 단위
 * `Hop` — 「이 파일, 다음 칸으로 넘어가는 줄, 그 간선의 종류」 — 를 받는다. 둘 사이의
 * 변환이 여기다. 순수 함수만 있다.
 *
 * 등뼈(`trunk`)만 넘긴다: 곁가지(`log.info` · DTO 빌더)는 「무엇이 언제 도나」의 순서를 재는
 * 데 잡음이고, 화면이 보여 줄 줄 범위는 곁가지까지 `hopRanges` 가 따로 낸다.
 */
import { trunk, type Hop, type MethodHop } from '@chickadee/concepts';
import type { EdgeKind } from '@chickadee/store-sql';

export type HopKind = 'call' | 'http' | 'mapper' | null;

/** `path.hops` 의 행. `called_line` 은 **앞 칸의 파일**에서 이 칸을 부른 줄이다. */
export interface HopRow {
  ord: number;
  path: string;
  name: string;
  line_start: number;
  line_end: number;
  called_line: number | null;
  depth: number;
  kind: HopKind;
}

/**
 * 행을 `MethodHop` 으로 되돌린다. 저장은 `calledAt.path` 를 싣지 않는데, 깊이 우선 순서라
 * **직전의 한 단계 얕은 칸**이 곧 부른 칸이다 — `methodPaths` 가 그 순서로 밀어 넣었다.
 */
export function toMethodHops(rows: readonly HopRow[]): MethodHop[] {
  const out: MethodHop[] = [];
  for (const r of [...rows].sort((a, b) => a.ord - b.ord)) {
    let calledAt: MethodHop['calledAt'] = null;
    if (r.called_line !== null) {
      for (let i = out.length - 1; i >= 0; i -= 1) {
        const prev = out[i] as MethodHop;
        if (prev.depth === r.depth - 1) {
          calledAt = { path: prev.path, line: r.called_line };
          break;
        }
      }
    }
    out.push({
      path: r.path, name: r.name, lineStart: r.line_start, lineEnd: r.line_end,
      calledAt, depth: r.depth, kind: r.kind,
    });
  }
  return out;
}

/** 호출 그래프의 간선 종류 → `import_edge.kind`. 매퍼 결합은 이름으로 묶이는 것이라 `dynamic` 이다. */
const EDGE_OF: Readonly<Record<'call' | 'http' | 'mapper', EdgeKind>> = {
  call: 'static', http: 'http', mapper: 'dynamic',
};

/**
 * 등뼈를 문항의 `Hop[]` 으로. 칸 i 의 `line` 은 **칸 i+1 을 부른 줄**이고 마지막 칸은 `null` —
 * `stage-types.ts` 의 `Hop` 계약 그대로다. 같은 파일이 연달아 오면(같은 클래스의 두 메서드)
 * 한 칸으로 접는다 — 파일 단위 문항에서 같은 노드가 둘이면 순서가 성립하지 않는다.
 */
export function trunkHops(hops: readonly MethodHop[]): Hop[] {
  const chain = trunk(hops);
  const out: Hop[] = [];
  for (let i = 0; i < chain.length; i += 1) {
    const at = chain[i] as MethodHop;
    const next = chain[i + 1];
    const hop: Hop = {
      path: at.path,
      line: next?.calledAt?.line ?? null,
      kind: next?.kind ? EDGE_OF[next.kind] : null,
    };
    const last = out[out.length - 1];
    if (last !== undefined && last.path === hop.path) {
      out[out.length - 1] = hop;
      continue;
    }
    out.push(hop);
  }
  return out;
}

export interface LineRange {
  path: string;
  from: number;
  to: number;
}

/** 같은 파일의 겹치거나 맞닿은 범위를 합친다. 경로·시작 줄 순. */
export function mergeRanges(ranges: readonly LineRange[]): LineRange[] {
  const sorted = [...ranges].sort((a, b) => a.path.localeCompare(b.path) || a.from - b.from);
  const out: LineRange[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last !== undefined && last.path === r.path && r.from <= last.to + 1) {
      last.to = Math.max(last.to, r.to);
      continue;
    }
    out.push({ ...r });
  }
  return out;
}

/** 줄기의 칸(정의 줄 범위)에 `pad` 줄을 더한 읽기 범위 — 곁가지까지 전부다. */
export function hopRanges(paths: readonly (readonly MethodHop[])[], pad = 0): LineRange[] {
  const raw: LineRange[] = [];
  for (const hops of paths) {
    for (const h of hops) {
      raw.push({ path: h.path, from: Math.max(1, h.lineStart - pad), to: h.lineEnd + pad });
      if (h.calledAt !== null) {
        raw.push({ path: h.calledAt.path, from: Math.max(1, h.calledAt.line - pad), to: h.calledAt.line + pad });
      }
    }
  }
  return mergeRanges(raw);
}
