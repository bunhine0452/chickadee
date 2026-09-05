/**
 * 02 §8.2 의 타입을 그대로 옮긴 것 — 스키마(`migrations/0001_init.sql`)와 1:1.
 *
 * 원칙(02 §8.1):
 * - 시각 `INTEGER` unix ms(UTC) → `number`
 * - 날짜 키 `TEXT 'YYYY-MM-DD'` → 브랜드 `DayKey`
 * - 불리언 `INTEGER 0/1` → `boolean` (경계에서 변환 — `rows.ts` 가 유일한 경계)
 * - 정수 id 는 `number`, 개념 id 는 브랜드 `ConceptId`
 * - `*_json` 은 zod 로 파싱 (`schemas.ts`)
 *
 * 필드 이름은 문서 그대로다. 고치거나 「개선」하지 않는다 — 05 문서가 목업 `data.js` 의
 * `CARDS`·`T1`·`T2` 키로 그대로 렌더한다는 §8.2 마지막 문단의 약속이 여기에 걸려 있다.
 *
 * DDL 에는 있으나 §8.2 에 대응 인터페이스가 없는 테이블(`repo`·`file`·`capture`·`git_commit`·
 * `ingest_run`·`unit*`·`card_state`·`card_concept`·`scheduler_params`·`dictionary_version`·
 * `concept_prereq`)은 여기에 넣지 않았다. 쓰기 파라미터가 필요한 것만 `rows.ts` 가
 * DDL 파생 입력 타입으로 좁혀 쓴다.
 */
import type { AstLite, Capture } from '@chickadee/ipc-client';

/** 02 §8.2 가 「01 §3.1 에서 import 한다」고 못박은 두 타입. 여기서 다시 내보내 표면을 하나로 둔다. */
export type { AstLite, Capture };

export type ConceptId = string & { readonly __brand: 'ConceptId' };
export type DayKey = string & { readonly __brand: 'DayKey' };     // 'YYYY-MM-DD'
export type Track = 't0' | 't1' | 't2' | 't3';
export type Grade = 1 | 2 | 3 | 4;                                 // Again Hard Good Easy
export type Layer = 0 | 1 | 2 | 3 | 4;

export interface Concept { id: ConceptId; lang: string; nameKo: string; nameEn: string | null; token: string | null;
  kind: 'universal' | 'lang'; universalId: ConceptId | null; trackDefault: Track; dictVersionId: number; isRetired: boolean; }

export interface ConceptSite { id: number; repoId: number; fileId: number; conceptId: ConceptId; siteKey: string;
  lineStart: number; lineEnd: number; colStart: number; colEnd: number; tsNodeKind: string | null;
  form: string | null; shape: string; occurrence: number; excerpt: string;
  picks: Record<number, string>; hole: string | null; ctx: Record<string, string>;   // `@pick.N`·`@hole`·`@ctx.<name>` 원문
  lineConcepts: ConceptId[]; uncoveredRatio: number;
  confidence: 'syntactic' | 'heuristic'; parseQuality: 'ok' | 'poor'; isDirty: boolean; isOversize: boolean;
  commitId: number | null; unknownCount: number; isAlive: boolean; updatedAt: number; }

export interface Mastery { conceptId: ConceptId; state: 0 | 1 | 2 | 3; stability: number | null; difficulty: number | null;
  dueAt: number | null; lastReviewAt: number | null; reps: number; lapses: number;
  layer: Layer; dayKey: DayKey | null; dayStartLayer: Layer; dayCeiling: Layer;
  firstOkAt: number | null; lastOkDay: DayKey | null; dunnoTotal: number; transferFrom: ConceptId | null;
  appliedLogId: number; updatedAt: number; }

/**
 * `card.kind` 의 CHECK 목록 그대로 (0001_init.sql). §8.2 는 이름만 쓰고 값은 DDL 에 있다.
 * `repair`·`reimpl` 은 T3 이라 대응하는 `CardPayload` 변형이 없다 (01 §9 — T3 은 `NOT_IMPLEMENTED`).
 */
