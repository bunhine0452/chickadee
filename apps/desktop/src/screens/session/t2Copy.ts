/**
 * T2 판의 문구 자리 (05 §5 · 04 §8). `t1Copy.ts` 와 같은 자리다 — 문구를 화면에서 떼어
 * 두면 조판 규칙(짧은 평서문·`keep-all`)을 한곳에서 지킬 수 있다.
 *
 * 카드에 구워진 문구(질문·힌트·사유)는 여기 없다. 그것은 생성 시점에 렌더된 최종
 * 문자열이고(D74) 리포마다 다르다. 여기 있는 것은 **어느 리포에서나 같은** 말뿐이다.
 *
 * 전부 상수가 아니라 함수인 이유는 로케일이다 — 모듈이 열리는 시점은 `setLocale()` 보다
 * 이르다 (D117).
 */
import { t, type MessageKey } from '@chickadee/i18n';
import type { T2Result } from '@chickadee/grading';

type Kind = 'placement' | 'radius' | 'flow' | 'direction';

/** 판 머리의 종별 이름. `card.kind` 그대로 온다. */
const KIND_NAME_KEY: Record<Kind, MessageKey> = {
  placement: 'map.kindPlacement',
  radius: 'map.kindRadius',
  flow: 'map.kindFlow',
  direction: 'map.kindDirection',
};

export const kindName = (kind: Kind): string => t(KIND_NAME_KEY[kind]);

/** 종별 부제 — 「무엇으로 채점하는가」를 먼저 말한다 (정본 §2). */
const KIND_SUB_KEY: Record<Kind, MessageKey> = {
  placement: 'map.subPlacement',
  radius: 'map.subRadius',
  flow: 'map.subFlow',
  direction: 'map.subDirection',
};

export const kindSub = (kind: Kind): string => t(KIND_SUB_KEY[kind]);

/** 지도 아래 안내 두 줄. 목업 `.map-status` 의 기본 문장이다. */
export const mapHint = (): string => t('map.mapHint');

/** 채점 머리의 제목. 04 §8.2 의 문턱(85·65)과 같은 자리에서 갈린다. */
export function verdictTitle(result: T2Result): string {
  if (result.pct === 100) return t('map.verdictPerfect');
  if (result.verdict === 'advance') return t('map.verdictClose');
  if (result.pct >= 65) return t('map.verdictClose');
  return t('map.verdictAgain');
}

/** 길잡이 한 줄 — 채점 직후 Dee 가 하는 말. */
export function guideAfter(result: T2Result): { say: string; motion: 'hop' | 'tilt' } {
  if (result.pct === 100) return { say: t('map.guidePerfect'), motion: 'hop' };
  if (result.pct >= 85) return { say: t('map.guideClose'), motion: 'hop' };
  return { say: t('map.guideMissed'), motion: 'tilt' };
}

/**
 * 라이브 리전 문구 (05 §7). 도장과 색이 나르는 것을 글자로도 나른다.
 * 「꼭 고쳐야 할」은 core 의 화면 이름이다 — 목업이 쓰는 말 그대로.
 *
 * **종마다 세는 것이 다르다** (04 §8.3). 흐름 추적은 파일이 아니라 경로의 자리를, 의존성
 * 방향은 문항을 센다 — 「꼭 고쳐야 할 5개」는 그 둘에서 거짓말이다. 분모는 셋 다
 * `found + missed` 로 같고 부르는 이름만 갈린다.
 */
export function liveAfter(result: T2Result): string {
  const vars = {
    total: String(result.found.length + result.missed.length),
    found: String(result.found.length),
  };
  if (result.kind === 'flow') return t('map.liveFlow', vars);
  if (result.kind === 'direction') return t('map.liveDirection', vars);
  return t('map.livePlacement', vars);
}

/** 힌트 버튼 문구. 감점이 아니라는 것을 버튼 자체가 말한다 (정본 §3-1). */
export const hintNote = (): string => t('map.hintNote');

