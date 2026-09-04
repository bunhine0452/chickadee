/**
 * 문법 사전 스키마 (03 §4.4). zod 가 정본이고 `dictionary/schema/concept.schema.json` 은
 * 여기서 생성한다 (D69) — 기여자가 읽는 계약은 JSON Schema 지만, 두 벌을 손으로 맞추면
 * 반드시 어긋나므로 한쪽만 쓴다.
 *
 * 사전은 커뮤니티 기여 데이터이고 카드 문구는 HTML 로 렌더된다(06 §4.2). 그래서
 * `.strict()` 로 모르는 키를 거부하고, 허용 태그·템플릿 변수 검사는 `lint.ts` 가 한다.
 *
 * **이중 언어 (D118).** 사람이 읽는 문자열은 `string` 이거나 `{ ko, en }` 이다. 스칼라는
 * `ko` 로 읽으므로 기존 YAML 은 한 글자도 고치지 않고 통과한다. 필드를 `*_en` 으로 늘리지
 * 않는 이유는 03 §4.4 의 필드 목록이 언어 축을 모르기 때문이다 — 축은 값 안에 있다.
 * 스키마는 두 벌로 나온다:
 *   `conceptSourceSchema` — 디스크 위의 모양(양쪽 언어). 로더와 린트, JSON Schema 가 쓴다.
 *   `conceptSchema`       — 로케일이 풀린 모양(문자열 하나). 카드·채점이 보는 것이다.
 */
import { z } from 'zod';

/** 앱이 읽을 수 있는 사전 스키마 번호 (03 §5.3). */
export const SUPPORTED_SCHEMA = [1] as const;

/**
 * 사전이 푸는 언어 축 (D117). `@chickadee/i18n` 의 `Locale` 과 같은 값이지만 사전은 그
 * 패키지에 기대지 않는다 — 사전은 인제스트에서도 돌고 거기엔 화면이 없다.
 */
export type Locale = 'ko' | 'en';

/** tree-sitter 문법 키 (D19). 사전 네임스페이스 `lang` 과 다른 축이다. */
export const grammarSchema = z.enum([
  'typescript', 'tsx', 'javascript', 'python', 'go', 'rust', 'swift', 'dart', 'sql',
  // D156 의 열 언어. `c_sharp` 은 tree-sitter 크레이트가 쓰는 키이고 사전 네임스페이스는
  // `csharp` 이다 — `cs/` 를 기초 CS 사전이 가져갔다 (D157).
  'c', 'cpp', 'java', 'c_sharp',
]);
export type Grammar = z.infer<typeof grammarSchema>;

/** 개념 id — `<lang>/<slug>` (03 §3.1). */
export const conceptIdSchema = z.string().regex(/^[a-z][a-z0-9]*\/[a-z0-9][a-z0-9-]*$/);

/** 태그를 걷어낸 길이. 상한은 사람이 읽는 글자 수를 재는 것이지 마크업을 재는 것이 아니다. */
const visible = (text: string): number => text.replace(/<[^>]+>/g, '').length;

/** 사람이 읽는 문자열 하나 (D118). 스칼라 = `ko`. */
export type Localized = string | { ko: string; en?: string | undefined };

/** `{ ko, en }` 모양인가. `name` 처럼 이미 두 언어를 들고 있는 값도 여기에 걸린다. */
export function isLocalized(value: unknown): value is { ko: string; en?: string | undefined } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0 || keys.some((k) => k !== 'ko' && k !== 'en')) return false;
  return typeof (value as { ko?: unknown }).ko === 'string';
}

/** 정본 언어의 글. 폴백을 따지지 않는 자리(린트의 구조 검사 등)가 쓴다. */
export const koOf = (value: Localized): string => (typeof value === 'string' ? value : value.ko);

/** 이 로케일의 글과, 그것이 폴백인지. `en` 이 없으면 `ko` 를 내고 폴백이라고 말한다. */
export function textOf(value: Localized, locale: Locale): { text: string; fellBack: boolean } {
  const ko = koOf(value);
  if (locale === 'ko') return { text: ko, fellBack: false };
  const en = typeof value === 'string' ? undefined : value.en;
  return en === undefined || en === '' ? { text: ko, fellBack: true } : { text: en, fellBack: false };
}

/** 글자 수 상한. `raw` 는 마크업까지, `vis` 는 태그를 걷어낸 뒤를 잰다. */
interface Cap { raw: number; vis: number; message: string }

