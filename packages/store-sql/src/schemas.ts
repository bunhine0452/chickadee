/**
 * `*_json` 열의 zod 스키마 (02 §8.2 마지막 문단 — `ItemState`·`CardPayload`·`ReviewDetail`·
 * `Settings` 는 각각 스키마를 갖는다) 와, 행 변환기가 필요로 하는 나머지 JSON 열의 스키마.
 *
 * 열 ↔ 스키마
 *   card.payload_json            → cardPayloadSchema
 *   card.snapshot_json           → snapshotSchema      (CodeLine[])
 *   session.plan_json            → planSchema          (PlannedItem[])
 *   session_item.state_json      → itemStateSchema
 *   review_log.detail_json       → reviewDetailSchema
 *   settings.value_json          → settingsSchema 의 키별 조각
 *   commit_file.touched_json     → touchedSchema       ([number, number][])
 *   concept_site.picks_json      → picksSchema
 *   concept_site.hole_json       → holeSchema
 *   concept_site.ctx_json        → ctxSchema
 *   concept_site.line_concepts_json → lineConceptsSchema
 *   block.ast_json               → astLiteSchema       (AstLite)
 *   appeal.reasons_json          → reasonsSchema
 *   scheduler_params.params_json → schedulerParamsSchema
 *   ingest_run.grammar_versions_json → grammarVersionsSchema
 *
 * 실패는 반드시 오류다 (`errors.ts` 참고). 행을 버리지도, 필드를 비우지도 않는다.
 *
 * 타입 주석에 관하여: zod v3 의 `.optional()` 은 `{ x?: T | undefined }` 를 만들고,
 * `exactOptionalPropertyTypes` 아래에서 그것은 §8.2 의 `{ x?: T }` 와 **서로** 대입되지 않는다.
 * 그래서 스키마에 `z.ZodType<Interface>` 를 붙이지 않고 추론에 맡긴 뒤,
 * 「인터페이스 → 스키마 출력」 한 방향만 아래 `SchemaCoverage` 로 컴파일 타임에 못박는다.
 * (반대 방향 — 스키마가 인터페이스보다 넓어지는 것 — 은 `rows.test.ts` 의 왕복이 잡는다.)
 */
import { z } from 'zod';

import { ColumnTypeError, JsonColumnError, type RowId } from './errors.js';
import type {
  AstLite, CardPayload, CodeLine, ConceptId, DayKey, DictLayer, ItemState, PlannedItem,
  ReviewDetail, Seg, Settings,
} from './types.js';

// ───────── 브랜드 · 리터럴 ─────────

/** 개념 id 는 브랜드 `ConceptId` (02 §8.1). */
export const conceptIdSchema = z.string().min(1).transform((v): ConceptId => v as ConceptId);

/** `TEXT 'YYYY-MM-DD'` → 브랜드 `DayKey` (02 §8.1). */
export const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const dayKeySchema = z.string().regex(DAY_KEY_PATTERN).transform((v): DayKey => v as DayKey);

// 문자열 리터럴 집합은 `z.enum`(리터럴 유니온 보존), 숫자 리터럴 집합은 `z.union` 으로 적는다.
export const trackSchema = z.enum(['t0', 't1', 't2', 't3']);
export const roleSchema = z.enum(['review', 'new', 'retry', 'prereq', 'manual', 'gap']);
export const layerSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export const gradeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export const rungSchema = gradeSchema;
export const stageSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
/** `mastery.state` — FSRS 0 New 1 Learning 2 Review 3 Relearning. */
export const masteryStateSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
/** `card.level` — 사용처 복잡도 밴드 (§6). */
export const levelSchema = stageSchema;

const int = () => z.number().int();

// ───────── concept_site 의 JSON 열 ─────────

/**
 * `@pick.N` 원문. §8.2 는 `Record<number, string>` 인데 DDL 기본값은 `'[]'` (배열) 이다 —
 * 빈 배열만 빈 레코드로 받아 준다. 값이 든 배열은 오류다(무음 손상 금지).
 */
export const picksSchema = z
  .union([z.record(z.string().regex(/^\d+$/), z.string()), z.array(z.unknown()).max(0)])
  .transform((v): Record<number, string> => {
    if (Array.isArray(v)) return {};
    const out: Record<number, string> = {};
    for (const [k, val] of Object.entries(v)) out[Number(k)] = val;
    return out;
  });

/** `@hole` 원문. 열이 NULL 이면 파싱하지 않는다(`hole: null`). */
export const holeSchema = z.string();

/** `@ctx.<name>` 원문. */
export const ctxSchema = z.record(z.string());

