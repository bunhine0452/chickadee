/**
 * 사다리 화면 모형 조립 (04 §2.4 · 05 §5).
 *
 * 왜 `CardPayload` 에 굽지 않나: 2단이 보여 주는 것은 **지금의** 겹과 「내려갈 판이 있나」다.
 * 카드를 만든 날 굳혀 두면 어제 찍은 선행이 오늘도 「비어 있음」으로 보인다. 그래서 payload 는
 * 개념 id 만 들고 있고(02 §8.2), 상태는 판을 걸 때 읽는다.
 */
import { buildLadder, buildPrompt, type LadderInput } from '@chickadee/grading';
import { ipc } from '@chickadee/ipc-client';
import { applyOutcome, labelFor, type LayerState } from '@chickadee/scheduler';
import type { CardPayload, ConceptId, Layer, Settings } from '@chickadee/store-sql';

import type { LadderCard } from '../components/session/ReprintLadder.js';
import type { PrereqRow, PrereqState } from '../components/session/PrereqRung.js';
import type { UseRow } from '../components/session/UsesRung.js';

type T0Payload = Extract<CardPayload, { track: 't0' }>;

/** 사다리 3단이 보여 주는 다른 자리 수 (04 §2.4). */
export const USES_LIMIT = 3;
/** 2겹부터는 「안다」로 본다 (04 §2.4 — `known`). */
export const KNOWN_LAYER = 2;

const asLayer = (n: number): Layer => Math.max(0, Math.min(4, Math.trunc(n))) as Layer;

/**
 * 04 §2.4 2단의 상태 4갈래를 3개로 좁힌 것 — 화면은 「내려갈 수 있나」만 구분하면 된다.
 * `none` 안의 두 경우(리포에 있으나 판 없음 / 리포에 아예 없음)는 곁말이 가른다.
 */
function stateOf(layer: number, hasCard: boolean, hasSite: boolean): PrereqState {
  if (layer >= KNOWN_LAYER) return 'ok';
  return hasCard && hasSite ? 'gap' : 'none';
}

function noteOf(layer: number, state: PrereqState, hasSite: boolean): string {
  if (state === 'ok') return `${layer}겹`;
  if (state === 'gap') return layer === 0 ? '아직 안 찍음' : `${layer}겹 — 한 번 더`;
  return hasSite ? '판이 없습니다' : '내 코드엔 아직 없습니다';
}

export interface LadderData {
  card: LadderCard;
  /** 2단이 「내려갈 곳이 없다」를 보고했나 — 초보 감지가 이것을 센다 (02 §6.4). */
  nowhereToGo: boolean;
  /**
   * 「모르겠어요」가 겹을 **어디로 옮기나**. 아직 답하지 않았을 때 머리말이 쓰는 값이다 —
   * 답한 뒤라면 채점이 낸 이동(`result.layer`)이 이미 진짜다.
   */
  ly: { from: Layer; to: Layer };
  /**
   * 원래 예정돼 있던 다시 찍기 시점 — 「11일 뒤」. **처음 거는 판이면 없다**: 예정이 없던
   * 자리에 「오늘 안에 → 오늘 안에」를 적으면 이득이 없는 것을 이득처럼 말하게 된다.
   */
  nextWas?: string;
}

export interface LadderQuery {
  repoId: number;
  payload: T0Payload;
  conceptId: ConceptId;
  /** 사람이 읽는 개념 이름과 토큰 — 4단 프롬프트의 「배우려는 문법」 줄. */
  concept: { name: string; token: string };
  /** 지금 판의 사용처 — 3단에서 뺀다. */
  siteId: number | null;
  /** 지금 고른 보기. 프롬프트의 「상태 한 줄」이 이것을 쓴다. */
  sel: number | null;
  answered: boolean;
  correct: boolean;
  stuck: string;
  /**
   * 판이 걸릴 때 읽은 숙련도. 겹의 이동과 「원래 예정」이 여기서 나온다 — 행이 없으면
   * (처음 만나는 개념) `null`.
   */
  mastery: LayerState | null;
  now: number;
  settings: Pick<Settings, 'tz' | 'rolloverHour'>;
}

