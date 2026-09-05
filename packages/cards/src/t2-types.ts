/**
 * T2 구조 카드 생성기의 입출력 계약 (04 §7~§8).
 *
 * `t1-types.ts` 와 같은 규칙이다 — 출력 페이로드를 새로 만들지 않고 02 §8.2 의
 * `CardPayload` t2 변형을 이름으로 좁혀 쓴다. 05 의 `DependencyMap` 이 `bands`·`files`·
 * `edges` 세 키를 목업 `data.js` 의 `T2` 그대로 읽는다는 약속이 그 타입에 걸려 있다.
 *
 * 생성기는 순수 함수다 (D97). 파일·엣지·커밋을 전부 인자로 받고 IPC·SQL·시각·난수를
 * 부르지 않는다 — 04 §9 의 「같은 `(repoId, target, attempt, dictVersion)` 로 두 번
 * 생성하면 deep-equal」이 그것 없이는 성립하지 않는다. T2 배치에는 난수 자체가 없다.
 */
import { t } from '@chickadee/i18n';
import type { CardPayload, ConceptId, EdgeKind } from '@chickadee/store-sql';

import type { NoPlate } from './types.js';

/**
 * `CardPayload` 의 t2 변형. 이 모양은 `store-sql` 의 `t2PayloadSchema` 가 zod 로 고정한다.
 * `entry`·`role` 두 종과 `role` 키도 그 zod 안에 있다 (D142).
 */
export type T2Payload = Extract<CardPayload, { track: 't2' }>;
export type T2Kind = T2Payload['kind'];

/** 04 §7.2 의 층. 0 화면 · 1 기능 · 2 동작·통신 · 3 공용·데이터. */
export type Band = 0 | 1 | 2 | 3;
export const BANDS = 4;

/**
 * 밴드 라벨 (04 §7.2 · 목업 `T2.bands[].l`). 지도가 밴드 머리에 찍고 정답지의 설명 문장이
 * 층을 부를 때도 쓴다 — 두 곳에 따로 두면 「동작 · 통신」의 가운뎃점 하나가 언젠가 갈라진다.
 *
 * 상수가 아니라 함수인 이유는 로케일이다 — 모듈이 열리는 시점은 `setLocale()` 보다 이르다.
 */
export const bandNames = (): readonly string[] =>
  [t('t2.bandScreen'), t('t2.bandFeature'), t('t2.bandAction'), t('t2.bandShared')];

/** 한 문제 지도의 노드 상한 (04 §7.4). */
export const MAX_NODES = 24;

/**
 * 지도 후보 노드 하나 — `t2.unit_files` 한 행.
 *
 * `inUnit` 이 거짓이면 1-hop 이웃이고, 24 노드를 넘을 때 **먼저 접히는** 쪽이다.
 * 정답지(core·sec)에 든 파일은 이웃이어도 접지 않는다 (04 §7.4).
 */
export interface GraphFile {
  fileId: number;
  /** 리포 상대 posix 경로. `file.path` 다. */
  path: string;
  inUnit: boolean;
}

/** 지도 후보 엣지 하나 — `t2.edges` 한 행을 경로로 옮긴 것. 방향은 언제나 「가져다 쓴다」. */
export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  confidence: 'syntactic' | 'heuristic';
}

/**
 * 정리·배치가 끝난 지도. `payload.bands`·`files`·`edges` 로 그대로 굽는다.
 *
 * `files` 의 **순서가 곧 밴드 안 순서**다 — 04 §7.3 의 barycenter 스윕 결과이고,
 * 좌표가 아니라 순서를 굽는 이유는 D97 에 있다(기하 상수는 컴포넌트 소유).
 */
export interface Graph {
  bands: { l: string; s: string }[];
  files: { p: string; r: Band; isNew?: boolean; folded?: number; cycle?: boolean }[];
  edges: [string, string, EdgeKind][];
  /** 고립이라 지도에서 뺀 노드 수 — 화면의 「지도 밖 N」 (04 §7.2). */
  offMap: number;
  /** 접힌 폴더 노드 경로 → 그 안의 파일 경로. 채점이 「접힌 폴더」 사유를 낼 때 본다. */
  foldedOf: Record<string, string[]>;
}

/** 후보 커밋 하나 — `t2.commit_candidates` 한 행. */
export interface CommitRow {
  id: number;
  sha: string;
  authoredAt: number;
  /** 제목 줄만 (03 §1.4). 접두 제거는 정답지가 한다. */
  message: string;
  filesN: number;
  insertions: number;
  deletions: number;
  truncated: boolean;
}

