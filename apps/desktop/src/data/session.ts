/**
 * 교정쇄(세션)의 데이터 층 (02 §5 · 05 §3). 화면은 SQL 을 모르고 이 모양만 안다.
 *
 * **원장이 곧 큐다**(D10) — 진행 상태를 담는 블롭이 따로 없고 `session` + `session_item`
 * 두 테이블이 전부다. 그래서 Esc 로 나갔다 돌아오면 이어 찍히고, 강제 종료 뒤에도 같다.
 */
import { MAX_BLOCK_LINES, MAX_UNKNOWN_CONCEPTS, MIN_BLOCK_LINES } from '@chickadee/cards';
import { rankNewConcepts, knownSet, levelForLayer, transferFrom } from '@chickadee/concepts';
import { langOf } from '@chickadee/dictionary';
import { t } from '@chickadee/i18n';
import { ipc } from '@chickadee/ipc-client';
import {
  LIMIT, REPRINT_GAP_DAYS, dayKey, endOfDay, estMinFor, plannedMin, planSession, prereqAt,
  resumeOf, retryAt, t1CadenceSays, t2CadenceSays,
  type Candidate, type DueConcept, type InsertAt, type Scheduler,
} from '@chickadee/scheduler';
import {
  cardPayloadSchema, fromMasteryRow, itemStateSchema, parseJsonColumn, type CardKind,
  type CardPayload, type ConceptId, type DayKey, type ItemState, type Layer, type Mastery,
  type Session, type SessionItem, type Settings, type Track,
} from '@chickadee/store-sql';

import { emptyMastery } from './plate.js';
import { loadScheduler, loadSettings } from './settings.js';

/** 큐 한 칸 — 판 한 장 + 그 판이 걸 카드. 카드 전환에 IPC 가 없도록 한 번에 긷는다 (05 §10). */
export interface Plate {
  id: number;
  pos: number;
  cardId: number;
  conceptId: ConceptId;
  track: Track;
  role: SessionItem['role'];
  estMin: number;
  parentItemId: number | null;
  status: SessionItem['status'];
  elapsedS: number;
  state: ItemState | null;
  kind: CardKind;
  level: 1 | 2 | 3;
  siteId: number | null;
  payload: CardPayload;
  nameKo: string;
  token: string | null;
  layer: Layer;
}

export interface SessionView {
  session: Session;
  plates: Plate[];
  /** 이어 찍을 자리. 새 세션이면 0. */
  pos: number;
  settings: Settings;
  scheduler: Scheduler;
}

/** 카드를 만들거나 이미 있는 것을 고르는 포트. `@chickadee/cards` 가 채운다. */
export interface CardMaker {
  /** 겹에 맞는 복습 카드. 없으면 그 자리에서 만든다. */
  forReview(conceptId: ConceptId, layer: Layer): Promise<Candidate | null>;
  /** 첫 노출 카드. 사전이 비어 만들 수 없으면 `null` — 그 개념은 「판이 없는 문법」에 남는다. */
  forNew(conceptId: ConceptId, siteId: number): Promise<Candidate | null>;
  /**
   * T1 필사 판. 블록 후보가 하나도 없거나(12~40줄 함수가 없다) 대표 개념을 못 뽑으면
   * `null` — 그러면 그날 T1 슬롯은 비고 T0 이 그 시간을 쓴다 (02 §5.3).
   */
  forBlock(): Promise<Candidate | null>;
  /**
   * T2 구조 판. 대지에 지도가 안 서거나(파일이 없다) 문제를 못 만들면 `null` —
   * T1 과 같은 규칙이다.
   */
  forUnit(): Promise<Candidate | null>;
}

const asLayer = (n: number): Layer => Math.max(0, Math.min(4, Math.trunc(n))) as Layer;

const DAY_MS = 86_400_000;

/** 만기 판정에 쓰는 오늘. 벽시계 규칙이다 (D54). */
export function today(now: number, s: Pick<Settings, 'tz' | 'rolloverHour'>): DayKey {
  return dayKey(now, s.tz, s.rolloverHour);
}

