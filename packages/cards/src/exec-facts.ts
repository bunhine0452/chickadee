/**
 * 실행 추적의 재료 — AST 하나에서 「무엇이 언제 도나」를 뽑는 층 (D151).
 *
 * **왜 이 층이 따로 있나.** 초보의 능력은 추적 → 설명 → 쓰기 순으로 붙는데(BRACElet) 우리
 * 트랙은 T0 어휘 → T1 필사(=쓰기) → T2 구조라 추적이 통째로 없다. 그 구멍을 메우는 문항의
 * 정답지가 여기서 나온다. 출제(`t0-exec.ts`)와 가른 이유는 하나다 — **이 층이 안정적이지
 * 않으면 얹을 개념을 줄여야 하고, 그 판단을 판 모양과 섞지 않으려면 따로 재야 한다.**
 *
 * 지키는 규칙 하나: **여기서 나오는 사실은 트리만으로 100% 확실해야 한다.** 「아마 이럴
 * 것이다」는 정답지가 될 수 없다 — 정본 §2 가 T0 를 실행 없이 채점한다고 못박았고, 흔들리는
 * 정답지는 오답 진단(정본 §3-2 「그것이 참이 되는 조건」)을 쓸 수 없게 만든다. 그래서 이
 * 파일은 **모르면 안 낸다** — 판정이 애매한 자리는 전부 후보에서 뺀다.
 */
// `AstLite` 는 `store-sql` 이 타입만 재수출한다 — `cards` 는 `ipc-client` 를 못 부른다
// (01 §2 의존 방향, eslint 가 강제). `t1-spec.ts` 가 같은 관용구를 쓴다.
import type { AstLite } from '@chickadee/store-sql';

/**
 * 문법마다 다른 노드 이름표. **코드가 아니라 데이터로 둔다** — 파이썬(D152)이 들어올 때
 * 고칠 것이 이 표 한 줄이어야 한다.
 *
 * 이름은 전부 `fixtures/golden` 의 `nodeKind` 에서 확인한 것이다(추측 금지).
 */
export interface Dialect {
  /** 실행 단위가 줄지어 있는 자루. */
  block: ReadonlySet<string>;
  /** 그 자리에서 흐름을 끊는 것 — 뒤에 오는 형제는 도달하지 않는다. */
  terminator: ReadonlySet<string>;
  /** 안쪽이 조건·반복에 걸린 것. 「무조건 돈다」에서 뺀다. */
  branching: ReadonlySet<string>;
  /**
   * 본문이 부를 때 도는 것. 정의는 실행이 아니다.
   *
   * **이름 있는 노드만 본다.** TS 문법에서 `function` 은 함수식의 종류이면서 동시에 `function`
   * 키워드의 **익명 노드 이름**이라(`fixtures/golden/t1/ast/14-ast-block.json` 에서 확인),
   * 이름을 안 보면 키워드 하나를 함수 하나로 센다.
   */
  fn: ReadonlySet<string>;
}

const ts: Dialect = {
  block: new Set(['statement_block']),
  terminator: new Set(['return_statement', 'throw_statement', 'break_statement', 'continue_statement']),
  branching: new Set([
    'if_statement', 'while_statement', 'for_statement', 'for_in_statement',
    'do_statement', 'switch_statement', 'try_statement',
  ]),
  fn: new Set(['function_declaration', 'function_expression', 'function', 'arrow_function', 'method_definition']),
};

/** 파이썬 (D152). 아직 개념을 안 얹었으므로 표만 서 있다. */
const py: Dialect = {
  block: new Set(['block']),
  terminator: new Set(['return_statement', 'raise_statement', 'break_statement', 'continue_statement']),
  branching: new Set([
    'if_statement', 'while_statement', 'for_statement', 'try_statement',
    'with_statement', 'match_statement',
  ]),
  fn: new Set(['function_definition', 'lambda']),
};

export const DIALECTS: Readonly<Record<string, Dialect>> = {
  typescript: ts, tsx: ts, javascript: ts, python: py,
};

export const dialectOf = (grammar: string): Dialect | null => DIALECTS[grammar] ?? null;

/**
 * 바이트 오프셋 → 1-based 줄 번호. 줄 시작 표를 한 번 만들고 이분 탐색한다.
 *
 * **바이트로 센다.** tree-sitter 의 `start`·`end` 는 바이트 오프셋인데 JS 문자열 인덱스는
 * UTF-16 단위다. 이 리포는 한국어 주석이 정본이라(D117) 소스에 멀티바이트가 흔하고, 문자로
 * 세면 주석 한 줄 아래부터 줄 번호가 통째로 밀린다.
 */
