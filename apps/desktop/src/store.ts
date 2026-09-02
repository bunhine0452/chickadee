/**
 * 화면 상태 (05 §2.2 「라우팅 = 상태, 라우터 없음」).
 *
 * 라우터를 쓰면 브라우저 히스토리(뒤로가기)가 생기는데 데스크톱 앱엔 뒤로가기가 없고,
 * Esc 의 주인이 둘이 된다 — 모달 지옥의 시작이다.
 *
 * **SQLite 가 유일한 진실이고 여기 있는 것은 파생 캐시다**(01 §5). 언제든 버리고
 * 다시 조회할 수 있어야 한다.
 */
import type { RepoInfo } from '@chickadee/store-sql';
import { create } from 'zustand';

import type { HomeData } from './screens/home/data.js';
import type { IngestWarningRow } from './screens/ingest/IngestScreen.js';
import type { Progress } from './screens/ingest/phases.js';

export type Screen = 'first-run' | 'home' | 'ingest' | 'settings';

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

const EMPTY: UiState = {
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

export const useUi = create<UiState & UiActions>((set) => ({
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
}));

/** 지금 고른 리포. 없으면 `null`. */
export const activeRepo = (s: UiState): RepoInfo | null =>
  s.repos.find((r) => r.id === s.activeId) ?? null;
