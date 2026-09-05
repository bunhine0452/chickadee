/**
 * 코스 문항 생성기의 입출력 계약 (D164 · `docs/program/exercises.md` §2).
 *
 * 생성기는 순수 함수다 — 파일 줄·요청 줄기·간선·사용처·블록·커밋을 전부 인자로 받고
 * IPC·SQL·시각·난수(시드 밖)를 부르지 않는다. 그래야 같은 입력에 같은 카드가 나오고(04 §9)
 * 골든이 성립한다. 앱의 `data/*.ts` 가 statement 결과를 이 모양으로 옮겨 넘긴다.
 *
 * 출력 카드의 **열 `track` 은 언제나 `t3`** 다 — 「어느 큐가 이 판을 내나」의 뜻이고(D164 ②),
 * 코스 카드는 예전 일일 큐가 아니라 챕터 계획(D165)이 낸다. `payload.track` 은 화면 모양이다.
 */
import type { Concept } from '@chickadee/dictionary';
import type { Hop } from '@chickadee/concepts';
import type { AstLite, CardKind, CardPayload, ConceptId, ConceptSite, EdgeKind, StageNo } from '@chickadee/store-sql';

import type { BlockConcept } from './t1-types.js';
import type { FocusLine, LineWindow } from './types.js';

/**
 * 18유형 — 16(exercises.md §2 표의 행 이름 그대로) + **형식 둘**(D187 ⑱).
 *
 * `trace-table` 은 2단에 붙는다 — 넷이 전부 경로라 값을 굴리는 판이 없던 자리다
 * (`pedagogy.md` §1.2). `order` 는 5단의 **1겹**(T1 페이딩 앞)이고 4·5단 「사이」가 아니다
 * (`pedagogy.md` §2.2 — 단을 여섯으로 늘리면 `stage_reached BETWEEN 0 AND 5` 가 깨진다).
 */
export type StageType =
  | 'point' | 'twin' | 'blank'
  | 'exec' | 'hop' | 'origin' | 'caller' | 'trace-table'
  | 'cut' | 'reorder' | 'contract'
  | 'patch-line' | 'patch-place' | 'rollback'
  | 'reimpl-spec' | 'reimpl-layer' | 'handoff' | 'order';

/** 유형 → 단. 1단 셋은 예전 T0 카드를 그대로 쓰므로(D164 ③) 여기서 새로 굽는 것은 `twin` 뿐이다. */
export const STAGE_OF: Readonly<Record<StageType, StageNo>> = {
  point: 1, twin: 1, blank: 1,
  exec: 2, hop: 2, origin: 2, caller: 2, 'trace-table': 2,
  cut: 3, reorder: 3, contract: 3,
  'patch-line': 4, 'patch-place': 4, rollback: 4,
  'reimpl-spec': 5, 'reimpl-layer': 5, handoff: 5, order: 5,
};

/**
 * 유형 → `card.kind` (exercises.md §5 표).
 *
 * **형식 둘은 있는 값을 빌린다 — 마이그레이션이 0줄이다.** `card.kind` 의 CHECK
 * (`0001_init.sql`)를 늘리려면 표를 다시 만들어야 하고(D146), 빌릴 값이 뜻에 맞으면 D151 의
 * 길이 더 싸다: `trace-table` 은 2단 추적이라 `hop` 과 같은 `flow`, `order` 는 순서를 묻는
 * 판이라 `reorder` 다. 화면과 채점기는 `card.kind` 가 아니라 `payload.kind`(`order`·`trace`)로
 * 갈리므로 두 뜻이 섞이지 않는다. `fundamentals.md` §6 이 설계한 `kind='value'` 는 그 마이그레이션
 * (`0010`)이 서면 옮겨 갈 자리다.
 */
export const KIND_OF: Readonly<Record<StageType, CardKind>> = {
  point: 'point', twin: 'twin', blank: 'blank',
  exec: 'point', hop: 'flow', origin: 'origin', caller: 'radius', 'trace-table': 'flow',
  cut: 'cut', reorder: 'reorder', contract: 'contract',
  'patch-line': 'repair', 'patch-place': 'repair', rollback: 'repair',
  'reimpl-spec': 'reimpl', 'reimpl-layer': 'reimpl', handoff: 'reimpl', order: 'reorder',
};

/** 파일 하나의 원문. `lines[].n` 은 파일 기준 1-based 다. */
export interface StageFile {
  path: string;
  fileId: number | null;
  /** tree-sitter 문법 키 (`file.grammar`). 모르면 `null` — 4·5단은 문법이 없으면 안 낸다. */
  grammar: string | null;
  lines: readonly FocusLine[];
}

/** 파일 간선 — `ResolvedEdge` 의 부분집합. `line` 은 `from` 쪽에서 그 간선이 적힌 줄. */
export interface StageEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  line?: number;
}

