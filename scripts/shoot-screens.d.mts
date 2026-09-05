/**
 * `shoot-screens.mjs` 의 타입 선언 (`tests/gates/shots.spec.ts` 가 그 모듈을 들여온다).
 *
 * **값은 여기 없다.** 목록의 출처는 여전히 `.mjs` 하나이고, 이 파일은 그 모양만 적는다 —
 * 스크립트를 `.ts` 로 옮기면 `pnpm shots` 가 tsx 없이는 못 돌고, 게이트가 자기 사본을 들면
 * 찍는 쪽과 재는 쪽이 조용히 갈라진다. 둘 다 피하는 자리가 여기다.
 */
import type { Page } from '@playwright/test';

/** 화면 하나. `open` 이 없으면 아직 못 찍는 화면이고 `NOT_SHOT` 이 그 사유를 든다. */
export interface Screen {
  id: string;
  name: string;
  group: string;
  note: string;
  /** `store.ts` 의 `Screen` 유니온 값. 코스는 라우트가 아니라 `'course'` 다. */
  route?: string;
  /** 이 화면이 보여 주는 판(`RENDERER_OF` 의 값). */
  renders?: string;
  open?: (page: Page, app: { db: unknown; handle: unknown; close: () => void }) => Promise<void>;
}

export const SCREENS: readonly Screen[];
export const WIDTHS: readonly number[];
export const THEMES: readonly string[];
export const SHOTS_DIR: string;
/** `StageType` → 그것을 그리는 판. `stage-types.ts` 의 유형이 늘면 여기 자리가 없어 게이트가 걸린다. */
export const RENDERER_OF: Readonly<Record<string, string>>;
export const NOT_SHOT: readonly { what: string; why: string }[];
export function shotName(id: string, theme: string, width: number): string;