/**
 * 홈의 「인쇄 시작」이 부르는 것. 오늘 세션이 있으면 이어 찍고, 없으면 짠다.
 * 큐가 비면 `null` — 세션을 만들지 않는다 (02 §5.3 빈 상태).
 */
export async function openSession(
  repoId: number,
  now: number,
  maker: CardMaker,
): Promise<SessionView | null> {
  const settings = await loadSettings();
  const day = today(now, settings);
  const scheduler = await loadScheduler(now, settings.desiredRetention);

  const open = await loadOpen(repoId);
  const resume = resumeOf(open.session, open.items, day);

  if (resume.kind === 'resume') {
    const session = open.session as Session;
    return { session, plates: await loadPlates(session.id), pos: resume.pos, settings, scheduler };
  }
  if (resume.kind === 'abandon') {
    await abandonStale(repoId, day, now);
  }

  const planned = await buildQueue(repoId, now, day, settings, scheduler, maker);
  if (planned.length === 0) return null;

  const session = await createSession(repoId, day, now, settings.budgetMin, planned);
  return { session, plates: await loadPlates(session.id), pos: 0, settings, scheduler };
}

/** 날짜를 가리지 않고 연다 — 어제 것이 남아 있으면 그것을 버려야 오늘 큐가 선다 (02 §5.6). */
async function loadOpen(repoId: number) {
  const rows = await ipc.store.query('session.open_any', { repoId });
  const row = rows[0];
  if (!row) return { session: null, items: [] };
  const session = toSession(row);
  const items = await ipc.store.query('session.items', { sessionId: session.id });
  return {
    session,
    items: items.map((i) => ({ pos: i.pos, status: i.status as SessionItem['status'] })),
  };
}

/** 날이 바뀐 세션과 그 미완 항목을 닫는다 (02 §5.6). */
export async function abandonStale(repoId: number, day: DayKey, now: number): Promise<void> {
  await ipc.store.batch([
    { name: 'session.abandon_stale', params: { repoId, dayKey: day, at: now } },
    { name: 'session.remove_stale_items', params: { repoId, dayKey: day } },
  ]);
}

// ───────── 큐 짜기 (02 §5.3) ─────────