export type CardKind =
  | 'meaning' | 'blank' | 'point'                                   // t0
  | 'transcribe'                                                    // t1
  | 'placement' | 'radius' | 'flow' | 'direction'                   // t2
  | 'entry' | 'role'                                                // t2 — 리포 지도 (D142)
  | 'repair' | 'reimpl'                                             // t3 — 코스 4·5단 (D164)
  | 'twin' | 'origin' | 'cut' | 'reorder' | 'contract';             // t3 — 코스 선택형 (D164)

/** 코스의 단 (D164 · `card.stage_no`). `card_state.stage`(T1 페이딩 1~3)와 다른 축이다. */
export type StageNo = 1 | 2 | 3 | 4 | 5;
/** 코스 4·5단의 세부 유형 — `card.kind` 는 `repair`·`reimpl` 이고 `payload.type` 이 셋씩 가른다. */
export type RepairType = 'patch-line' | 'patch-place' | 'rollback';
export type ReimplType = 'reimpl-spec' | 'reimpl-layer' | 'handoff';

export interface Card { id: number; repoId: number; unitId: number | null; track: Track; kind: CardKind; conceptId: ConceptId;
  level: 1 | 2 | 3; siteId: number | null; fileId: number | null; commitId: number | null;
  payload: CardPayload; snapshot: CodeLine[] | null; genVersion: number; contentHash: string; createdAt: number; retiredAt: number | null;
  /** 코스의 단. `null` 이면 코스 밖의 판 — 0008 이전 행도 그렇다 (D164). 선택인 것은 예전 리터럴을 안 깨려고. */
  stageNo?: StageNo | null; }

export type CodeLine = { n: number; t: string; target?: true } | { n: number; seg: Seg[]; target?: true };
export type Seg = { t: string; pick?: number } | { hole: true };

/**
 * 사전 3층(03 §4.4 `dict: { one_liner, why, trace }`)의 렌더 형태. §8.2 가 `DictLayer` 를
 * 이름으로만 쓰고 정의하지 않아 목업 `design/src/ink/data.js` 의 `dict[]` 에서 옮겼다.
 */
export type DictLayer = { k: string; t: string } | { k: string; steps: string[] };