/** 같은 줄에서 만난 개념 id 들 (§6.1 미지 개념 계산의 입력). */
export const lineConceptsSchema = z.array(conceptIdSchema);

// ───────── 카드 payload ─────────

export const segSchema = z.union([
  z.object({ t: z.string(), pick: int().optional() }),
  z.object({ hole: z.literal(true) }),
]);

export const codeLineSchema = z.union([
  z.object({ n: int(), t: z.string(), target: z.literal(true).optional() }),
  z.object({ n: int(), seg: z.array(segSchema), target: z.literal(true).optional() }),
]);

/** `card.snapshot_json` — 은퇴한 카드가 품는 코드 줄 스냅샷 (02 §2.1). */
export const snapshotSchema = z.array(codeLineSchema);

export const dictLayerSchema = z.union([
  z.object({ k: z.string(), t: z.string() }),
  z.object({ k: z.string(), steps: z.array(z.string()) }),
]);

const t0PayloadSchema = z.object({
  track: z.literal('t0'),
  kind: z.enum(['meaning', 'blank', 'point']),
  file: z.string(),
  focus: int(),
  lines: z.array(codeLineSchema),
  q: z.string(),
  hint: z.string(),
  options: z.array(z.object({ t: z.string(), mono: z.boolean().optional() })).optional(),
  answer: int(),
  why: z.array(
    z.union([
      z.null(),
      z.object({ t: z.string(), edge: z.object({ h: z.string(), code: z.array(z.string()) }).optional() }),
    ]),
  ),
  ok: z.string(),
  rule: z.string(),
  result: z.object({ label: z.string(), value: z.string(), note: z.string() }).optional(),
  dict: z.array(dictLayerSchema).optional(),
  prereq: z.array(z.object({ conceptId: conceptIdSchema, n: z.string() })),
  uses: z.array(z.object({ siteId: int(), f: z.string(), l: int() })),
  promptLines: z.array(z.string()),
  payoff: z.string().optional(),
  bridge: z.string().optional(),
  transferFrom: conceptIdSchema.optional(),
  previewSiteId: int().optional(),
});

const t1PayloadSchema = z.object({
  track: z.literal('t1'),
  kind: z.literal('transcribe'),
  /**
   * 02 `block.id` (D92). 판을 마칠 때 `why_answer.block_id` 와 `block.ast_json` 캐시를
   * 되찾을 열쇠다 — `card` 에는 블록을 가리키는 열이 없고(`file_id` 뿐이다) 원본 줄만으로
   * 블록을 되짚으면 같은 파일의 같은 길이 블록과 헷갈린다.
   */
  blockId: int(),
  file: z.string(),
  fn: z.string(),
  original: z.array(z.string()),
  show2: z.array(int()),
  why: z.object({
    line: int(),
    q: z.string(),
    help: z.string(),
    choices: z.array(z.object({ t: z.string(), ok: z.boolean(), fb: z.string() })),
  }),
});

export const edgeKindSchema = z.enum(['static', 'type', 'dynamic', 'http']);

/**
 * D100 — 02 §8.2 의 t2 변형. 네 종이 한 모양을 나눠 쓴다.
 *   · `commit` 없음  = 그래프만으로 만든 3종, 또는 커밋 부족 폴백 (04 §8.3·§8.4)
 *   · `flow`/`pairs` = 흐름 추적·의존성 방향의 정답지. 파일을 **고르는** 두 종은 `core` 를 쓴다
 *   · `edges` 3번째 자리 = `import_edge.kind`. 05 가 `type` 을 점선, `http` 를 이중선으로 (04 §7.3)
 */
const t2PayloadSchema = z.object({
  track: z.literal('t2'),
  kind: z.enum(['placement', 'radius', 'flow', 'direction', 'entry', 'role']),
  q: z.string(),
  hint: z.string(),
  bands: z.array(z.object({ l: z.string(), s: z.string() })),
  files: z.array(z.object({
    p: z.string(), r: z.number(), isNew: z.boolean().optional(),
    // 접힌 폴더 노드 안의 파일 수 (04 §7.4) · SCC 크기 > 1 (04 §7.2).
    folded: int().optional(), cycle: z.boolean().optional(),
  })),
  edges: z.array(z.tuple([z.string(), z.string(), edgeKindSchema])),
  commit: z.object({ h: z.string(), d: z.string(), m: z.string(), n: z.string() }).optional(),
  core: z.record(z.tuple([z.string(), z.string()])),
  sec: z.record(z.tuple([z.string(), z.string()])),
  trap: z.record(z.string()),
  hints: z.array(z.string()),
  flow: z.object({ answer: z.array(z.string()), deck: z.array(z.string()) }).optional(),
  pairs: z.array(z.object({
    a: z.string(), b: z.string(), answer: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  })).optional(),
  role: z.object({ folder: z.string(), answer: int() }).optional(),
});

