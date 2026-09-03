/**
 * 「판 완료」 — 한 판을 마칠 때 원장에 남기는 전부 (02 §4 이벤트 표 · §8.1 쓰기 순서).
 *
 * 규칙은 하나도 여기서 만들지 않는다. 겹은 `@chickadee/scheduler` 의 리듀서가, 등급은
 * 같은 패키지의 매핑이, 판정은 `@chickadee/grading` 이 정한다 — 이 파일은 그 셋의 출력을
 * 다섯 개의 쓰기로 옮기는 곳이고, 그래서 `rebuildMastery()` 가 같은 결과를 다시 만들 수 있다.
 */
import { ipc } from '@chickadee/ipc-client';
import {
  gradeFor, shownLayerOf, step, type LayerMove, type Outcome, type Scheduler,
} from '@chickadee/scheduler';
import {
  buildPlateDoneTx, type ConceptId, type DayKey, type ItemState, type Layer, type Mastery,
  type ReviewDetail, type SessionItem, type Track,
} from '@chickadee/store-sql';

/** 한 세션에 연출까지 보여 주는 LIFER 는 셋까지다 (정본 §3-6). */
export const LIFER_CEREMONY_PER_SESSION = 3;

export interface FinishInput {
  repoId: number;
  sessionId: number;
  item: Pick<SessionItem, 'id' | 'cardId' | 'conceptId' | 'track' | 'role'>;
  /** 지금 저장할 판 내부 상태 (선택·사다리 단·이어보기). */
  state: ItemState | null;
  mastery: Mastery;
  scheduler: Scheduler;
  now: number;
  day: DayKey;
  /** 답의 정오. 「모르겠어요」와 무관하다 (02 §4 — `ok` 는 원래 값). */
  ok: boolean;
  /** 그 판에서 「모르겠어요」를 눌렀나. */
  dunno: boolean;
  /** 전이로 첫 겹을 받은 개념인가 — 첫 정답이 Hard 가 아니라 Good 이다. */
  transfer: boolean;
  detail: ReviewDetail;
  durationMs: number;
  elapsedS: number;
  /** 「모르겠어요」를 눌렀을 때만. `dunno_event` 는 판당 한 행이다. */
  dunnoEvent?: { answeredBefore: boolean; wasCorrect: boolean | null; maxRung: 1 | 2 | 3 | 4 };
  /** LIFER 채집지 — 그 개념을 처음 본 파일과 줄. 당시 경로를 박제한다. */
  site: { filePath: string; lineNo: number | null };
  /** 이 세션에서 이미 연출을 보여 준 횟수. */
  liferShown: number;
  /** T1 만 — 3단계(백지)를 통과해야 4겹이다 (02 §4). */
  stage?: 1 | 2 | 3;
}

/** 실측 소요 시간 EMA (02 §5.1 — α=0.3). 9분 예상이 19분이면 진행바가 거짓말한다. */
export const EMA_ALPHA = 0.3;

export function nextEma(previous: number | null, tookMin: number): number {
  if (previous === null) return Math.round(tookMin * 100) / 100;
  return Math.round((previous * (1 - EMA_ALPHA) + tookMin * EMA_ALPHA) * 100) / 100;
}

export interface FinishResult {
  move: LayerMove;
  grade: 1 | 2 | 3;
  dueAt: number;
  /** 개념 첫 성공 — `lifer` 행을 썼다 (D76: 다시 찍기로 맞혀도 쓴다). */
  lifer: boolean;
  /** 연출을 띄울까 — 첫 성공이고, 다시 찍기·아래층이 아니고, 세션 상한 안일 때만 (D76). */
  ceremony: boolean;
  mastery: Mastery;
}

const outcomeOf = (ok: boolean, dunno: boolean): Outcome => (dunno ? 'dunno' : ok ? 'ok' : 'wrong');

/** 연출을 못 본 LIFER 는 `shown_at = NULL` 로 남아 요약에서 보인다 (02 §4). */
const ceremonyAllowed = (role: SessionItem['role'], shown: number): boolean =>
  role !== 'retry' && role !== 'prereq' && shown < LIFER_CEREMONY_PER_SESSION;

const ceilingCapOf = (track: Track, stage: 1 | 2 | 3 | undefined): Layer =>
  track === 't1' && stage !== 3 ? 3 : 4;

/**
 * 한 tx 로 나간다 (D77). 실패하면 아무것도 안 쓴 것이고, 화면은 그 판을 다시 마칠 수 있다 —
 * `dunno_event` 만 UNIQUE 라 두 번째 시도에서 `max_rung` 이 커지는 쪽으로 합쳐진다.
 */
