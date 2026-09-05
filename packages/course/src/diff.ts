/**
 * 줄 단위 diff → 4단 정답지의 hunk (D172 ③).
 *
 * `git_diff_text` 는 그 커밋이 **더한 줄만** 준다(D98) — 4단 `patch-line` 은 뺀 줄과 자리가
 * 있어야 서고 `rollback` 은 뺀 줄이 곧 정답이다. Rust 를 늘리지 않고 부모·자식 두 판을
 * `file_read_lines{rev}` 로 읽어 여기서 diff 를 낸다. 결정론(같은 입력 → 같은 hunk)이면 되고
 * 최단일 필요는 없어 LCS 표 하나로 끝낸다 — 공통 앞·뒤를 먼저 벗기므로 실제 표는 바뀐
 * 구간만큼이다.
 */
import type { Hunk, HunkLine } from '@chickadee/cards';

/** hunk 앞뒤 문맥 줄 수. 4단 프롬프트 창(±4, D8)이 hunk 안에서 잘리지 않을 만큼이다. */
export const DIFF_CONTEXT = 4;
/** LCS 표 상한(칸). 넘으면 이 파일의 hunk 를 내지 않는다 — 리포 하나의 통째 재작성은 문항이 아니다. */
export const DIFF_CELLS = 4_000_000;

type Op = HunkLine;

function ops(a: readonly string[], b: readonly string[]): Op[] | null {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p += 1;
  let s = 0;
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s += 1;
  const am = a.slice(p, a.length - s);
  const bm = b.slice(p, b.length - s);
  const n = am.length;
  const m = bm.length;
  if (n * m > DIFF_CELLS) return null;

  const w = m + 1;
  const table = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i * w + j] = am[i] === bm[j]
        ? (table[(i + 1) * w + j + 1] as number) + 1
        : Math.max(table[(i + 1) * w + j] as number, table[i * w + j + 1] as number);
    }
  }

  const out: Op[] = a.slice(0, p).map((text) => ({ sign: ' ', text }));
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (am[i] === bm[j]) {
      out.push({ sign: ' ', text: am[i] as string });
      i += 1;
      j += 1;
    } else if ((table[(i + 1) * w + j] as number) >= (table[i * w + j + 1] as number)) {
      out.push({ sign: '-', text: am[i] as string });
      i += 1;
    } else {
      out.push({ sign: '+', text: bm[j] as string });
      j += 1;
    }
  }
  while (i < n) out.push({ sign: '-', text: am[i++] as string });
  while (j < m) out.push({ sign: '+', text: bm[j++] as string });
  for (const text of a.slice(a.length - s)) out.push({ sign: ' ', text });
  return out;
}

/**
 * 두 판의 hunk. `oldStart`·`newStart` 는 1-based 이고, 바뀐 줄이 `2·context` 안에 이어지면
 * 한 hunk 다(unified diff 와 같은 규칙). 바뀐 것이 없거나 표가 너무 크면 빈 배열.
 */
export function lineDiff(
  oldLines: readonly string[],
  newLines: readonly string[],
  context = DIFF_CONTEXT,
): Hunk[] {
  const all = ops(oldLines, newLines);
  if (all === null) return [];
  const edits: number[] = [];
  all.forEach((o, i) => { if (o.sign !== ' ') edits.push(i); });
  if (edits.length === 0) return [];

  const oldAt: number[] = [];
  const newAt: number[] = [];
  let o = 1;
  let nw = 1;
  for (const op of all) {
    oldAt.push(o);
    newAt.push(nw);
    if (op.sign !== '+') o += 1;
    if (op.sign !== '-') nw += 1;
  }

  const groups: [number, number][] = [];
  let start = edits[0] as number;
  let end = start;
  for (const e of edits.slice(1)) {
    if (e - end <= 2 * context) {
      end = e;
    } else {
      groups.push([start, end]);
      start = e;
      end = e;
    }
  }
  groups.push([start, end]);

  return groups.map(([s, e]) => {
    const from = Math.max(0, s - context);
    const to = Math.min(all.length - 1, e + context);
    return {
      oldStart: oldAt[from] as number,
      newStart: newAt[from] as number,
      lines: all.slice(from, to + 1),
    };
  });
}