export type CardPayload =
  | { track: 't0'; kind: 'meaning' | 'blank' | 'point'; file: string; focus: number; lines: CodeLine[]; q: string; hint: string;
      options?: { t: string; mono?: boolean }[]; answer: number; why: (null | { t: string; edge?: { h: string; code: string[] } })[];
      ok: string; rule: string; result?: { label: string; value: string; note: string };
      dict?: DictLayer[]; prereq: { conceptId: ConceptId; n: string }[]; uses: { siteId: number; f: string; l: number }[];
      promptLines: string[];                                    // focus±4, 사다리 4단(프롬프트)용
      payoff?: string; bridge?: string; transferFrom?: ConceptId; previewSiteId?: number }   // 합성 예제일 때 「곧 여기서 본다」
  | { track: 't1'; kind: 'transcribe'; blockId: number; file: string; fn: string; original: string[];
      show2: number[];
      why: { line: number; q: string; help: string; choices: { t: string; ok: boolean; fb: string }[] } }
  // D100 — 네 종이 한 모양을 나눠 쓴다. `commit` 이 없는 카드는 그래프만으로 만든 3종과
  // 커밋 부족 폴백(04 §8.3·§8.4)이고, `flow`·`pairs` 는 그 두 종의 정답지다.
  // `edges` 의 3번째 자리는 `import_edge.kind` — 05 가 `type` 을 점선, `http` 를 이중선으로 그린다.
  | { track: 't2'; kind: 'placement' | 'radius' | 'flow' | 'direction' | 'entry' | 'role';
      q: string; hint: string;
      bands: { l: string; s: string }[];
      files: { p: string; r: number; isNew?: boolean; folded?: number; cycle?: boolean }[];
      edges: [string, string, EdgeKind][];
      commit?: { h: string; d: string; m: string; n: string }; core: Record<string, [string, string]>;
      sec: Record<string, [string, string]>; trap: Record<string, string>; hints: string[];
      flow?: { answer: string[]; deck: string[] };
      pairs?: { a: string; b: string; answer: 0 | 1 | 2 | 3 }[];
      // D142 — 폴더 역할 4지. 보기는 `bands` 의 네 라벨이라 따로 싣지 않는다.
      role?: { folder: string; answer: number } }
  // ───────── 코스 문항 (D164 · `docs/program/exercises.md` §2) ─────────
  // `payload.track` 은 **화면 모양**이다. 코스 카드의 열 `card.track` 은 전부 `t3` 이고(어느 큐가
  // 내나 — t0·t1·t2 는 예전 일일 큐, t3 는 코스), 2단 `hop`·`caller` 처럼 T2 지도 모양을 빌리는
  // 판은 payload 가 `t2` 다. 아래 셋은 `t3` 모양 — t0 변형의 `kind` 를 넓히지 않는 이유는 D164.
  //
  // 선택형 — 1단 `twin` · 2단 `origin` · 3단 `cut`·`reorder`·`contract`. 보기가 파일 자리를
  // 가리키면 `f`·`l` 이 붙는다. `contract` 는 둘째 물음(이유 4지)을 `reason` 에 싣는다.
  | { track: 't3'; kind: 'twin' | 'origin' | 'cut' | 'reorder' | 'contract'; stage: 1 | 2 | 3;
      file: string; focus: number; lines: CodeLine[]; q: string; hint: string;
      options: { t: string; mono?: boolean; f?: string; l?: number }[]; answer: number;
      why: (null | { t: string })[]; ok: string; rule: string; promptLines: string[];
      reason?: { q: string; options: { t: string }[]; answer: number; why: (null | { t: string })[] } }
  // 4단 수정 — 실제 `fix:` 커밋의 hunk 가 참조 답이다. `lines` 는 편집 창(파일 줄 `from` 부터),
  // `target` 은 `patch-line`·`rollback` 에서 고칠 줄(창 안 0-based), `patch-place` 에서 정답 삽입
  // 자리(0..lines.length). `accept` 는 `patch-place` 의 스코프 검사가 허용하는 자리 전부.
  // `tests` 는 실행 판정의 정답지다 (D180) — 비었으면 그 판은 게이트에서 빠진다.
  | { track: 't3'; kind: 'repair'; type: RepairType; stage: 4; q: string;
      file: string; grammar: string; goal: string; commit: { h: string; d: string; m: string };
      lines: string[]; from: number; target: number; expected: string[]; accept?: number[];
      promptLines: string[]; tests?: JudgeTestPayload[] }
  // 5단 재구현 — `reimpl-spec` 은 시그니처와 `mustHold` 만 주고, `reimpl-layer` 는 이웃 층
  // (`context`)을 사양으로 주며 `links` 로 연결을 검사한다. `handoff` 는 채점이 없다.
  | { track: 't3'; kind: 'reimpl'; type: ReimplType; stage: 5;
      file: string; grammar: string; fn: string; original: string[]; from: number;
      signature: string[]; mustHold: { text: string; source: 'user' | 'dict' | 'ast'; anchor: number[] }[];
      links: string[]; context: { file: string; lines: string[] }[]; question: string;
      promptLines: string[]; blockId: number | null; tests?: JudgeTestPayload[] };

/** 판정용 테스트 한 장이 payload 에 실린 모양 (D180). 러너의 `RunSpec.tests` 로 그대로 간다. */
export interface JudgeTestPayload { path: string; text: string; source: 'commit' | 'repo' | 'contract' }

/** 코스 문항의 payload 만 (D164). 화면이 단 화면을 고를 때 이 셋으로 좁힌다. */
export type StagePayload = Extract<CardPayload, { track: 't3' }>;

/**
 * `session.plan_json` 의 원소. §8.2 는 `Session.plan: PlannedItem[]` 을 쓰면서 `PlannedItem` 을
 * 정의하지 않는다 — §5.3 `planSession()` 이 실제로 읽는 필드(`track`·`role`·`estMin`)와
 * `item(card, role, est)` 의 인자에서 최소로 좁혔다.
 */
export interface PlannedItem { cardId: number; conceptId: ConceptId; track: Track; role: SessionItem['role']; estMin: number; }

export interface Session { id: number; repoId: number; dayKey: DayKey; seqInDay: number; startedAt: number; endedAt: number | null;
  budgetMin: number; plannedMin: number; elapsedS: number; status: 'active' | 'paused' | 'done' | 'abandoned'; plan: PlannedItem[]; liferShown: number; }

