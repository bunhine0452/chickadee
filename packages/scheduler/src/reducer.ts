/**
 * 잉크 겹 리듀서 (02 §3.3). **얼마나 익혔다고 보여줄지**만 정한다 — 다음 인쇄 시각은
 * `fsrs.ts` 가 정하고 이 파일은 FSRS 를 모른다.
 *
 * 규칙은 하나다: 겹은 맞힌 횟수가 아니라 **시간을 두고 다시 맞힌 횟수**로 쌓인다(정본 §2).
 * 그래서 R1(하루 최대 +1)·R2(만기 근처에서만)·R3(오답은 유지)·R4(모르겠어요는 −1, 회복만)이
 * 전부 「천장」 하나로 표현된다 — 그날 오를 수 있는 최대 겹을 아침에 정해 두고, 그날의
 * 사건들은 천장을 내리기만 한다.
 *
 * `review_log` 한 행 = 이 함수 한 번이며 `rebuildMastery()` 도 같은 함수를 돈다.
 */
import type { DayKey, Layer, Mastery } from '@chickadee/store-sql';

/** 「모르겠어요」는 답의 정오와 무관하게 우선한다 (02 §4). */
export type Outcome = 'ok' | 'wrong' | 'dunno';

export const MAX_LAYER = 4;

/** R2 — 만기 12시간 전까지는 「만기 근처」로 본다. */
export const EARLY_GRACE_MS = 12 * 3_600_000;

/** 겹 규칙만 아는 최소 모양. `Mastery` 전체를 받지 않는 이유는 재생이 이 필드만 읽기 때문이다. */
export type LayerState = Pick<
  Mastery,
  'layer' | 'dayKey' | 'dayStartLayer' | 'dayCeiling' | 'firstOkAt' | 'lastOkDay' | 'dueAt'
>;

const clampLayer = (n: number): Layer => (n < 0 ? 0 : n > MAX_LAYER ? MAX_LAYER : n) as Layer;

/**
 * R2 자격 — 개념 첫 성공이거나, 마지막 정답이 어제 이전이고 만기가 12시간 안으로 들어왔을 때.
 * 그 전에 찍으면 겹은 유지되고 원장에 `early=1` 이 박힌다.
 */
export function isEligible(m: LayerState, now: number, day: DayKey): boolean {
  if (m.firstOkAt === null) return true;
  if (m.lastOkDay === null || m.lastOkDay >= day) return false;
  return m.dueAt !== null && now >= m.dueAt - EARLY_GRACE_MS;
}

/**
 * 그날 첫 접촉. 흐려짐을 저장값으로 **물질화**하고(R6) 그날의 천장을 정한다(R1·R2·R5).
 *
 * `shown` 은 `fsrs.shownLayer(m.layer, R)` 의 결과다 — 리듀서는 R 을 계산하지 않는다.
 * 같은 날 두 번째부터는 아무 일도 하지 않는다(천장을 다시 올리면 R1 이 깨진다).
 */
export function beginDay(m: LayerState, now: number, day: DayKey, shown: Layer = m.layer): LayerState {
  if (m.dayKey === day) return m;
  const layer = shown;
  let ceiling = isEligible(m, now, day) ? clampLayer(layer + 1) : layer;
  if (m.firstOkAt === null) ceiling = clampLayer(Math.max(ceiling, 1)); // R5 첫 성공은 무조건 1겹
  return { ...m, layer, dayKey: day, dayStartLayer: layer, dayCeiling: ceiling };
}

/**
 * 판 하나의 결과를 겹에 반영한다 (R3·R4·R5).
 *
 * `ceilingCap` 은 트랙이 거는 추가 상한이다 — T1 은 3단계(백지)를 통과해야만 4겹이므로
 * 호출자가 `stage === 3 ? 4 : 3` 을 넘긴다 (02 §4 T1 행). T0 은 넘기지 않는다.
 */
export function applyOutcome(m: LayerState, o: Outcome, ceilingCap: Layer = MAX_LAYER): LayerState {
  let layer = m.layer;
  let ceiling = Math.min(m.dayCeiling, ceilingCap);

  if (o === 'dunno') {
    // R4 — 하루에 한 겹만 내려간다. 「+1 은 하루 한 번」의 대칭이다(D78): 같은 날 두 번째
    // 「모르겠어요」가 또 내리면 사다리를 열어 본 것에 벌을 주는 셈이 되고, 그것이 곧
    // 「모르겠어요는 벌이 아니라 공정」(정본 §3-1)을 깬다.
    layer = clampLayer(Math.max(m.dayStartLayer - 1, layer - 1));
    ceiling = Math.min(ceiling, m.dayStartLayer); // 같은 날 회복만
  } else if (o === 'wrong') {
    ceiling = Math.min(ceiling, layer); // R3 다시 찍기 정답이 겹을 올리지 못하게
  }
  if (m.firstOkAt === null) ceiling = Math.max(ceiling, 1); // R5
  if (o === 'ok') layer = clampLayer(Math.min(layer + 1, ceiling));

  return { ...m, layer, dayCeiling: clampLayer(ceiling) };
}

/** 한 판을 마칠 때 겹이 어떻게 움직였는지. 원장의 `layer_before`·`layer_after`·`early` 가 된다. */
export interface LayerMove {
  before: Layer;
  after: Layer;
  /** 만기 12시간 전에 찍어 겹이 오르지 못한 정답. 화면이 안내 문구를 낸다 (02 §4). */
  early: boolean;
  /** 이 판이 개념의 첫 성공인가 — LIFER 조건의 절반이다 (04 §2.2 는 `fresh && correct && !retry`). */
  firstOk: boolean;
  next: LayerState;
}

/**
 * 「그날 첫 접촉 → 결과 반영」 한 걸음. 원장 재생도 화면도 이 함수 하나만 부른다 —
 * 두 곳이 `beginDay` 를 따로 부르면 순서가 어긋나 재생 결과가 캐시와 달라진다.
 */
export function step(
  m: LayerState,
  o: Outcome,
  now: number,
  day: DayKey,
  shown: Layer = m.layer,
  ceilingCap: Layer = MAX_LAYER,
): LayerMove {
  const started = beginDay(m, now, day, shown);
  const before = started.layer;
  const next = applyOutcome(started, o, ceilingCap);
  return {
    before,
    after: next.layer,
    // 「조기」는 **만기 전에 찍었다**는 뜻만이다 (02 §4). 오늘 이미 한 겹을 받아서
    // 더 못 오르는 경우(R1)는 조기가 아니므로 「잉크가 마르지 않았다」 문구를 내지 않는다.
    early: o === 'ok' && m.firstOkAt !== null && m.dueAt !== null && now < m.dueAt - EARLY_GRACE_MS,
    firstOk: o === 'ok' && m.firstOkAt === null,
    next,
  };
}