/**
 * 문자열 하나. 상한은 **언어마다** 건다 — 영어는 같은 뜻이 더 긴 경우가 흔하고, 여기서
 * 걸리는 편이 화면에서 잘리는 것보다 낫다.
 */
function plainText(cap?: Cap): z.ZodType<string, z.ZodTypeDef, string> {
  if (!cap) return z.string();
  return z.string().max(cap.raw).refine((v) => visible(v) <= cap.vis, { message: cap.message });
}

/** 같은 문자열을 `{ ko, en }` 으로도 받는 쪽 (D118). 두 언어에 같은 상한이 걸린다. */
function localizedText(cap?: Cap): z.ZodType<Localized, z.ZodTypeDef, Localized> {
  const one = plainText(cap);
  return z.union([one, z.object({ ko: one, en: one.optional() }).strict()]);
}

/** 사람이 읽는 문자열 하나의 스키마. 상한이 없는 자리에 쓴다. */
export const localizedSchema = localizedText();

/**
 * 개념 하나의 모양. `text` 만 갈아 끼워 두 벌을 만든다 — 원문(양쪽 언어)과 풀린 것(문자열).
 * 필드가 늘어도 두 벌이 어긋나지 않는 유일한 방법이다.
 */
function conceptShape<T extends Localized>(make: (cap?: Cap) => z.ZodType<T, z.ZodTypeDef, T>) {
  const text = make();
  const capped = (raw: number, vis: number, message: string) => make({ raw, vis, message });
  const edge = z.object({ h: text, code: z.array(z.string()).min(1) }).strict();
  const diag = z.object({
    t: capped(1_200, 300, '진단문은 태그를 뺀 300자까지다'),
    edge: edge.optional(),
  }).strict();

  const option = z.object({
    t: text,
    mono: z.boolean().optional(),
    /** 정답 옵션에는 없다 — 첫 옵션이 정답이고 셔플은 앱이 한다 (03 §4.2). */
    diag: diag.optional(),
  }).strict();

  const ask = z.object({ q: text, hint: text.optional() });

  /** 의미형 — 옵션 4개, 그중 오답 3개에 진단이 붙는다. */
  const meaning = ask.extend({ options: z.array(option).length(4) }).strict();

  /** 지목형 — 정답은 `pick.N`, 오답 pick 마다 진단이 있어야 한다. */
  const point = ask.extend({
    answer: z.string().regex(/^pick\.[1-9]$/),
    diag: z.record(z.string().regex(/^pick\.[1-9]$/), diag).optional(),
  }).strict();

  /** 빈칸형 — 첫 옵션이 `@hole` 원문이다. */
  const blank = ask.extend({ options: z.array(option).length(4) }).strict();

  const whyGate = z.object({
    q: text,
    help: text.optional(),
    choices: z.array(z.object({ t: text, ok: z.boolean(), fb: text }).strict()).length(3),
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

  return {
    meaning, point, blank, whyGate,
    fields: {
      schema: z.literal(1),
      id: conceptIdSchema,
      /** 보편 개념 id, 또는 언어 고유면 `null` — 개념 전이의 근거다 (03 §3.1). */
      universal: conceptIdSchema.nullable().default(null),
      /**
       * 두 언어를 다 들고 다닌다 — 원장의 `concept.name_ko`·`name_en` 두 열로 갈라져
       * 들어가므로 로케일이 풀려도 한쪽을 버리지 않는다 (D118 · 마이그레이션 0002).
       */
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
        one_liner: capped(400, 80, 'one_liner 는 태그를 뺀 80자까지다'),
        why: text,
        trace: z.array(text).default([]),
      }).strict(),
      rule: text,
      /** `value` 는 코드 조각을 끼운 템플릿이라 언어가 없다 (03 §4.3). */
      result: z.object({ label: text, value: z.string(), note: text }).strict().optional(),
      ok: text,
      payoff: text.optional(),
      bridge: text.optional(),
      misconceptions: z.array(text).default([]),
      meaning: z.array(meaning).default([]),
      point: z.array(point).default([]),
      blank: z.array(blank).default([]),
      /**
       * 빈칸형을 **못 내는** 사유 (D145). `blank:` 와 `@hole` 을 둘 다 못 갖춘 `essential`
       * 개념은 여기에 이유를 적는다. 「아직 안 썼다」와 「이 문법에는 뚫을 구멍이 없다」는
       * 다른 상태인데 게이트는 그 둘을 구별할 수 없다 — 사람이 적어야 구별된다.
       * 빈칸형이 이미 있는 개념에 남아 있으면 린트가 잡는다(`no-hole-reason-stale`).
       */
      no_hole_reason: z.string().min(8).nullable().default(null),
      why_gate: whyGate.optional(),
      queries: z.array(z.object({
        grammars: z.array(grammarSchema).min(1),
        file: z.string(),
      }).strict()).default([]),
      examples: z.array(example).default([]),
    },
  };
}

