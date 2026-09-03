/**
 * T1 필사 카드 생성기의 입출력 계약 (04 §3).
 *
 * `types.ts` 와 같은 규칙을 따른다 — 출력 페이로드는 새로 만들지 않고 02 §8.2 의
 * `CardPayload` t1 변형을 이름으로 좁혀 쓴다. 05 의 ClonePad 가 `original`·`show2`·`why`
 * 세 키를 목업 `data.js` 의 `T1` 그대로 읽는다는 약속이 그 타입에 걸려 있다.
 *
 * 생성기는 순수 함수다 (D86). 블록 원문·개념 목록·사전을 전부 인자로 받고 IPC·SQL·시각·
 * 난수를 부르지 않는다 — 그래야 같은 입력에 같은 카드가 나오고(04 §9) 골든이 성립한다.
 */
import type { Concept } from '@chickadee/dictionary';
import type { CardPayload, ConceptId } from '@chickadee/store-sql';

import type { NoPlate } from './types.js';

/** `CardPayload` 의 t1 변형. 이 모양은 `store-sql` 의 `t1PayloadSchema` 가 zod 로 고정한다. */
export type T1Payload = Extract<CardPayload, { track: 't1' }>;

/** 블록 안에 걸린 개념 하나. `block.candidates` 의 `concepts_json` 원소와 1:1 이다. */
export interface BlockConcept {
  conceptId: string;
  /** 잉크 겹 0~4. `mastery.layer` 가 없으면 0 이다. */
  layer: number;
  /** 블록 줄 범위에 걸친 그 개념의 Site 수. D27 의 동률 판정이 이것을 본다. */
  siteCount: number;
  /** 그 개념의 Site 중 가장 작은 id. `content_hash` 의 `siteId` 자리에 들어간다. */
  siteId: number;
}

/**
 * 필사 후보 블록 하나. `block.candidates` statement 가 긷는 한 행 + 블록 원문이다 —
 * 필드 이름을 고치면 앱의 행 변환이 어긋난다.
 *
 * `lines` 는 01 `file_read_block` 이 읽어 온 블록 원문을 줄로 쪼갠 것이다. statement 는
 * 원문을 주지 않으므로(SQL 리터럴에 파일 내용이 없다) 앱이 두 번째 호출로 채운다.
 * `name` 은 `block.name` 이 `NOT NULL` 이지만 이름 없는 블록(`kind === 'file'`·익명 함수)을
 * 빈 문자열로 채우는 대신 `null` 로 받는다 — `payload.fn` 폴백이 그 구분을 본다.
 */
export interface BlockCandidate {
  blockId: number;
  fileId: number;
  /** 리포 상대 posix 경로. `file.path` 다. */
  path: string;
  /** `null` = 워크트리. */
  rev: string | null;
  name: string | null;
  /** function | method | class | file | segment (02 `block.kind`). */
  kind: string;
  /** 1-based, 양끝 포함. */
  lineStart: number;
  lineEnd: number;
  textHash: string;
  /** 블록 줄 범위에 닿은 가장 최근 커밋 시각. 순위 ③ 이 본다. */
  lastCommitAt: number | null;
  concepts: BlockConcept[];
  lines: string[];
}

/**
 * 04 §3.3 스펙 카드. 3단계에서 원본 대신 이것만 보인다.
 *
 * `anchor` 는 `payload.original` 의 **0-based** 줄 색인이다 — 화면이 항목을 짚으면 그 줄이
 * 밝아진다. 출처가 사용자면 짚을 줄이 없어 빈 배열이다.
 */
export interface SpecCard {
  signature: string[];
  header?: string;
  mustHold: { text: string; source: 'user' | 'dict' | 'ast'; anchor: number[] }[];
}

/**
 * 04 §3 「입력: 블록 후보 + 사전 + 필수 문법 집합」.
 *
 * 대표 개념은 **입력이 아니라 출력**이다 — D27 이 블록 안 개념에서 규칙으로 뽑으라고
 * 정했으므로 부르는 쪽이 따로 넘기면 두 값이 어긋날 수 있다. `pickConcept` 가 고른다.
 */
export interface T1Request {
  repoId: number;
  /** 시드와 `gen` 에 들어간다 — 사전이 바뀌면 같은 블록이라도 다른 카드다 (04 §0). */
  dictVersion: string;
  /** 대표 개념 선정(D27)과 스펙 카드 ②사전 층이 여기서 `difficulty`·`one_liner` 를 읽는다. */
  concepts: ReadonlyMap<string, Concept>;
  /** `_lang.yaml.essential` 을 합친 것. D27 의 첫 조건이다. */
  essential: ReadonlySet<string>;
  /**
   * tree-sitter 문법 키 (`file.grammar`). 마스크 표를 고른다.
   * `Grammar` 로 좁히지 않는다 — `file.grammar` 는 nullable TEXT 라 모르는 값이 올 수
   * 있고, 그때 폴백(정규식) 열로 내려가는 것이 04 §3.2 표의 마지막 열이다.
   */
  grammar: string;
  /** 03 §3.6 순으로 오지 않아도 된다 — `rankBlocks` 가 04 §3.1 순위로 다시 세운다. */
  candidates: readonly BlockCandidate[];
  /** 페이딩 단계 (`card_state.stage`). 1 이면 첫 노출 제한(≤ 25줄)이 걸린다. */
  stage: 1 | 2 | 3;
  /** `card_state.prints`. 없으면 `stage === 1` 을 첫 노출로 읽는다. */
  prints?: number;
  /** 2단계 통과 직후 사용자가 쓴 「이 함수가 지켜야 할 것」 2~4줄 (04 §3.3 ①). */
  whyOwn?: readonly string[];
}

export interface T1Card {
  blockId: number;
  /** `card.file_id` — T1 카드는 사용처가 아니라 파일에 매인다 (02 `card`). */
  fileId: number;
  /** 숙련도가 붙는 대표 개념 (D27). */
  conceptId: ConceptId;
  /** `card_concept(role='secondary')` 로 남을 나머지. 겹에는 반영되지 않는다. */
  secondary: ConceptId[];
  payload: T1Payload;
  contentHash: string;
  spec: SpecCard;
  /** 이 넷이면 같은 카드를 다시 만든다. `seed` 는 동순위 왜 게이트 문항 선정에만 쓴다. */
  gen: { seed: number; dictVersion: string; blockId: number; textHash: string };
}

/**
 * `types.ts` 의 `isNoPlate` 는 `T0Card | NoPlate` 로 좁혀져 있고 그 파일은 T0 계약이다 —
 * T1 쪽 좁히기를 여기에 둔다. 실패 표현은 `NoPlate` 를 그대로 재사용한다.
 */
export const isT1Card = (r: T1Card | NoPlate): r is T1Card => !('noPlate' in r);
