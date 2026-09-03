/**
 * 세션 흐름 (05 §3 · 02 §4·§5.5). 화면이 부르는 동사만 모아 둔 곳이다 —
 * 컴포넌트는 IPC 도 SQL 도 규칙도 모르고 여기만 부른다.
 *
 * 규칙의 주인은 여전히 셋이다: 판정 `@chickadee/grading` · 겹과 큐 `@chickadee/scheduler` ·
 * 문항 `@chickadee/cards`. 이 파일은 그 셋을 원장과 store 에 잇는다.
 */
import { newcomerFlag, recountUnknown } from '@chickadee/concepts';
import { loadDict, type Dict } from '@chickadee/dictionary';
import { gradeT0, isLifer, t0Answered, toReviewDetail, type T0Answered } from '@chickadee/grading';
import { IpcError, ipc, log } from '@chickadee/ipc-client';
import { TICK_MS, labelFor, shouldInsertPrereq, shouldInsertRetry } from '@chickadee/scheduler';
import type { CardPayload, ConceptId, ItemState, Layer } from '@chickadee/store-sql';

import { measure, markSessionOpen } from './devtools/audit.js';
import { cardMaker, makeCard, type MakerDeps } from './data/cards.js';
import { emptyMastery, finishPlate } from './data/plate.js';
import {
  insertPrereq, insertRetry, loadMastery, loadPlates, openSession, recordDunno, recordLadder,
  removePlate, saveItem, saveSession, today, type Plate,
} from './data/session.js';
import { loadScheduler, loadSettings, saveSetting } from './data/settings.js';
import { report, todayKey } from './flow.js';
import { useUi, type PlateResult } from './store.js';

export { TICK_MS };

/**
 * 세션 하나가 쓰는 카드 생성기 문맥. **판을 만들 때만** 필요하다 —
 * 채점·사다리·저장은 이것이 없어도 돈다(그래야 화면 테스트가 큐를 손으로 넣고 돌 수 있다).
 */
let maker: MakerDeps | null = null;

const t0Of = (payload: CardPayload): Extract<CardPayload, { track: 't0' }> | null =>
  payload.track === 't0' ? payload : null;

/**
 * 홈의 「인쇄 시작」. 오늘 세션이 있으면 이어 찍고, 큐가 비면 아무것도 열지 않는다.
 * 돌아온 값이 `false` 면 화면은 「오늘은 인쇄할 판이 없습니다」를 보인다 (02 §5.3).
 */
export async function startSession(repoId: number, rootPath: string): Promise<boolean> {
  try {
    const dict = loadDict();
    const now = Date.now();
    const layers = new Map<ConceptId, Layer>();
    const deps: MakerDeps = {
      repoId,
      rootPath,
      dict,
      dictVersion: dictVersionOf(dict),
      layerOf: (conceptId) => layers.get(conceptId) ?? 0,
      now,
    };
    maker = deps;

    const view = await openSession(repoId, now, cardMaker(deps));
    if (view === null) return false;

    // 유형 선호(04 §1.4)가 겹을 보므로 큐에 걸린 개념의 겹을 미리 담아 둔다.
    for (const [conceptId, m] of await loadMastery(view.plates.map((p) => p.conceptId))) {
      layers.set(conceptId, m.layer);
    }
    markSessionOpen();
    useUi.getState().beginSession(view.session, view.plates, view.pos);
    return true;
  } catch (e) {
    report(e, '인쇄 시작');
    return false;
  }
}

function dictVersionOf(dict: Dict): string {
  const versions = [...dict.langs.values()].map((l) => `${l.lang}@${l.version}`).sort();
  return versions.join(' ');
}

// ───────── 채점 (02 §4 · 04 §2) ─────────

export interface AnswerInput {
  /** 고른 보기 인덱스. **0-based** 다 — 키보드 `1~4` 는 화면이 −1 해서 넘긴다. */
  sel: number;
  elapsedMs: number;
  /** 이 판에서 「모르겠어요」를 눌렀나. */
  dunno: boolean;
  /** 열어 본 사다리 단. */
  rungsOpened: number[];
}