export interface SessionItem { id: number; sessionId: number; pos: number; cardId: number; conceptId: ConceptId; track: Track;
  role: 'review' | 'new' | 'retry' | 'prereq' | 'manual' | 'gap'; estMin: number; parentItemId: number | null;
  status: 'pending' | 'active' | 'done' | 'skipped' | 'removed'; elapsedS: number; state: ItemState | null; reviewLogId: number | null; createdAt: number; }
export type ItemState = { sel?: number; answered?: boolean; dunno?: boolean; rung?: 1 | 2 | 3 | 4; jumped?: boolean; returned?: boolean;
  prereqDone?: ConceptId[]; t1Draft?: string; t1Stage?: 1 | 2 | 3; peeks?: number; t2Sel?: string[]; hints?: number;
  /**
   * 편집 보조가 앉힌 글자 (D143). `peeks` 와 같은 자리·같은 규칙 — **감점 없음, 기록만.**
   * 초안(`t1Draft`)과 함께 살아야 한다: 판을 떠났다 돌아오면 그때까지 센 것이 남아야
   * 「이 판의 글자가 어디서 왔나」가 판 하나 단위로 성립한다.
   */
  assist?: { keyed: number; assisted: number; pasted: number; accepted: number } };

export interface ReviewLog { id: number; sessionId: number; sessionItemId: number; cardId: number; conceptId: ConceptId; track: Track;
  role: SessionItem['role']; reviewedAt: number; dayKey: DayKey; grade: Grade; ok: boolean; dunno: boolean; early: boolean;
  elapsedDays: number; scheduledDays: number; rAtReview: number | null; layerBefore: Layer; layerAfter: Layer;
  sBefore: number | null; dBefore: number | null; sAfter: number; dAfter: number; dueAfter: number; paramsId: number; durationMs: number;
  detail: ReviewDetail; }
export type ReviewDetail =
  | { track: 't0'; sel: number; answer: number; kind: 'meaning' | 'blank' | 'point' }
  | { track: 't1'; meaning: number; total: number; exact: number; equiv: number; differ: number; missing: number; extra: number;
      peeks: number; downgraded: boolean;
      /** 편집 보조가 앉힌 글자 (D143) — `peeks` 옆, 감점 없음. 없으면 안 재던 판본의 행이다. */
      assist?: { keyed: number; assisted: number; pasted: number; accepted: number };
      stageBefore: 1|2|3; stageAfter: 1|2|3; appealedLines: number[]; whyText: string; whyPick: number | null }
  | { track: 't2'; pct: number; found: string[]; missed: string[]; wrong: string[]; bonus: string[]; hints: number; more: boolean };

export interface DunnoEvent { id: number; sessionItemId: number; reviewLogId: number | null; cardId: number; conceptId: ConceptId; at: number;
  answeredBefore: boolean; wasCorrect: boolean | null; maxRung: 1 | 2 | 3 | 4; layerBefore: Layer; layerAfter: Layer; }
export interface LadderEvent { id: number; dunnoEventId: number; rung: 1 | 2 | 3 | 4; action: 'open' | 'jump' | 'back' | 'return' | 'prompt_built' | 'copied'; targetCardId: number | null; at: number; }
export interface Appeal { id: number; reviewLogId: number; cardId: number; track: 't1' | 't2'; lineNo: number | null; originalText: string | null;
  userText: string | null; normOriginal: string | null; normUser: string | null;
  autoVerdict: 'differ' | 'missing' | 'extra' | 'wrong-pick'; autoReason: string | null; reasons: string[] | null;
  patternKey: string | null; engineVersion: string | null; dictVersion: string | null;
  status: 'open' | 'accepted' | 'rejected'; createdAt: number; resolvedAt: number | null; note: string | null; }
export interface Lifer { id: number; conceptId: ConceptId; cardId: number; repoId: number; filePath: string; lineNo: number | null; at: number; shownAt: number | null; }
export interface Gap { repoId: number; conceptId: ConceptId; siteCount: number; minUnknown: number; bestSiteId: number | null;
  reason: string | null; status: 'open' | 'card_made' | 'dismissed'; computedAt: number; }

// 인제스트 산출 · 원장 보강 (열과 1:1). `Capture`·`AstLite` 는 01 §3.1 에서 import 한다
export interface CommitFile { commitId: number; path: string; oldPath: string | null; status: 'A' | 'M' | 'D' | 'R';
  additions: number; deletions: number; touched: [number, number][]; }
