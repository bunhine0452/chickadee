/**
 * 화면 상태 (05 §2.2 「라우팅 = 상태, 라우터 없음」).
 *
 * 라우터를 쓰면 브라우저 히스토리(뒤로가기)가 생기는데 데스크톱 앱엔 뒤로가기가 없고,
 * Esc 의 주인이 둘이 된다 — 모달 지옥의 시작이다.
 *
 * **SQLite 가 유일한 진실이고 여기 있는 것은 파생 캐시다**(01 §5). 언제든 버리고
 * 다시 조회할 수 있어야 한다.
 */
import { getLocale, type Locale } from '@chickadee/i18n';
import type { ItemState, Layer, RepoInfo, Session } from '@chickadee/store-sql';
import { TOAST_MS } from '@chickadee/ui';
import { create } from 'zustand';

import type { CloneScope } from './data/clone.js';
import type { Plate } from './data/session.js';
import type { HomeData } from './screens/home/data.js';
import type { IngestWarningRow } from './screens/ingest/IngestScreen.js';
import type { Progress } from './screens/ingest/phases.js';

export type Screen = 'first-run' | 'home' | 'ingest' | 'repos' | 'settings' | 'clone';

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
  /**
   * 표시 언어 (D117). `t()` 는 모듈 상태를 읽으므로 문구 자체는 이것 없이도 바뀌지만,
   * **React 가 다시 그릴 이유**가 여기 있어야 부팅이 세운 언어가 첫 화면에 닿는다.
   */
  locale: Locale;
  /** 첫 실행의 「프로그래밍이 처음인가요?」 답 (D147). 0장의 길이만 정한다. */
  declaredNewcomer: boolean;
  repos: RepoInfo[];
  activeId: number | null;
  home: HomeData | null;
  /**
   * 클론 코스가 열릴 범위 (D120). `screen === 'clone'` 일 때만 뜻이 있다 —
   * 화면이 아니라 **어느 코스인지**를 나르는 값이라 `screen` 과 따로 둔다.
   */
  cloneScope: CloneScope | null;
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
  setLocale: (locale: Locale) => void;
  setDeclaredNewcomer: (newcomer: boolean) => void;
  setRepos: (repos: RepoInfo[], activeId?: number | null) => void;
  /** 서가·스위처의 리포 전환 (D119 · 05 §2.4). 세션 중에는 아무것도 하지 않는다. */
  setActive: (repoId: number) => boolean;
  /**
   * 클론 코스를 연다 (D120). 홈의 대지 카드·마스트헤드·서가가 부르는 **한 문**이다 —
   * 범위를 같이 넘기므로 화면에 따로 전달할 props 가 없다. 세션 중에는 열지 않는다
   * (`false` 를 돌려주고 부른 쪽이 그 이유를 말한다).
   */
  openClone: (scope: CloneScope) => boolean;
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
  locale: getLocale(),
  declaredNewcomer: false,
  repos: [],
  activeId: null,
  home: null,
  cloneScope: null,
  at: null,
  currentPath: undefined,
  warnings: [],
  ingestDone: false,
  cancelling: false,
  error: undefined,
  toast: undefined,
};

/**
 * 토스트 시계 (D170 ③). `say()` 가 띄운 문구를 지우는 코드가 어디에도 없어 T2 채점 문구가
 * 요약과 홈까지 따라왔다 — 목업의 `toast()` 는 3.6초 뒤 스스로 사라진다(`TOAST_MS`).
 * 스토어가 시계를 들고 있는 이유는 부르는 자리가 여덟 곳이라서다: 자리마다 지우면 하나는 빠진다.
 */
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUi = create<UiState & SessionState & UiActions & SessionActions>((set) => ({
  ...EMPTY,
  go: (screen) => set({ screen }),
  setLocale: (locale) => set({ locale }),
  setDeclaredNewcomer: (declaredNewcomer) => set({ declaredNewcomer }),
  setRepos: (repos, activeId) =>
    set((s) => {
      // 보던 리포가 목록에서 사라졌으면(서가에서 지웠다) 첫 줄로 내려온다. 그대로 두면
      // `activeRepo()` 가 `null` 이라 리포가 남아 있는데도 첫 실행 화면이 뜬다.
      const next = activeId === undefined
        ? (repos.some((r) => r.id === s.activeId) ? s.activeId : repos[0]?.id ?? null)
        : activeId;
      return {
        repos,
        activeId: next,
        // 리포가 바뀌었으면 홈은 남의 리포 것이다 — 비워서 다시 읽게 한다.
        home: next === s.activeId ? s.home : null,
        screen: repos.length === 0 ? 'first-run' : s.screen === 'first-run' ? 'home' : s.screen,
      };
    }),
  setHome: (home) => set({ home }),
  /**
   * 리포를 바꾼다 (05 §2.4). 바꾸는 것은 `activeId` 하나이고 `home` 을 비워 다시 읽게 한다 —
   * 화면 상태는 파생 캐시라 통째로 버리는 편이 부분 갱신보다 싸고 틀릴 자리가 없다 (05 §3).
   *
   * **세션 중에는 바꾸지 않는다.** 교정지 한 장이 어느 리포 것인지가 도중에 바뀌면 그 세션의
   * 채점이 어느 원장에 남는지가 흔들린다. 진행 중 세션은 리포별로 저장되므로 나갔다 와도
   * 그 자리에서 이어 찍힌다.
   */
  setActive: (repoId) => {
    let moved = false;
    set((s) => {
      if (s.session !== null || s.activeId === repoId) return {};
      moved = true;
      return { activeId: repoId, home: null, screen: 'home' as Screen };
    });
    return moved;
  },
  /**
   * 코스를 연다 (D120). 코스는 일일 큐 **밖**의 모드이므로 세션 오버레이가 아니라
   * 별도 화면이다 — `screen` 을 바꾸고 홈은 그대로 뒤에 남지 않는다.
   *
   * 세션 중에는 열지 않는다. 이유는 `setActive` 와 같다: 원장에 남는 판이 어느 실행의
   * 것인지가 도중에 흔들리면 안 된다.
   */
  openClone: (scope) => {
    let opened = false;
    set((s) => {
      if (s.session !== null || s.activeId === null) return {};
      opened = true;
      return { screen: 'clone' as Screen, cloneScope: scope };
    });
    return opened;
  },
  beginIngest: () =>
    set({ screen: 'ingest', at: null, warnings: [], ingestDone: false, cancelling: false, error: undefined }),
  step: (at, currentPath) => set({ at, currentPath }),
  // 경고는 쌓기만 한다 — 인제스트 하나에 수천 건이 날 수 있으므로 화면이 잘라 쓴다.
  warn: (row) => set((s) => ({ warnings: [...s.warnings, row] })),
  finishIngest: (error) => set({ ingestDone: true, cancelling: false, error }),
  cancel: () => set({ cancelling: true }),
  say: (toast) => {
    if (toastTimer !== null) clearTimeout(toastTimer);
    toastTimer = null;
    set({ toast });
    if (toast === undefined) return;
    toastTimer = setTimeout(() => {
      toastTimer = null;
      set({ toast: undefined });
    }, TOAST_MS);
  },
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
