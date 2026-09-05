/**
 * 오늘 15분, 코스판 (D165 · `docs/program/mastery.md` §4 끝).
 *
 * **만기 재검 먼저 → 오늘 챕터의 다음 단.** 예산이 넘치면 다음 단을 자르고 재검은 남긴다 —
 * 재검은 미루면 간격이 무너지고, 다음 단은 내일 그 자리에 그대로 있다. `plan.ts` 머리말의
 * 「부채를 미루지 않는다」를 챕터로 승계한 것이고, 그래서 `plan.ts` 는 한 줄도 안 바뀐다.
 *
 * 순수 함수다 — SQL 도 IPC 도 여기 없다. 만기 목록은 호출자가 `chapter.due` 로 읽어 오고
 * (그 statement 가 「같은 날 재검은 안 낸다」를 이미 지킨다), 다음 단의 판은 문항 층이 만든다.
 */
import { BUDGET_SLACK, LIMIT } from './plan.js';

const clamp = (lo: number, hi: number, v: number): number => (v < lo ? lo : v > hi ? hi : v);

/** 만기 재검 하나 — 챕터 하나가 한 칸이다 (2단 추적 1 + 3단 예측 1 이 한 칸에 든다). */
export interface RecheckItem {
  kind: 'recheck';
  unitId: number;
  /** `chapter.due_at`. 오래 밀린 것부터 낸다. */
  dueAt: number;
  estMin: number;
}

/** 오늘 챕터의 다음 단, 그 안의 판 하나. */
export interface StageItem {
  kind: 'stage';
  unitId: number;
  stage: 1 | 2 | 3 | 4 | 5;
  /** 이 판을 무엇으로 낼지 — 카드 id 든 문항 키든 호출자의 것이다. */
  ref: string;
  estMin: number;
}

export type CourseItem = RecheckItem | StageItem;

export interface CoursePlanInput {
  /** `settings.budget_min`. `plan.ts` 와 같은 10~25 로 잘린다. */
  budgetMin: number;
  /** 만기 재검. `chapter.due` 순서(만기 → 챕터 번호) 그대로 온다. */
  due: readonly RecheckItem[];
  /**
   * 오늘 챕터의 다음 단 — **판 순서대로**. 1단은 개념이 6~12개라 하루에 다 안 들어가고,
   * 그때 뒤에서 잘린 판이 내일의 첫 판이 된다. 단 전체를 통으로 버리지 않는 이유다.
   */
  next: readonly StageItem[];
}

/**
 * 큐 하나. 재검이 앞이고 그다음이 다음 단이다.
 *
 * 재검에 상한을 두지 않는다 — `plan.ts` 의 `reviews_per_session` 20 은 개념 단위라 만기가
 * 수백 건까지 가지만 챕터는 코스 하나에 열 안팎이다. 상한이 걸릴 자리가 없다.
 *
 * 다음 단은 **뒤에서 자른다** — 안 들어가는 판을 만나면 거기서 멈추고, 뒤의 작은 판을 앞으로
 * 당기지 않는다. 단 안의 판 순서가 곧 배우는 순서라 건너뛰면 순서가 깨진다.
 */
export function planCourseDay(input: CoursePlanInput): CourseItem[] {
  const due = [...input.due].sort((a, b) => a.dueAt - b.dueAt || a.unitId - b.unitId);
  const budget = clamp(LIMIT.min_budget, LIMIT.hard_cap_min, input.budgetMin) * BUDGET_SLACK;

  const out: CourseItem[] = [...due];
  let spent = due.reduce((sum, r) => sum + r.estMin, 0);
  for (const item of input.next) {
    if (spent + item.estMin > budget) break;
    out.push(item);
    spent += item.estMin;
  }
  return out;
}

/** 계획한 분 — 진행바 전체 길이. `plan.ts` 의 `plannedMin` 과 같은 반올림이다. */
export const coursePlannedMin = (items: readonly { estMin: number }[]): number =>
  Math.round(items.reduce((sum, i) => sum + i.estMin, 0) * 10) / 10;

/**
 * 재검이 예산을 통째로 먹었나. 화면이 「오늘은 밀린 재검부터」라고 말할 근거이고,
 * 이 값이 여러 날 참이면 챕터를 여는 속도가 재검을 못 따라간 것이다 (EVALS C5 가 그때 운다).
 */
export function rechecksOnly(items: readonly CourseItem[]): boolean {
  return items.length > 0 && items.every((i) => i.kind === 'recheck');
}