// ───────── 코스 문항 (D164) ─────────
// 셋 다 `track: 't3'` 라 `discriminatedUnion('track')` 에 못 든다 — 바깥을 `z.union` 으로 감싼다.
// 예전 셋은 `track` 으로 먼저 갈리고, `t3` 는 `kind` 가 다시 가른다.

/** 코스의 단 1~5 (`card.stage_no`). */
export const stageNoSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export const repairTypeSchema = z.enum(['patch-line', 'patch-place', 'rollback']);
export const reimplTypeSchema = z.enum(['reimpl-spec', 'reimpl-layer', 'handoff']);

const plainWhySchema = z.array(z.union([z.null(), z.object({ t: z.string() })]));

const stageChoiceSchema = z.object({
  track: z.literal('t3'),
  kind: z.enum(['twin', 'origin', 'cut', 'reorder', 'contract']),
  stage: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  file: z.string(),
  focus: int(),
  lines: z.array(codeLineSchema),
  q: z.string(),
  hint: z.string(),
  options: z.array(z.object({
    t: z.string(), mono: z.boolean().optional(), f: z.string().optional(), l: int().optional(),
  })),
  answer: int(),
  why: plainWhySchema,
  ok: z.string(),
  rule: z.string(),
  promptLines: z.array(z.string()),
  reason: z.object({
    q: z.string(), options: z.array(z.object({ t: z.string() })), answer: int(), why: plainWhySchema,
  }).optional(),
});

const stageRepairSchema = z.object({
  track: z.literal('t3'),
  kind: z.literal('repair'),
  type: repairTypeSchema,
  stage: z.literal(4),
  q: z.string(),
  file: z.string(),
  grammar: z.string(),
  goal: z.string(),
  commit: z.object({ h: z.string(), d: z.string(), m: z.string() }),
  lines: z.array(z.string()),
  from: int(),
  target: int(),
  expected: z.array(z.string()),
  accept: z.array(int()).optional(),
  promptLines: z.array(z.string()),
});

const stageReimplSchema = z.object({
  track: z.literal('t3'),
  kind: z.literal('reimpl'),
  type: reimplTypeSchema,
  stage: z.literal(5),
  file: z.string(),
  grammar: z.string(),
  fn: z.string(),
  original: z.array(z.string()),
  from: int(),
  signature: z.array(z.string()),
  mustHold: z.array(z.object({
    text: z.string(), source: z.enum(['user', 'dict', 'ast']), anchor: z.array(int()),
  })),
  links: z.array(z.string()),
  context: z.array(z.object({ file: z.string(), lines: z.array(z.string()) })),
  question: z.string(),
  promptLines: z.array(z.string()),
  blockId: z.union([int(), z.null()]),
});

/** `card.payload_json` (02 §8.2 · 05 가 그대로 렌더한다). 코스 셋은 D164. */
export const cardPayloadSchema = z.union([
  z.discriminatedUnion('track', [t0PayloadSchema, t1PayloadSchema, t2PayloadSchema]),
  stageChoiceSchema,
  stageRepairSchema,
  stageReimplSchema,
]);

// ───────── 세션 · 원장 ─────────

/**
 * 이 판의 글자가 어디서 왔나 (D143). 감점 없음 — 기록과 스케줄러 신호다.
 *
 * 스키마가 모르는 키는 **떼어 낸다**. 타입만 넣고 여기를 빠뜨리면 저장은 되는데 읽을 때
 * 조용히 사라지고, `Covers<…>` 는 인터페이스가 스키마 출력을 확장하는 방향이라 컴파일도
 * 안 깨진다 — 그래서 이 세 줄이 타입보다 먼저다.
 */
const assistCountSchema = z.object({
  keyed: int(), assisted: int(), pasted: int(), accepted: int(),
});

/** `session_item.state_json` — 판 내부 진행. */
export const itemStateSchema = z.object({
  sel: int().optional(),
  answered: z.boolean().optional(),
  dunno: z.boolean().optional(),
  rung: rungSchema.optional(),
  jumped: z.boolean().optional(),
  returned: z.boolean().optional(),
  prereqDone: z.array(conceptIdSchema).optional(),
  t1Draft: z.string().optional(),
  t1Stage: stageSchema.optional(),
  peeks: int().optional(),
  assist: assistCountSchema.optional(),
  t2Sel: z.array(z.string()).optional(),
  hints: int().optional(),
});

