/**
 * 오늘의 인쇄 큐 (02 §5). 순수 함수다 — SQL 도 IPC 도 여기 없고, 조회 결과와 카드 생성기는
 * 전부 인자로 들어온다(D72: `scheduler` 는 `ipc-client` 를 import 하지 않는다).
 *
 * 큐가 하는 약속은 둘이다. **부채를 미루지 않는다**(만기 복습은 예산 초과라도 안 뺀다) 와
 * **시간이 거짓말하지 않는다**(칸 너비 = `est_min`, 그래서 예산이 실측 EMA 를 쓴다).
 */
import type { ConceptId, PlannedItem, SessionItem, Track } from '@chickadee/store-sql';

export type Role = SessionItem['role'];

/**
 * 02 §5.1 — `settings` 로 덮어쓸 수 있다.
 *
 * **T0 둘은 코드 창이 넓어지면서 올렸다 (D141).** 판에 보이는 코드가 「초점 ±2」(어디서나
 * 5줄)에서 「초점을 감싸는 블록」으로 바뀌어 읽는 시간이 늘었다 — 실측은 `t0_review`
 * 0.58~0.67분 · `t0_new` 2.08~2.17분이다. 옛 값(0.5 · 2)을 두면 만기 20건인 날 계획이
 * 27.2분으로 부풀어 `DROP_ORDER` 가 새 T1 까지 잘라 낸다. 그러면 D140 이 방금 고친
 * 「구조 판이 먼저 잘리지 않는다」가 다른 트랙에서 되풀이된다.
 *
 * 값은 실측 구간의 아래쪽이다 — 이 상수는 **첫 며칠만** 지배하고 그 뒤로는
 * `card_state.est_min_ema` 가 덮는다(`estMinFor`). 카드 은퇴로 EMA 가 전부 NULL 이 된
 * 직후가 그 며칠이라 이 값이 실제로 쓰인다.
 */
export const EST_MIN = {
  t0_review: 0.6,
  t0_new: 2.1,
  t0_retry: 0.5,
  t0_prereq: 0.7,
  t2_review: 3,
  t2_new: 4,
} as const;

export const LIMIT = {
  budget_min: 15,
  min_budget: 10,
  hard_cap_min: 25,
  reviews_per_session: 20,
  new_per_day: 2,
  t1_per_week: 2,
  t1_min_gap_days: 2,
  t2_gap_days: 2,
  retry_offset: 3,
} as const;

/** 예산은 딱 맞추지 않는다 — 15 % 까지는 넘겨 둔다(마지막 판을 자르면 흐름이 끊긴다). */
export const BUDGET_SLACK = 1.15;

const clamp = (lo: number, hi: number, v: number): number => (v < lo ? lo : v > hi ? hi : v);

/** 단계마다 원본의 몇 할을 치는가. 7~16분으로 자른다 (02 §5.1). */
export const T1_STAGE_FACTOR = [0.35, 0.5, 0.65] as const;

export function t1Est(lines: number, stage: 1 | 2 | 3): number {
  const factor = T1_STAGE_FACTOR[stage - 1] ?? T1_STAGE_FACTOR[0];
  return clamp(7, 16, Math.round(lines * factor));
}

/** 큐에 걸 후보 한 장. `card` 는 이미 있거나 방금 만든 카드다. */
export interface Candidate {
  cardId: number;
  conceptId: ConceptId;
  track: Track;
  role: Role;
  estMin: number;
}

export interface DueConcept {
  conceptId: ConceptId;
  layer: number;
  track: Track;
  /** 이 개념을 오늘 어떤 카드로 낼까. 없으면 큐에서 빠진다. */
  r: number;
}

export interface PlanInput {
  /** `settings.budget_min`. 10~25 로 잘린다. */
  budgetMin: number;
  /** 만기 복습 후보. **호출자가 R 을 이미 계산해 두었다** — 스케줄러 인스턴스는 여기 없다. */
  due: readonly DueConcept[];
  /** 겹에 맞는 카드를 고르거나 그 자리에서 만든다. 없으면 `null`. */
  pickCard: (conceptId: ConceptId, layer: number) => Candidate | null;
  /** 02 §6.2 순위대로 온 새 개념 후보. */
  newConcepts: readonly { conceptId: ConceptId; bestSiteId: number }[];
  /** 새 판 만들기. 사전이 비면 `null` 이고 그 개념은 「판이 없는 문법」으로 남는다. */
  makeNewCard: (conceptId: ConceptId, siteId: number) => Candidate | null;
  /** 오늘 이미 찍은 새 판 수 (세션 합산). */
  newCountToday: number;
  /** `settings.new_per_day`. */
  newPerDay?: number;
  /** T1 슬롯 — 리듬이 찼고 걸 카드가 있으면. 없으면 `null` (M2 에는 T1 카드가 없다). */
  t1Slot?: Candidate | null;
  /** T2 슬롯 — 같은 규칙. */
  t2Slot?: Candidate | null;
}

