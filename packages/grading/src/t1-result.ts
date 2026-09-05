/**
 * T1 채점 한 번 (04 §4). 정렬 → 정규식층 → AST 승격 → 전역 치환 검증 순으로 돌고
 * 04 §4.6 의 `T1Result` 를 낸다.
 *
 * **여기에 IPC 도 SQL 도 없다.** 원본·답안 줄과 (있으면) 양쪽 AST 를 인자로 받는다 —
 * 답안 AST 는 앱이 채점 직전에 `parse_snippet` 을 한 번 불러 넘긴다(04 §4.5 · D87).
 * 그래서 골든(04 §9)이 픽스처 하나로 성립하고, 예산(20줄 < 20 ms)이 IPC 와 섞이지 않는다.
 */
import { advanceThreshold, RETRY_PCT } from '@chickadee/scheduler';
import type { ReviewDetail } from '@chickadee/store-sql';

import { align } from './t1-align.js';
import { promote, type AstPair } from './t1-ast.js';
import { compareLine } from './t1-line.js';
import { buildProt, freeIdents, origIdents } from './t1-prot.js';
import { judgeRenames } from './t1-rename.js';
import type { AssistCount, Reason, ReasonCode, Status, T1Result, T1Row } from './t1-types.js';

export { advanceThreshold };

/** 채점 한 번의 입력. */
export interface T1Input {
  blockId: number;
  /** **채점한 단계**다 — 「한 단계 쉽게」를 누른 뒤라면 내려간 쪽이다 (D85). */
  stage: 1 | 2 | 3;
  original: readonly string[];
  user: readonly string[];
  /** tree-sitter 문법 키 (D19). PROT 의 내장 표를 고른다. */
  grammar: string;
  /** 파일 모듈 수준 선언명 — import·최상위 `const`/`function` (04 §4.3). */
  moduleDecls?: readonly string[];
  /** 원본 잠깐 보기 횟수. 감점이 아니라 「더 자주 보여줄 신호」다 (04 §4.6). */
  peeks: number;
  downgraded: boolean;
  /**
   * 편집 보조가 앉힌 글자 (D143). **`peeks` 와 같은 규칙** — 감점 없음, 기록만.
   * 아래 `gradeT1` 이 이 값을 그대로 실어 내보낼 뿐 **점수 계산에는 한 번도 읽지 않는다.**
   * 골든(04 §9)이 그대로 통과해야 하고, 이의의 `patternKey`(04 §5)가 서로 다른 보조
   * 조건에서 나온 판정을 섞지 않으려면 점수는 불변이어야 하기 때문이다.
   */
  assist?: AssistCount;
  /** 양쪽 AST. 없으면 정규식층만 돈다(언어 폴백). */
  ast?: AstPair;
  /** AST 를 못 쓴 이유 — 화면이 「이 언어는 글자 비교만 합니다」를 낼 근거 (04 §4.5). */
  astFallback?: Extract<ReasonCode, 'PARSE_LANG_UNSUPPORTED' | 'PARSE_TIMEOUT' | 'PARSE_ERROR'>;
  /** 측정용 시계. 골든이 deep-equal 이려면 값을 고정해야 한다 (04 §9). */
  clock?: () => number;
}

const EMPTY_COUNTS = (): Record<Status, number> =>
  ({ exact: 0, equiv: 0, differ: 0, missing: 0, extra: 0 });

/**
 * 04 §4.6 판정.
 *
 * `advance` 는 「다음 단계로」이고 문턱은 소블록 완충값이다. `swap` 행이 하나라도 있으면
 * 백분율과 무관하게 `advance` 를 막는다 — 인자 순서가 바뀐 코드는 뜻이 바뀐 코드다.
 * 다만 65 % 아래는 `repeat` 로 둔다: 04 §4.6 의 65 규칙이 그 아래를 「같은 단계를 한 번 더」로
 * 정해 놓았고, 스왑이 있다고 더 관대해질 이유가 없다.
 */
export function verdictOf(pct: number, passPct: number, swap: boolean): T1Result['verdict'] {
  if (pct >= passPct && !swap) return 'advance';
  return pct >= RETRY_PCT ? 'repeat-soft' : 'repeat';
}

/** 다음에 걸 단계 (02 §4 T1 행 — ≥ 문턱이면 +1, 최대 3). */
export function nextStage(stage: 1 | 2 | 3, verdict: T1Result['verdict']): 1 | 2 | 3 {
  if (verdict !== 'advance') return stage;
  return Math.min(3, stage + 1) as 1 | 2 | 3;
}