/** `session.plan_json` — 최초 큐 스냅샷 (§5.3 `planSession()` 의 반환). */
export const plannedItemSchema = z.object({
  cardId: int(),
  conceptId: conceptIdSchema,
  track: trackSchema,
  role: roleSchema,
  estMin: z.number(),
});
export const planSchema = z.array(plannedItemSchema);

/** `review_log.detail_json` — 트랙별 상세. */
export const reviewDetailSchema = z.discriminatedUnion('track', [
  z.object({ track: z.literal('t0'), sel: int(), answer: int(), kind: z.enum(['meaning', 'blank', 'point']) }),
  z.object({
    track: z.literal('t1'),
    meaning: z.number(), total: int(), exact: int(), equiv: int(), differ: int(), missing: int(), extra: int(),
    peeks: int(), assist: assistCountSchema.optional(),
    downgraded: z.boolean(), stageBefore: stageSchema, stageAfter: stageSchema,
    appealedLines: z.array(int()), whyText: z.string(), whyPick: int().nullable(),
  }),
  z.object({
    track: z.literal('t2'),
    pct: z.number(), found: z.array(z.string()), missed: z.array(z.string()), wrong: z.array(z.string()),
    bonus: z.array(z.string()), hints: int(), more: z.boolean(),
  }),
]);

// ───────── 그 밖의 JSON 열 ─────────

/** `commit_file.touched_json` — `'+'` 줄의 new_lineno 범위 (01 §3.3). */
export const touchedSchema = z.array(z.tuple([int(), int()]));

/** `appeal.reasons_json`. */
export const reasonsSchema = z.array(z.string());

/** `scheduler_params.params_json` — FSRS-5 `number[19]` (02 §3.6). */
export const SCHEDULER_PARAM_COUNT = 19;
export const schedulerParamsSchema = z.array(z.number()).length(SCHEDULER_PARAM_COUNT);

/** `ingest_run.grammar_versions_json` — `{ grammar: version }`. */
export const grammarVersionsSchema = z.record(z.string());

/**
 * `block.ast_json` — `parse_snippet` 의 `AstLite`. 재귀라 zod v3 이 주석을 요구하는데,
 * `AstLite` 를 그대로 쓰면 `text?: string` 과 zod 출력 `text?: string | undefined` 가 부딪힌다.
 * 출력 전용 쌍둥이 타입을 두고 아래 `SchemaCoverage` 가 둘을 대조한다.
 */
type AstLiteOut = {
  kind: string; named: boolean; start: number; end: number;
  text?: string | undefined; children: AstLiteOut[];
};
export const astLiteSchema: z.ZodType<AstLiteOut> = z.lazy(() =>
  z.object({
    kind: z.string(),
    named: z.boolean(),
    start: int(),
    end: int(),
    text: z.string().optional(),
    children: z.array(astLiteSchema),
  }),
);

// ───────── settings (KV 테이블) ─────────

/** 02 §8.2 `Settings`. `settings` 테이블은 키·값 한 쌍이 한 행이라 이 객체는 여러 행의 합이다. */
export const settingsSchema = z.object({
  budgetMin: z.number(),
  tz: z.string(),
  rolloverHour: int(),
  desiredRetention: z.number(),
  newPerDay: int(),
  t1PerWeek: int(),
  newcomerFlag: z.enum(['none', 'suspect', 'confirmed']),
  theme: z.enum(['light', 'dark']),
  trim: z.enum(['on', 'off']),
  motion: z.enum(['system', 'reduce']),
  identities: z.array(z.object({ email: z.string(), name: z.string() })),
  excludeGlobs: z.array(z.string()),
  locale: z.enum(['ko', 'en']),
  tutorialSeen: z.boolean(),
  declaredNewcomer: z.boolean(),
  rootCleared: z.boolean(),
  dictLangs: z.array(z.string()),
  lastRepoId: z.number().nullable(),
});

/**
 * `Settings` 필드 ↔ `settings.key` 문자열. DDL 머리 주석의 키 목록(`budget_min`·`tz`·
 * `rollover_hour`·`desired_retention`·`new_per_day`·`newcomer_flag`·`motion`·`identities`·
 * `exclude_globs`)을 그대로 쓰고, 주석이 `…` 로 열어 둔 셋(`t1_per_week`·`theme`·`trim`)은
 * 같은 규칙(snake_case)으로 이었다.
 */
