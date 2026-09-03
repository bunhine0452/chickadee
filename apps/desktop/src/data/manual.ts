/**
 * 홈에서 손으로 판을 거는 두 동사 (02 §5.5 마지막 문단 · D88).
 *
 * 「이 판 찍기」는 그 개념·겹에 맞는 카드를 골라 큐에 끼우고(`role='manual'`),
 * 「판 만들기」는 판이 없는 문법에 카드를 만들어 끼운다(`role='gap'`).
 *
 * **자리를 여기서 세지 않는다** — 어디에 넣을지는 `manualAt`(스케줄러)이, 자리를 비우는
 * 것은 `insertPlate`(park/unpark 한 tx)가 한다. 예상 시간도 `estMinFor` 가 정한다.
 */
import { loadDict, type Dict } from '@chickadee/dictionary';
import { ipc, log } from '@chickadee/ipc-client';
import { estMinFor, manualAt } from '@chickadee/scheduler';
import type { ConceptId, DayKey, Layer, Track } from '@chickadee/store-sql';

import { report } from '../flow.js';
import { startSession } from '../session-flow.js';
import { useUi } from '../store.js';
import { makeCard, type MakerDeps } from './cards.js';
import { insertPlate, levelFor, loadMastery, loadPlates, today, type Plate } from './session.js';
import { loadSettings } from './settings.js';

export interface ManualRequest {
  repoId: number;
  rootPath: string;
  conceptId: ConceptId;
  /**
   * 카드를 만들 때 쓸 사용처. `null` 이면 `card.sites_for_concept` 의 첫 줄을 쓴다 —
   * 그 쿼리가 이미 「미지 최소 → 짧은 줄」 순이라 02 §6.2 의 `bestSite` 와 같은 자리다.
   */
  siteId: number | null;
}

/** 판 한 장이 큐의 어디에 걸렸나. 화면이 사용자에게 말할 것이 전부 여기 있다. */
export interface ManualPlaced {
  ok: true;
  role: 'manual' | 'gap';
  cardId: number;
  /** 큐에서 이 판의 자리(0-based). 세션을 열지 못해 큐에 못 넣었으면 `null`. */
  pos: number | null;
  /** 이번 호출이 교정쇄를 새로 열었나. 열렸으면 화면이 이미 그 판을 보이고 있다. */
  opened: boolean;
  /** 같은 카드가 이미 큐에 있어 그것을 그대로 썼나(끼우지 않았다). */
  reused: boolean;
}

export type ManualResult = ManualPlaced | { ok: false; reason: 'no-plate' | 'error' };

/** 「이 판 찍기」 — 있는 카드를 겹에 맞게 고르고, 없으면 그 자리에서 만든다 (02 §6.2). */
export function pickPlateNow(req: ManualRequest): Promise<ManualResult> {
  return place(req, 'manual', async (deps, layer) => {
    const level = levelFor(layer);
    const rows = await ipc.store.query('queue.pick_card', {
      repoId: req.repoId, conceptId: req.conceptId, level,
    });
    const found = rows[0];
    if (found) return { id: found.id, track: found.track as Track };
    return made(await makeCard(deps, req.conceptId, req.siteId, level));
  });
}

/**
 * 「판 만들기」 — 판이 없는 문법에 카드를 만든다. `gap.status='card_made'` 는
 * `makeCard` 가 이미 닫는다(`card.gap_close`) — 여기서 두 번 닫지 않는다.
 */
export function makePlateFor(req: ManualRequest): Promise<ManualResult> {
  return place(req, 'gap', async (deps, layer) =>
    made(await makeCard(deps, req.conceptId, req.siteId, levelFor(layer))));
}

const made = (cardId: number | null): { id: number; track: Track } | null =>
  cardId === null ? null : { id: cardId, track: 't0' };

/** 카드 한 장을 확보하는 방법. 두 동사의 차이는 이것뿐이다. */
type Resolve = (deps: MakerDeps, layer: Layer) => Promise<{ id: number; track: Track } | null>;

async function place(
  req: ManualRequest,
  role: 'manual' | 'gap',
  resolve: Resolve,
): Promise<ManualResult> {
  try {
    const now = Date.now();
    const settings = await loadSettings();
    const day = today(now, settings);
    const layer = (await loadMastery([req.conceptId])).get(req.conceptId)?.layer ?? 0;

    const card = await resolve(makerFor(req, layer, now), layer);
    if (card === null) {
      // 사유는 `gap.reason` 에 남았다 (04 §1.4 「사유 없는 불가는 없다」).
      log.info('판을 만들지 못했다', { role, conceptId: req.conceptId });
      return { ok: false, reason: 'no-plate' };
    }

    const sessionId = await openToday(req.repoId, day);
    if (sessionId === null) return await openThenPlace(req, role, card, now);
    return await insertInto(sessionId, req, role, card, now);
  } catch (e) {
    report(e, role === 'gap' ? '판 만들기' : '이 판 찍기');
    return { ok: false, reason: 'error' };
  }
}

/**
 * 카드 생성기 문맥. `dictVersion` 계산은 `startSession` 과 **글자 하나까지 같아야** 한다 —
 * 그 값이 `content_hash` 에 들어가므로 다르면 같은 사용처로 카드가 두 장 생긴다
 * (`card.insert` 는 해시가 같을 때만 겹치는 것을 무시한다).
 */