export function gradeT1(input: T1Input): T1Result {
  const clock = input.clock ?? (() => performance.now());
  const started = clock();

  const prot = buildProt({
    original: input.original,
    grammar: input.grammar,
    ...(input.moduleDecls ? { moduleDecls: input.moduleDecls } : {}),
  });
  const orig = origIdents({
    original: input.original,
    grammar: input.grammar,
    ...(input.moduleDecls ? { moduleDecls: input.moduleDecls } : {}),
  });
  const ans = freeIdents(input.user, prot);

  // 1 · 정렬
  const alignment = align(input.original, input.user);

  // 2 · 정규식층. 양쪽이 빈 줄인 짝은 행을 만들지 않는다 — 분모가 비공백 줄이므로
  // (04 §4.6) 빈 줄을 `exact` 로 세면 `meaning` 이 `total` 을 넘는다.
  let rows: T1Row[] = [];
  const pending: T1Row[] = [];
  for (const pair of alignment.pairs) {
    const o = input.original[pair.oi] as string;
    const blankOriginal = o.trim() === '';
    if (pair.ui < 0) {
      if (blankOriginal) continue;
      rows.push({ oi: pair.oi, ui: -1, status: 'missing', reasons: [], maps: [], engine: 'regex' });
      continue;
    }
    const u = input.user[pair.ui] as string;
    if (blankOriginal && u.trim() === '') continue;
    const cmp = compareLine(o, u, prot, input.grammar);
    // `pending` 은 11단계가 판정한다. 그때까지 표시는 `differ` 다 — 낙관해 두면 치환이
    // 거부됐을 때 화면이 「동등」에서 「어긋남」으로 뒤집힌다.
    const row: T1Row = {
      oi: pair.oi,
      ui: pair.ui,
      status: cmp.status === 'pending' ? 'differ' : cmp.status,
      reasons: cmp.reasons,
      maps: cmp.maps,
      engine: 'regex',
    };
    rows.push(row);
    if (cmp.status === 'pending') pending.push(row);
  }

  // 3 · 11단계 전역 치환 (04 §4.3)
  const verdicts = judgeRenames({ rows: pending, orig, ans });
  const accepted = new Map<string, string>();
  for (const row of pending) {
    const v = verdicts.get(row.oi);
    if (v === undefined) continue;
    row.status = v.status;
    row.reasons = [...row.reasons, ...v.reasons];
    if (v.swap) row.swap = true;
    if (v.status === 'equiv') for (const [a, b] of row.maps) accepted.set(a, b);
  }

  // 4 · AST 승격 (04 §4.5). 승격이 삼킨 답안 줄은 `extra` 에서 뺀다.
  const absorbed = new Set<number>();
  if (input.ast !== undefined) {
    const promoted = promote({ ...input.ast, rows, accepted, prot });
    for (const row of rows) {
      const outcome = promoted.get(row.oi);
      if (outcome === undefined) continue;
      row.reasons = [...row.reasons, ...outcome.reasons];
      if (!outcome.promoted) continue;
      row.status = 'equiv';
      row.engine = 'ast';
      for (const line of outcome.absorbed) absorbed.add(line);
    }
  }

  // 5 · 짝 없는 답안 줄. 원본 줄 뒤에 **몰아서** 붙인다(목업과 같다) — 원본 줄 사이에
  // 끼워 넣으면 「원본 3행 다음이 추가 1행」처럼 보여, 답안에서 그 줄이 어디 있었는지를
  // 거짓으로 말한다.
  rows = rows.sort((a, b) => a.oi - b.oi);
  for (const ui of alignment.extra) {
    if (absorbed.has(ui)) continue;
    rows.push({ oi: -1, ui, status: 'extra', reasons: [], maps: [], engine: 'regex' });
  }

  // 6 · 점수
  const n = EMPTY_COUNTS();
  for (const row of rows) n[row.status] += 1;
  const total = input.original.filter((l) => l.trim() !== '').length;
  const meaning = n.exact + n.equiv;
  const pct = total === 0 ? 0 : Math.round((100 * meaning) / total);
  const passPct = advanceThreshold(total);
  const swap = rows.some((r) => r.swap === true);

  const fallbackReason: Reason[] = input.astFallback === undefined
    ? []
    : [{ code: input.astFallback }];
  if (fallbackReason.length > 0) {
    for (const row of rows) {
      if (row.status === 'differ') row.reasons = [...row.reasons, ...fallbackReason];
    }
  }

  return {
    blockId: input.blockId,
    stage: input.stage,
    rows,
    n,
    total,
    meaning,
    pct,
    passPct,
    verdict: verdictOf(pct, passPct, swap),
    peeks: input.peeks,
    downgraded: input.downgraded,
    ...(input.assist === undefined ? {} : { assist: input.assist }),
    engine: rows.some((r) => r.engine === 'ast') ? 'ast' : 'regex',
    elapsedMs: clock() - started,
    appeals: 0,
  };
}

/**
 * 02 §8.2 `ReviewDetail` 의 t1 변형. `stageBefore` 는 **채점한 단계**이고(D85)
 * `stageAfter` 는 다음에 걸 단계다 — `rebuild.ts` 의 4겹 상한이 `stageBefore` 를 읽으므로
 * `finishPlate({stage})` 에 넘기는 값과 같아야 한다.
 */
export function toT1Detail(
  result: T1Result,
  why: { text: string; pick: number | null },
  appealedLines: readonly number[],
): Extract<ReviewDetail, { track: 't1' }> {
  return {
    track: 't1',
    meaning: result.meaning,
    total: result.total,
    exact: result.n.exact,
    equiv: result.n.equiv,
    differ: result.n.differ,
    missing: result.n.missing,
    extra: result.n.extra,
    peeks: result.peeks,
    downgraded: result.downgraded,
    ...(result.assist === undefined ? {} : { assist: result.assist }),
    stageBefore: result.stage,
    stageAfter: nextStage(result.stage, result.verdict),
    appealedLines: [...appealedLines],
    whyText: why.text,
    whyPick: why.pick,
  };
}
