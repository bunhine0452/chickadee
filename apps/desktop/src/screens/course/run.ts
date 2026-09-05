/**
 * 단 오버레이가 드는 것 — 순수 함수만 (D171 ④).
 *
 * 판의 **모양**은 `payload.track` 이 정한다 (D164 ②): t0 는 지목 판, t2 `flow` 는 카드 덱,
 * t2 `radius` 는 파일 고르기, t3 는 선택형·수정·재구현. 열 `card.track` 은 전부 `t3` 라
 * 여기서는 안 본다. 채점은 `gradeStage` 가, 원장은 `recordStageResult` 가 한다 — 이 파일은
 * 그 둘 사이의 모양 변환과 셈뿐이다.
 */
import type { StageType } from '@chickadee/cards';
import { FOLD_HOPS, type ChapterProgress } from '@chickadee/concepts';
import type { StageVerdict } from '@chickadee/grading';
import type { MessageKey } from '@chickadee/i18n';
import type { Card, CardKind, CardPayload, ConceptId, StageNo } from '@chickadee/store-sql';

/** 화면이 거는 판 하나. `Card` 에서 코스 화면이 쓰는 것만 남겼다. */
export interface StageCardView {
  id: number;
  kind: CardKind;
  conceptId: ConceptId;
  stageNo: StageNo;
  type: StageType;
  payload: CardPayload;
  /** 예산과 큐 칸의 너비. `EST_MIN` 이 정한다 — 실측(`stage_log.duration_ms`)이 쌓이면 덮을 자리다. */
  estMin: number;
}

/** 단 하나를 걸 때 오버레이가 받는 것. 참조가 바뀌면 오버레이가 처음부터 다시 선다. */
export interface RunSpec {
  unitId: number;
  unitName: string;
  stage: StageNo;
  kind: 'first' | 'recheck';
  hasRepair: boolean;
  row: ChapterProgress;
  cards: StageCardView[];
}

/**
 * 판 유형별 예상 분 (`docs/program/course.md` §5.1 의 「읽는 단위」).
 * 선택형 1 · 추적 2 · 수정 3 · 재구현 6 · 들고 나가기 4. 첫 며칠만 지배하는 값이다.
 */
export const EST_MIN: Readonly<Record<StageType, number>> = {
  point: 0.5, twin: 1, blank: 0.5,
  exec: 1, hop: 2, origin: 1, caller: 2,
  cut: 1, reorder: 1, contract: 1.5,
  'patch-line': 3, 'patch-place': 2, rollback: 3,
  'reimpl-spec': 6, 'reimpl-layer': 6, handoff: 4,
};

/** 관문 판(T0) 한 장의 예상 분. 정본 §3-5 의 「T0 30초 칸」. */
export const EST_GATE_MIN = 0.5;

/** payload 모양 → 16유형. 모양이 코스 것이 아니면 `null` — 그 행은 화면이 걸지 않는다. */
export function typeOf(payload: CardPayload): StageType | null {
  switch (payload.track) {
    case 't0': return payload.kind === 'point' ? 'exec' : payload.kind === 'blank' ? 'blank' : null;
    case 't2': return payload.kind === 'flow' ? 'hop' : payload.kind === 'radius' ? 'caller' : null;
    case 't3':
      if (payload.kind === 'repair' || payload.kind === 'reimpl') return payload.type;
      return payload.kind;
    default: return null;
  }
}

/** `card.by_unit_stage` 행(이미 `fromCardRow` 를 지난 것)을 화면 모양으로. 코스 판이 아니면 버린다. */
export function toView(card: Card): StageCardView | null {
  const type = typeOf(card.payload);
  const stageNo = card.stageNo ?? null;
  if (type === null || stageNo === null) return null;
  return {
    id: card.id, kind: card.kind, conceptId: card.conceptId, stageNo, type,
    payload: card.payload, estMin: EST_MIN[type],
  };
}

const STAGE_KEY = {
  1: 'chapter.stage1', 2: 'chapter.stage2', 3: 'chapter.stage3', 4: 'chapter.stage4', 5: 'chapter.stage5',
} as const satisfies Record<StageNo, MessageKey>;

