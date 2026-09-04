/**
 * 맥락 줄 조립 (04 §1). 판에 찍히는 `payload.lines` 는 **초점을 감싸는 블록**이고,
 * 사다리 4단 프롬프트에 들어가는 `payload.promptLines` 는 초점 ±4(≤ 9줄)다.
 *
 * 창이 왜 블록인가 (D141): 목업 카드 네 장은 5·5·6·3줄로 제각각이고 오프셋도 −3…+1,
 * −2…+2, −4…+1, −1…+1 로 다 달랐다. 공통점은 줄 수가 아니라 **감싸는 함수 전체**다.
 * `LINES_WINDOW = 2` 는 그 네 장의 평균을 규칙으로 굳힌 것이었다.
 *
 * 두 폭은 서로 독립이다. 창이 넓어져도 프롬프트에 담기는 것은 초점 ±4 그대로여야 한다 —
 * 정본 §3-1 「이 줄과 앞뒤 4줄뿐」이 프라이버시 규약이라서다(D8). `lines.test.ts` 가 못 박는다.
 *
 * 생성기는 파일을 읽지 않는다 — 부르는 쪽이 블록 범위(∪ 초점 ±4)를 한 번 읽어 넘긴다 (D72).
 */
import type { CodeLine, Seg } from '@chickadee/store-sql';

import type { FocusLine, LineWindow } from './types.js';

/** 감싸는 블록을 못 찾았을 때의 폭. 옛 고정 창 그대로다 — 폴백이 곧 지금까지의 동작이다. */
export const LINES_WINDOW = 2;
/** 프롬프트 폭. discussion §3-1 「이 줄과 앞뒤 4줄」. 창과 무관하게 고정이다. */
export const PROMPT_WINDOW = 4;
/**
 * 창의 최대 줄 수. 블록이 이보다 길면 초점을 가운데 두고 자른다.
 *
 * 40 인 이유: 사용자가 상한을 정할 때 「40줄을 다 펴면 한 판이 두 판 시간이 된다」고 했다.
 * 그래서 40 은 **다 펴도 넘지 않는 선**이고, 판이 처음 보여 주는 폭은 05 의 접기(20줄)가 정한다.
 */
export const WINDOW_MAX_LINES = 40;

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

/**
 * 이 사용처의 창. 감싸는 블록이 있으면 **그 블록 ∪ 초점 ±2**, 없으면 초점 ±2 다.
 *
 * 폴백이 도는 자리 셋: ① 사전에 없는 자리라 블록이 안 잡힌 사용처(최상위 import·상수,
 * `describe(() => …)` 처럼 `_blocks.scm` 이 잡지 않는 콜백 안), ② 블록 밖에 선 초점,
 * ③ 파일을 못 읽어 `excerpt` 한 줄로 물러선 카드. 셋 다 **카드는 나와야 한다** —
 * 창을 못 찾았다고 판이 없어지면 사용자가 잃는 것은 창이 아니라 그 개념 전부다.
 */
export function windowOf(focus: number, block?: LineWindow | undefined): LineWindow {
  // 옛 고정 창이 바닥이다 — 창은 넓히는 것이지 좁히는 것이 아니다. 세 줄짜리 함수에서
  // 초점 ±2 보다 좁게 잘라 내면 목업 카드 1(`addItem` + 그것이 건드리는 선언)이 못 선다.
  const floor: LineWindow = { from: focus - LINES_WINDOW, to: focus + LINES_WINDOW };
  if (block === undefined || focus < block.from || focus > block.to) return floor;

  const from = Math.min(block.from, floor.from);
  const to = Math.max(block.to, floor.to);
  if (to - from + 1 <= WINDOW_MAX_LINES) return { from, to };

  // 상한을 넘으면 초점을 가운데 두고 자르되 창 경계 밖으로는 나가지 않는다.
  const half = Math.floor((WINDOW_MAX_LINES - 1) / 2);
  let cut = focus - half;
  if (cut < from) cut = from;
  else if (cut + WINDOW_MAX_LINES - 1 > to) cut = to - WINDOW_MAX_LINES + 1;
  return { from: cut, to: cut + WINDOW_MAX_LINES - 1 };
}

/** 창 안에 드는 줄만. 창 계산은 `windowOf` 하나뿐이다 — 누설 검사도 이것을 쓴다. */
export function inWindow(
  lines: readonly FocusLine[],
  focus: number,
  block?: LineWindow | undefined,
): FocusLine[] {
  const win = windowOf(focus, block);
  return lines.filter((l) => l.n >= win.from && l.n <= win.to);
}

export function codeLines(
  lines: readonly FocusLine[],
  focus: number,
  spans: readonly Span[] = [],
  block?: LineWindow | undefined,
): CodeLine[] {
  const out: CodeLine[] = [];
  for (const line of inWindow(lines, focus, block)) {
    const mine = spans.filter((s) => s.line === line.n);
    const target = line.n === focus ? { target: true as const } : {};
    out.push(mine.length > 0
      ? { n: line.n, seg: segments(line.t, mine), ...target }
      : { n: line.n, t: line.t, ...target });
  }
  return out;
}

/**
 * 프롬프트에는 빈칸이 아니라 원문이 들어간다 (04 §2.4 「빈칸은 정답으로 채움」).
 *
 * **창을 보지 않는다.** 블록이 40줄이어도 여기 담기는 것은 초점 ±4 뿐이다 (D8 · 정본 §3-1).
 */
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
