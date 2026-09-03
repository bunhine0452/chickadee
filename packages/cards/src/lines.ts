/**
 * 맥락 줄 조립 (04 §1). 판에 찍히는 `payload.lines` 는 초점 ±2(목업 5줄),
 * 사다리 4단 프롬프트에 들어가는 `payload.promptLines` 는 초점 ±4(≤ 9줄)다.
 *
 * 생성기는 파일을 읽지 않는다 — 부르는 쪽이 `file_read_lines(focus−4, focus+4, rev)` 로
 * 한 번 읽어 넘긴다 (D72).
 */
import type { CodeLine, Seg } from '@chickadee/store-sql';

import type { FocusLine } from './types.js';

/** 판에 보이는 폭. 목업 카드가 5줄이다. */
export const LINES_WINDOW = 2;
/** 프롬프트 폭. discussion §3-1 「이 줄과 앞뒤 4줄」. */
export const PROMPT_WINDOW = 4;

/** 초점 줄 안에서 짚을 수 있는 조각 하나. `to` 는 끝 다음 열이다. */
export interface Span {
  line: number;
  from: number;
  to: number;
  /** 1-based 보기 번호. `← →` 이동 순서와 같다 (04 §1.1). */
  pick?: number;
  hole?: true;
}

function segments(text: string, spans: readonly Span[]): Seg[] {
  const out: Seg[] = [];
  let at = 0;
  for (const span of [...spans].sort((a, b) => a.from - b.from)) {
    if (span.from < at) continue; // 겹치는 조각은 앞의 것이 이긴다
    if (span.from > at) out.push({ t: text.slice(at, span.from) });
    if (span.hole === true) out.push({ hole: true });
    else {
      const t = text.slice(span.from, span.to);
      out.push(span.pick === undefined ? { t } : { t, pick: span.pick });
    }
    at = span.to;
  }
  if (at < text.length) out.push({ t: text.slice(at) });
  return out;
}

export function codeLines(
  lines: readonly FocusLine[],
  focus: number,
  spans: readonly Span[] = [],
): CodeLine[] {
  const out: CodeLine[] = [];
  for (const line of lines) {
    if (Math.abs(line.n - focus) > LINES_WINDOW) continue;
    const mine = spans.filter((s) => s.line === line.n);
    const target = line.n === focus ? { target: true as const } : {};
    out.push(mine.length > 0
      ? { n: line.n, seg: segments(line.t, mine), ...target }
      : { n: line.n, t: line.t, ...target });
  }
  return out;
}

/** 프롬프트에는 빈칸이 아니라 원문이 들어간다 (04 §2.4 「빈칸은 정답으로 채움」). */
export function promptLines(lines: readonly FocusLine[], focus: number): string[] {
  return lines.filter((l) => Math.abs(l.n - focus) <= PROMPT_WINDOW).map((l) => l.t);
}

/** 초점 줄에서 `text` 가 처음 나오는 자리. `at` 부터 찾는다. */
export function spanOf(line: FocusLine, text: string, at = 0): Span | null {
  const from = line.t.indexOf(text, at);
  return from === -1 ? null : { line: line.n, from, to: from + text.length };
}

export const lineAt = (lines: readonly FocusLine[], n: number): FocusLine | undefined =>
  lines.find((l) => l.n === n);