export const SETTINGS_KEYS = {
  budgetMin: 'budget_min',
  tz: 'tz',
  rolloverHour: 'rollover_hour',
  desiredRetention: 'desired_retention',
  newPerDay: 'new_per_day',
  t1PerWeek: 't1_per_week',
  newcomerFlag: 'newcomer_flag',
  theme: 'theme',
  trim: 'trim',
  motion: 'motion',
  identities: 'identities',
  excludeGlobs: 'exclude_globs',
  locale: 'locale',
  tutorialSeen: 'tutorial_seen',
  declaredNewcomer: 'declared_newcomer',
  rootCleared: 'root_cleared',
  dictLangs: 'dict_langs',
  lastRepoId: 'last_repo_id',
} as const satisfies Record<keyof Settings, string>;

export type SettingsField = keyof typeof SETTINGS_KEYS;

/** `settings.key` → `Settings` 필드. 모르는 키는 `undefined`. */
const FIELD_BY_KEY: ReadonlyMap<string, SettingsField> = new Map(
  Object.entries(SETTINGS_KEYS).map(([field, key]) => [key, field as SettingsField]),
);
export const settingsFieldFor = (key: string): SettingsField | undefined => FIELD_BY_KEY.get(key);

/** 키 하나의 값 스키마. `settings.value_json` 은 행마다 이걸로 검증한다. */
export const settingsValueSchema = (field: SettingsField): z.ZodTypeAny => settingsSchema.shape[field];

// ───────── JSON 열 파싱 ─────────

/**
 * zod 문제 목록 → `'경로:코드'` — **값은 넣지 않는다** (01 §6).
 *
 * `z.union` 은 문제를 `invalid_union` 하나로 접고 갈래별 문제를 `unionErrors` 에 숨긴다
 * (`cardPayloadSchema`, D164). 접힌 채로 내면 「payload 가 틀렸다」밖에 못 말하므로 갈래 안의
 * 문제를 펼친다 — 가장 적게 틀린 갈래가 실제로 뜻한 모양이라 그 갈래의 경로를 앞에 둔다.
 */
function issuePaths(error: z.ZodError): string[] {
  const flat = (issues: readonly z.ZodIssue[]): string[] => {
    const out: string[] = [];
    for (const i of issues) {
      if (i.code === 'invalid_union') {
        const branches = i.unionErrors.map((e) => flat(e.issues)).sort((a, b) => a.length - b.length);
        for (const b of branches) out.push(...b);
      } else {
        out.push(`${i.path.join('.') || '<root>'}:${i.code}`);
      }
    }
    return out;
  };
  return [...new Set(flat(error.issues))].slice(0, 8);
}

/**
 * `*_json` 열 하나를 파싱한다. JSON 이 아니거나 스키마와 다르면 `JsonColumnError` —
 * 그 행을 버리지 않는다(02 §8.1 무음 손상 금지).
 */
export function parseJsonColumn<S extends z.ZodTypeAny>(
  schema: S,
  raw: unknown,
  table: string,
  column: string,
  rowId: RowId,
): z.infer<S> {
  if (typeof raw !== 'string') throw new ColumnTypeError(table, column, rowId, 'JSON TEXT');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // SyntaxError 의 메시지는 원문 조각을 담는다 — 옮기지 않는다.
    throw new JsonColumnError(table, column, rowId, ['<root>:invalid_json']);
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new JsonColumnError(table, column, rowId, issuePaths(result.error));
  return result.data as z.infer<S>;
}

// ───────── 컴파일 타임 대조 (§8.2 인터페이스 → 스키마 출력) ─────────

type Assert<T extends true> = T;
type Covers<Interface, Output> = [Interface] extends [Output] ? true : false;

/** 하나라도 `false` 가 되면 여기서 컴파일이 깨진다 — 스키마가 §8.2 를 덜 받는 것이다. */
export type SchemaCoverage = [
  Assert<Covers<ItemState, z.infer<typeof itemStateSchema>>>,
  Assert<Covers<CardPayload, z.infer<typeof cardPayloadSchema>>>,
  Assert<Covers<ReviewDetail, z.infer<typeof reviewDetailSchema>>>,
  Assert<Covers<Settings, z.infer<typeof settingsSchema>>>,
  Assert<Covers<CodeLine, z.infer<typeof codeLineSchema>>>,
  Assert<Covers<Seg, z.infer<typeof segSchema>>>,
  Assert<Covers<DictLayer, z.infer<typeof dictLayerSchema>>>,
  Assert<Covers<PlannedItem, z.infer<typeof plannedItemSchema>>>,
  Assert<Covers<AstLite, AstLiteOut>>,
];