/** 「이것도 맞다」 — 접수 전후 문구 (04 §8.4). */
export const appealIdle = (): string => t('map.appealIdle');
export const appealDone = (): string => t('map.appealDone');
export const appealNote = (): string => t('map.appealNote');

// ───────── 흐름 추적 (04 §8.3) ─────────

/** 두 자리의 이름. 목록에 `aria-label` 로 붙는다 — 눈으로는 제목 줄이 같은 말을 한다. */
export const flowPathLabel = (): string => t('map.flowPathLabel');
export const flowDeckLabel = (): string => t('map.flowDeckLabel');

/** 아직 한 장도 안 세웠을 때. 빈 상자만 두면 「여기 뭘 하라는 건가」가 남는다. */
export const flowEmpty = (): string => t('map.flowEmpty');
/** 덱을 다 썼을 때. 다 쓰는 것이 정답은 아니다 — 덱에는 경로 밖 파일이 섞여 있다. */
export const flowDeckEmpty = (): string => t('map.flowDeckEmpty');

/** 동작 줄 안내. 「다 쓰지 않아도 된다」를 먼저 말한다 (함정 카드가 섞여 있다). */
export const flowNote = (): string => t('map.flowNote');

/** 자리 문구 — 화면과 `aria-label` 이 같은 말을 쓴다. */
export function flowSeat(seat: number, total: number): string {
  return t('map.flowSeat', { seat: String(seat), total: String(total) });
}

/**
 * 자리를 옮기는 버튼의 이름. 화살표 글리프만 있는 버튼은 낭독기에서 「버튼」으로만 읽힌다 —
 * **무엇을 어디로** 옮기는지를 이름이 싣는다 (05 §9).
 *
 * 파일 이름 뒤에 조사를 붙이지 않는다 — `packages/grading` 의 `directionNote` 와 같은 이유다.
 */
export function flowMoveLabel(
  name: string, dir: 'up' | 'down', seat: number, total: number,
): string {
  return t('map.flowMove', {
    name,
    seat: flowSeat(seat, total),
    dir: t(dir === 'up' ? 'map.flowUp' : 'map.flowDown'),
  });
}

export function flowDropLabel(name: string): string {
  return t('map.flowDrop', { name });
}

export function flowAddLabel(name: string, seat: number): string {
  return t('map.flowAdd', { name, seat: String(seat) });
}

// ───────── 의존성 방향 (04 §8.3) ─────────

/**
 * 한 문항의 물음. 「A ↔ B」는 채점기가 결과 줄의 이름으로 쓰는 모양 그대로다
 * (`gradeDirection` 의 `key`) — 고를 때와 결과에서 같은 글자를 보게 한다.
 */
export function directionAsk(a: string, b: string): string {
  return `${a} ↔ ${b}`;
}

/**
 * 4지 (04 §8.3 · `DirectionAnswer` 0~3 순서). 화살표는 언제나 「가져다 쓴다(import)」 방향이라
 * 지도의 화살표와 같은 뜻이다. 문자열 모양은 `packages/grading` 의 `directionLabel` 과 같다 —
 * 채점 뒤 결과 줄이 사용자가 고른 보기와 글자까지 같아야 「내가 이걸 골랐지」가 성립한다.
 */
export function directionOptions(a: string, b: string): [string, string, string, string] {
  return [`${a} → ${b}`, `${b} → ${a}`, t('grading.directionBoth'), t('grading.directionNone')];
}

/** 아직 안 푼 문항 수. 채점 버튼이 잠긴 이유가 이 줄에 있다. */
export function directionLeft(n: number): string {
  return t('map.directionLeft', { n: String(n) });
}

/** 다 풀었을 때. 지도를 봐도 된다는 것을 마지막까지 붙들어 둔다 (04 §8.3 힌트). */
export const directionDone = (): string => t('map.directionDone');