/**
 * 판 하나를 마친다. 겹·FSRS·원장은 `finishPlate` 가, 다시 찍기 삽입은 여기가 한다 —
 * 삽입은 큐의 일이고 큐는 원장 다음에 손대야 순서가 뒤집히지 않는다.
 */
export async function answerPlate(input: AnswerInput): Promise<PlateResult | null> {
  const store = useUi.getState();
  const { session, pos, plates } = store;
  const plate = plates[pos];
  if (session === null || plate === undefined) return null;

  const payload = t0Of(plate.payload);
  if (payload === null) return null;

  try {
    const settings = await loadSettings();
    const day = today(Date.now(), settings);
    const now = Date.now();

    const parent = plate.parentItemId === null
      ? undefined
      : t0Of(plates.find((p) => p.id === plate.parentItemId)?.payload ?? plate.payload) ?? undefined;
    // 05 §10 `t0:grade` 예산 30ms 는 **판정 계산**의 것이다 — 원장 쓰기는 그 뒤다.
    const verdict = measure('t0:grade', () => gradeT0(payload, input.sel, parent));

    const mastery = (await loadMastery([plate.conceptId])).get(plate.conceptId)
      ?? emptyMastery(plate.conceptId, null);
    const fresh = mastery.firstOkAt === null;

    const event: T0Answered = t0Answered({
      cardId: plate.cardId,
      conceptId: plate.conceptId,
      siteId: plate.siteId ?? 0,
      kind: payload.kind,
      sel: input.sel,
      correct: verdict.correct,
      dunno: input.dunno,
      rungsOpened: input.rungsOpened,
      elapsedMs: input.elapsedMs,
      retry: plate.role === 'retry',
      prereq: plate.role === 'prereq',
      fresh,
      seed: 0,
      ...(plate.parentItemId === null ? {} : { parentCardId: plate.cardId }),
    });

    const state: ItemState = { sel: input.sel, answered: true, dunno: input.dunno };
    const finished = await finishPlate({
      repoId: session.repoId,
      sessionId: session.id,
      item: plate,
      state,
      mastery,
      scheduler: await loadScheduler(now, settings.desiredRetention),
      now,
      day,
      ok: verdict.correct,
      dunno: input.dunno,
      transfer: mastery.transferFrom !== null,
      detail: toReviewDetail(event, payload.answer),
      durationMs: input.elapsedMs,
      elapsedS: Math.round(input.elapsedMs / 1000),
      ...(input.dunno
        ? {
            dunnoEvent: {
              answeredBefore: true,
              wasCorrect: verdict.correct,
              maxRung: maxRung(input.rungsOpened),
            },
          }
        : {}),
      site: { filePath: payload.file, lineNo: payload.focus },
      liferShown: store.liferShown,
    });

    // 오답·모르겠어요면 다시 찍기를 건다 (02 §4). 아래층·다시 찍기 판에서는 안 넣고,
    // 「같은 판의 retry 가 이미 뒤에 있나」는 `insertRetry` 가 SQL 로 본다 — 여기서 `false` 를
    // 넘기는 것은 그 검사를 두 번 하지 않겠다는 뜻이다.
    if ((!verdict.correct || input.dunno) && shouldInsertRetry({ role: plate.role, pendingRetry: false })) {
      await insertRetry(session.id, plate.pos, plate.id,
        { id: plate.cardId, conceptId: plate.conceptId, track: plate.track }, now);
    }
    useUi.getState().setPlates(await loadPlates(session.id));

    const result: PlateResult = {
      sel: input.sel,
      correct: verdict.correct,
      dunno: input.dunno,
      layer: [finished.move.before, finished.move.after],
      gain: gainText(finished.move.before, finished.move.after, finished.dueAt, now, settings),
      early: finished.move.early,
    };
    useUi.getState().recordResult(pos, result);
    if (finished.ceremony) useUi.getState().countLifer();
    if (isLifer(event)) log.info('처음 기록한 개념', { conceptId: plate.conceptId });
    return result;
  } catch (e) {
    report(e, '채점');
    return null;
  }
}

const maxRung = (rungs: readonly number[]): 1 | 2 | 3 | 4 =>
  (rungs.length === 0 ? 1 : Math.max(...rungs)) as 1 | 2 | 3 | 4;

