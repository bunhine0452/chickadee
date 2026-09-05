/**
 * `trace-table` 채점 — 칸마다 값 일치 + **이월** (D187 ⑱ · `docs/program/fundamentals.md` §13).
 *
 * ## 둘을 겹쳐 쓴다
 *
 * `table` 의 부분 점수(맞은 칸 / 물은 칸)와 `step` 의 이월 채점(앞 칸이 뒤 칸의 기댓값을
 * 정한다)을 한 격자에 얹었다. 이월이 없으면 첫 상자를 `1` 이라 부른 사람이 판 전체를 잃는다 —
 * 「한 번 틀렸다고 숙련도가 바닥까지 떨어지지 않는다」(정본 §3-1)를 형식 안에서 깨는 것이다.
 *
 * ## 상자 라벨은 **분할**이 정답이다
 *
 * A·B 로 쓰든 1·2 로 쓰든 「같은 상자끼리 같은 이름, 다른 상자끼리 다른 이름」이면 맞다.
 * 그래서 상자 열은 두 가지만 본다 — ① 이월 칸은 앞 칸에 쓴 이름과 같은가
 * ② 값이 바뀌는 칸은 **앞에서 쓴 적 없는** 이름인가. 이 둘이 곧 분할 일치다.
 *
 * ## 「있나」 열은 닫힌 낱말이다
 *
 * 코드만 보고 정해지는 것은 「이 시점에 이 이름에 값이 있나」뿐이다(`java-learning.md` §12.5 —
 * DB 의 실제 수는 러너와 데이터의 일이다). 그래서 그 열의 답은 참·거짓이고, 채점기가
 * 언어와 무관한 표기 집합을 받는다.
 *
 * `@chickadee/cards` 를 import 하지 않는다 — 의존 방향(01 §2)에 `grading → cards` 가 없다.
 * payload 를 **구조적으로** 받는다.
 */
import { t } from '@chickadee/i18n';

import { normalizeFloat, normalizeInt } from './fundamentals.js';

/** 칸 하나의 답. `@chickadee/store-sql` 의 `TraceCell` 과 같은 모양이다. */
export type TraceCellValue =
  | { t: 'int'; v: string }
  | { t: 'float'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'string'; v: string }
  | { t: 'box'; label: string; accept: readonly string[] }
  | { t: 'none'; accept: readonly string[] }
  | { t: 'unknown'; accept: readonly string[] };

export interface TraceCellSpec {
  r: string;
  c: string;
  v: TraceCellValue;
  /** 값이 안 바뀐 칸이 가리키는 앞 칸의 행 키. 값이 여기서 정해지면 `null`. */
  carry: string | null;
}

export interface TraceGradeInput {
  cols: readonly { k: string; axis: string; t: string }[];
  rows: readonly { k: string; line: number | null; t: string }[];
  cells: readonly TraceCellSpec[];
  /** 예측 모드에서 비운 칸 `"<row>|<col>"`. 비어 있으면 격자 전부를 묻는다. */
  hidden: readonly string[];
  ok: string;
  rule: string;
}

/** 왜 틀렸나. 처방이 갈리는 자리라 값으로 남긴다. */
export type TraceMissKind =
  /** 안 적었다. */
  | 'blank'
  /** 이월 — 값이 안 바뀌었는데 앞 칸과 다르게 적었다. */
  | 'carry'
  /** 분할 — 다른 상자를 앞에서 쓴 이름으로 불렀다. */
  | 'reused'
  /** 값이 다르다. */
  | 'value';

export interface TraceMiss {
  key: string;
  row: string;
  col: string;
  kind: TraceMissKind;
  text: string;
}

export interface TraceVerdict {
  ok: boolean;
  /** 맞은 칸 / 물은 칸 × 100. 물은 칸이 0 이면 0. */
  pct: number;
  asked: number;
  correct: number;
  misses: TraceMiss[];
  okText: string | null;
  rule: string;
  diagnosis: string | null;
}

export const cellKey = (row: string, col: string): string => `${row}|${col}`;

/** 앞뒤를 자르고 안쪽 공백을 한 칸으로. `fundamentals.ts` 와 같은 규칙이다. */
const collapse = (raw: string): string => raw.trim().replace(/\s+/gu, ' ');

/** 참·거짓의 표기 — 언어·화면에 안 매인 닫힌 집합. 대소문자를 안 가린다. */
const YES = new Set(['true', 't', 'yes', 'y', 'o', '1', '있음', '있다', '○']);
const NO = new Set(['false', 'f', 'no', 'n', 'x', '0', '없음', '없다', '×', '-', '—', '–']);
/** 「아직 없다」의 표기. `accept` 에 더해 이만큼은 언제나 받는다. */
const NONE = new Set(['-', '—', '–', '없음', '없다', 'x', 'none', 'null']);