async function buildQueue(
  repoId: number,
  now: number,
  day: DayKey,
  settings: Settings,
  scheduler: Scheduler,
  maker: CardMaker,
) {
  const eod = endOfDay(day, settings.tz, settings.rolloverHour);
  const [dueRows, knownRows, candidateRows, edgeRows, newCount] = await Promise.all([
    ipc.store.query('queue.due', { repoId, eod, day, limit: 60 }),
    ipc.store.query('queue.known_rows', {}),
    ipc.store.query('queue.new_candidates', { repoId }),
    ipc.store.query('queue.prereq_edges', {}),
    ipc.store.query('queue.new_count_today', { repoId, day }),
  ]);

  /**
   * 꺼 둔 문법 사전 언어는 **새 판에서만** 뺀다 (05 §2.1 · D122). 이미 익힌 개념의 복습은
   * 그대로 둔다 — 원장에 겹이 쌓여 있는데 언어를 껐다고 그 기록이 멈추면, 다시 켰을 때
   * 만기가 통째로 밀려 있다. 목록이 비면 전부 켜진 것이다.
   */
  const langOn = settings.dictLangs.length === 0
    ? () => true
    : (id: string) => settings.dictLangs.includes(langOf(id));
  const candidates = candidateRows.filter((c) => langOn(c.id));

  const due: DueConcept[] = dueRows.map((m) => ({
    conceptId: m.concept_id as ConceptId,
    layer: m.layer,
    track: m.track_default as Track,
    r: scheduler.retrievability(
      {
        state: m.state as 0 | 1 | 2 | 3,
        stability: m.stability,
        difficulty: m.difficulty,
        dueAt: m.due_at,
        lastReviewAt: m.last_review_at,
        reps: m.reps,
        lapses: m.lapses,
      },
      now,
    ),
  }));

  const known = knownSet(knownRows.map((r) => ({
    conceptId: r.id, layer: r.layer, universalId: r.universal_id,
  })));
  const prereq = new Map<string, string[]>();
  for (const e of edgeRows) prereq.set(e.concept_id, [...(prereq.get(e.concept_id) ?? []), e.prereq_id]);

  const bestSites = new Map(await Promise.all(candidates.map(async (c) => {
    const rows = await ipc.store.query('queue.best_site', { repoId, conceptId: c.id });
    const s = rows[0];
    return [c.id, s ? { siteId: s.id, unknown: s.unknown_count, lineStart: s.line_start, lineEnd: s.line_end } : null] as const;
  })));

  const ranked = rankNewConcepts({
    candidates: candidates.map((c) => ({ conceptId: c.id, siteCount: c.site_count })),
    bestSiteOf: (id) => bestSites.get(id) ?? null,
    prereqOf: (id) => prereq.get(id) ?? [],
  });
  // 아는 개념은 이미 `queue.new_candidates` 가 걸렀다 — 여기서는 순위만 본다.
  void known;

  const [t1Slot, t2Slot] = await Promise.all([
    trackSlot(repoId, 't1', day, maker, now),
    trackSlot(repoId, 't2', day, maker, now),
  ]);

  // 포트는 동기라 카드를 미리 만들어 둔다 — 플래너 안에서 await 할 수 없다.
  const reviewCards = new Map<string, Candidate | null>();
  for (const m of due) reviewCards.set(m.conceptId, await maker.forReview(m.conceptId, asLayer(m.layer)));
  const newCards = new Map<string, Candidate | null>();
  for (const c of ranked.slice(0, LIMIT.new_per_day * 3)) {
    newCards.set(c.conceptId, await maker.forNew(c.conceptId as ConceptId, c.best.siteId));
  }

  return planSession({
    budgetMin: settings.budgetMin,
    due,
    pickCard: (conceptId) => reviewCards.get(conceptId) ?? null,
    newConcepts: ranked.map((c) => ({ conceptId: c.conceptId as ConceptId, bestSiteId: c.best.siteId })),
    makeNewCard: (conceptId) => newCards.get(conceptId) ?? null,
    newCountToday: newCount[0]?.n ?? 0,
    newPerDay: settings.newPerDay,
    t1Slot,
    t2Slot,
  });
}

/**
 * T1·T2 슬롯. 리듬이 「오늘 걸어라」고 할 때만 자리를 채운다.
 *
 * **두 트랙이 찾는 것이 다르다** — 02 §5.3 이 이미 다르게 적어 뒀고, D140 전에는 코드가
 * 그 차이를 안 지켰다.
 *
 * · 2번 T1 은 「단계 미완 카드 우선, 없으면 새 함수」 — **이어서 칠 판**이다. 3단계
 *   페이딩(04 §3.2)이 같은 카드를 일부러 다시 부르므로 있는 카드가 언제나 먼저다.
 * · 3번 T2 는 「새 T2 1장」 — **아직 안 본 판**이다. 만기 복습은 `queue.due` 로 오므로
 *   이 자리가 옛 판을 다시 낼 이유는 회전이 다 찼을 때뿐이다.
 *
 * 전에는 둘 다 「있는 카드 먼저」였고, `queue.next_track_card` 가 `LIMIT 1` 이라
 * 카드가 한 장이라도 있으면 늘 그 한 장이었다. 그래서 `forUnit` 은 첫 판 뒤로 죽은
 * 코드였고 D107 의 네 종은 한 번도 다 구워지지 않았다.
 */