/** 「잉크 N겹 · 다음 인쇄 …」 — `applyOutcome` 결과로만 그린다 (05 §3). */
function gainText(
  before: Layer,
  after: Layer,
  dueAt: number,
  now: number,
  settings: { tz: string; rolloverHour: number },
): string {
  const next = labelFor(dueAt, now, settings.tz, settings.rolloverHour);
  if (after > before) return `잉크 ${after}겹 · 다음 인쇄 ${next}`;
  if (after < before) return `잉크 ${after}겹으로 내려갑니다 · 다음 인쇄 ${next}`;
  return `잉크 ${after}겹 그대로 · 다음 인쇄 ${next}`;
}

// ───────── 사다리 (02 §4 · 04 §2.4) ─────────

/** 「모르겠어요」를 누른 순간. 판당 한 행이고 겹은 판을 마칠 때 움직인다. */
export async function pressDunno(answered: boolean, wasCorrect: boolean | null): Promise<number> {
  const { plates, pos } = useUi.getState();
  const plate = plates[pos];
  if (plate === undefined) return 0;
  try {
    return await recordDunno(plate, Date.now(), answered, wasCorrect, plate.layer);
  } catch (e) {
    report(e, '모르겠어요');
    return 0;
  }
}

export async function openRung(dunnoEventId: number, rung: 1 | 2 | 3 | 4): Promise<void> {
  if (dunnoEventId === 0) return;
  try {
    await recordLadder(dunnoEventId, rung, 'open', null, Date.now());
  } catch (e) {
    log.warn('사다리 발자국을 남기지 못했다', { errorCode: e instanceof IpcError ? e.code : 'UNKNOWN' });
  }
}

/**
 * 아래층 점프 (02 §4). 현재 자리 **앞**에 선행 판을 끼우고 부모는 뒤로 밀린다.
 * 깊이는 1 이다 — 아래층에서 또 내려가지 않는다.
 */
export async function jumpPrereq(
  dunnoEventId: number,
  conceptId: ConceptId,
): Promise<boolean> {
  const { session, plates, pos } = useUi.getState();
  const plate = plates[pos];
  if (session === null || plate === undefined || maker === null) return false;
  if (!shouldInsertPrereq(plate.role)) return false;

  try {
    const cardId = await makeCard(maker, conceptId, null, 1);
    if (cardId === null) return false;
    await insertPrereq(session.id, plate.pos, plate.id,
      { id: cardId, conceptId, track: 't0' }, Date.now());
    await recordLadder(dunnoEventId, 2, 'jump', cardId, Date.now());

    useUi.getState().setPlates(await loadPlates(session.id));
    useUi.getState().goTo(plate.pos);
    return true;
  } catch (e) {
    report(e, '아래층 점프');
    return false;
  }
}

/** 아래층에서 `B` 로 올라간다 — 로그를 남기지 않고 그 판만 지운다 (02 §4). */
export async function backFromPrereq(dunnoEventId: number): Promise<void> {
  const { session, plates, pos } = useUi.getState();
  const plate = plates[pos];
  if (session === null || plate === undefined || plate.role !== 'prereq') return;
  try {
    await removePlate(plate.id);
    if (dunnoEventId !== 0) await recordLadder(dunnoEventId, 2, 'back', null, Date.now());
    useUi.getState().setPlates(await loadPlates(session.id));
  } catch (e) {
    report(e, '위로');
  }
}

/**
 * 아래층을 마치고 부모로 돌아온다. 「이어보기」 문단이 열리는 것은 이 신호 하나 때문이다
 * (02 §4 — `state_json.returned = true`).
 */
export async function returnToParent(dunnoEventId: number): Promise<void> {
  const { session, plates, pos } = useUi.getState();
  const done = plates[pos];
  if (session === null || done === undefined || done.parentItemId === null) return;
  const parentIndex = plates.findIndex((p) => p.id === done.parentItemId);
  if (parentIndex < 0) return;
  const parent = plates[parentIndex] as Plate;

  try {
    const payoff = t0Of(parent.payload)?.payoff ?? '';
    await saveItem(parent.id, 'pending', parent.elapsedS, { ...(parent.state ?? {}), returned: true });
    if (dunnoEventId !== 0) await recordLadder(dunnoEventId, 2, 'return', null, Date.now());
    useUi.getState().setCarry({ parentItemId: parent.id, payoff });
    useUi.getState().setPlates(await loadPlates(session.id));
    useUi.getState().goTo(parentIndex);
  } catch (e) {
    report(e, '복귀');
  }
}