/** 사용처 하나 + 파일 경로. `twin` 과 1단 개념 목록의 재료. */
export interface StageSite {
  site: ConceptSite;
  path: string;
}

/** 파스한 블록 하나 — `exec`·`reorder`·5단의 재료. `ast` 오프셋은 **블록 기준**이다 (`t0-exec` 과 같다). */
export interface StageBlock {
  path: string;
  blockId: number | null;
  name: string | null;
  window: LineWindow;
  ast: AstLite | null;
  grammar: string;
  /** `block.text_hash`. 시드와 재생성 계약의 키다 (D70). */
  hash: string;
  concepts: readonly BlockConcept[];
}

/**
 * 같은 이름의 자리들 — `origin` 의 재료. 누가 정하고(`define`) 누가 읽고(`read`) 누가 옮겨
 * 싣는지(`carry`)는 부르는 쪽이 AST·매퍼 열 대조로 정해 넘긴다. 모르면 안 넘기고, 안 넘기면 안 낸다.
 */
export interface NameUse {
  name: string;
  path: string;
  line: number;
  text: string;
  role: 'define' | 'read' | 'carry';
}

/** 응답 키 하나 — `contract` 의 재료. `maker` 는 백엔드가 그 이름을 만드는 자리, `reads` 는 프런트가 읽는 자리. */
export interface ResponseKey {
  key: string;
  maker: { path: string; line: number; text: string };
  reads: readonly { path: string; line: number; text: string }[];
}

export interface HunkLine {
  sign: ' ' | '+' | '-';
  text: string;
}

/** diff 덩어리 하나. `oldStart`·`newStart` 는 파일 기준 1-based. */
export interface Hunk {
  oldStart: number;
  newStart: number;
  lines: readonly HunkLine[];
}

/**
 * 판정용 테스트 한 장 (D180). `RunSpec.tests` 로 러너에 그대로 넘어간다.
 *
 * `source` 는 어디서 나왔나다 — `commit` 은 그 `fix:` 커밋이 같이 고친 테스트, `repo` 는
 * 대상 클래스와 이름이 맞는 리포 테스트, `contract` 는 원본 공개 메서드의 계약으로 생성한 것.
 * 화면이 「무엇이 판정했나」를 이 값으로 말한다.
 */
export interface JudgeTest {
  path: string;
  text: string;
  source: 'commit' | 'repo' | 'contract';
}

/** 리포에 이미 있는 테스트 파일 하나 — 추출의 재료. `bake.ts` 가 읽어 넘긴다. */
export interface StageTestFile {
  path: string;
  text: string;
}

/** 4단의 정답지 — 실제 커밋. `fix` 여부는 생성기가 제목으로 가른다. */
export interface StageCommit {
  id: number;
  sha: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** 제목 줄. */
  message: string;
  files: readonly { path: string; hunks: readonly Hunk[] }[];
}

export interface StageRequest {
  repoId: number;
  unitId: number;
  /** 기능 이름 (`unit.name`). 문구가 쓴다. */
  unitName: string;
  dictVersion: string;
  attempt: number;
  /** 이 기능의 파일 전부 — 경로 → 원문. 경로 위 파일은 여기 반드시 있어야 한다. */
  files: ReadonlyMap<string, StageFile>;
  /** 이 기능의 요청 줄기들 (`requestPaths` 에서 이 기능의 진입 파일로 시작하는 것만). */
  paths: readonly Hop[][];
  edges: readonly StageEdge[];
  concepts: ReadonlyMap<string, Concept>;
  sites?: readonly StageSite[];
  blocks?: readonly StageBlock[];
  names?: readonly NameUse[];
  responseKeys?: readonly ResponseKey[];
  commits?: readonly StageCommit[];
  /** 리포의 테스트 파일 — 4·5단 판정용 테스트를 여기서 먼저 찾는다 (D180). */
  tests?: readonly StageTestFile[];
  /** 유형별 개념 id 덮어쓰기. 기본값은 `STAGE_CONCEPTS`. */
  conceptIds?: Partial<Record<StageType, ConceptId>>;
}

/** 구운 판 하나. `card.insert_stage` 의 파라미터로 그대로 옮겨진다. */
export interface StageCard {
  /** 언제나 `t3` (D164 ②). */
  track: 't3';
  kind: CardKind;
  type: StageType;
  stageNo: StageNo;
  conceptId: ConceptId;
  unitId: number;
  fileId: number | null;
  siteId: number | null;
  commitId: number | null;
  payload: CardPayload;
  contentHash: string;
  gen: { seed: number; dictVersion: string; attempt: number; key: string };
}

/** 못 낸 유형과 사유. 사유 없는 「불가」는 없다 (04 전제). */
export interface StageDrop {
  type: StageType;
  reason: string;
}

export interface StageResult {
  stageNo: StageNo;
  cards: StageCard[];
  dropped: StageDrop[];
}
