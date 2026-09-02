/**
 * 문법 사전 스키마 (03 §4.4). zod 가 정본이고 `dictionary/schema/concept.schema.json` 은
 * 여기서 생성한다 (D69) — 기여자가 읽는 계약은 JSON Schema 지만, 두 벌을 손으로 맞추면
 * 반드시 어긋나므로 한쪽만 쓴다.
 *
 * 사전은 커뮤니티 기여 데이터이고 카드 문구는 HTML 로 렌더된다(06 §4.2). 그래서
 * `.strict()` 로 모르는 키를 거부하고, 허용 태그·템플릿 변수 검사는 `lint.ts` 가 한다.
 */
import { z } from 'zod';

/** 앱이 읽을 수 있는 사전 스키마 번호 (03 §5.3). */
export const SUPPORTED_SCHEMA = [1] as const;

/** tree-sitter 문법 키 (D19). 사전 네임스페이스 `lang` 과 다른 축이다. */
export const grammarSchema = z.enum([
  'typescript', 'tsx', 'javascript', 'python', 'go', 'rust', 'swift', 'dart', 'sql',
]);
export type Grammar = z.infer<typeof grammarSchema>;

/** 개념 id — `<lang>/<slug>` (03 §3.1). */
export const conceptIdSchema = z.string().regex(/^[a-z][a-z0-9]*\/[a-z0-9][a-z0-9-]*$/);

/** 태그를 걷어낸 길이. 상한은 사람이 읽는 글자 수를 재는 것이지 마크업을 재는 것이 아니다. */
const visible = (text: string): number => text.replace(/<[^>]+>/g, '').length;

const edge = z.object({ h: z.string(), code: z.array(z.string()).min(1) }).strict();
const diag = z.object({
  t: z.string().max(1_200).refine((v) => visible(v) <= 300, {
    message: '진단문은 태그를 뺀 300자까지다',
  }),
  edge: edge.optional(),
}).strict();

const option = z.object({
  t: z.string(),
  mono: z.boolean().optional(),
  /** 정답 옵션에는 없다 — 첫 옵션이 정답이고 셔플은 앱이 한다 (03 §4.2). */
  diag: diag.optional(),
}).strict();

const ask = z.object({ q: z.string(), hint: z.string().optional() });

/** 의미형 — 옵션 4개, 그중 오답 3개에 진단이 붙는다. */
export const meaningSchema = ask.extend({ options: z.array(option).length(4) }).strict();

/** 지목형 — 정답은 `pick.N`, 오답 pick 마다 진단이 있어야 한다. */
export const pointSchema = ask.extend({
  answer: z.string().regex(/^pick\.[1-9]$/),
  diag: z.record(z.string().regex(/^pick\.[1-9]$/), diag).optional(),
}).strict();

/** 빈칸형 — 첫 옵션이 `@hole` 원문이다. */
export const blankSchema = ask.extend({ options: z.array(option).length(4) }).strict();

export const whyGateSchema = z.object({
  q: z.string(),
  help: z.string().optional(),
  choices: z.array(z.object({ t: z.string(), ok: z.boolean(), fb: z.string() }).strict()).length(3),
}).strict().refine((v) => v.choices.filter((c) => c.ok).length === 1, {
  message: 'why_gate.choices 에는 ok 가 정확히 하나여야 한다',
});

const example = z.object({
  code: z.string(),
  /** `none` 은 음성 예시 — 이 코드에서는 하나도 잡히면 안 된다. */
  expect: z.union([
    z.literal('none'),
    z.object({
      sites: z.number().int().nonnegative().optional(),
      form: z.string().optional(),
      hole: z.string().optional(),
      picks: z.record(z.string(), z.string()).optional(),
      ctx: z.record(z.string(), z.string()).optional(),
    }).strict(),
  ]),
}).strict();

