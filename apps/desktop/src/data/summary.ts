/**
 * 인쇄 완료 요약 (02 §7.4 · 05 §5 `Summary`). 「오늘 움직인 잉크」가 전부다.
 *
 * 읽기 전용이다 — 요약 화면은 아무것도 쓰지 않는다(05 §3: 「오늘 판 다시 보기」는
 * `review_log` 를 다시 그릴 뿐이고 `session.discard` 는 폐기됐다, D33).
 */
import { ipc } from '@chickadee/ipc-client';
import { labelFor } from '@chickadee/scheduler';
import type { ConceptId, Layer, Settings, Track } from '@chickadee/store-sql';

export interface InkShift {
  conceptId: ConceptId;
  nameKo: string;
  token: string | null;
  track: Track;
  from: Layer;
  to: Layer;
  /** 「다음 인쇄」 — 실제 `due_at` 을 라벨로 바꾼 값 (02 §3.5). */
  nextLabel: string;
  dueAt: number;
  lastRole: string;
  ok: boolean;
}

export interface SummaryLifer {
  /** `lifer.id` 가 곧 일련번호(#047)다. */
  serial: number;
  conceptId: ConceptId;
  nameKo: string;
  token: string | null;
  filePath: string;
  lineNo: number | null;
  /** 세션 중에 연출을 못 본 것 — 요약에서 처음 보여 준다 (02 §4 · D76). */
  unseen: boolean;
}

export interface SummaryData {
  plates: number;
  exact: number;
  dunno: number;
  minutes: number;
  shifts: InkShift[];
  lifers: SummaryLifer[];
}

const asLayer = (n: number): Layer => Math.max(0, Math.min(4, Math.trunc(n))) as Layer;

export async function loadSummary(
  repoId: number,
  sessionId: number,
  sessionStartedAt: number,
  now: number,
  settings: Pick<Settings, 'tz' | 'rolloverHour'>,
): Promise<SummaryData> {
  const [shiftRows, tallyRows, liferRows] = await Promise.all([
    ipc.store.query('review.session_shifts', { sessionId }),
    ipc.store.query('review.session_tally', { sessionId }),
    ipc.store.query('review.lifer_since', { repoId, since: sessionStartedAt }),
  ]);
  const tally = tallyRows[0];

  return {
    plates: tally?.n ?? 0,
    exact: tally?.ok ?? 0,
    dunno: tally?.dunno ?? 0,
    minutes: Math.round(((tally?.duration_ms ?? 0) / 60_000) * 10) / 10,
    shifts: shiftRows.map((r) => ({
      conceptId: r.concept_id as ConceptId,
      nameKo: r.name_ko,
      token: r.token,
      track: r.track as Track,
      from: asLayer(r.layer_from),
      to: asLayer(r.layer_to),
      nextLabel: labelFor(r.due_after, now, settings.tz, settings.rolloverHour),
      dueAt: r.due_after,
      lastRole: r.last_role,
      ok: r.ok === 1,
    })),
    lifers: liferRows.map((r) => ({
      serial: r.id,
      conceptId: r.concept_id as ConceptId,
      nameKo: r.name_ko,
      token: r.token,
      filePath: r.file_path,
      lineNo: r.line_no,
      unseen: r.shown_at === null,
    })),
  };
}

/** 요약에서 처음 본 LIFER 는 본 것으로 표시한다 — 다음 요약에서 또 새것처럼 뜨지 않게. */
export async function markLifersShown(ids: readonly number[], now: number): Promise<void> {
  if (ids.length === 0) return;
  await ipc.store.batch(ids.map((id) => ({
    name: 'review.lifer_shown' as const,
    params: { id, shownAt: now },
  })));
}
