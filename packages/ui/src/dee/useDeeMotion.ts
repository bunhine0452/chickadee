import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Dee 의 **습성** 동작 (05 §6 · 정본 §3-9 · 00 D11).
 * 표정은 없다 — 홉(정답) · 고개 기울임(어긋남·생각) · 거꾸로 매달리기(모르겠어요) · LIFER 홉.
 */
export type DeeMotion = 'hop' | 'tilt' | 'hang' | 'peek' | 'lifer';

export interface DeeMotionSpec {
  /** 한 번 도는 데 걸리는 시간(ms). */
  readonly durationMs: number;
  /** 반복 횟수. **무한은 없다** — 05 §10 「상시 애니메이션 0개」. */
  readonly iterations: number;
}

/** 720ms 예산. `lifer` 는 정본 §3.9 의 명시 예외이고 `peek` 는 D11 로 2회 유한화됐다. */
export const DEE_MOTION_BUDGET_MS = 720;

export const DEE_MOTIONS: Readonly<Record<DeeMotion, DeeMotionSpec>> = {
  hop: { durationMs: 520, iterations: 1 },
  tilt: { durationMs: 700, iterations: 1 },
  hang: { durationMs: 550, iterations: 1 },
  peek: { durationMs: 1600, iterations: 2 },
  lifer: { durationMs: 1350, iterations: 1 },
};

export const DEE_MOTION_CLASSES = Object.keys(DEE_MOTIONS) as readonly DeeMotion[];

export interface DeeMotionOptions {
  /**
   * Monaco/textarea 에 포커스가 있는가. true 면 **모션 0** — `motion` 을 통째로 무시한다
   * (05 §6 「타이핑 중 모션 0」).
   */
  typing?: boolean | undefined;
  /**
   * 감축 모드. 클래스는 **그대로 붙인다** — CSS 가 지속시간만 없애고
   * `animation-fill-mode: both` 가 최종 포즈를 남긴다 (05 §6). 다시 재생만 하지 않는다.
   */
  reducedMotion?: boolean | undefined;
  /** 같은 `motion` 이 연속으로 올 때 재생을 강제하려고 올리는 수. */
  nonce?: number | undefined;
}

/**
 * 목업 `deeDo()` 이식 — 클래스 전부 제거 → 리플로 → 추가.
 * 요소를 다시 그리지 않으므로 `<use>` 노드 동일성이 유지된다.
 */
export function useDeeMotion(
  ref: RefObject<SVGSVGElement | null>,
  motion: DeeMotion | null | undefined,
  options: DeeMotionOptions = {},
): void {
  const { typing = false, reducedMotion = false, nonce = 0 } = options;

  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return;

    el.classList.remove(...DEE_MOTION_CLASSES);
    if (motion === null || motion === undefined) return;
    if (typing) return;

    // 감축 모드에서는 재생을 강제하지 않는다 — 최종 포즈만 남기면 된다.
    if (!reducedMotion) void el.getBoundingClientRect().width;
    el.classList.add(motion);
  }, [ref, motion, typing, reducedMotion, nonce]);
}
