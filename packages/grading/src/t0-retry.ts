/**
 * 다시 찍기(재출제) 규칙 (04 §2.3).
 *
 * 이 파일은 **결정만** 한다 — 「무엇을 만들어 달라」는 서술을 돌려주고, 실제 카드 생성은
 * `@chickadee/cards` 가 한다. 왜 같은 문제를 그대로 다시 내지 않는가: 진단문의 정답을
 * 외운 것을 맞힌 것으로 세게 된다.
 */
import type { T0Kind } from './t0.js';

/** 같은 개념의 후보 사용처. `unknownCount` 는 03 §3.6 순위(없으면 0으로 본다). */
export interface RetryCandidate {
  siteId: number;
  shape: string;
  unknownCount?: number;
}

export interface RetryCurrent {
  siteId: number;
  shape: string;
  kind: T0Kind;
  /** 지금 판의 시드 회차. 다시 찍기는 언제나 `attempt + 1` 로 간다. */
  attempt: number;
}

/** `@chickadee/cards` 에 넘기는 주문서. */
export interface RetryRequest {
  siteId: number;
  kind: T0Kind;
  attempt: number;
}

/** 이만큼 연달아 어긋나면 한 단계 쉬운 쪽으로 내린다. */
export const CONSECUTIVE_WRONG_TO_EASE = 2;

/** 어려운 쪽 → 쉬운 쪽. 지목형이 바닥이다 (04 §1.4 `prefer(ly)` 의 역순). */
const EASIER: Record<T0Kind, T0Kind> = { meaning: 'blank', blank: 'point', point: 'point' };

/**
 * 다른 Site 우선 — 오늘 안 본 것, `shape` 가 다른 것 (04 §2.3).
 * 후보가 없으면 같은 사용처를 그대로 돌려준다(보기만 재셔플; 지목형은 동일한 판).
 *
 * 동점은 `unknownCount` 오름차순 → `siteId` 오름차순으로 끊는다. 난수는 쓰지 않는다 —
 * 같은 입력에 같은 순서가 나와야 재현이 된다(04 §0).
 */
export function pickRetrySite(
  sites: readonly RetryCandidate[],
  current: RetryCurrent,
  seenToday: Iterable<number> = [],
): number {
  const seen = new Set(seenToday);
  const others = sites.filter((s) => s.siteId !== current.siteId);
  if (others.length === 0) return current.siteId;

  const ranked = [...others].sort(
    (a, b) =>
      Number(seen.has(a.siteId)) - Number(seen.has(b.siteId))
      || Number(a.shape === current.shape) - Number(b.shape === current.shape)
      || (a.unknownCount ?? 0) - (b.unknownCount ?? 0)
      || a.siteId - b.siteId,
  );
  return ranked[0]?.siteId ?? current.siteId;
}

/**
 * 두 번 연속 어긋나면 한 단계 쉬운 쪽으로 (meaning → blank → point).
 * 한 번에 한 단계만 내린다 — 연속 3회라고 두 단계를 내리면 지목형까지 두 판 만에 떨어지고
 * 「인식(지목)이 맞는 겹」의 근거(04 §1.4)를 앞질러 버린다.
 */
export function nextKind(kind: T0Kind, consecutiveWrong: number): T0Kind {
  return consecutiveWrong >= CONSECUTIVE_WRONG_TO_EASE ? EASIER[kind] : kind;
}

/** 두 결정을 합쳐 주문서 한 장으로. */
export function planRetry(input: {
  sites: readonly RetryCandidate[];
  current: RetryCurrent;
  seenToday?: Iterable<number>;
  consecutiveWrong: number;
}): RetryRequest {
  const { sites, current, seenToday = [], consecutiveWrong } = input;
  return {
    siteId: pickRetrySite(sites, current, seenToday),
    kind: nextKind(current.kind, consecutiveWrong),
    attempt: current.attempt + 1,
  };
}
