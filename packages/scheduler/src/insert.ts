/**
 * 세션 중 삽입과 복구 (02 §5.5·§5.6). 자리 계산과 「넣어도 되나」 판정만 한다 —
 * 쓰기는 `session.shift_park`·`shift_unpark`·`item_insert` 를 부르는 쪽이 한다.
 *
 * 삽입은 예산을 넘길 수 있다(§5.4). 하드캡 25분은 **계획** 상한이지 세션 상한이 아니다 —
 * 틀린 판을 다시 걸지 않으려고 큐를 닫으면 「모르겠어요는 벌이 아니다」가 거짓말이 된다.
 */
import type { DayKey, Session, SessionItem } from '@chickadee/store-sql';

import { EST_MIN, LIMIT } from './plan.js';

export interface InsertAt {
  pos: number;
  role: SessionItem['role'];
  estMin: number;
  parentItemId: number | null;
}

/**
 * 다시 찍기 — 현재 자리 +3 뒤, 큐 끝을 넘으면 끝에 (02 §4·§5.5).
 * 3인 이유는 「바로 다음」이면 방금 본 진단문을 외운 것을 맞힌 것으로 세기 때문이다.
 */
export function retryAt(itemCount: number, curPos: number, parentItemId: number): InsertAt {
  return {
    pos: Math.min(itemCount, curPos + LIMIT.retry_offset),
    role: 'retry',
    estMin: EST_MIN.t0_retry,
    parentItemId,
  };
}

/**
 * 아래층(선행) — **현재 자리 앞**. 부모 판은 그대로 뒤로 밀리고, 아래층을 마치면 자동 복귀한다.
 */
export function prereqAt(curPos: number, parentItemId: number): InsertAt {
  return { pos: curPos, role: 'prereq', estMin: EST_MIN.t0_prereq, parentItemId };
}

/** 홈의 「이 판 찍기」·「판 만들기」 — 현재 뒤 (02 §5.5 마지막 문단). */
export function manualAt(curPos: number, role: 'manual' | 'gap', estMin: number): InsertAt {
  return { pos: curPos + 1, role, estMin, parentItemId: null };
}

/** 판당 최대 한 번 (02 §4). 아래층 판에서는 아예 넣지 않는다 — 깊이 1 이 규칙이다. */
export interface RetryGuard {
  /** 지금 판의 역할. `retry`·`prereq` 면 다시 찍기를 만들지 않는다. */
  role: SessionItem['role'];
  /** 같은 카드의 미완 retry 가 현재 뒤에 이미 있나 (`session.pending_retry`). */
  pendingRetry: boolean;
}

export function shouldInsertRetry(g: RetryGuard): boolean {
  if (g.role === 'retry' || g.role === 'prereq') return false;
  return !g.pendingRetry;
}

/** 아래층은 중첩되지 않는다 (깊이 1). */
export const shouldInsertPrereq = (role: SessionItem['role']): boolean => role !== 'prereq';

// ───────── 02 §5.6 중단 · 복구 ─────────

export type Resume =
  | { kind: 'resume'; sessionId: number; pos: number }
  | { kind: 'abandon'; sessionId: number }
  | { kind: 'fresh' };

/**
 * 홈에 들어올 때의 판정. 같은 `day_key` 면 이어 찍고, 날이 바뀌었으면 버린다.
 *
 * 왜 버리나: 어제 큐 + 오늘 만기를 합치면 25분을 넘긴다. 버려도 잃는 것은 없다 —
 * 완료 판의 로그는 이미 원장에 있고, 미완 카드는 만기라서 오늘 큐가 다시 집는다.
 */
export function resumeOf(
  open: Pick<Session, 'id' | 'dayKey' | 'status'> | null,
  items: readonly Pick<SessionItem, 'pos' | 'status'>[],
  today: DayKey,
): Resume {
  if (open === null) return { kind: 'fresh' };
  if (open.dayKey !== today) return { kind: 'abandon', sessionId: open.id };
  const next = items
    .filter((i) => i.status === 'pending' || i.status === 'active')
    .sort((a, b) => a.pos - b.pos)[0];
  if (next === undefined) return { kind: 'abandon', sessionId: open.id };
  return { kind: 'resume', sessionId: open.id, pos: next.pos };
}

/** 05 §3 의 저장 5시점. 이름을 상수로 둬서 화면과 테스트가 같은 말을 쓰게 한다. */
export const SAVE_POINTS = ['mount', 'graded', 'queue-changed', 'tick', 'escape'] as const;
export type SavePoint = (typeof SAVE_POINTS)[number];

/** 5초마다 `elapsed_s` 를 저장한다 (목업 persist 주기). */
export const TICK_MS = 5_000;