export async function finishPlate(input: FinishInput): Promise<FinishResult> {
  const { item, mastery, scheduler, now, day } = input;
  const outcome = outcomeOf(input.ok, input.dunno);

  const shown = shownLayerOf(mastery, scheduler, now);
  const move = step(mastery, outcome, now, day, shown, ceilingCapOf(item.track, input.stage));

  const grade = gradeFor({
    track: item.track,
    ok: input.ok,
    dunno: input.dunno,
    fresh: mastery.firstOkAt === null,
    transfer: input.transfer,
    retry: item.role === 'retry',
  });
  const fsrs = scheduler.review(mastery, grade, now);

  const next: Mastery = {
    ...mastery,
    ...move.next,
    state: fsrs.state,
    stability: fsrs.stability,
    difficulty: fsrs.difficulty,
    dueAt: fsrs.dueAt,
    lastReviewAt: fsrs.lastReviewAt,
    reps: fsrs.reps,
    lapses: fsrs.lapses,
    layer: move.after,
    firstOkAt: mastery.firstOkAt ?? (move.firstOk ? now : null),
    lastOkDay: input.ok && !input.dunno ? day : mastery.lastOkDay,
    dunnoTotal: mastery.dunnoTotal + (input.dunno ? 1 : 0),
    updatedAt: now,
  };

  const lifer = move.firstOk;
  const ceremony = lifer && ceremonyAllowed(item.role, input.liferShown);

  const t = buildPlateDoneTx({
    reviewLog: {
      sessionId: input.sessionId,
      sessionItemId: item.id,
      cardId: item.cardId,
      conceptId: item.conceptId,
      track: item.track,
      role: item.role,
      reviewedAt: now,
      dayKey: day,
      grade,
      ok: input.ok ? 1 : 0,
      dunno: input.dunno ? 1 : 0,
      early: move.early ? 1 : 0,
      elapsedDays: fsrs.elapsedDays,
      scheduledDays: fsrs.scheduledDays,
      rAtReview: fsrs.rAtReview,
      layerBefore: move.before,
      layerAfter: move.after,
      sBefore: mastery.stability,
      dBefore: mastery.difficulty,
      sAfter: fsrs.stability,
      dAfter: fsrs.difficulty,
      dueAfter: fsrs.dueAt,
      paramsId: scheduler.paramsId,
      durationMs: input.durationMs,
      detailJson: JSON.stringify(input.detail),
    },
    sessionItem: {
      id: item.id,
      status: 'done',
      elapsedS: input.elapsedS,
      stateJson: input.state === null ? null : JSON.stringify(input.state),
    },
    mastery: toMasteryParams(next),
    ...(input.dunnoEvent
      ? {
          dunnoEvent: {
            sessionItemId: item.id,
            maxRung: input.dunnoEvent.maxRung,
            layerAfter: move.after,
          },
        }
      : {}),
    ...(lifer
      ? {
          lifer: {
            conceptId: item.conceptId,
            cardId: item.cardId,
            repoId: input.repoId,
            filePath: input.site.filePath,
            lineNo: input.site.lineNo,
            at: now,
            shownAt: ceremony ? now : null,
          },
        }
      : {}),
  });

  await ipc.store.batch(t.build());

  // 카드 인스턴스 상태 — 다음 큐의 예상 시간이 이 EMA 를 쓴다 (02 §5.1).
  //
  // 부르는 쪽에서 받지 않고 여기서 읽는다: 세 곳(화면·재생·테스트)이 각자 챙기게 하면
  // 한 곳만 빠뜨려도 인쇄 횟수가 조용히 1 에 멈춘다. 판을 넘기는 경로가 아니라 마치는
  // 경로라 쿼리 한 번은 예산 밖이다.
  const stateRows = await ipc.store.query('card.state_get', { cardId: item.cardId });
  const prev = stateRows[0];
  await ipc.store.exec('card.state_upsert', {
    cardId: item.cardId,
    prints: (prev?.prints ?? 0) + 1,
    stage: input.stage ?? ((prev?.stage ?? 1) as 1 | 2 | 3),
    lastPct: prev?.last_pct ?? null,
    estMinEma: nextEma(prev?.est_min_ema ?? null, input.elapsedS / 60),
    lastPrintedAt: now,
  });

  // `applied_log_id` 는 방금 쓴 로그의 id 다. 한 번 더 읽어 캐시를 재생과 맞춘다 —
  // 이 한 줄이 없으면 `rebuild_mastery == mastery` 가 커서에서만 어긋난다.
  const written = await ipc.store.query('review.mastery_get', {
    conceptIds: JSON.stringify([item.conceptId]),
  });
  const appliedLogId = written[0]?.applied_log_id ?? next.appliedLogId;

  return { move, grade, dueAt: fsrs.dueAt, lifer, ceremony, mastery: { ...next, appliedLogId } };
}

/** `mastery` 캐시 한 행 → `review.mastery_upsert` 파라미터. */
export function toMasteryParams(m: Mastery): Parameters<typeof buildPlateDoneTx>[0]['mastery'] {
  return {
    conceptId: m.conceptId,
    state: m.state,
    stability: m.stability,
    difficulty: m.difficulty,
    dueAt: m.dueAt,
    lastReviewAt: m.lastReviewAt,
    reps: m.reps,
    lapses: m.lapses,
    layer: m.layer,
    dayKey: m.dayKey,
    dayStartLayer: m.dayStartLayer,
    dayCeiling: m.dayCeiling,
    firstOkAt: m.firstOkAt,
    lastOkDay: m.lastOkDay,
    dunnoTotal: m.dunnoTotal,
    transferFrom: m.transferFrom,
    updatedAt: m.updatedAt,
  };
}

/** 아직 원장이 없는 개념의 빈 숙련도. 전이면 1겹에서 시작한다 (02 §6.3). */
export function emptyMastery(conceptId: ConceptId, transferFrom: ConceptId | null): Mastery {
  return {
    conceptId,
    state: 0,
    stability: null,
    difficulty: null,
    dueAt: null,
    lastReviewAt: null,
    reps: 0,
    lapses: 0,
    layer: (transferFrom ? 1 : 0) as Layer,
    dayKey: null,
    dayStartLayer: 0,
    dayCeiling: 0,
    firstOkAt: null,
    lastOkDay: null,
    dunnoTotal: 0,
    transferFrom,
    appliedLogId: 0,
    updatedAt: 0,
  };
}
