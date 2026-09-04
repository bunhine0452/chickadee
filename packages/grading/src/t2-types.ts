/**
 * T2 구조 채점의 계약 (04 §8.2·§8.3).
 *
 * 결과 타입은 04 §8.2 가 정본이고 여기서는 그것을 옮긴다. 원장에 실리는 요약
 * (`ReviewDetail` 의 t2 변형)은 02 §8.2 소유라 여기서 다시 정의하지 않는다 —
 * `toT2Detail`(`t2.ts`)이 이 결과에서 그 모양을 만든다. T1 과 같은 배치다.
 *
 * 문구 상수는 04 · 목업에서 **글자 그대로** 옮겼다. 화면이 이 문장을 그대로 쓰므로
 * 여기서 말을 다듬으면 문서와 화면이 어긋난다.
 */
import { t } from '@chickadee/i18n';
import type { CardPayload, ReviewDetail } from '@chickadee/store-sql';

/** 카드 한 장의 정답지·지도 (02 §8.2 · D100). 네 종이 한 모양을 나눠 쓴다. */
export type T2Payload = Extract<CardPayload, { track: 't2' }>;

/** 원장에 실리는 요약 (02 §8.2). */
export type T2Detail = Extract<ReviewDetail, { track: 't2' }>;

export type T2Kind = 'placement' | 'radius' | 'flow' | 'direction';
export type T2Tier = 'found' | 'missed' | 'wrong' | 'sec';

/**
 * 결과 목록 한 줄. `stat` 은 커밋 통계(`+64 −0`)이고 정답지에 없는 파일은 `null` 이다 —
 * 목업이 그 자리에 「변경 없음」을 찍는다(`t2.js` 의 `group()`).
 */
export interface T2Row {
  path: string;
  tier: T2Tier;
  stat: string | null;
  note: string;
}

/** 04 §8.2. `pct` 는 표시값이고 진급은 `verdict` 가 정한다. */
export interface T2Result {
  kind: T2Kind;
  pct: number;
  found: string[];
  missed: string[];
  wrong: string[];
  bonus: string[];
  verdict: 'advance' | 'repeat-soft' | 'repeat';
  /** 진급을 막은 이유가 wrong 상한이면 그 문장. 아니면 null. */
  capped: string | null;
  hints: number;
  /** 결과 목록의 표시 순서 — missed → found → wrong → sec (04 §8.2). */
  rows: T2Row[];
}

/**
 * 판정 한 번의 판본. `appeal.engine_version` 에 실려 나간다 (04 §5·§8.4).
 * 규칙을 고치면 **올려라** — 골든이 바뀌는 커밋이 곧 이 값이 바뀌는 커밋이다.
 */
export const T2_ENGINE_VERSION = '1';

/**
 * 세 문장. 상수가 아니라 함수인 이유는 로케일이다 — 모듈이 열리는 시점은 `setLocale()`
 * 보다 이르다 (D117).
 */

/** wrong 상한에 걸려 진급이 막혔을 때의 문장 (04 §8.2). */
export const cappedNote = (): string => t('grading.cappedNote');

/** 접힌 폴더 노드를 골랐을 때의 사유 (04 §7.4 마지막 문장). */
export const foldedNote = (): string => t('grading.foldedNote');

/** `trap` 에도 없는 wrong 의 기본 사유 (04 §8.1 기본 템플릿 · 목업 `t2.js`). */
export const unchangedNote = (): string => t('grading.unchangedNote');
