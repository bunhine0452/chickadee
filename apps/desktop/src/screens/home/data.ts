/**
 * 홈이 그리는 데이터 (05 §2.1 · 02 §7.1). 화면은 SQL 을 모르고 이 모양만 안다.
 *
 * 목업 `design/ink-home.html` 이 시각의 정본이고, 이 파일은 그 목업이 손으로 적어 둔
 * 값(`LY_COUNT`·`mins`·시트·노드)이 실데이터에서 어떤 이름으로 오는지를 고정한다.
 */
import { ipc } from '@chickadee/ipc-client';
import type { Layer } from '@chickadee/store-sql';

/** 잉크 겹 0~4 의 이름. 은유 옆에 평문을 병기한다 (정본 §6). */
export const LAYER_NAMES = [
  { n: '0겹', k: '미인쇄', plain: '실루엣만' },
  { n: '1겹', k: '애벌', plain: '흐린 하프톤' },
  { n: '2겹', k: '먹판', plain: '윤곽이 잡힘' },
  { n: '3겹', k: '+ 청판', plain: '색이 들어옴' },
  { n: '4겹', k: '+ 진홍', plain: '완성' },
] as const;

export const TRACK_NAMES = { t0: 'T0 문법', t1: 'T1 클론 코딩', t2: 'T2 구조', t3: 'T3' } as const;

/** 지난 14일 컬러 바의 칸 수. */
export const COLOR_BAR_DAYS = 14;
/** 「판이 없는 문법」 패널이 보여 주는 줄 수 (02 §7.1). */
export const GAPS_LIMIT = 5;
/** 「다시 찍을 개념」 줄 수. */
export const RETAKE_LIMIT = 6;

export type NodeState = 'done' | 'current' | 'locked' | 'open';

export interface HomeNode {
  conceptId: string;
  track: 't0' | 't1' | 't2' | 't3';
  nameKo: string;
  token: string | null;
  layer: Layer;
  /** 흐려짐을 반영한 표시 겹. M1 에서는 `layer` 와 같고 M2 의 `fade` 가 갈라놓는다. */
  shownLayer: Layer;
  state: NodeState;
  dueAt: number | null;
}

export interface HomeSheet {
  unitId: number;
  name: string;
  rootPath: string | null;
  files: number;
  /** 시트의 새 선명도 = 노드 겹의 내림 평균 (목업 `paintSheet`). */
  avgLayer: Layer;
  state: 'done' | 'current' | 'locked';
  nodes: HomeNode[];
}

export interface HomeGap {
  conceptId: string;
  nameKo: string;
  token: string | null;
  siteCount: number;
  minUnknown: number;
  hot: boolean;
  /** 막대 길이 = 이 개념의 등장 횟수 / 최대 등장 횟수 (03 §6). */
  fill: number;
}

export interface HomeRetake {
  conceptId: string;
  nameKo: string;
  token: string | null;
  track: 't0' | 't1' | 't2' | 't3';
  layer: Layer;
  dueAt: number | null;
  excerpt: string | null;
}

export interface HomeMasthead {
  concepts: number;
  printed: number;
  avgLayer: number;
}

export interface LastRun {
  status: string;
  mode: string;
  files: number;
  captures: number;
  commits: number;
  warnings: number;
  finishedAt: number | null;
  error: string | null;
}

export interface HomeData {
  masthead: HomeMasthead;
  inkScale: number[];
  sheets: HomeSheet[];
  gaps: HomeGap[];
  retake: HomeRetake[];
  /** 14칸, 오래된 날이 앞. 값은 그날 인쇄한 분. */
  days: number[];
  lastRun: LastRun | null;
  /** 인제스트된 파일 수. 0 이면 아직 읽은 것이 없다는 뜻이다. */
  files: number;
}

const asLayer = (n: number): Layer => Math.max(0, Math.min(4, Math.trunc(n))) as Layer;

/**
 * 홈 한 화면치를 읽는다. 쿼리 여섯 번 — 세션 시작 전 화면이라 예산이 넉넉하고,
 * 하나로 합치면 어느 패널이 느린지 알 수 없게 된다 (01 §8).
 */
