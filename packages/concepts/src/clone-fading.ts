/**
 * 클론 코스의 페이딩 단계 (D120 · 04 §3 T1 3단계).
 *
 * 일일 큐의 T1 은 1단계(원본 옆에 두고 베끼기)에서 시작해 판을 마칠 때마다 오른다
 * (`card_state.stage`). 코스는 다르다 — 코스를 여는 사람은 「베끼기」가 아니라 「짓기」를
 * 하러 왔고, 목차가 파일 순서를 이미 정해 주므로 1단계는 그냥 타자 연습이 된다.
 * 그래서 **기본이 2단계(뼈대만)** 이고, 그 개념을 이미 아는 사람에게만 3단계(백지)를 준다.
 *
 * 겹 3 을 문턱으로 삼은 이유: 02 §3.3 에서 겹 3 은 「시간을 두고 세 번 다시 맞혔다」이고,
 * 04 의 T1 이 4겹을 3단계 통과에만 주는 것과 짝이 맞는다 — 3단계를 못 본 개념에게
 * 3단계를 요구하지 않으면서, 3단계를 통과할 만한 개념에는 백지를 준다.
 */

/** 코스의 기본 단계 — 뼈대만 보인다. */
export const COURSE_STAGE = 2;
/** 이 겹부터는 백지(3단계). */
export const BLANK_FROM_LAYER = 3;

/** 대표 개념의 겹으로 정하는 코스 단계. 1단계는 코스에 없다. */
export function courseStage(layer: number): 2 | 3 {
  return layer >= BLANK_FROM_LAYER ? 3 : 2;
}

/**
 * 코스가 `card_state.stage` 에 되쓸 값 — **지금 값 그대로**다.
 *
 * 코스와 일일 큐는 같은 카드를 공유한다(같은 블록이면 `content_hash` 가 같다). 코스가
 * 자기 단계를 `card_state.stage` 에 밀어 넣으면 다음 날 큐가 그 단계에서 시작하고,
 * 큐의 사다리(1 → 2 → 3)가 코스에 끌려간다. 겹은 나누되 단계는 나누지 않는다.
 */
export function keepCardStage(current: number | null | undefined): 1 | 2 | 3 {
  return current === 2 || current === 3 ? current : 1;
}
