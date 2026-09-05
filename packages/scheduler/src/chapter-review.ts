/**
 * 챕터 재검 — FSRS 를 챕터 행에 그대로 건다 (D165 · `docs/program/mastery.md` §4 ②).
 *
 * **새 알고리즘이 0 이다.** `chapter` 행이 `mastery` 와 같은 열(S·D·`due_at`·`reps`·`lapses`)을
 * 갖도록 0007 이 만들어 두었고, 그래서 `makeScheduler` 를 한 줄도 안 고치고 인자만 바꿔 부른다.
 * `fsrs.ts`·`reducer.ts`·`plan.ts` 는 이 파일 때문에 안 바뀐다.
 *
 * 재검은 문항을 새로 만들지 않는다 — 그 챕터의 2단 추적 1 + 3단 예측 1 을 다시 낸다.
 * 그 둘의 정오가 곧 등급이고, 이 하나가 「배웠다」의 직접 증거다: 3일 뒤에도 추적하고
 * 예측하면 배운 것이고, 아니면 그날의 성능이었다.
 */
import type { ChapterProgress, ChapterSchedule, RecheckGrade } from '@chickadee/concepts';

import type { Scheduler } from './fsrs.js';

/** 재검 한 번의 답. 추적과 예측 둘뿐이다. */
export interface RecheckAnswers {
  /** 2단 추적 — 순서를 전부 맞혔나. 부분점수가 없다. */
  traceOk: boolean;
  /** 3단 예측. */
  predictOk: boolean;
}

/**
 * 등급 (`mastery.md` §4 ②) — 둘 다 맞음 Good(3) · 예측만 틀림 Hard(2) · 추적 틀림 Again(1).
 *
 * **추적이 축이다.** 예측을 틀린 것은 그 줄 하나를 잘못 읽은 것이지만 추적을 틀린 것은
 * 경로 자체를 잃은 것이고, 경로가 이 코스가 가르치는 것이다. 그래서 예측 정오와 무관하게
 * 추적이 틀리면 Again 이다.
 */
export function recheckGrade(a: RecheckAnswers): RecheckGrade {
  if (!a.traceOk) return 1;
  return a.predictOk ? 3 : 2;
}

/** 재검 한 번이 몇 문항인가 — 2단 1 + 3단 1. `stage_log.asked` 로 간다. */
export const RECHECK_ASKED = 2;

/**
 * 재검을 예산에서 잡는 시간 (`mastery.md` §4 — 「만기 재검(3~4분)」의 아래쪽).
 *
 * 이 값은 **첫 며칠만** 지배한다 — `stage_log.duration_ms` 가 쌓이면 호출자가 실측으로
 * 덮는다(`plan.ts` 의 `est_min_ema` 와 같은 자리). 실측 전이라 구간의 아래쪽을 쓴다.
 */
export const EST_RECHECK_MIN = 3;

/** 재검 답 둘을 `stage_log` 값으로. 2단을 틀리면 `passed` 가 0 이다 — 부분점수가 없다. */
export function recheckTally(a: RecheckAnswers): { asked: number; correct: number } {
  return { asked: RECHECK_ASKED, correct: (a.traceOk ? 1 : 0) + (a.predictOk ? 1 : 0) };
}

/**
 * 다음 재검 일정. 기본 파라미터로 3일 → 9일 → 3주가 나온다 (02 §3.5 궤적).
 *
 * `Scheduler` 는 `mastery` 행을 받게 쓰였고 `ChapterProgress` 가 그 열 이름을 그대로 쓴다 —
 * 구조가 같아서 변환이 없다. 그것이 0007 이 열 이름을 베낀 이유다.
 */
export function scheduleRecheck(
  scheduler: Scheduler,
  row: ChapterProgress,
  grade: RecheckGrade,
  now: number,
): ChapterSchedule {
  const r = scheduler.review(row, grade, now);
  return {
    state: r.state,
    stability: r.stability,
    difficulty: r.difficulty,
    dueAt: r.dueAt,
    lastReviewAt: r.lastReviewAt,
    reps: r.reps,
    lapses: r.lapses,
    elapsedDays: r.elapsedDays,
  };
}