// ───────── 저장 5시점 (05 §3) ─────────

export async function savePlate(status: Plate['status'] = 'active'): Promise<void> {
  const { session, plates, pos, elapsed } = useUi.getState();
  const plate = plates[pos];
  if (session === null || plate === undefined) return;
  try {
    // 이미 마친 판을 `active` 로 되돌리지 않는다 — Esc 로 나가면 5초 tick 과 나가기 저장이
    // 둘 다 이 함수를 부르는데, 그때 마지막 판이 다시 「안 푼 판」이 되면 이어 찍기가
    // 같은 판을 또 건다.
    const keep = plate.status === 'done' ? 'done' : status;
    await saveItem(plate.id, keep, elapsed[pos] ?? plate.elapsedS, plate.state);
  } catch (e) {
    log.warn('판 저장을 건너뛴다', { errorCode: e instanceof IpcError ? e.code : 'UNKNOWN' });
  }
}

/** Esc — 확인 모달 없이 나가고 진행은 남는다 (정본 §3-4). */
export async function pauseSession(): Promise<void> {
  const store = useUi.getState();
  const { session } = store;
  if (session === null) return;
  try {
    await savePlate('active');
    await saveSession(session, 'paused', totalElapsed(store.elapsed), session.plannedMin, null,
      store.liferShown);
  } catch (e) {
    report(e, '세션 저장');
  } finally {
    useUi.getState().closeSession();
    useUi.getState().go('home');
  }
}

/** 마지막 판을 마쳤다. 요약을 보여 주고 홈은 세션이 닫힐 때 다시 읽는다 (05 §3). */
export async function completeSession(): Promise<void> {
  const store = useUi.getState();
  const { session } = store;
  if (session === null) return;
  try {
    await saveSession(session, 'done', totalElapsed(store.elapsed), session.plannedMin,
      Date.now(), store.liferShown);
    await afterSession(session.repoId, session.id);
  } catch (e) {
    report(e, '세션 마무리');
  }
  useUi.getState().finishSession();
}

/**
 * 세션이 끝나고 도는 것 둘 (02 §6.1·§6.4).
 *
 * 화면을 막지 않는다 — 실패해도 요약은 이미 떠 있고, 다음 세션이 다시 센다.
 */
async function afterSession(repoId: number, sessionId: number): Promise<void> {
  const dict = maker?.dict ?? loadDict();

  // ① 「아직 모르는 개념 개수」 다시 세기. 겹이 움직였으면 그 줄의 순위가 바뀐다.
  const rows = await ipc.store.query('queue.known_rows', {});
  await recountUnknown(dict, repoId, rows.map((r) => ({
    conceptId: r.id, layer: r.layer, universalId: r.universal_id,
  })));

  // ② 초보 감지. 아무것도 잠그지 않는다 — 홈에 안내 한 줄이 뜰 뿐이다 (정본 §1).
  const [roots, empties, settings] = await Promise.all([
    ipc.store.query('review.session_root_new', { sessionId }),
    ipc.store.query('review.ladder_empty_prereq', { sessionId }),
    loadSettings(),
  ]);
  const flag = newcomerFlag({
    rootResults: roots.map((r) => ({ conceptId: r.concept_id, ok: r.ok === 1, dunno: r.dunno === 1 })),
    emptyPrereqReports: empties[0]?.n ?? 0,
    previous: settings.newcomerFlag,
  });
  if (flag !== settings.newcomerFlag) await saveSetting('newcomerFlag', flag, Date.now());
}

const totalElapsed = (elapsed: Record<number, number>): number =>
  Object.values(elapsed).reduce((a, b) => a + b, 0);

/** 오늘이 언제인지는 `flow.ts` 가 이미 안다 — 두 벌로 두지 않는다. */
export { todayKey };