export async function loadHome(repoId: number, today: string): Promise<HomeData> {
  const [counts, scale, units, unitFiles, gapRows, retakeRows, dayRows, runRows, fileRows] =
    await Promise.all([
      ipc.store.query('home.bundle_counts', { repoId }),
      ipc.store.query('home.layer_scale', { repoId }),
      ipc.store.query('home.units', { repoId }),
      ipc.store.query('home.unit_files', { repoId }),
      ipc.store.query('gaps.list', { repoId, limit: GAPS_LIMIT }),
      ipc.store.query('queue.retake_pending', { repoId, limit: RETAKE_LIMIT }),
      ipc.store.query('stats.days', { repoId, fromDay: shiftDay(today, -(COLOR_BAR_DAYS - 1)) }),
      ipc.store.query('home.last_run', { repoId }),
      ipc.store.query('home.file_count', { repoId }),
    ]);

  const inkScale = [0, 0, 0, 0, 0];
  for (const row of scale) inkScale[asLayer(row.layer)] = row.n;

  const filesByUnit = new Map(unitFiles.map((r) => [r.name, r.files]));
  const sheets = buildSheets(units, filesByUnit);
  const maxGap = Math.max(1, ...gapRows.map((g) => g.site_count));
  const first = counts[0];
  const run = runRows[0];

  return {
    masthead: {
      concepts: first?.concepts ?? 0,
      printed: first?.printed ?? 0,
      avgLayer: first?.avg_layer ?? 0,
    },
    inkScale,
    sheets,
    gaps: gapRows.map((g, i) => ({
      conceptId: g.concept_id,
      nameKo: g.name_ko,
      token: g.token,
      siteCount: g.site_count,
      minUnknown: g.min_unknown,
      hot: i === 0 || g.site_count >= 10,
      fill: g.site_count / maxGap,
    })),
    retake: retakeRows.map((r) => ({
      conceptId: r.concept_id,
      nameKo: r.name_ko,
      token: r.token,
      track: r.track_default as HomeRetake['track'],
      layer: asLayer(r.layer),
      dueAt: r.due_at,
      excerpt: r.excerpt,
    })),
    days: toDays(dayRows, today),
    lastRun: run
      ? {
          status: run.status,
          mode: run.mode,
          files: run.files_n,
          captures: run.captures_n,
          commits: run.commits_n,
          warnings: run.warnings_n,
          finishedAt: run.finished_at,
          error: run.error,
        }
      : null,
    files: fileRows.reduce((sum, r) => sum + r.n, 0),
  };
}

type UnitRow = Awaited<ReturnType<typeof ipc.store.query<'home.units'>>>[number];

/**
 * 노드 상태 (02 §7.1): 표시 겹 ≥ 1 이면 `done`, 직접 선행 중 이 리포에 카드가 있는데
 * 표시 겹 0 인 것이 있으면 `locked`, 잠기지 않은 첫 미인쇄가 `current`.
 *
 * M1 에는 카드가 없어 `locked` 가 나올 수 없다 — 잠금은 카드가 생기는 M2 부터다.
 */
function buildSheets(rows: readonly UnitRow[], files: ReadonlyMap<string, number>): HomeSheet[] {
  const sheets = new Map<number, HomeSheet>();
  for (const row of rows) {
    const sheet = sheets.get(row.unit_id) ?? {
      unitId: row.unit_id,
      name: row.name,
      rootPath: row.root_path,
      files: files.get(row.name) ?? 0,
      avgLayer: 0 as Layer,
      state: 'current' as const,
      nodes: [],
    };
    const layer = asLayer(row.layer);
    sheet.nodes.push({
      conceptId: row.concept_id,
      track: row.track as HomeNode['track'],
      nameKo: row.name_ko,
      token: row.token,
      layer,
      shownLayer: layer,
      state: layer >= 1 ? 'done' : 'open',
      dueAt: row.due_at,
    });
    sheets.set(row.unit_id, sheet);
  }

  for (const sheet of sheets.values()) {
    const sum = sheet.nodes.reduce((a, n) => a + n.shownLayer, 0);
    sheet.avgLayer = asLayer(sheet.nodes.length ? Math.floor(sum / sheet.nodes.length) : 0);
    sheet.state = sheet.nodes.every((n) => n.state === 'done') ? 'done' : 'current';
    // 잠기지 않은 첫 미인쇄가 「지금 여기」다.
    const next = sheet.nodes.find((n) => n.state === 'open');
    if (next) next.state = 'current';
  }
  return [...sheets.values()];
}

/** 14칸 고정. 기록이 없는 날은 0 이고, 마지막 칸이 오늘이다. */
function toDays(rows: readonly { day_key: string; mins: number }[], today: string): number[] {
  const byDay = new Map(rows.map((r) => [r.day_key, r.mins]));
  return Array.from({ length: COLOR_BAR_DAYS }, (_, i) =>
    byDay.get(shiftDay(today, i - (COLOR_BAR_DAYS - 1))) ?? 0);
}

/** `YYYY-MM-DD` 를 며칠 옮긴다. 하루 경계는 `@chickadee/scheduler` 가 이미 적용한 뒤다. */
export function shiftDay(dayKey: string, days: number): string {
  const at = new Date(`${dayKey}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}
