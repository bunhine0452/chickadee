/**
 * 선행 그래프의 위상 정렬 (02 §6.2). 뿌리부터 나오게 하는 순서이고,
 * 동률은 사전의 `essential` 순서 → 난이도 → id 로 깬다.
 *
 * 사이클이 있으면 사전 오류지만 런타임이 멈춰서는 안 된다 — 남은 것을 id 순으로 붙인다.
 */
export interface GraphNode {
  id: string;
  prereq: readonly string[];
  difficulty: number;
}

export function topoOrder(nodes: readonly GraphNode[], essential: readonly string[]): string[] {
  const rank = new Map(essential.map((id, i) => [id, i]));
  const known = new Set(nodes.map((n) => n.id));
  const pending = new Map(nodes.map((n) => [n.id, n.prereq.filter((p) => known.has(p)).length]));
  const dependents = new Map<string, string[]>();
  for (const node of nodes) {
    for (const prereq of node.prereq) {
      if (!known.has(prereq)) continue;
      dependents.set(prereq, [...(dependents.get(prereq) ?? []), node.id]);
    }
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const score = (id: string): [number, number, string] => [
    rank.get(id) ?? Number.MAX_SAFE_INTEGER,
    byId.get(id)?.difficulty ?? 0,
    id,
  ];
  const cmp = (a: string, b: string): number => {
    const [ar, ad] = score(a);
    const [br, bd] = score(b);
    return ar - br || ad - bd || a.localeCompare(b);
  };

  const out: string[] = [];
  const ready = [...pending.entries()].filter(([, n]) => n === 0).map(([id]) => id).sort(cmp);
  const seen = new Set<string>();
  while (ready.length > 0) {
    const next = ready.shift();
    if (next === undefined) break;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
    for (const child of dependents.get(next) ?? []) {
      const left = (pending.get(child) ?? 1) - 1;
      pending.set(child, left);
      if (left === 0) ready.push(child);
    }
    ready.sort(cmp);
  }
  // 사이클에 갇힌 나머지 — 사전 린트가 잡을 일이지만 여기서 멈추지는 않는다.
  const rest = nodes.map((n) => n.id).filter((id) => !seen.has(id)).sort(cmp);
  return [...out, ...rest];
}
