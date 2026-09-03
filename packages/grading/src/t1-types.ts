/**
 * T1 판정 엔진의 계약 (04 §4.6).
 *
 * 결과 타입은 04 §4.6 이 정본이고 여기서는 그것을 그대로 옮긴다. 원장에 실리는 요약
 * (`ReviewDetail` 의 t1 변형)은 02 §8.2 소유이므로 여기서 다시 정의하지 않는다 —
 * `toT1Detail`(`t1-result.ts`)이 이 결과에서 그 모양을 만든다.
 */
import type { Track } from '@chickadee/store-sql';

/** 04 §4.6 그대로. 「정합 · 동등 · 어긋남 · 누락 · 추가」의 코드 이름(00 §3 용어집). */
export type Status = 'exact' | 'equiv' | 'differ' | 'missing' | 'extra';

/**
 * 한 줄 판정이 그렇게 나온 이유. `code` 는 04 §4.2 표의 사유 코드이고 `detail` 은
 * 화면에 그대로 보일 값(치환 쌍·어긋난 토큰 쌍)이다.
 *
 * **사유 없는 `differ` 는 없다** — 화면이 「무엇이 다른가」를 말할 수 없으면 이의를 붙일
 * 자리도 사라진다(04 §4.6 이 「블록 전체 AST 동일성 한 판」을 버린 이유).
 */
export interface Reason {
  code: ReasonCode;
  detail?: string;
}

/**
 * 04 §4.2·§4.3·§4.5 가 쓰는 사유 코드 전부. 문자열을 흩뿌리지 않고 여기 모아 두는 이유는
 * `patternKey`(04 §5)가 이 코드들을 **정렬해서** 해시하기 때문이다 — 오타 하나가 새 패턴을
 * 만들어 「같은 불만 3건」이 영영 모이지 않는다.
 */
export const REASON_CODES = [
  // §4.2 파이프라인
  'COMMENT_TEXT', 'COMMENT_MISSING', 'COMMENT_EXTRA', 'TRAILING_COMMENT',
  'BLANK_MISMATCH', 'INDENT', 'TERMINATOR', 'QUOTE', 'WHITESPACE',
  'TOKEN_COUNT', 'TOKEN_MISMATCH',
  // §4.3 전역 치환
  'RENAME', 'SWAP', 'RENAME_INCONSISTENT',
  // §4.5 AST 승격
  'AST_EQUIV', 'TEMPLATE_VS_CONCAT', 'PARSE_ERROR',
  'PARSE_LANG_UNSUPPORTED', 'PARSE_TIMEOUT',
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

/** 어느 층이 이 줄을 판정했나. 화면이 「이 언어는 글자 비교만 합니다」를 낼 근거다 (04 §4.5). */
export type Engine = 'regex' | 'ast';

/** 04 §4.6 `T1Row`. `oi`·`ui` 는 **0-based** 줄 색인이고 `-1` 은 짝이 없다는 뜻이다. */
export interface T1Row {
  oi: number;
  ui: number;
  status: Status;
  reasons: Reason[];
  /** 이 줄에서 나온 이름 치환 쌍. §4.3 이 블록 전체에서 다시 판정한다. */
  maps: [string, string][];
  /** 이름 맞바꿈 — 뜻이 바뀐 코드다. 한 줄이라도 있으면 진급이 막힌다 (04 §4.6). */
  swap?: boolean;
  engine: Engine;
  appealed?: boolean;
}

/** 04 §4.6 `T1Result`. */
export interface T1Result {
  blockId: number;
  stage: 1 | 2 | 3;
  rows: T1Row[];
  n: Record<Status, number>;
  /** 원본의 **비공백** 줄 수. 빈 줄이 분모에 들면 20줄 중 2줄이 공짜다 (04 §4.6). */
  total: number;
  /** `exact + equiv`. */
  meaning: number;
  pct: number;
  /** 합격 문턱 — 소블록 완충값 `min(85, 100 − 200/total)` (04 §4.6 · D83). */
  passPct: number;
  verdict: 'advance' | 'repeat-soft' | 'repeat';
  peeks: number;
  downgraded: boolean;
  /** 한 줄이라도 AST 가 판정했으면 `ast`. */
  engine: Engine;
  elapsedMs: number;
  appeals: number;
}

/** 거터 틱 세 색 (05 §8). 타이핑 중에는 이 셋만 나온다 — `missing`·`extra` 는 채점의 것이다. */
export type Tick = '' | 'exact' | 'equiv' | 'differ';

/**
 * 판정 한 번의 판본. `appeal.engine_version` 에 실려 나가고, 이의가 「어느 엔진의 판정에
 * 대한 것인지」를 나중에 알 수 있게 한다 (04 §5). 규칙을 고치면 **올려라** — 골든이
 * 바뀌는 커밋이 곧 이 값이 바뀌는 커밋이다.
 */
export const T1_ENGINE_VERSION = '1';

/** 이의를 접수할 수 있는 판정 (04 §5 — `differ` 행에서만). */
export type AppealVerdict = 'differ' | 'missing' | 'extra' | 'wrong-pick';

export interface AppealTrack {
  track: Extract<Track, 't1' | 't2'>;
}
