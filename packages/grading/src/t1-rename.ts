/**
 * 11단계 — 전역 치환 3조건 + 검증 ④ (04 §4.3).
 *
 * 「지역 변수명을 일관되게 바꾼 것은 같은 뜻」을 판정한다. 세 조건과 검증 하나가 각각
 * 다른 거짓 통과를 막는다:
 *
 * - ① `|fwd[a]| = 1` · ② `|bwd[b]| = 1` — 한 이름을 자리마다 다르게 바꾼 답안을 막는다.
 * - ③ `b ∉ ORIG` — **스왑 버그**. 이것이 없으면 `submit(password, email)` 이 「email→password,
 *   password→email 치환」으로 통과한다. 이름 맞바꿈은 뜻이 바뀌므로 어떤 규칙으로도 동등이
 *   될 수 없다(04 §5 「절대 동등이 될 수 없는 목록」).
 * - ④ `a ∈ ANS` — 원본 이름이 답안에 그대로 남아 있다. 이것이 없으면 `email` 을 **한 줄만**
 *   `mail` 로 바꾼 답안이 통과한다(목업 누락).
 *
 * ④는 **범위를 보지 않는다**. 서로 다른 스코프의 같은 이름(함수 매개변수 `e` 와 화살표
 * 매개변수 `e`)을 한쪽만 바꾸면 「일관되지 않다」로 잡힌다. 스코프를 보려면 AST 가 필요하고
 * 그것은 승격층(04 §4.5)의 일이다 — 여기서 놓치는 쪽으로 기울이면 한 줄만 바꾼 답안이
 * 통과하므로, 04 §4.3 이 적은 그대로 보수적으로 둔다.
 */
import type { Reason, T1Row } from './t1-types.js';

export interface RenameInput {
  /** 아직 `pending` 인 행들 — 자리마다 이름만 달랐던 짝. */
  rows: readonly T1Row[];
  /** 04 §4.3 `ORIG` — 원본 블록의 식별자 ∪ 파일 모듈 수준 선언명. */
  orig: ReadonlySet<string>;
  /** 04 §4.3 `ANS` — 답안 전체 식별자 중 PROT 자리가 아닌 것. */
  ans: ReadonlySet<string>;
}

export interface RenameVerdict {
  status: 'equiv' | 'differ';
  reasons: Reason[];
  swap: boolean;
}

/** `pending` 행마다의 판정. 행을 고치지 않고 판정만 돌려준다 — 조립은 `t1-result.ts` 가 한다. */
export function judgeRenames(input: RenameInput): Map<number, RenameVerdict> {
  const fwd = new Map<string, Set<string>>();
  const bwd = new Map<string, Set<string>>();

  for (const row of input.rows) {
    for (const [a, b] of row.maps) {
      const f = fwd.get(a) ?? new Set<string>();
      f.add(b);
      fwd.set(a, f);
      const r = bwd.get(b) ?? new Set<string>();
      r.add(a);
      bwd.set(b, r);
    }
  }

  const out = new Map<number, RenameVerdict>();
  for (const row of input.rows) {
    out.set(row.oi, judgeOne(row.maps, fwd, bwd, input.orig, input.ans));
  }
  return out;
}

function judgeOne(
  maps: readonly [string, string][],
  fwd: ReadonlyMap<string, ReadonlySet<string>>,
  bwd: ReadonlyMap<string, ReadonlySet<string>>,
  orig: ReadonlySet<string>,
  ans: ReadonlySet<string>,
): RenameVerdict {
  let consistent = true;
  let swap = false;
  let leftover = false;

  for (const [a, b] of maps) {
    if ((fwd.get(a)?.size ?? 0) !== 1 || (bwd.get(b)?.size ?? 0) !== 1) consistent = false;
    if (orig.has(b)) {
      consistent = false;
      swap = true;
    }
    if (ans.has(a)) {
      consistent = false;
      leftover = true;
    }
  }

  if (consistent) {
    const pairs = maps.map(([a, b]) => `${a} → ${b}`).join(', ');
    return { status: 'equiv', reasons: [{ code: 'RENAME', detail: pairs }], swap: false };
  }
  if (swap) {
    const pairs = maps.filter(([, b]) => orig.has(b)).map(([a, b]) => `${a} ↔ ${b}`).join(', ');
    return { status: 'differ', reasons: [{ code: 'SWAP', detail: pairs }], swap: true };
  }
  const detail = leftover
    ? maps.filter(([a]) => ans.has(a)).map(([a]) => a).join(', ')
    : maps.map(([a, b]) => `${a} → ${b}`).join(', ');
  return {
    status: 'differ',
    reasons: [{ code: 'RENAME_INCONSISTENT', detail }],
    swap: false,
  };
}
