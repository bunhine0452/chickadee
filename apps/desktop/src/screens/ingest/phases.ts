/**
 * 인제스트 진행을 화면의 4칸으로 (05 §2.1 · D47).
 *
 * Rust 의 `walk·parse·git·write` 는 두 칸으로, TS 의 `derive`·`cards` 는 두 칸으로 접힌다.
 * blame 은 배경이라 칸이 없다 (03 §1.5).
 *
 * **묶음은 잡이 실제로 내보내는 순서를 따른다**(D110) — `walk → parse → git → write`.
 * 앞선 묶음(`walk`+`git` / `parse`)은 그 순서와 어긋나 막대가 1 → 2 → 1 → 3 으로 **되돌았다**.
 * 진행 막대가 뒤로 가면 사람은 그것을 고장으로 읽는다.
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
  { kind: 'walk', label: '코드 읽기', sub: '파일 목록과 문법', mins: 0.18, phases: ['walk', 'parse'] },
  { kind: 'git', label: '히스토리', sub: '커밋과 캡처 저장', mins: 0.12, phases: ['git', 'write'] },
  { kind: 'write', label: '개념 추출', sub: '내 코드의 사용처 찾기', mins: 0.06, phases: ['derive'] },
  { kind: 'cards', label: '판 짜기', sub: '카드로 만들 자리 고르기', mins: 0.02, phases: ['cards'] },
];

export interface Progress {
  phase: Phase;
  done: number;
  total: number;
}

/**
 * 지금 어느 칸에 있고 그 칸이 얼마나 찼는가.
 *
 * 한 칸이 단계 둘을 담으면 **칸 안에서도 되돌 수 있다** — 앞 단계가 10/10 으로 칸을 채운
 * 직후 뒤 단계가 0/10 으로 시작하기 때문이다. 그래서 칸 안의 자리를
 * `(단계 순번 + 그 단계의 진행) / 단계 수` 로 잰다: `walk` 10/10 은 0.5, `parse` 0/10 도
 * 0.5, `parse` 10/10 이 1.0 이다. 칸도 채움도 앞으로만 간다 (D110).
 */
export function positionOf(at: Progress | null): { pos: number; progress: number | undefined } {
  if (!at) return { pos: 0, progress: 0 };
  const pos = BOXES.findIndex((box) => box.phases.includes(at.phase));
  const box = BOXES[pos];
  if (pos === -1 || box === undefined) return { pos: 0, progress: 0 };
  const step = box.phases.indexOf(at.phase);
  // `total` 이 0 이면 Rust 가 아직 총량을 모르는 것이다(커밋 수가 그렇다) — 그 단계가
  // 시작했다는 것까지만 세고 안쪽 진행은 비운다.
  const inner = at.total > 0 ? Math.min(1, at.done / at.total) : 0;
  const progress = (step + inner) / box.phases.length;
  return { pos, progress: at.total > 0 || box.phases.length > 1 ? progress : undefined };
}

/** 끝난 뒤의 자리 — 모든 칸이 찬 상태. */
export const DONE = { pos: BOXES.length, progress: 1 } as const;