/**
 * 사다리 한 벌. 조립 규칙은 `@chickadee/grading` 이 갖고 있고 여기는 그 입력을 긷는다 —
 * 프롬프트가 무엇을 담고 무엇을 빼는지(D8)는 이 파일이 정하지 않는다.
 */
export async function loadLadder(q: LadderQuery): Promise<LadderData> {
  const [prereqRows, useRows] = await Promise.all([
    ipc.store.query('concept.prereqs', { repoId: q.repoId, conceptId: q.conceptId }),
    ipc.store.query('concept.uses', { repoId: q.repoId, conceptId: q.conceptId, limit: USES_LIMIT + 1 }),
  ]);

  const prereq: PrereqRow[] = prereqRows.map((r) => {
    const layer = asLayer(r.layer);
    const state = stateOf(layer, r.has_card === 1, r.has_site === 1);
    return {
      conceptId: r.prereq_id,
      n: r.name_ko,
      ly: layer,
      state,
      note: noteOf(layer, state, r.has_site === 1),
    };
  });

  // 지금 보고 있는 자리는 「다른 자리」가 아니다.
  const uses: UseRow[] = useRows
    .filter((r) => r.line_start !== q.payload.focus)
    .slice(0, USES_LIMIT)
    .map((r) => ({ siteId: r.id, f: baseName(r.path), l: r.line_start, code: r.excerpt }));

  const input: LadderInput = {
    card: q.payload,
    concept: q.concept,
    currentSiteId: q.siteId,
    prereqFacts: new Map(prereqRows.map((r) => [r.prereq_id as ConceptId, {
      layer: asLayer(r.layer),
      // 「내려갈 판이 있나」는 지금 카드가 있느냐로 본다. 없으면 즉석 생성은 점프 시점에 한다.
      cardId: r.has_card === 1 ? 0 : null,
      inRepo: r.has_site === 1,
    }])),
    useMeta: new Map(useRows.map((r) => [r.id, { shape: '', unknownCount: r.unknown_count }])),
    sel: q.sel,
    stuck: q.stuck,
  };
  // 4단 프롬프트는 여기서 만들지 않는다. 목업의 `promptOut` 은 **빈 채로 시작**하고
  // 「프롬프트 만들기」를 누른 순간 그때의 「막힌 지점」으로 조립된다 — 열 때 미리 구우면
  // 사용자가 적은 문장이 영영 안 담긴다. 그 자리는 `rebuildPrompt` 이고 화면이 들고 있는다.
  const built = buildLadder(input);

  // 겹의 이동은 **감축기가 정한다** — 「한 겹」을 화면이 따로 세면 R4 의 「같은 날 두 번째는
  // 더 안 내림」과 언젠가 갈라진다 (02 §4 · `applyOutcome`).
  const from = q.mastery?.layer ?? (0 as Layer);
  const ly = { from, to: q.mastery === null ? from : applyOutcome(q.mastery, 'dunno').layer };

  return {
    card: { dict: q.payload.dict ?? [], prereq, uses },
    nowhereToGo: built.prereq.nowhereToGo,
    ly,
    ...(q.mastery?.dueAt == null
      ? {}
      : { nextWas: labelFor(q.mastery.dueAt, q.now, q.settings.tz, q.settings.rolloverHour) }),
  };
}

/** 「막힌 지점」만 바뀌었을 때 — 사다리를 통째로 다시 긷지 않는다. */
export function rebuildPrompt(q: {
  payload: T0Payload;
  concept: { name: string; token: string };
  sel: number | null;
  stuck: string;
}): string {
  return buildPrompt({ card: q.payload, concept: q.concept, sel: q.sel, stuck: q.stuck });
}

/** 파일 이름만. 디렉터리 경로는 화면에도 프롬프트에도 담지 않는다 (D8). */
export const baseName = (path: string): string => path.split('/').pop() ?? path;