type SlotKey = `${'review' | 'new'}:${Track}`;

/** 02 §5.3 6번 — 짧은 것 먼저. 중간에 나가도 복습은 남는다. */
const ORDER: readonly SlotKey[] = [
  'review:t0', 'new:t0', 'review:t1', 'new:t1', 'review:t2', 'new:t2',
];

/**
 * 예산을 넘겼을 때 빼는 순서. **만기 복습은 이 목록에 없다.**
 *
 * 새 T2 가 마지막인 이유(D140): T2 는 하루 최대 한 장이고 간격이 2일이라 한 번 잘리면
 * 그 판은 이틀 뒤에나 다시 온다. T1 은 주 2회 리듬이라 같은 주에 또 자리가 있고,
 * 새 T0 은 하루 상한 2장이라 내일 그대로 돌아온다. 만기 20건인 날의 산수
 * (`10 + 7 + 4 + 4 = 25 > 15 × 1.15`)에서 옛 순서는 T2 를 먼저 버렸고, 그래서
 * 만기가 쌓인 사람일수록 구조 판을 영영 못 봤다.
 */
const DROP_ORDER: readonly SlotKey[] = ['new:t0', 'new:t1', 'new:t2'];

/**
 * 그 트랙의 판을 다시 찍기까지 띄우는 날수 (02 §5.3 2·3번 · D140).
 *
 * **T1 은 0** — 3단계 페이딩이 같은 카드를 일부러 다시 부른다(04 §3.2). 여기에 창을 두면
 * 1단계에서 멈춘 필사가 일주일 뒤에야 2단계로 간다.
 *
 * **T2 는 7** — 세 가지가 이 값에 맞는다. ① `trackSlot` 이 리듬을 재는 창이 이미 최근
 * 7일이라 큐의 「최근」이 하나로 남는다. ② `t2_gap_days = 2` 라 7일 안에 T2 자리는 최대
 * 네 번이고, 판 네 장(= D107 이 대지 하나에 약속한 네 종)이면 언제나 창 밖의 것이 하나
 * 있다. 네 장이 안 되면 결과가 비고, 그것이 곧 「한 장 더 구워라」 신호다 —
 * 판 수는 리듬이 요구하는 만큼에서 저절로 멈춘다. ③ 진짜 만기를 막지 않는다: 만기 T2 는
 * `queue.due` → `queue.pick_card` 로 오고 이 창은 그 경로를 건드리지 않는다. FSRS 기본
 * `w[2] = 3.173`(첫 Good 의 안정도, 일)이라 7일 창은 원장보다 늘 뒤에 선다.
 */
export const REPRINT_GAP_DAYS = { t1: 0, t2: 7 } as const;

const keyOf = (c: Candidate): SlotKey =>
  `${c.role === 'review' ? 'review' : 'new'}:${c.track}`;

/**
 * 02 §5.3. 만기 복습 → T1 슬롯 → T2 슬롯 → 새 T0 → 예산 맞추기 → 순서.
 *
 * 빈 결과는 정상이다 — 만기도 새 후보도 없으면 세션을 만들지 않고 홈이
 * 「오늘은 인쇄할 판이 없습니다」를 보인다. 억지로 채우지 않는다.
 */