export const conceptSchema = z.object({
  schema: z.literal(1),
  id: conceptIdSchema,
  /** 보편 개념 id, 또는 언어 고유면 `null` — 개념 전이의 근거다 (03 §3.1). */
  universal: conceptIdSchema.nullable().default(null),
  name: z.object({ ko: z.string(), en: z.string() }).strict(),
  /** 스티커 얼굴 토큰. 패턴 개념은 없을 수 있다. */
  token: z.string().max(16).nullable().default(null),
  /** 쿼리가 있는 개념만 채운다. `common/`·`arch/` 는 문법에 매이지 않는다 (03 §3.1). */
  grammars: z.array(grammarSchema).default([]),
  framework: z.string().nullable().default(null),
  /** 이 개념이 기본으로 어느 트랙에 붙는가. `arch/*` 넷만 `t2` 다 (03 §3.1). */
  track_default: z.enum(['t0', 't1', 't2', 't3']).default('t0'),
  /** 문법 구멍 지도의 「필수 문법」에 드는가 (03 §6). */
  essential: z.boolean().default(false),
  difficulty: z.number().int().min(1).max(5),
  prereq: z.array(conceptIdSchema).default([]),
  confusions: z.array(conceptIdSchema).default([]),
  dict: z.object({
    one_liner: z.string().max(400).refine((v) => visible(v) <= 80, {
      message: 'one_liner 는 태그를 뺀 80자까지다',
    }),
    why: z.string(),
    trace: z.array(z.string()).default([]),
  }).strict(),
  rule: z.string(),
  result: z.object({ label: z.string(), value: z.string(), note: z.string() }).strict().optional(),
  ok: z.string(),
  payoff: z.string().optional(),
  bridge: z.string().optional(),
  misconceptions: z.array(z.string()).default([]),
  meaning: z.array(meaningSchema).default([]),
  point: z.array(pointSchema).default([]),
  blank: z.array(blankSchema).default([]),
  why_gate: whyGateSchema.optional(),
  queries: z.array(z.object({
    grammars: z.array(grammarSchema).min(1),
    file: z.string(),
  }).strict()).default([]),
  examples: z.array(example).default([]),
}).strict();

export type Concept = z.infer<typeof conceptSchema>;

/** `common/`·`arch/` 는 보편 개념, 나머지는 언어 개념 (02 `concept.kind`). */
export function kindOf(id: string): 'universal' | 'lang' {
  const lang = id.split('/')[0];
  return lang === 'common' || lang === 'arch' ? 'universal' : 'lang';
}

/** 개념 id 앞머리 = 사전 네임스페이스 (D19). */
export const langOf = (id: string): string => id.split('/')[0] ?? '';

/** `_lang.yaml` — 언어 네임스페이스 하나의 메타 (03 §6). */
export const langMetaSchema = z.object({
  lang: z.string().regex(/^[a-z][a-z0-9]*$/),
  version: z.string(),
  grammars: z.array(grammarSchema).min(1),
  grammar_abi: z.number().int().positive(),
  /** grammar → 확장자. 인제스트의 `LangSpec` 이 여기서 나온다 (03 §2.1). */
  extensions: z.record(grammarSchema, z.array(z.string().regex(/^\.[a-z0-9.]+$/))),
  /** `package.json` 의존성으로 감지한다. 감지 실패 리포에서는 로드하지 않는다 (D59). */
  framework: z.string().nullable().default(null),
  detect: z.object({ dependency: z.string() }).strict().optional(),
  essential: z.array(conceptIdSchema).default([]),
  alternatives: z.array(z.object({
    gap: conceptIdSchema,
    present: conceptIdSchema,
    note: z.string().optional(),
  }).strict()).default([]),
  thin_threshold: z.object({
    min_files: z.number().int().positive(),
    min_sites: z.number().int().positive(),
    small_repo_files: z.number().int().positive(),
  }).strict(),
  /** `point[].diag` 가 없을 때의 폴백 문장 (04 §2.1). */
  diag_default: z.object({ point: z.string(), blank: z.string() }).strict(),
}).strict();

export type LangMeta = z.infer<typeof langMetaSchema>;