function makerFor(req: ManualRequest, layer: Layer, now: number): MakerDeps {
  const dict = loadDict();
  return {
    repoId: req.repoId,
    rootPath: req.rootPath,
    dict,
    dictVersion: dictVersionOf(dict),
    layerOf: () => layer,
    now,
  };
}

const dictVersionOf = (dict: Dict): string =>
  [...dict.langs.values()].map((l) => `${l.lang}@${l.version}`).sort().join(' ');

/** 오늘 이어 찍을 세션. 어제 것은 돌려주지 않는다 — 그것은 `startSession` 이 버린다 (02 §5.6). */
async function openToday(repoId: number, day: DayKey): Promise<number | null> {
  const rows = await ipc.store.query('session.open_today', { repoId, dayKey: day });
  return rows[0]?.id ?? null;
}

/** 오늘 세션이 있을 때 — 현재 자리 **뒤**에 끼운다 (02 §5.5). */
async function insertInto(
  sessionId: number,
  req: ManualRequest,
  role: 'manual' | 'gap',
  card: { id: number; track: Track },
  now: number,
): Promise<ManualPlaced> {
  const plates = await loadPlates(sessionId);

  // 두 번 눌러도 판이 두 장 생기지 않는다. `insertRetry` 의 `pending_retry` 검사와 같은 뜻이고,
  // 여기서는 이미 읽어 둔 큐로 보므로 쿼리가 늘지 않는다.
  const already = plates.find(
    (p) => p.cardId === card.id && (p.status === 'pending' || p.status === 'active'),
  );
  if (already) {
    return { ok: true, role, cardId: card.id, pos: already.pos, opened: false, reused: true };
  }

  const at = manualAt(currentPosOf(plates, sessionId), role, estMinFor(card.track, role));
  await insertPlate(sessionId, at, { id: card.id, conceptId: req.conceptId, track: card.track }, now);

  // 교정쇄가 열려 있으면 큐가 바뀐 것을 화면도 알아야 한다 (05 §3 「queue-changed」).
  const store = useUi.getState();
  if (store.session?.id === sessionId) store.setPlates(await loadPlates(sessionId));
  return { ok: true, role, cardId: card.id, pos: at.pos, opened: false, reused: false };
}

/**
 * 오늘 세션이 없을 때 — **세션을 먼저 열고 그 뒤에 0번으로 끼운다**(선택 ⓐ).
 *
 * 문서는 「없으면 새 세션의 0번」이라고만 적었지만(02 §5.5), 세션을 여는 유일한 문
 * (`openSession`)은 `planSession` 이 짠 큐로 열린다 — 그 큐를 먼저 만들지 않으면 만기 복습이
 * 오늘 통째로 빠진다. 그래서 큐를 정상으로 짠 뒤 그 앞(0번)에 한 장을 얹는다: 「누른 판이
 * 첫 판」이라는 약속은 지키고 큐 규칙은 안 깬다.
 *
 * `planSession` 이 방금 만든 카드를 이미 집었으면 끼우지 않고 그 자리로 간다 — 같은 판을
 * 두 장 걸면 「다시 찍기」가 아닌데 두 번 묻는 판이 된다.
 */
async function openThenPlace(
  req: ManualRequest,
  role: 'manual' | 'gap',
  card: { id: number; track: Track },
  now: number,
): Promise<ManualPlaced> {
  const stub: ManualPlaced =
    { ok: true, role, cardId: card.id, pos: null, opened: false, reused: false };

  // 큐가 비면 세션이 안 열린다 (02 §5.3 빈 상태). 카드는 이미 원장에 있으니 다음 세션이 집는다.
  if (!(await startSession(req.repoId, req.rootPath))) return stub;
  const session = useUi.getState().session;
  if (session === null) return stub;

  const planned = useUi.getState().plates;
  const index = planned.findIndex((p) => p.cardId === card.id);
  const found = planned[index];
  if (found !== undefined) {
    useUi.getState().goTo(index);
    return { ok: true, role, cardId: card.id, pos: found.pos, opened: true, reused: true };
  }

  await insertPlate(
    session.id,
    { pos: 0, role, estMin: estMinFor(card.track, role), parentItemId: null },
    { id: card.id, conceptId: req.conceptId, track: card.track },
    now,
  );
  useUi.getState().setPlates(await loadPlates(session.id));
  useUi.getState().goTo(0);
  return { ok: true, role, cardId: card.id, pos: 0, opened: true, reused: false };
}

/**
 * 「현재 자리」. 화면이 그 세션을 열고 있으면 걸린 판, 아니면 이어 찍을 첫 미완 판이다.
 * 남은 판이 없으면 큐 끝(마지막 pos)이라 삽입은 맨 뒤로 간다.
 */
function currentPosOf(plates: readonly Plate[], sessionId: number): number {
  const store = useUi.getState();
  const onScreen = store.session?.id === sessionId ? plates[store.pos] : undefined;
  if (onScreen) return onScreen.pos;
  const next = plates.find((p) => p.status === 'pending' || p.status === 'active');
  return next?.pos ?? plates.reduce((max, p) => Math.max(max, p.pos), -1);
}