export function planSession(input: PlanInput): PlannedItem[] {
  const items: Candidate[] = [];

  // 1) 만기 복습 — R 낮은 순, 상한 20. 부채는 여기서 잘린다.
  const due = [...input.due]
    .sort((a, b) => a.r - b.r || a.conceptId.localeCompare(b.conceptId))
    .slice(0, LIMIT.reviews_per_session);
  for (const m of due) {
    const card = input.pickCard(m.conceptId, m.layer);
    if (card) items.push(card);
  }

  // 2) T1 슬롯 — 만기 T1 이 이미 있으면 그것이 오늘의 T1 이다.
  if (!items.some((i) => i.track === 't1') && input.t1Slot) items.push(input.t1Slot);
  // 3) T2 슬롯.
  if (!items.some((i) => i.track === 't2') && input.t2Slot) items.push(input.t2Slot);

  // 4) 새 T0 — 하루 상한(세션 합산).
  let newLeft = (input.newPerDay ?? LIMIT.new_per_day) - input.newCountToday;
  for (const cand of input.newConcepts) {
    if (newLeft <= 0) break;
    const card = input.makeNewCard(cand.conceptId, cand.bestSiteId);
    if (card) {
      items.push(card);
      newLeft -= 1;
    }
  }

  const budget = clamp(LIMIT.min_budget, LIMIT.hard_cap_min, input.budgetMin);
  const fitted = fitBudget(items, budget * BUDGET_SLACK);
  return order(fitted).map(toPlanned);
}

const toPlanned = (c: Candidate): PlannedItem => ({
  cardId: c.cardId,
  conceptId: c.conceptId,
  track: c.track,
  role: c.role,
  estMin: c.estMin,
});

/**
 * 02 §5.3 5번. 초과분을 `새 T0 → 새 T1 → 새 T2` 순으로 뺀다. 만기 복습은 빼지 않는다 —
 * 미룬 부채는 다음 날 더 커져서 돌아온다.
 */
export function fitBudget(items: readonly Candidate[], budget: number): Candidate[] {
  const kept = [...items];
  const total = () => kept.reduce((sum, i) => sum + i.estMin, 0);
  for (const key of DROP_ORDER) {
    while (total() > budget) {
      const at = kept.map(keyOf).lastIndexOf(key);
      if (at < 0) break;
      kept.splice(at, 1);
    }
    if (total() <= budget) break;
  }
  return kept;
}

/** 02 §5.3 6번. 같은 칸 안에서는 원래 순서(만기 급한 것)를 지킨다. */
export function order(items: readonly Candidate[]): Candidate[] {
  const rank = new Map(ORDER.map((k, i) => [k, i]));
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) =>
      (rank.get(keyOf(a.item)) ?? ORDER.length) - (rank.get(keyOf(b.item)) ?? ORDER.length)
      || a.i - b.i)
    .map((x) => x.item);
}

/** `planned_min` — 진행바 전체 길이. 삽입이 생기면 늘어난다 (02 §5.4). */
export const plannedMin = (items: readonly { estMin: number }[]): number =>
  Math.round(items.reduce((sum, i) => sum + i.estMin, 0) * 10) / 10;

// ───────── 02 §5.2 리듬 ─────────

export interface Cadence {
  /** 최근 7일에 그 트랙을 몇 번 마쳤나. */
  recent: number;
  /** 마지막으로 마친 날 (`YYYY-MM-DD`). 없으면 `null`. */
  lastDay: string | null;
  /** 오늘. */
  today: string;
}

const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** T1 은 주 2회, 최소 2일 간격 (02 §5.2). */
export function t1CadenceSays(c: Cadence): boolean {
  if (c.recent >= LIMIT.t1_per_week) return false;
  return c.lastDay === null || daysBetween(c.lastDay, c.today) >= LIMIT.t1_min_gap_days;
}

/** T2 는 만기가 없을 때 2일 간격으로 한 장. */
export function t2CadenceSays(c: Cadence): boolean {
  return c.lastDay === null || daysBetween(c.lastDay, c.today) >= LIMIT.t2_gap_days;
}

/** 새 판의 예상 시간 — 트랙·역할이 정한다 (02 §5.1). `card_state.est_min_ema` 가 있으면 그것이 이긴다. */
export function estMinFor(track: Track, role: Role, ema: number | null = null): number {
  if (ema !== null && ema > 0) return ema;
  if (role === 'retry') return EST_MIN.t0_retry;
  if (role === 'prereq') return EST_MIN.t0_prereq;
  if (track === 't2') return role === 'review' ? EST_MIN.t2_review : EST_MIN.t2_new;
  if (track === 't1') return t1Est(20, 1);
  return role === 'review' ? EST_MIN.t0_review : EST_MIN.t0_new;
}