export function lineIndex(src: string): (offset: number) => number {
  const bytes = new TextEncoder().encode(src);
  const starts = [0];
  for (let i = 0; i < bytes.length; i += 1) if (bytes[i] === 0x0a) starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if ((starts[mid] as number) <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
}

/**
 * 이 노드가 품은 첫 블록. 함수 정의의 본문을 찾는 데 쓴다.
 *
 * 얕게만 본다(직계 자식) — 깊이 내려가면 중첩 함수의 본문을 남의 것으로 착각한다.
 */
export function blockOf(node: AstLite, d: Dialect): AstLite | null {
  return node.children.find((c) => d.block.has(c.kind)) ?? null;
}

/**
 * 블록의 **직계** 실행 단위. 이름 없는 노드(중괄호·세미콜론)는 뺀다.
 *
 * 직계만 보는 것이 이 파일의 정확성을 떠받친다 — 안쪽까지 훑으면 조건 안의 줄이 바깥 줄과
 * 같은 자격으로 섞이고, 그 순간 「무엇이 먼저 도나」의 답이 흔들린다.
 */
export const statementsOf = (block: AstLite): AstLite[] => block.children.filter((c) => c.named);

/**
 * 흐름을 끊는 **직계** statement 의 자리. 없으면 `-1`.
 *
 * 조건 안의 `return` 은 세지 않는다 — 그건 「돌 수도 있다」이지 「여기서 끝난다」가 아니다.
 * 이 한 줄이 `unreachable` 을 추측이 아니라 사실로 만든다.
 */
export function terminatorAt(stmts: readonly AstLite[], d: Dialect): number {
  return stmts.findIndex((s) => d.terminator.has(s.kind));
}

export interface ExecFacts {
  /** 부르면 **반드시** 도는 직계 statement — 조건·반복에 안 걸렸고 끊김 앞에 있다. */
  unconditional: AstLite[];
  /** 흐름이 끊긴 뒤라 **절대** 안 도는 직계 statement. */
  unreachable: AstLite[];
  /** 조건·반복이라 「돌 수도 있다」인 직계 statement. 오답 진단의 재료다. */
  conditional: AstLite[];
  /** 부르면 가장 먼저 닿는 직계 statement. 비었으면 `null`. */
  first: AstLite | null;
}

/**
 * 블록 하나의 실행 사실. 셋으로 정확히 갈린다 — **반드시 돈다 · 돌 수도 있다 · 절대 안 돈다.**
 *
 * 가운데(`conditional`)를 버리지 않고 들고 있는 이유는 오답 진단 때문이다. 정본 §3-2 는
 * 「틀렸다」가 아니라 「당신이 고른 그것이 **참이 되는 조건**」을 요구하는데, 조건 안의 줄을
 * 고른 학습자에게 댈 말이 정확히 그 조건이다.
 */
export function execFacts(block: AstLite, d: Dialect): ExecFacts {
  const stmts = statementsOf(block);
  const cut = terminatorAt(stmts, d);
  const live = cut === -1 ? stmts : stmts.slice(0, cut + 1);
  const unreachable = cut === -1 ? [] : stmts.slice(cut + 1);
  const unconditional: AstLite[] = [];
  const conditional: AstLite[] = [];
  for (const s of live) (d.branching.has(s.kind) ? conditional : unconditional).push(s);
  return { unconditional, unreachable, conditional, first: stmts[0] ?? null };
}

/**
 * 이 트리 안의 함수 정의 전부, 조상 스택과 함께. `AstLite` 에 부모가 없어 내려가며 들고 간다.
 *
 * 중첩 함수를 빠뜨리지 않는 것이 중요하다 — 「정의는 실행이 아니다」라는 오해가 가장 잘
 * 드러나는 자리가 함수 안의 함수다.
 */
export function functionsIn(root: AstLite, d: Dialect): { node: AstLite; depth: number }[] {
  const out: { node: AstLite; depth: number }[] = [];
  const walk = (n: AstLite, depth: number): void => {
    const isFn = n.named && d.fn.has(n.kind);
    if (isFn) out.push({ node: n, depth });
    for (const c of n.children) walk(c, isFn ? depth + 1 : depth);
  };
  walk(root, 0);
  return out;
}