const source = conceptShape(localizedText);
const plain = conceptShape(plainText);

/** 디스크 위의 개념 — 문자열마다 `{ ko, en }` 이 열려 있다 (D118). 로더·린트가 읽는다. */
export const conceptSourceSchema = z.object(source.fields).strict();
export type SourceConcept = z.infer<typeof conceptSourceSchema>;

/** 로케일이 풀린 개념. 카드·채점이 보는 모양이고 이중 언어 이전과 같다. */
export const conceptSchema = z.object(plain.fields).strict();

export const meaningSchema = source.meaning;
export const pointSchema = source.point;
export const blankSchema = source.blank;
export const whyGateSchema = source.whyGate;

/**
 * 로케일이 풀린 개념 + 폴백 자국. `untranslated` 가 비어 있지 않으면 이 개념의 그 자리들은
 * 요청한 언어가 없어 `ko` 로 나갔다는 뜻이다 — 화면이 한 줄로 알린다 (D118).
 */
export type Concept = z.infer<typeof conceptSchema> & { readonly untranslated?: readonly string[] };

/** `common/`·`arch/` 는 보편 개념, 나머지는 언어 개념 (02 `concept.kind`). */
export function kindOf(id: string): 'universal' | 'lang' {
  const lang = id.split('/')[0];
  return lang === 'common' || lang === 'arch' ? 'universal' : 'lang';
}

/** 개념 id 앞머리 = 사전 네임스페이스 (D19). */
export const langOf = (id: string): string => id.split('/')[0] ?? '';

/** `_lang.yaml` — 언어 네임스페이스 하나의 메타 (03 §6). 개념과 같은 두 벌로 나온다. */
function langShape<T extends Localized>(text: z.ZodType<T, z.ZodTypeDef, T>) {
  return {
    lang: z.string().regex(/^[a-z][a-z0-9]*$/),
    version: z.string(),
    grammars: z.array(grammarSchema).min(1),
    /**
     * grammar → ABI. **숫자 하나가 아니다** — `ts` 는 `typescript`(14)·`tsx`(14)·
     * `javascript`(15) 셋을 물고 있어 한 값으로 못 적는다. 값을 정하는 것은 언어가 아니라
     * `Cargo.lock` 이 고정한 크레이트 버전이다(같은 문법도 버전이 다르면 갈린다).
     * `dict.test.ts` 가 `parse_langs` 가 보고하는 실제 `abi` 와 대조한다.
     */
    grammar_abi: z.record(grammarSchema, z.number().int().positive()),
    /** grammar → 확장자. 인제스트의 `LangSpec` 이 여기서 나온다 (03 §2.1). */
    extensions: z.record(grammarSchema, z.array(z.string().regex(/^\.[a-z0-9.]+$/))),
    /** `package.json` 의존성으로 감지한다. 감지 실패 리포에서는 로드하지 않는다 (D59). */
    framework: z.string().nullable().default(null),
    detect: z.object({ dependency: z.string() }).strict().optional(),
    essential: z.array(conceptIdSchema).default([]),
    alternatives: z.array(z.object({
      gap: conceptIdSchema,
      present: conceptIdSchema,
      note: text.optional(),
    }).strict()).default([]),
    thin_threshold: z.object({
      min_files: z.number().int().positive(),
      min_sites: z.number().int().positive(),
      small_repo_files: z.number().int().positive(),
    }).strict(),
    /** `point[].diag` 가 없을 때의 폴백 문장 (04 §2.1). */
    diag_default: z.object({ point: text, blank: text }).strict(),
  };
}

/** 디스크 위의 `_lang.yaml`. */
export const langMetaSourceSchema = z.object(langShape(localizedText())).strict();
export type SourceLangMeta = z.infer<typeof langMetaSourceSchema>;

/** 로케일이 풀린 `_lang.yaml`. */
export const langMetaSchema = z.object(langShape(plainText())).strict();
export type LangMeta = z.infer<typeof langMetaSchema>;