/** 이 칸의 답이 학습자의 글과 맞나. 상자 칸은 여기서 안 본다 — 분할이 정답이라 따로 돈다. */
function matches(value: TraceCellValue, raw: string): boolean {
  const s = collapse(raw);
  if (s === '') return false;
  const low = s.toLowerCase();
  switch (value.t) {
    case 'bool':
      return value.v ? YES.has(low) : NO.has(low);
    case 'none':
      return NONE.has(low) || value.accept.some((a) => a.toLowerCase() === low);
    case 'unknown':
      return value.accept.some((a) => a.toLowerCase() === low);
    case 'int': {
      const n = normalizeInt(s);
      return n !== null && n === BigInt(value.v).toString();
    }
    case 'float': {
      const n = normalizeFloat(s);
      return n !== null && Object.is(n, Number(value.v));
    }
    case 'string':
      return s === value.v || low === value.v.toLowerCase();
    default:
      return false;
  }
}

/**
 * 격자 한 판의 채점.
 *
 * `answers` 의 키는 `"<row>|<col>"` 이다. **안 물은 칸은 카드의 답이 그대로 채워져 있다**
 * (예측 모드가 바뀐 칸만 가리므로) — 그래서 이월이 그 칸을 가리키면 카드의 값을 쓴다.
 */
export function gradeTrace(
  item: TraceGradeInput, answers: Readonly<Record<string, string>>,
): TraceVerdict {
  const byKey = new Map(item.cells.map((c) => [cellKey(c.r, c.c), c]));
  const asked = new Set(item.hidden.length > 0
    ? item.hidden
    : item.cells.map((c) => cellKey(c.r, c.c)));
  const rowLabel = new Map(item.rows.map((r) => [r.k, r.line === null ? r.t : `${String(r.line)}`]));
  const colLabel = new Map(item.cols.map((c) => [c.k, c.t]));

  /** 이 칸에 **놓인 글자** — 물은 칸은 학습자의 답, 안 물은 칸은 카드의 답. */
  const written = (key: string): string => {
    const typed = answers[key];
    if (typed !== undefined && collapse(typed) !== '') return collapse(typed);
    if (asked.has(key)) return '';
    const cell = byKey.get(key);
    if (cell === undefined) return '';
    return cell.v.t === 'box' ? cell.v.label : '';
  };

  const misses: TraceMiss[] = [];
  let correct = 0;
  // 상자 열마다 「학습자의 이름 → 카드의 상자」. 분할 일치가 이 표 하나로 판정된다.
  const claimed = new Map<string, Map<string, string>>();

  for (const cell of item.cells) {
    const key = cellKey(cell.r, cell.c);
    if (!asked.has(key)) continue;
    const mine = written(key);
    const where = { key, row: rowLabel.get(cell.r) ?? cell.r, col: colLabel.get(cell.c) ?? cell.c };
    if (mine === '') {
      misses.push({ ...where, kind: 'blank', text: t('grading.traceBlank', { row: where.row, col: where.col }) });
      continue;
    }

    if (cell.v.t !== 'box') {
      if (matches(cell.v, mine)) correct += 1;
      else {
        misses.push({
          ...where, kind: 'value',
          text: t('grading.traceValue', { row: where.row, col: where.col, mine }),
        });
      }
      continue;
    }

    // ① 이월 — 값이 안 바뀐 칸은 **앞 칸에 쓴 이름**이 기댓값이다.
    if (cell.carry !== null) {
      const want = written(cellKey(cell.carry, cell.c));
      if (want !== '' && mine !== want) {
        misses.push({
          ...where, kind: 'carry',
          text: t('grading.traceCarry', {
            row: where.row, col: where.col, want, mine, from: rowLabel.get(cell.carry) ?? cell.carry,
          }),
        });
        continue;
      }
      correct += 1;
      continue;
    }

    // ② 분할 — 값이 바뀌는 칸은 **앞에서 쓴 적 없는** 이름이어야 한다.
    let table = claimed.get(cell.c);
    if (table === undefined) {
      table = new Map<string, string>();
      claimed.set(cell.c, table);
    }
    const taken = table.get(mine);
    if (taken !== undefined && taken !== cell.v.label) {
      misses.push({
        ...where, kind: 'reused',
        text: t('grading.traceReused', { row: where.row, col: where.col, mine }),
      });
      continue;
    }
    table.set(mine, cell.v.label);
    correct += 1;
  }

  const total = [...asked].filter((k) => byKey.has(k)).length;
  const pct = total === 0 ? 0 : Math.round((100 * correct) / total);
  const ok = total > 0 && misses.length === 0;
  return {
    ok, pct, asked: total, correct, misses,
    okText: ok ? item.ok : null,
    rule: item.rule,
    diagnosis: ok ? null : (misses[0]?.text ?? t('grading.traceEmpty')),
  };
}