export type EdgeKind = 'static' | 'type' | 'dynamic' | 'http';
export interface ImportEdge { repoId: number; fromFileId: number; toFileId: number;
  kind: EdgeKind; confidence: 'syntactic' | 'heuristic'; }
export interface Block { id: number; repoId: number; fileId: number; rev: string | null; name: string; kind: string;
  lineStart: number; lineEnd: number; textHash: string; ast: AstLite | null; isAlive: boolean; updatedAt: number; }
export interface WhyAnswer { id: number; reviewLogId: number; cardId: number; blockId: number | null; lineNo: number | null;
  questionId: string; text: string; pick: number | null; pickOk: boolean | null; createdAt: number; }
export interface PerfSample { id: number; kind: string; ms: number; n: number; at: number; }

/**
 * `repo` 한 행. 장부가 TS 로 내려오면서(D65) 이 타입도 IPC 경계에서 여기로 왔다.
 * `status` 는 열이 아니라 파생이다 — 경로가 없으면 `missing`, `detached_at` 이 있으면 `detached`.
 */
export interface RepoInfo {
  id: number;
  rootPath: string;
  name: string;
  defaultBranch: string | null;
  headSha: string | null;
  primaryLang: string | null;
  /** 루트 커밋 해시들을 정렬해 `-` 로 이은 문자열. 커밋 0개면 `''` (D44). */
  fingerprint: string;
  status: 'ok' | 'missing' | 'detached';
  addedAt: number;
  lastIngestAt: number | null;
}

export interface Settings { budgetMin: number; tz: string; rolloverHour: number; desiredRetention: number; newPerDay: number;
  t1PerWeek: number; newcomerFlag: 'none' | 'suspect' | 'confirmed'; theme: 'light' | 'dark'; trim: 'on' | 'off';
  motion: 'system' | 'reduce'; identities: { email: string; name: string }[]; excludeGlobs: string[];
  /** 표시 언어 (D117). `ko` 가 정본이고 `en` 은 번역이 있는 문구만 바뀐다. */
  locale: 'ko' | 'en';
  /**
   * 첫 판을 함께 걸어 본 적이 있나 (D134). 거짓이면 이 리포의 첫 세션 첫 판에 안내 띠가
   * 얹힌다. 설정 「학습」에서 다시 거짓으로 돌릴 수 있다.
   */
  tutorialSeen: boolean;
  /**
   * 첫 실행에서 「프로그래밍이 처음인가요?」에 예라고 답했나 (D147). 참이면 0장이
   * 뿌리 통과만으로 닫히지 않는다 — 늘려 놓은 24판이 나흘에 사라지는 것을 막는다.
   * **레벨을 묻는 것이 아니라 대상 경계 안쪽인지만 묻는 한 문항이다** — 별도 배치고사를
   * 만들지 않는다는 결정(방안 E-5)은 그대로다. 설정 「학습」에서 언제든 바꾼다.
   */
  declaredNewcomer: boolean;
  /**
   * 새 판을 만들 문법 사전 언어 (D122). **비면 전부 켜진 것**이다 — 빈 목록이
   * 「아무 언어도 안 함」이 되면 첫 실행에서 큐가 통째로 빈다. 표시 언어와 다른 축이다.
   */
  dictLangs: string[];
  /**
   * 0장 종료 조건 ② — 뿌리 판을 통과한 세션이 한 번이라도 나왔나 (D136).
   * **한 번 참이면 참으로 남는다**: 조건이 「나옴」이라 나중 세션이 그 사실을 되돌리지
   * 못한다. `newcomerFlag` 로 대신할 수 없다 — 그쪽 `'none'` 은 아직 아무것도 재 보지
   * 않은 첫날과 구별되지 않는다.
   */
  rootCleared: boolean;
  /**
   * 마지막으로 연 리포 (D119 · 05 §2.4 진입 규칙). 다음에 켤 때 그 리포의 홈으로 바로
   * 들어간다. 그 리포가 목록에서 사라졌으면 첫 줄로 내려온다 — 값이 화면을 막지 않는다.
   */
  lastRepoId: number | null; }
// 기본값: newPerDay = 2, budgetMin = 15 (§5.1 LIMIT)
