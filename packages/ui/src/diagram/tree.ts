/**
 * 평가 트리의 **접히는 순서**. 우선순위는 트리 모양이 이미 담고 있고, 순서는 후위 순회다 —
 * `2 + 3 * 4` 는 `3 * 4` 를 먼저 접고 그 다음 `2 + 12` 를 접는다. 같은 트리는 언제나 같은
 * 단계 수를 낸다(diagrams.md §2 원칙 1).
 */
import type { EvalNode, EvalTreeModel, FoldModel } from './types';

/** 후위 순번이 매겨진 마디. `order` 가 0 이면 잎이라 접을 것이 없다. */
export interface FoldNode {
  node: EvalNode;
  /** 1부터. 이 번호가 곧 「몇 번째 단계에서 접히나」다. */
  order: number;
  kids: readonly FoldNode[];
}

/** 트리에 후위 순번을 매긴다. 순수 함수이고 입력을 건드리지 않는다. */
export function annotate(root: EvalNode): FoldNode {
  let next = 0;
  const walk = (node: EvalNode): FoldNode => {
    if (node.kind === 'leaf') return { node, order: 0, kids: [] };
    const kids = node.kids.map(walk);
    next += 1;
    return { node, order: next, kids };
  };
  return walk(root);
}

/** 접을 수 있는 단계 수 = 연산 마디 수. `step` 은 0 부터 이 값까지다. */
export function foldSteps(root: EvalNode): number {
  return root.kind === 'leaf' ? 0 : root.kids.reduce((n, k) => n + foldSteps(k), 1);
}

/** `step` 단계까지 접었을 때 이 마디가 접혔나. */
export function isFolded(at: FoldNode, step: number): boolean {
  return at.order > 0 && at.order <= step;
}

/**
 * `step` 단계에서 화면에 남는 식. 접힌 마디는 값으로 바뀐다.
 * 안쪽 마디에만 괄호를 씌운다 — 맨 바깥 괄호는 아무것도 안 알려 주고 눈만 먹는다.
 */
export function foldedText(at: FoldNode, step: number, top = true): string {
  if (at.node.kind === 'leaf') return at.node.text;
  if (isFolded(at, step)) return at.node.result;
  const parts = at.kids.map((k) => foldedText(k, step, false));
  if (parts.length === 1) return `${at.node.op}${parts[0] ?? ''}`;
  const joined = parts.join(` ${at.node.op} `);
  return top ? joined : `(${joined})`;
}

/**
 * 낭독기 한 문장. 「괄호 2 더하기 3 곱하기 4」로 읽히면 순서를 못 듣는다 —
 * **지금 무엇이 접히는지**를 말한다.
 */
export function describeTree(model: EvalTreeModel, step: number, phase: 'predict' | 'reveal' = 'reveal'): string {
  const at = annotate(model.root);
  const total = foldSteps(model.root);
  if (phase === 'predict') return `식 ${model.expr}. ${total}단계로 접힙니다. 값은 아직 가려져 있습니다.`;
  if (step <= 0) return `식 ${model.expr}. ${total}단계로 접힙니다. 아직 아무것도 접지 않았습니다.`;
  const now = find(at, step);
  const shown = foldedText(at, step);
  const head = `${step}단계, ${total} 중 ${step}번째.`;
  if (now === null || now.node.kind !== 'op') return `${head} 지금 식은 ${shown} 입니다.`;
  const kids = now.kids.map((k) => foldedText(k, step - 1, false)).join(` ${now.node.op} `);
  return `${head} ${kids} 를 접어 ${now.node.result} 가 되고, 지금 식은 ${shown} 입니다.`;
}

function find(at: FoldNode, order: number): FoldNode | null {
  if (at.order === order) return at;
  for (const k of at.kids) {
    const hit = find(k, order);
    if (hit !== null) return hit;
  }
  return null;
}


/* ═══════════════ 평평한 걸음 배열 ═══════════════ */

/**
 * 낭독기 한 문장(사다리판). 「지금 몇 번째 걸음에서 무엇이 무엇이 되었나」를 말한다.
 * `predict` 는 **지금 걸음부터** 가린다 — 첫 줄(주어진 식)은 물음이라 언제나 남는다.
 */
export function describeFold(fold: FoldModel, step: number, phase: 'predict' | 'reveal' = 'reveal'): string {
  const total = Math.max(fold.steps.length - 1, 0);
  const at = Math.min(Math.max(step, 0), total);
  const first = fold.steps[0];
  const head = `식 ${fold.expr}. ${total}걸음으로 접힙니다.`;
  if (at === 0 || phase === 'predict') {
    const given = first === undefined ? '' : ` 주어진 것은 ${first.code}, 타입 ${first.type}.`;
    return `${head}${given} ${at === 0 ? '아직 접지 않았습니다.' : `${at}번째 걸음은 가려져 있습니다.`}`;
  }
  const now = fold.steps[at];
  const before = fold.steps[at - 1];
  if (now === undefined || before === undefined) return head;
  return `${head} ${at}번째 걸음, ${before.code} 가 ${now.code} 가 되고 타입은 ${now.type} 입니다.`;
}
