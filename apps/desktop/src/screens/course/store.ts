/**
 * 코스 화면 상태 (D171). `store.ts` 의 `useUi` 와 **따로** 둔다 — 코스는 홈을 대신하는 화면
 * 하나와 그 위의 단 오버레이 하나뿐이고, 세션 슬라이스(판·결과·겹)와 섞이면 D162 가 지적한
 * 「두 축이 서로 다른 말」이 스토어 안에서 재현된다.
 *
 * **SQLite 가 진실이고 여기 있는 것은 파생 캐시다** (01 §5). `sessionId` 만 예외로 하루
 * 동안 들고 있는다 — `stage_log.session_id` 가 NOT NULL 이라 코스도 `session` 한 행이
 * 필요한데, 클론 코스(D120)처럼 태어날 때부터 `done` 이라 일일 큐가 그것을 집지 않는다.
 */
import { create } from 'zustand';

import type { RunSpec } from './run.js';

export interface CourseState {
  /** 코스 화면이 홈을 대신하고 있나. */
  open: boolean;
  /** 지금 펼친 챕터 (`unit.id`). 목차의 첫 줄이 기본이다. */
  selected: number | null;
  /** 단 오버레이가 걸려 있나. `null` 이면 목차다. */
  run: RunSpec | null;
  /** 원장에 쓸 세션 행. `sessionDay` 가 오늘이 아니면 다시 만든다. */
  sessionId: number | null;
  sessionDay: string | null;
  /** 데이터를 다시 읽으라는 신호. 값 자체는 뜻이 없고 바뀌는 것이 뜻이다. */
  version: number;
}

export interface CourseActions {
  openCourse: () => void;
  closeCourse: () => void;
  select: (unitId: number | null) => void;
  startRun: (spec: RunSpec) => void;
  endRun: () => void;
  setSession: (sessionId: number, sessionDay: string) => void;
  bump: () => void;
}

const EMPTY: CourseState = {
  open: false,
  selected: null,
  run: null,
  sessionId: null,
  sessionDay: null,
  version: 0,
};

export const useCourse = create<CourseState & CourseActions>((set) => ({
  ...EMPTY,
  openCourse: () => set({ open: true, run: null }),
  closeCourse: () => set({ open: false, run: null }),
  select: (selected) => set({ selected }),
  startRun: (run) => set({ run }),
  endRun: () => set((s) => ({ run: null, version: s.version + 1 })),
  setSession: (sessionId, sessionDay) => set({ sessionId, sessionDay }),
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