export const stageKey = (stage: StageNo): MessageKey => STAGE_KEY[stage];

const TYPE_KEY = {
  point: 'chapter.tPoint', twin: 'chapter.tTwin', blank: 'chapter.tBlank',
  exec: 'chapter.tExec', hop: 'chapter.tHop', origin: 'chapter.tOrigin', caller: 'chapter.tCaller',
  cut: 'chapter.tCut', reorder: 'chapter.tReorder', contract: 'chapter.tContract',
  'patch-line': 'chapter.tPatchLine', 'patch-place': 'chapter.tPatchPlace', rollback: 'chapter.tRollback',
  'reimpl-spec': 'chapter.tReimplSpec', 'reimpl-layer': 'chapter.tReimplLayer', handoff: 'chapter.tHandoff',
} as const satisfies Record<StageType, MessageKey>;

export const typeKey = (type: StageType): MessageKey => TYPE_KEY[type];

/**
 * 단의 셈 — 원장에 남길 `asked`·`correct`. `handoff` 는 채점이 없으므로 **묻지 않은 것**으로
 * 센다: 넣으면 5단이 늘 미달이고, 5단은 어차피 통과 게이트가 아니다(README §3).
 */
export function tally(
  cards: readonly StageCardView[],
  verdicts: Readonly<Record<number, StageVerdict>>,
): { asked: number; correct: number } {
  let asked = 0;
  let correct = 0;
  cards.forEach((c, i) => {
    if (c.type === 'handoff') return;
    asked += 1;
    if (verdicts[i]?.ok === true) correct += 1;
  });
  return { asked, correct };
}

/** 예산 총량 — 큐 바의 분모. */
export const plannedMin = (cards: readonly { estMin: number }[]): number =>
  Math.round(cards.reduce((s, c) => s + c.estMin, 0) * 10) / 10;

/**
 * 순서를 접는다 — `foldPath` 와 같은 규칙(양 끝은 남기고 사이는 고르게)을 파일 경로 배열에.
 * 2단 막힘의 처방이다(`mastery.md` §5): 선행 개념이 모자란 게 아니라 경로가 안 보이는 것이라
 * 5칸을 3칸으로 줄여 다시 묻는다.
 */
export function foldOrder(order: readonly string[], to: number = FOLD_HOPS): string[] {
  if (to < 2 || order.length <= to) return [...order];
  const keep: string[] = [];
  for (let i = 0; i < to; i += 1) {
    const at = Math.round((i * (order.length - 1)) / (to - 1));
    const item = order[at];
    if (item !== undefined) keep.push(item);
  }
  return keep;
}

/**
 * `hop` 판을 접은 것. 정답이 3칸이 되고 덱은 그 셋 + 원래 덱의 함정이다 — 접힌 칸은 덱에서도
 * 뺀다(남기면 「정답이 아닌 정답」이 되어 채점이 그것을 함정으로 센다).
 */
export function foldFlow(payload: Extract<CardPayload, { track: 't2' }>): Extract<CardPayload, { track: 't2' }> {
  if (payload.flow === undefined) return payload;
  const answer = foldOrder(payload.flow.answer);
  const dropped = new Set(payload.flow.answer.filter((p) => !answer.includes(p)));
  const deck = payload.flow.deck.filter((p) => !dropped.has(p));
  return { ...payload, flow: { answer, deck } };
}

/** 세션 큐 칸의 색 — 판 모양을 트랙 별칭으로 접는다 (`TimeQueue` 의 `kind`). */
export function queueKindOf(type: StageType): 't0' | 't1' | 't2' {
  if (type === 'exec' || type === 'point' || type === 'blank' || type === 'twin') return 't0';
  if (type === 'hop' || type === 'caller') return 't2';
  if (type.startsWith('reimpl') || type === 'handoff' || type.startsWith('patch') || type === 'rollback') return 't1';
  // 선택형 다섯은 T0 판과 같은 모양이라 같은 색이다.
  return 't0';
}