async function trackSlot(
  repoId: number,
  track: 't1' | 't2',
  day: DayKey,
  maker: CardMaker,
  now: number,
): Promise<Candidate | null> {
  const since = shiftDay(day, -7);
  const rows = await ipc.store.query('queue.track_cadence', { repoId, track, sinceDay: since });
  const cadence = { recent: rows[0]?.recent ?? 0, lastDay: rows[0]?.last_day ?? null, today: day };
  const says = track === 't1' ? t1CadenceSays(cadence) : t2CadenceSays(cadence);
  if (!says) return null;

  const cards = await ipc.store.query('queue.next_track_card', {
    repoId, track, printedBefore: now - REPRINT_GAP_DAYS[track] * DAY_MS,
  });
  const card = cards[0];
  const found: Candidate | null = card === undefined ? null : {
    cardId: card.id,
    conceptId: card.concept_id as ConceptId,
    track,
    role: card.prints > 0 ? 'review' : 'new',
    estMin: estMinFor(track, card.prints > 0 ? 'review' : 'new', card.est_min_ema),
  };

  if (track === 't1') return found ?? maker.forBlock();

  /*
   * T2 — 구워 두고 아직 안 쓴 판이 있으면 그것, 없으면 **한 장 굽는다**(세션당 한 장).
   * 다 구웠을 때만 7일 창 밖으로 나온 옛 판을 다시 낸다.
   *
   * 순서가 반대면(옛 판 먼저) 회전이 판 넉 장에서 멈춘다: 창이 7일이고 T2 자리가 이틀에
   * 한 번이라 넷째 판을 구운 다음 날이면 첫 판이 이미 창 밖이고, 다섯째를 구울 날이
   * 영영 오지 않는다. 대지 20짜리 리포에서 네 장은 「평생 한 장」보다 낫기만 할 뿐이다.
   */
  if (found?.role === 'new') return found;
  return (await maker.forUnit()) ?? found;
}

