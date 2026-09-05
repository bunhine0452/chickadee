/**
 * T0 카드 생성기의 입출력 계약 (04 §0 · §1).
 *
 * 출력은 새로 만들지 않는다 — 02 §8.2 의 `CardPayload` 가 정본이고 여기서는 그 t0 변형을
 * 이름으로 좁혀 쓴다. 05 가 목업 `data.js` 의 `CARDS` 키를 그대로 렌더한다는 약속이
 * 그 타입에 걸려 있다.
 *
 * 생성기는 순수 함수다. IPC 를 부르지 않고 맥락 줄·사용처·사전을 전부 인자로 받는다
 * (D72) — 그래야 같은 입력에 같은 카드가 나오고(04 §9) 골든 테스트가 성립한다.
 */
import type { Concept } from '@chickadee/dictionary';
import type { CardPayload, ConceptId, ConceptSite } from '@chickadee/store-sql';

export type T0Kind = 'point' | 'blank' | 'meaning';

/** `CardPayload` 의 t0 변형. */
export type T0Payload = Extract<CardPayload, { track: 't0' }>;

/** 01 `file_read_lines` 가 읽어 온 초점 앞뒤 줄. 1-based 행 번호. */
export interface FocusLine {
  n: number;
  t: string;
}

/** 줄 범위 하나. 1-based, 양끝 포함 — 02 `block.line_start`·`line_end` 와 같은 규약이다. */
export interface LineWindow {
  from: number;
  to: number;
}

/** 같은 개념의 다른 사용처 — `payload.uses` 와 `{{other.*}}` 의 재료 (04 §2.4 3단). */
export interface OtherUse {
  siteId: number;
  file: string;
  line: number;
  text: string;
}

/** 사용처 하나와 그 둘레. 카드 한 장을 만드는 데 필요한 것 전부. */
export interface SiteInput {
  site: ConceptSite;
  /** 리포 상대 posix 경로. `file` 테이블의 `path` 다. */
  path: string;
  /**
   * 부르는 쪽이 읽어 온 줄. **`block` ∪ 초점 ±4** 를 담아야 한다 — `payload.lines` 는
   * 창(블록)에서, `payload.promptLines` 는 초점 ±4 에서 각각 잘려 나간다 (D141 · D8).
   */
  lines: readonly FocusLine[];
  /**
   * 초점을 감싸는 최소 의미 단위 (02 `block`). 창이 이 범위다 — 없으면 초점 ±2 로 떨어진다
   * (D141). 40줄을 넘으면 `windowOf` 가 초점을 가운데 두고 자른다.
   */
  block?: LineWindow | undefined;
  /** 같은 줄에 걸친 다른 개념의 사용처. 혼동 쌍의 토큰이 지목형 오답이 된다 (04 §1.1). */
  lineSites?: readonly ConceptSite[];
  /** 같은 개념의 다른 사용처. 첫 항목이 `{{other.*}}` 가 된다. */
  others?: readonly OtherUse[];
}

/** 04 §1 「입력: 사전 항목 + 그 개념의 Site[] + layerOf」. */
export interface T0Request {
  repoId: number;
  /** 시드에 들어간다 — 사전이 바뀌면 같은 사용처라도 다른 카드다 (04 §0). */
  dictVersion: string;
  /** 다시 찍기마다 +1. 보기 순서가 달라진다 (04 §2.3). */
  attempt: number;
  concept: Concept;
  /** 선행·혼동 개념의 이름과 문장을 꺼내는 데 쓴다. */
  concepts: ReadonlyMap<string, Concept>;
  /** `_lang.yaml.diag_default` — 지목형 진단 폴백 (04 §2.1). */
  diagDefault?: { point: string; blank: string };
  /** 이 개념의 잉크 겹 0~4. 유형 선호를 정한다 (04 §1.4). */
  ly: number;
  /** 03 §3.6 `rank` 순으로 정렬해 넘긴다 — 생성기는 순서를 바꾸지 않는다. */
  sites: readonly SiteInput[];
  /** 전이로 첫 겹을 받은 출처 개념 (02 §6.3). */
  transferFrom?: ConceptId;
  /** 합성 예제일 때 「곧 네 코드 여기에서」 예고할 사용처. */
  previewSiteId?: number;
}

export interface T0Card {
  conceptId: ConceptId;
  siteId: number;
  kind: T0Kind;
  payload: T0Payload;
  /** `card.content_hash` — 같은 카드를 두 번 만들지 않기 위한 것 (D70). */
  contentHash: string;
  /** 이 넷이면 같은 카드를 언제든 다시 만든다 (04 §0). */
  gen: { seed: number; dictVersion: string; attempt: number; siteId: number };
}

/** 판이 없는 문법. 사유는 홈의 「판이 없는 문법」에 그대로 뜬다 (02 `gap.reason`). */
export interface NoPlate {
  noPlate: true;
  reason: string;
}

export const isNoPlate = (r: T0Card | NoPlate): r is NoPlate => 'noPlate' in r;

/**
 * 생성기 하나의 결과. 실패는 사유를 달고 돌아온다 — 사유 없는 「불가」는 없다 (04 전제).
 * `leak` 은 정답이 맥락 줄에 그대로 또 보인다는 표시다 (04 §1.2).
 */
export type GenResult = { card: T0Card; leak?: true } | { reason: string };

export const isFailure = (r: GenResult): r is { reason: string } => 'reason' in r;