/** 그 커밋이 바꾼 파일 하나 — `t2.commit_files` 한 행. */
export interface CommitFileRow {
  path: string;
  oldPath: string | null;
  status: 'A' | 'M' | 'D' | 'R';
  additions: number;
  deletions: number;
  /** 인제스트가 읽지 않는 파일이면 `null` — 지도에 노드가 없으니 정답지에서도 빠진다. */
  fileId: number | null;
  /**
   * `git_diff_text` 가 준 `+` 줄 (D98). 04 §8.1 의 「추가 줄이 전부 import 문인 파일도
   * sec」이 이것만 본다. 없으면(머지·잘린 커밋) 그 걸음을 건너뛴다 — 없다고 core 가
   * 되지도, sec 가 되지도 않는다.
   */
  added?: readonly string[];
}

/**
 * 04 §8.1 의 산출. `core` 가 점수의 분모이고 `sec` 는 감점·가산이 없다.
 * 값의 모양은 목업 `T2.core` 그대로 — `[통계, 설명]`.
 */
export interface AnswerKey {
  commit: { h: string; d: string; m: string; n: string };
  /** 접두(`feat:` 따위)를 뗀 제목. 질문 템플릿이 이것을 넣는다. */
  subject: string;
  core: Record<string, [string, string]>;
  sec: Record<string, [string, string]>;
  trap: Record<string, string>;
  hints: string[];
  /** 그 커밋에서 새로 생긴 파일 (`status === 'A'`). 지도의 「새 파일」 배지가 이것이다. */
  newFiles: string[];
}

/**
 * 카드 한 장을 굽는 데 필요한 것 전부. 앱의 `data/graph.ts` 가 statement 결과를 이 모양으로
 * 옮겨 넘긴다 — 생성기는 SQL 도 IPC 도 모른다.
 */
export interface T2Request {
  repoId: number;
  unitId: number;
  /** 대지 이름과 뿌리 경로 (`unit.name` · `unit.root_path`). 질문 문구가 쓴다. */
  unitName: string;
  unitRoot: string;
  /** 이 카드가 매달릴 개념 — `arch/placement` · `arch/radius` · `arch/flow` · `arch/direction`. */
  conceptId: ConceptId;
  /** 04 §9 결정성. 같은 시드면 같은 카드다. */
  seed: number;
  /**
   * 리포 지도 종(`entry`·`role`)에서 **몇 번째 후보**를 낼 것인가 (D142). 대지 목록의
   * 색인이고, 후보가 그만큼 없으면 생성기가 `NoPlate` 를 낸다 — 같은 판을 두 번 굽지
   * 않는다. 대지마다 지도가 달라지는 나머지 네 종에는 뜻이 없다.
   */
  targetIndex?: number;
  files: readonly GraphFile[];
  edges: readonly GraphEdge[];
  /** 최근 순. 04 §8.1 의 후보 필터가 여기서 고른다. */
  commits: readonly CommitRow[];
  /** 커밋 id → 그 커밋의 변경 파일. `commits` 전부에 대해 미리 읽어 둔다. */
  filesOf: ReadonlyMap<number, readonly CommitFileRow[]>;
  /** 공변경 이력 (04 §8.1 sec ②) — 커밋 id → 바뀐 경로들. 최근 50 커밋. */
  recent: ReadonlyMap<number, readonly string[]>;
}

/** 04 §8.1 후보 커밋의 최소 개수. 이보다 적으면 책임 배치를 만들지 않는다 (§8.4). */
export const MIN_COMMITS_FOR_PLACEMENT = 3;

// ───────── 리포 지도 (04 §7.5 · §8.5 · D142) ─────────

/**
 * 리포 지도가 서려면 있어야 하는 최소 노드 수. 폴더 다섯 장짜리 그림에는 「이 프로젝트는
 * 이런 구조구나」가 없다 — 그 리포에서는 대지 하나짜리 문제가 맞다.
 */
export const MIN_REPO_NODES = 6;

/**
 * 진입점 문제의 정답 상한. 지도의 절반이 문이면 아무 데나 찍어도 맞는다 — 상한과 함께
 * 「정답이 노드의 절반을 넘지 않는다」도 본다 (`buildEntry`).
 */
export const MAX_ENTRY_CORE = 4;

/** 「이 폴더는 왜 있나」를 물을 수 있는 폴더의 최소 파일 수. 한 장짜리는 폴더가 아니다. */
export const MIN_ROLE_MEMBERS = 2;

/** 생성 결과. `NoPlate` 와 같은 자리에서 「못 만들었다」를 말한다. */
export interface T2Card {
  kind: T2Kind;
  conceptId: ConceptId;
  unitId: number;
  /** 정답지가 커밋에서 나왔으면 그 `git_commit.id` — `card.commit_id` 에 들어간다. */
  commitId: number | null;
  payload: T2Payload;
  contentHash: string;
}

export const isT2Card = (v: T2Card | NoPlate): v is T2Card => 'payload' in v;
