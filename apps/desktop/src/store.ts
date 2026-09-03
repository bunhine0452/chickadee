/**
 * 화면 상태 (05 §2.2 「라우팅 = 상태, 라우터 없음」).
 *
 * 라우터를 쓰면 브라우저 히스토리(뒤로가기)가 생기는데 데스크톱 앱엔 뒤로가기가 없고,
 * Esc 의 주인이 둘이 된다 — 모달 지옥의 시작이다.
 *
 * **SQLite 가 유일한 진실이고 여기 있는 것은 파생 캐시다**(01 §5). 언제든 버리고
 * 다시 조회할 수 있어야 한다.
 */
import type { ItemState, Layer, RepoInfo, Session } from '@chickadee/store-sql';
import { create } from 'zustand';

import type { Plate } from './data/session.js';
import type { HomeData } from './screens/home/data.js';
import type { IngestWarningRow } from './screens/ingest/IngestScreen.js';
import type { Progress } from './screens/ingest/phases.js';

export type Screen = 'first-run' | 'home' | 'ingest' | 'settings';

/** 판 하나의 결과 — 채점 뒤 화면이 그리는 것 전부 (05 §3 `CardResult`). */
export interface PlateResult {
  sel: number;
  correct: boolean;
  dunno: boolean;
  layer: [Layer, Layer];
  /** 「잉크 N겹 · 다음 인쇄 …」. `applyOutcome` 결과로만 그린다 (05 §3). */
  gain: string;
  /** 만기 전에 찍어 겹이 오르지 못했다 (02 §4). */
  early: boolean;
}

/** 아래층에서 돌아올 때 들고 오는 것 (목업 `S.carry`). */
export interface Carry {
  parentItemId: number;
  /** 선행 개념에서 배운 것을 부모 판에 이어 붙일 문단. */
  payoff: string;
}

/**
 * 세션 슬라이스 (05 §3). **SQLite 가 진실이고 여기 있는 것은 진행 중인 사본**이다 —
 * 저장 5시점마다 `session_item` 으로 내려간다.
 */
export interface SessionState {
  session: Session | null;
  plates: Plate[];
  pos: number;
  /** 자리(pos) → 결과. */
  results: Record<number, PlateResult>;
  /** 자리(pos) → 초. `useSessionClock` 만 쓴다. */
  elapsed: Record<number, number>;
  carry: Carry | null;
  /** 이 세션에서 연출을 보여 준 LIFER 수. 상한 3 (정본 §3-6). */
  liferShown: number;
  done: boolean;
}

export interface UiState {
  screen: Screen;
  repos: RepoInfo[];
  activeId: number | null;
  home: HomeData | null;
  /** 인제스트 진행. 화면이 끝나면 비운다. */
  at: Progress | null;
  currentPath: string | undefined;
  warnings: IngestWarningRow[];
  ingestDone: boolean;
  cancelling: boolean;
  /** 사용자에게 보여야 하는 오류 한 줄. 내부 오류는 여기 오지 않는다 (01 §6). */
  error: string | undefined;
  toast: string | undefined;
}

export interface SessionActions {
  beginSession: (session: Session, plates: Plate[], pos: number) => void;
  setPlates: (plates: Plate[]) => void;
  goTo: (pos: number) => void;
  recordResult: (pos: number, result: PlateResult) => void;
  tick: (pos: number, seconds: number) => void;
  patchState: (pos: number, patch: ItemState) => void;
  setCarry: (carry: Carry | null) => void;
  countLifer: () => void;
  finishSession: () => void;
  closeSession: () => void;
}

export interface UiActions {
  go: (screen: Screen) => void;
  setRepos: (repos: RepoInfo[], activeId?: number | null) => void;
  setHome: (home: HomeData | null) => void;
  beginIngest: () => void;
  step: (at: Progress, currentPath?: string) => void;
  warn: (row: IngestWarningRow) => void;
  finishIngest: (error?: string) => void;
  cancel: () => void;
  say: (toast: string | undefined) => void;
  fail: (error: string | undefined) => void;
}

const NO_SESSION: SessionState = {
  session: null,
  plates: [],
  pos: 0,
  results: {},
  elapsed: {},
  carry: null,
  liferShown: 0,
  done: false,
};

const EMPTY: UiState & SessionState = {
  ...NO_SESSION,
  screen: 'first-run',
  repos: [],
  activeId: null,
  home: null,
  at: null,
  currentPath: undefined,
  warnings: [],
  ingestDone: false,
  cancelling: false,
  error: undefined,
  toast: undefined,
};

export const useUi = create<UiState & SessionState & UiActions & SessionActions>((set) => ({
  ...EMPTY,
  go: (screen) => set({ screen }),
  setRepos: (repos, activeId) =>
    set((s) => ({
      repos,
      activeId: activeId === undefined ? (s.activeId ?? repos[0]?.id ?? null) : activeId,
      screen: repos.length === 0 ? 'first-run' : s.screen === 'first-run' ? 'home' : s.screen,
    })),
  setHome: (home) => set({ home }),
  beginIngest: () =>
    set({ screen: 'ingest', at: null, warnings: [], ingestDone: false, cancelling: false, error: undefined }),
  step: (at, currentPath) => set({ at, currentPath }),
  // 경고는 쌓기만 한다 — 인제스트 하나에 수천 건이 날 수 있으므로 화면이 잘라 쓴다.
  warn: (row) => set((s) => ({ warnings: [...s.warnings, row] })),
  finishIngest: (error) => set({ ingestDone: true, cancelling: false, error }),
  cancel: () => set({ cancelling: true }),
  say: (toast) => set({ toast }),
  fail: (error) => set({ error }),

  // ───────── 세션 (05 §3) ─────────
  beginSession: (session, plates, pos) =>
    set({ ...NO_SESSION, session, plates, pos, liferShown: session.liferShown }),
  setPlates: (plates) => set({ plates }),
  goTo: (pos) => set({ pos }),
  recordResult: (pos, result) =>
    set((s) => ({ results: { ...s.results, [pos]: result } })),
  // 1초 tick 은 이것만 바꾼다 — 교정지는 선택자 때문에 리렌더되지 않는다 (05 §3).
  tick: (pos, seconds) => set((s) => ({ elapsed: { ...s.elapsed, [pos]: seconds } })),
  patchState: (pos, patch) =>
    set((s) => ({
      plates: s.plates.map((p, i) =>
        i === pos ? { ...p, state: { ...(p.state ?? {}), ...patch } } : p),
    })),
  setCarry: (carry) => set({ carry }),
  countLifer: () => set((s) => ({ liferShown: s.liferShown + 1 })),
  finishSession: () => set({ done: true }),
  closeSession: () => set({ ...NO_SESSION }),
}));

/** 지금 걸린 판. 세션이 없거나 큐 밖이면 `null`. */
export const currentPlate = (s: SessionState): Plate | null => s.plates[s.pos] ?? null;

/** 지금 고른 리포. 없으면 `null`. */
export const activeRepo = (s: UiState): RepoInfo | null =>
  s.repos.find((r) => r.id === s.activeId) ?? null;
