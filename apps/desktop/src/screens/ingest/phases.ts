/**
 * 인제스트 진행을 화면의 4칸으로 (05 §2.1 · D47).
 *
 * Rust 의 `walk·parse·git·write` 는 「git 읽기」와 「파싱」 두 칸으로, TS 의 `derive`·`cards`
 * 는 「개념 추출」과 「판 짜기」 두 칸으로 접힌다. blame 은 배경이라 칸이 없다 (03 §1.5).
 *
 * 칸의 너비는 **예상 시간**이다 — 스피너를 쓰지 않기로 한 이상, 남은 양은 시간으로만
 * 말할 수 있다(정본 §3-5). 아래 분값은 03 §7 의 10만 줄 예산 15초를 4칸에 나눈 것이다.
 */
import type { Phase } from '@chickadee/concepts';

import type { QueueItem } from '../../components/shell/TimeQueue.js';

/** 화면의 칸 하나. `phases` 의 어느 단계가 이 칸을 채우는지가 매핑의 전부다. */
export interface Box extends QueueItem {
  phases: readonly Phase[];
}

/**
 * 03 §7 의 예산 배분(파싱+쿼리 8s · 커밋 diff 4s · sqlite 2s)을 분으로 옮긴 값.
 * 실측이 아니라 **예상**이고, 그래서 칸 안의 진행은 실제 `done/total` 이 이긴다.
 */
export const BOXES: readonly Box[] = [
  { kind: 'walk', label: 'git 읽기', sub: '파일 목록과 히스토리', mins: 0.1, phases: ['walk', 'git'] },
  { kind: 'parse', label: '파싱', sub: '문법으로 코드 읽기', mins: 0.14, phases: ['parse'] },
  { kind: 'write', label: '개념 추출', sub: '내 코드의 사용처 찾기', mins: 0.06, phases: ['write', 'derive'] },
  { kind: 'cards', label: '판 짜기', sub: '카드로 만들 자리 고르기', mins: 0.02, phases: ['cards'] },
];

export interface Progress {
  phase: Phase;
  done: number;
  total: number;
}

/** 지금 어느 칸에 있고 그 칸이 얼마나 찼는가. */
export function positionOf(at: Progress | null): { pos: number; progress: number | undefined } {
  if (!at) return { pos: 0, progress: 0 };
  const pos = BOXES.findIndex((box) => box.phases.includes(at.phase));
  if (pos === -1) return { pos: 0, progress: 0 };
  // `total` 이 0 이면 Rust 가 아직 총량을 모르는 것이다(커밋 수가 그렇다) — 칸만 옮긴다.
  const progress = at.total > 0 ? Math.min(1, at.done / at.total) : undefined;
  return { pos, progress };
}

/** 끝난 뒤의 자리 — 모든 칸이 찬 상태. */
export const DONE = { pos: BOXES.length, progress: 1 } as const;