const shiftDay = (day: string, delta: number): string => {
  const t = new Date(`${day}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + delta);
  return t.toISOString().slice(0, 10);
};

async function createSession(
  repoId: number,
  day: DayKey,
  now: number,
  budgetMin: number,
  planned: readonly { cardId: number; conceptId: ConceptId; track: Track; role: SessionItem['role']; estMin: number }[],
): Promise<Session> {
  const seq = (await ipc.store.query('session.next_seq', { repoId, dayKey: day }))[0]?.n ?? 1;
  await ipc.store.exec('session.insert', {
    repoId,
    dayKey: day,
    seqInDay: seq,
    startedAt: now,
    budgetMin,
    plannedMin: plannedMin(planned),
    status: 'active',
    planJson: JSON.stringify(planned),
  });
  const rows = await ipc.store.query('session.open_today', { repoId, dayKey: day });
  const row = rows[0];
  if (!row) throw new Error('세션을 만들지 못했다');

  await ipc.store.batch(planned.map((p, pos) => ({
    name: 'session.item_insert' as const,
    params: {
      sessionId: row.id, pos, cardId: p.cardId, conceptId: p.conceptId, track: p.track,
      role: p.role, estMin: p.estMin, parentItemId: null, createdAt: now,
    },
  })));
  return toSession(row);
}

// ───────── 읽기 ─────────

/**
 * `state_json` 은 zod 가 `{ sel?: number | undefined }` 로 내놓는데 02 §8.2 의 `ItemState` 는
 * `exactOptionalPropertyTypes` 아래에서 `{ sel?: number }` 다. 값은 같고 표기만 다르므로
 * 경계에서 한 번만 좁힌다 — 스키마가 이미 검증했다.
 */
function toItemState(raw: string | null, rowId: number): ItemState | null {
  if (raw === null) return null;
  return parseJsonColumn(itemStateSchema, raw, 'session_item', 'state_json', rowId) as ItemState;
}

export async function loadPlates(sessionId: number): Promise<Plate[]> {
  const rows = await ipc.store.query('session.items', { sessionId });
  return rows
    .filter((r) => r.status !== 'removed')
    .map((r) => ({
      id: r.id,
      pos: r.pos,
      cardId: r.card_id,
      conceptId: r.concept_id as ConceptId,
      track: r.track as Track,
      role: r.role as SessionItem['role'],
      estMin: r.est_min,
      parentItemId: r.parent_item_id,
      status: r.status as SessionItem['status'],
      elapsedS: r.elapsed_s,
      state: toItemState(r.state_json, r.id),
      kind: r.kind as CardKind,
      level: r.level as 1 | 2 | 3,
      siteId: r.site_id,
      // zod 출력의 `{ x?: T | undefined }` → §8.2 의 `{ x?: T }`. `rows.ts` 의 `fromCardRow` 와
      // 같은 좁히는 캐스트다 — 값은 이미 스키마가 검증했다.
      payload: parseJsonColumn(
        cardPayloadSchema, r.payload_json, 'card', 'payload_json', r.card_id,
      ) as CardPayload,
      nameKo: r.name_ko,
      token: r.token,
      layer: asLayer(r.layer),
    }));
}

/** 판이 걸릴 때 그 개념의 숙련도를 읽는다. 행이 없으면 빈 것을 만든다. */
export async function loadMastery(
  conceptIds: readonly ConceptId[],
): Promise<Map<ConceptId, Mastery>> {
  if (conceptIds.length === 0) return new Map();
  const rows = await ipc.store.query('review.mastery_get', {
    conceptIds: JSON.stringify([...new Set(conceptIds)]),
  });
  const out = new Map<ConceptId, Mastery>();
  for (const row of rows) {
    const m = fromMasteryRow(row);
    out.set(m.conceptId, m);
  }
  for (const id of conceptIds) if (!out.has(id)) out.set(id, emptyMastery(id, null));
  return out;
}

/** 02 §6.3 — 같은 보편 개념이 다른 언어에서 3겹 이상이면 첫 노출을 1겹에서 시작한다. */
export async function transferSourceOf(
  conceptId: ConceptId,
  universalId: string | null,
): Promise<ConceptId | null> {
  if (universalId === null) return null;
  const rows = await ipc.store.query('queue.known_rows', {});
  const donor = transferFrom(conceptId, universalId, rows.map((r) => ({
    conceptId: r.id, universalId: r.universal_id, layer: r.layer,
  })));
  return donor as ConceptId | null;
}

// ───────── 쓰기 (05 §3 저장 5시점) ─────────

export async function saveItem(
  itemId: number,
  status: SessionItem['status'],
  elapsedS: number,
  state: ItemState | null,
): Promise<void> {
  await ipc.store.exec('session.item_save', {
    id: itemId,
    status,
    elapsedS,
    stateJson: state === null ? null : JSON.stringify(state),
  });
}

export async function saveSession(
  session: Session,
  status: Session['status'],
  elapsedS: number,
  plannedMinutes: number,
  endedAt: number | null,
  liferShown: number,
): Promise<void> {
  await ipc.store.exec('session.update', {
    id: session.id,
    status,
    elapsedS,
    plannedMin: plannedMinutes,
    endedAt,
    liferShown,
  });
}

/**
 * 세션 중 삽입 (02 §5.5). 자리를 비우고 넣는 것까지 **한 tx** 여야 한다 —
 * 밀다 만 채로 끊기면 `UNIQUE(session_id, pos)` 가 다음 삽입을 영영 막는다.
 */
export async function insertPlate(
  sessionId: number,
  at: InsertAt,
  card: { id: number; conceptId: ConceptId; track: Track },
  now: number,
): Promise<void> {
  await ipc.store.batch([
    { name: 'session.shift_park', params: { sessionId, from: at.pos } },
    { name: 'session.shift_unpark', params: { sessionId } },
    {
      name: 'session.item_insert',
      params: {
        sessionId, pos: at.pos, cardId: card.id, conceptId: card.conceptId, track: card.track,
        role: at.role, estMin: at.estMin, parentItemId: at.parentItemId, createdAt: now,
      },
    },
  ]);
}

/** 오답·모르겠어요 뒤의 다시 찍기 (02 §4). 같은 판의 retry 가 이미 뒤에 있으면 넣지 않는다. */
export async function insertRetry(
  sessionId: number,
  curPos: number,
  parentItemId: number,
  card: { id: number; conceptId: ConceptId; track: Track },
  now: number,
): Promise<boolean> {
  const [pending, count] = await Promise.all([
    ipc.store.query('session.pending_retry', { sessionId, cardId: card.id, pos: curPos }),
    ipc.store.query('session.item_count', { sessionId }),
  ]);
  if ((pending[0]?.n ?? 0) > 0) return false;
  await insertPlate(sessionId, retryAt(count[0]?.n ?? 0, curPos, parentItemId), card, now);
  return true;
}

/** 아래층 점프 (02 §4). 현재 자리 앞에 끼우고 부모는 뒤로 밀린다. */
export async function insertPrereq(
  sessionId: number,
  curPos: number,
  parentItemId: number,
  card: { id: number; conceptId: ConceptId; track: Track },
  now: number,
): Promise<void> {
  await insertPlate(sessionId, prereqAt(curPos, parentItemId), card, now);
}

/** 아래층에서 `B` 로 올라가면 그 판은 지운다 — 로그를 남기지 않는다 (02 §4). */
export async function removePlate(itemId: number): Promise<void> {
  await ipc.store.exec('session.item_remove', { id: itemId });
}

/** 사다리 발자국 (02 §4 · 04 §2.4). 「모르겠어요」 한 번에 여러 행이 쌓인다. */
export async function recordDunno(
  item: Pick<SessionItem, 'id' | 'cardId' | 'conceptId'>,
  at: number,
  answeredBefore: boolean,
  wasCorrect: boolean | null,
  layerBefore: Layer,
): Promise<number> {
  await ipc.store.exec('review.dunno_insert', {
    sessionItemId: item.id,
    cardId: item.cardId,
    conceptId: item.conceptId,
    at,
    answeredBefore: answeredBefore ? 1 : 0,
    wasCorrect: wasCorrect === null ? null : wasCorrect ? 1 : 0,
    maxRung: 1,
    layerBefore,
    layerAfter: layerBefore,
  });
  const rows = await ipc.store.query('review.dunno_get', { sessionItemId: item.id });
  return rows[0]?.id ?? 0;
}

export async function recordLadder(
  dunnoEventId: number,
  rung: 1 | 2 | 3 | 4,
  action: 'open' | 'jump' | 'back' | 'return' | 'prompt_built' | 'copied',
  targetCardId: number | null,
  at: number,
): Promise<void> {
  await ipc.store.exec('review.ladder_insert', { dunnoEventId, rung, action, targetCardId, at });
}

/** 카드 `level` 은 겹이 정한다 (02 §6.2) — 같은 개념이 점점 복잡한 자기 코드로 나온다. */
export const levelFor = levelForLayer;

function toSession(row: {
  id: number; repo_id: number; day_key: string; seq_in_day: number; started_at: number;
  ended_at: number | null; budget_min: number; planned_min: number; elapsed_s: number;
  status: string; plan_json: string; lifer_shown: number;
}): Session {
  return {
    id: row.id,
    repoId: row.repo_id,
    dayKey: row.day_key as DayKey,
    seqInDay: row.seq_in_day,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    budgetMin: row.budget_min,
    plannedMin: row.planned_min,
    elapsedS: row.elapsed_s,
    status: row.status as Session['status'],
    plan: JSON.parse(row.plan_json) as Session['plan'],
    liferShown: row.lifer_shown,
  };
}

// ───────── 홈의 「오늘의 인쇄」 미리보기 ─────────

export interface TodayPreviewData {
  items: { kind: string; label: string; mins: number; sub: string; review: boolean }[];
  mins: number;
  resumeAt: number | null;
}

/**
 * 홈이 그리는 미리보기. **세션도 카드도 만들지 않는다** — 「인쇄 시작」을 누르기 전에
 * 카드를 구우면 열어 보지도 않은 판이 원장에 쌓인다.
 *
 * 그래서 여기 수치는 근사다: 만기 개념 수 × 복습 예상 + 새 판 남은 장수 × 새 판 예상.
 * 실제 큐는 `openSession` 이 짜고, 그때 예산에 맞춰 잘린다.
 */
export async function previewToday(repoId: number, now: number): Promise<TodayPreviewData> {
  const settings = await loadSettings();
  const day = today(now, settings);
  const eod = endOfDay(day, settings.tz, settings.rolloverHour);

  const open = await loadOpen(repoId);
  if (open.session !== null && open.session.dayKey === day) {
    const plates = await loadPlates(open.session.id);
    const pending = plates.filter((p) => p.status === 'pending' || p.status === 'active');
    return {
      items: plates.map(toPreviewItem),
      mins: plates.reduce((a, p) => a + p.estMin, 0),
      resumeAt: pending[0]?.pos ?? null,
    };
  }

  const [dueRows, candidates, newCount, t1Slot, t2Slot] = await Promise.all([
    ipc.store.query('queue.due', { repoId, eod, day, limit: LIMIT.reviews_per_session }),
    ipc.store.query('queue.new_candidates', { repoId }),
    ipc.store.query('queue.new_count_today', { repoId, day }),
    previewSlot(repoId, 't1', day, now),
    previewSlot(repoId, 't2', day, now),
  ]);

  const newLeft = Math.max(0, Math.min(
    settings.newPerDay - (newCount[0]?.n ?? 0),
    candidates.length,
  ));
  const items = [
    ...dueRows.map((r) => ({
      kind: r.track_default, label: r.concept_id, mins: estMinFor(r.track_default as Track, 'review'),
      sub: '복습', review: true,
    })),
    ...Array.from({ length: newLeft }, () => ({
      kind: 't0', label: t('home.previewNewT0'), mins: estMinFor('t0', 'new'),
      sub: t('session.roleNew'), review: false,
    })),
    ...(t1Slot === null ? [] : [t1Slot]),
    ...(t2Slot === null ? [] : [t2Slot]),
  ];
  return { items, mins: items.reduce((a, i) => a + i.mins, 0), resumeAt: null };
}

/**
 * T1·T2 자리 미리보기 (D170 ④). `trackSlot` 과 같은 리듬을 보되 **굽지 않는다** — 재료가
 * 있는지만 센다. 홈이 「2판 · 4분」이라 하고 세션이 「3판 · 8분」을 거는 것이 이 자리를 안 세어서였다.
 *
 * 근사인 자리: 구워 둔 판이 없으면 T1 은 열 수 있는 블록이, T2 는 파일이 붙은 대지가 있을 때
 * 한 장으로 센다. 실제로 구워지는지는 `openSession` 이 정한다.
 */
async function previewSlot(
  repoId: number,
  track: 't1' | 't2',
  day: DayKey,
  now: number,
): Promise<TodayPreviewData['items'][number] | null> {
  const rows = await ipc.store.query('queue.track_cadence', {
    repoId, track, sinceDay: shiftDay(day, -7),
  });
  const cadence = { recent: rows[0]?.recent ?? 0, lastDay: rows[0]?.last_day ?? null, today: day };
  if (!(track === 't1' ? t1CadenceSays(cadence) : t2CadenceSays(cadence))) return null;

  const cards = await ipc.store.query('queue.next_track_card', {
    repoId, track, printedBefore: now - REPRINT_GAP_DAYS[track] * DAY_MS,
  });
  const card = cards[0];
  if (card === undefined) {
    if (track === 't1') {
      const n = await ipc.store.query('block.openable', {
        repoId, minLines: MIN_BLOCK_LINES, maxLines: MAX_BLOCK_LINES, maxUnknown: MAX_UNKNOWN_CONCEPTS,
      });
      if ((n[0]?.n ?? 0) === 0) return null;
    } else if ((await ipc.store.query('queue.units', { repoId })).length === 0) {
      return null;
    }
  }
  const review = card !== undefined && card.prints > 0;
  return {
    kind: track,
    label: t(track === 't1' ? 'home.previewT1' : 'home.previewT2'),
    mins: estMinFor(track, review ? 'review' : 'new', card?.est_min_ema ?? null),
    sub: t(review ? 'session.roleReview' : 'session.roleNew'),
    review,
  };
}

const toPreviewItem = (p: Plate) => ({
  kind: p.track,
  label: p.nameKo,
  mins: p.estMin,
  sub: p.token ?? p.role,
  review: p.role === 'review' || p.role === 'retry',
});
