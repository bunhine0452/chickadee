/**
 * 기초 문항 — **고르지 않고 적는다** (`docs/program/fundamentals.md`).
 *
 * 1·2부(D177)의 판은 원래 전부 고르기였다 — `point`(짚기) · `blank`(4지) · `meaning`(4지).
 * 그런데 정본 §1 이 재려는 것은 **강제된 능동 출력**이고, 4지선다는 소거법으로 맞을 수 있다.
 * 「`int a = 7 / 2;` 뒤 `a` 는?」에 3·3.5·4·3.0 을 늘어놓으면 소수점이 있는 둘을 지우고
 * 반올림을 지우면 답이 남는다. **적게 하면 그 길이 없다.**
 *
 * 이 파일이 내는 것은 여섯 형식 중 **`value` 하나**다. 재료는 사전이 아니라 **카탈로그**다
 * (`fundamentals-catalog.ts` 의 첫 주석이 그 판단의 근거를 적는다). 갈리는 자리는 이렇다 —
 * 사전이 대는 것은 **개념 id 와 산문**과 「네 코드의 여기가 그것이다」이고, 카탈로그가 대는
 * 것은 **식과 그 값**이다.
 *
 * 파일이 셋인 이유: `fundamentals-dialects.ts` 는 **언어의 규칙**, `fundamentals-catalog.ts`
 * 는 **식**, 여기는 **그 둘을 문항으로 접는 자리와 진단의 계산**이다. 한 파일에 두면 규칙
 * 한 줄을 고칠 때 800줄을 열어야 한다.
 */
import { contentHash } from './hash.js';
import { GEN_VERSION } from './payload.js';
import { CATALOG, FUND_AXES, type ExprSpec, type FundAlt, type FundAxis } from './fundamentals-catalog.js';
import { FUND_DIALECTS, FUND_LANGS, type FundDialect, type FundLang, type FoldStep, type FundValue } from './fundamentals-dialects.js';

export {
  ERRORS, EVENTS, event, valueText, FUND_DIALECTS, FUND_LANGS,
} from './fundamentals-dialects.js';
export type {
  DeclKind, FoldStep, FundDialect, FundLang, FundValue, OverflowRule,
} from './fundamentals-dialects.js';
export { FUND_AXES } from './fundamentals-catalog.js';
export type { FundAlt, FundAxis } from './fundamentals-catalog.js';

/**
 * 기초 문항의 `site_id`. 원장에는 `NULL` 로 들어간다 — 합성 예제와 같은 사정이고, 대응하는
 * `concept_site` 행이 없다. 합성(-1)·추적(-2)·규약(-3) 다음 음수라 넷이 안 섞인다.
 */
export const FUND_SITE_ID = -4;

/** 여섯 형식. 코드가 있는 것은 `value` 하나다 (`fundamentals.md` §2). */
export type FundType = 'value' | 'step' | 'bits' | 'table' | 'build' | 'predict';

/**
 * 오답에 붙일 진단 재료. **`none` 을 값으로 둔 것이 이 타입의 요점이다** (D186 ④) —
 * 진단이 없는 판을 「없다」고 말하지 않으면 화면이 아무 말도 못 하고, 그 침묵이 곧
 * 「이 앱은 왜 틀렸는지 안 가르친다」가 된다.
 */
export type FundDiagnosis = 'siblings' | 'variants' | 'langAlt' | 'none';

export interface FundItem {
  /** `<식 id>:<언어>`. 같은 입력에 같은 id 다 — 재생성 계약의 키다 (04 §0). */
  id: string;
  lang: FundLang;
  type: FundType;
  /** 0부 공통 축 여덟 중 어디 (`docs/curriculum/README.md` §8). */
  axis: FundAxis;
  /** 이 판이 매달리는 개념. 사전이 산문과 「네 코드의 여기」를 여기서 댄다. */
  conceptId: string;
  /** 문법 아래에 깔린 기계 (`cs/`). 없으면 `null`. */
  machineId: string | null;
  /** 판에 뜨는 코드. */
  code: readonly string[];
  /** 물음의 대상 줄 (`code` 안 0-based). */
  focus: number;
  /** 무엇의 값을 묻나 — 이름과 그 언어의 선언 타입. 물음 문구는 화면이 짓는다. */
  target: { name: string; declared: string };
  expected: FundValue;
  /** 오답일 때 펴 보이는 기계의 걸음 (`fundamentals.md` §5). */
  fold: readonly FoldStep[];
  /** 이 언어의 참·거짓 표기. 채점기가 이 표기만 정답으로 본다. */
  spell: { yes: string; no: string };
  /**
   * **같은 식의 다른 언어 답.** 정본 §3-2 「당신이 고른 그것이 참이 되는 조건」이 값 적기에서
   * 서는 자리다. 값에 **오류도 들어간다** — 자바스크립트의 대표 오답은 다른 언어의 값이
   * 아니라 다른 언어의 **컴파일 오류**일 때가 있고, 그것을 빼면 그 오답이 전부 `unknown` 이
   * 된다 (문서 §13).
   */
  siblings: readonly { lang: FundLang; name: string; value: FundValue }[];
  /** **같은 언어, 한 글자 다른 판.** 열 언어가 같은 답을 내는 식에서 진단이 여기서 나온다. */
  variants: readonly FundAlt[];
  /** **같은 언어, 다른 규칙.** 자바 `Integer` 캐시 안·밖, SQL `NOT IN` 대 `NOT EXISTS`. */
  langAlt: readonly FundAlt[];
  /** 위 셋 중 무엇으로 진단하나. 셋 다 비면 `'none'` 이고 화면이 그것을 말한다. */
  diagnosis: FundDiagnosis;
  /** 「수학적으로는 이 값이다」. `0.1 + 0.2` 의 `0.3` 이 여기 들어간다. 없으면 `null`. */
  ideal: FundValue | null;
  /** `card.content_hash` 와 같은 규약 (D70). */
  contentHash: string;
}

/** 못 낸 식과 사유. 사유 없는 「불가」는 없다 (04 전제). */
export interface FundDrop {
  exprId: string;
  axis: FundAxis;
  reason: string;
}

/**
 * 축 여덟이 매달리는 개념. **언어 사전에 그 축의 개념이 있으면 그것을, 없으면 보편 개념을**
 * 쓴다 — 실재하는 id 만 적었고 시험이 사전과 맞댄다.
 *
 * 축 하나에 식이 셋 이상 걸리므로 **개념 하나에 식이 셋 이상**이고, 그래야 재출제가
 * 「다른 식 같은 개념」이 된다 (D187 ②). 기계 개념(`cs/`)을 `conceptId` 로 쓰지 않는 이유가
 * 이것이다 — `cs/floating-point` 를 `float-add` 의 개념으로 두면 그 개념에 식이 하나뿐이다.
 */
const AXIS_CONCEPT: Readonly<Record<FundAxis, { universal: string; lang: Partial<Record<FundLang, string>> }>> = {
  integer: { universal: 'common/integer-literal', lang: { java: 'java/integer-limit', ts: 'ts/number-is-double', py: 'py/arithmetic' } },
  float: { universal: 'common/float-literal', lang: { java: 'java/float-inexact', ts: 'ts/float-inexact' } },
  text: { universal: 'common/text-literal', lang: { java: 'java/text-length', ts: 'ts/text-length' } },
  boolean: { universal: 'common/boolean-value', lang: { java: 'java/boolean-literal', ts: 'ts/boolean-literal', py: 'py/boolean-literal' } },
  operator: { universal: 'cs/operator-precedence', lang: { java: 'java/operator-precedence', ts: 'ts/operator-precedence' } },
  conversion: { universal: 'cs/type-conversion', lang: { java: 'java/implicit-conversion', ts: 'ts/implicit-conversion', sql: 'sql/implicit-cast' } },
  assignment: { universal: 'common/variable-binding', lang: { java: 'java/assignment', ts: 'ts/reassignment', py: 'py/assignment' } },
  equality: { universal: 'common/comparison', lang: { java: 'java/comparison', ts: 'ts/comparison', py: 'py/comparison', sql: 'sql/comparison' } },
};

/** 이 언어의 이 축이 매달리는 개념 id. */
export const fundConceptId = (axis: FundAxis, lang: FundLang): string =>
  AXIS_CONCEPT[axis].lang[lang] ?? AXIS_CONCEPT[axis].universal;

/** 같은 식의 다른 언어 답. `expected` 가 같은 언어는 안 담는다 — 진단이 될 게 없다. */
function siblingsOf(spec: ExprSpec, self: FundDialect): FundItem['siblings'] {
  const mine = JSON.stringify(spec.make(self).expected);
  const out: { lang: FundLang; name: string; value: FundValue }[] = [];
  for (const lang of FUND_LANGS) {
    if (lang === self.lang) continue;
    const d = FUND_DIALECTS[lang];
    if (spec.skip?.(d) != null) continue;
    const value = spec.make(d).expected;
    if (JSON.stringify(value) === mine) continue;
    out.push({ lang, name: d.name, value });
  }
  return out;
}

/**
 * 값이 정말 다른 판만 남긴다.
 *
 * **컴파일이 안 서는 식은 한 글자를 바꿔도 안 선다** — `true + true` 자리의 `true + false`
 * 는 자바에서 둘 다 컴파일 오류라 「그 답이 참이 되는 조건」을 하나도 못 말한다. 그런 판을
 * 남겨 두면 화면이 두 코드를 나란히 놓고 같은 답을 가리키게 되고, 그것은 진단이 아니라
 * 소음이다. 카탈로그에서 식마다 손으로 거르지 않고 여기서 한 번에 거른다.
 */
const usefulAlts = (
  list: readonly FundAlt[], expected: FundValue, code: readonly string[],
): FundAlt[] => list.filter((a) => JSON.stringify(a.value) !== JSON.stringify(expected)
  && a.code.join('\n') !== code.join('\n'));

/**
 * 무엇으로 진단하나. **순서가 규칙이다** — 언어 밖(`siblings`)이 언어 안(`variants`·`langAlt`)
 * 보다 앞이다. 「그 답은 파이썬의 규칙이다」가 「그 답은 괄호를 넣은 판의 답이다」보다 더
 * 많은 것을 가르친다: 앞은 학습자가 **어느 기계를 머릿속에 넣고 있었나**를 말하고 뒤는
 * **어디를 잘못 읽었나**를 말한다.
 */
const diagnosisOf = (
  siblings: FundItem['siblings'], variants: readonly FundAlt[], langAlt: readonly FundAlt[],
): FundDiagnosis => {
  if (siblings.length > 0) return 'siblings';
  if (variants.length > 0) return 'variants';
  if (langAlt.length > 0) return 'langAlt';
  return 'none';
};

/**
 * 한 언어의 `value` 형식 문항 전부. **순수 함수다** — 같은 언어에 언제나 같은 문항이 나오고
 * IPC·SQL·난수를 부르지 않는다 (04 §9 · D72).
 */
export function buildValueItems(lang: FundLang): { items: FundItem[]; dropped: FundDrop[] } {
  const d = FUND_DIALECTS[lang];
  const items: FundItem[] = [];
  const dropped: FundDrop[] = [];

  for (const spec of CATALOG) {
    const skip = spec.skip?.(d) ?? null;
    if (skip !== null) {
      dropped.push({ exprId: spec.id, axis: spec.axis, reason: skip });
      continue;
    }
    const m = spec.make(d);
    const id = `${spec.id}:${lang}`;
    const siblings = siblingsOf(spec, d);
    const variants = usefulAlts(m.variants, m.expected, m.code);
    const langAlt = usefulAlts(m.langAlt, m.expected, m.code);
    items.push({
      id,
      lang,
      type: 'value',
      axis: spec.axis,
      conceptId: fundConceptId(spec.axis, lang),
      machineId: spec.machineId,
      code: m.code,
      focus: m.focus,
      target: m.target,
      expected: m.expected,
      fold: m.fold,
      spell: d.spell,
      siblings,
      variants,
      langAlt,
      diagnosis: diagnosisOf(siblings, variants, langAlt),
      ideal: m.ideal,
      contentHash: contentHash({
        conceptId: fundConceptId(spec.axis, lang),
        kind: 'value',
        siteId: FUND_SITE_ID,
        genVersion: GEN_VERSION,
        payload: { id, code: m.code, expected: m.expected },
      }),
    });
  }
  return { items, dropped };
}

/** 열 언어 전부. 문서의 표와 시험이 이것을 본다. */
export function buildAllValueItems(): FundItem[] {
  return FUND_LANGS.flatMap((lang) => buildValueItems(lang).items);
}

// ───────── 재출제 — 다른 식 같은 개념 (D187 ②) ─────────

/**
 * 판정란·판 머리에 붙는 문구의 i18n 키. **문구는 `packages/i18n` 이 댄다**
 * (`MISS_MESSAGE_KEY`·`ABSENCE_MESSAGE_KEY` 선례). 여기 있는 것은 「어느 사실을 말하나」다.
 *
 * 여섯 중 넷이 **정직성**의 자리다 (D186 ④) — 같은 식을 다시 낸다 · 이 언어에서는 안 낸다 ·
 * 이 언어의 값은 아직 안 재 봤다 · 명세가 답을 안 정했다. 넷 다 「말 안 하면 아무도 모르는」
 * 사실이고, 그래서 키를 미리 만들어 둔다.
 */
export const FUND_NOTE_KEY = {
  retrySame: 'fund.retrySameExpr',
  retryOther: 'fund.retryOtherExpr',
  dropped: 'fund.dropped',
  verifiedSpec: 'fund.verifiedSpec',
  compileError: 'fund.compileError',
  unspecified: 'fund.unspecified',
} as const;

/** 「답이 없다」 둘에 붙는 문구의 키. 값이면 `null` — 화면이 값을 그대로 쓴다. */
export const valueNoteKey = (v: FundValue): string | null => {
  if (v.t === 'compile-error') return FUND_NOTE_KEY.compileError;
  if (v.t === 'unspecified') return FUND_NOTE_KEY.unspecified;
  return null;
};

/** 이 언어의 값을 무엇으로 확인했나 — 명세뿐이면 화면이 그 사실을 말한다 (D186 ④). */
export const verifiedNoteKey = (lang: FundLang): string | null =>
  (FUND_DIALECTS[lang].verified === 'spec' ? FUND_NOTE_KEY.verifiedSpec : null);

export interface FundRetry {
  item: FundItem;
  /**
   * 다른 식을 못 찾아 **같은 식**을 다시 내는가. 참이면 화면이 그 사실을 말한다 —
   * 「이 개념에는 식이 하나뿐입니다」. 숨기면 학습자는 답을 외운 것을 이해로 착각한다.
   */
  sameExpr: boolean;
  /** {@link FUND_NOTE_KEY} 의 값. 판 머리에 한 줄로 붙는다. */
  noteKey: string;
}

/**
 * 틀린 판을 오늘 다시 낼 때 무엇을 내나 — **같은 개념의 다른 식**이다 (D187 ②).
 *
 * 같은 식을 다시 내면 재는 것이 이해가 아니라 **답의 기억**이고, 아예 다른 개념을 내면
 * 진단(정본 §3-2)이 이어지지 않는다. 그 사이가 이 함수다. 난수를 안 쓴다 — 같은 입력에
 * 같은 순서여야 재현이 된다(04 §0). `seenToday` 에 든 식은 뒤로 민다.
 */
export function planFundRetry(
  lang: FundLang, currentId: string, seenToday: Iterable<string> = [],
): FundRetry {
  const { items } = buildValueItems(lang);
  const current = items.find((x) => x.id === currentId);
  if (current === undefined) throw new Error(`${currentId} 는 ${lang} 카탈로그에 없다`);
  const seen = new Set(seenToday);
  const others = items
    .filter((x) => x.conceptId === current.conceptId && x.id !== current.id)
    .sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id)) || a.id.localeCompare(b.id));
  const next = others[0];
  return next === undefined
    ? { item: current, sameExpr: true, noteKey: FUND_NOTE_KEY.retrySame }
    : { item: next, sameExpr: false, noteKey: FUND_NOTE_KEY.retryOther };
}

// ───────── 센서스 (D181 태도 — 재고 보고만 한다) ─────────

export interface FundCensusLang {
  lang: FundLang;
  verified: 'measured' | 'spec';
  items: number;
  dropped: number;
  /** 축 → 그 언어에서 실제로 선 식의 수. 0 인 축이 있으면 그것이 그 언어의 사실이다. */
  byAxis: Record<FundAxis, number>;
  /** 개념 → 식 수. 값이 1 인 개념은 재출제가 같은 식이 된다 (D187 ②). */
  byConcept: Record<string, number>;
  diagnosis: Record<FundDiagnosis, number>;
}

export interface FundCensus {
  langs: FundCensusLang[];
  total: number;
  diagnosis: Record<FundDiagnosis, number>;
  /** 식이 하나뿐인 (언어, 개념) 쌍. 재출제가 같은 식이 되는 자리의 목록이다. */
  singletons: { lang: FundLang; conceptId: string }[];
}

const emptyDiag = (): Record<FundDiagnosis, number> =>
  ({ siblings: 0, variants: 0, langAlt: 0, none: 0 });

/** 카탈로그의 재고. 게이트와 문서의 표가 같은 함수를 본다. */
export function fundCensus(): FundCensus {
  const langs: FundCensusLang[] = [];
  const diagnosis = emptyDiag();
  const singletons: { lang: FundLang; conceptId: string }[] = [];
  let total = 0;

  for (const lang of FUND_LANGS) {
    const { items, dropped } = buildValueItems(lang);
    const byAxis = Object.fromEntries(FUND_AXES.map((a) => [a, 0])) as Record<FundAxis, number>;
    const byConcept: Record<string, number> = {};
    const diag = emptyDiag();
    for (const x of items) {
      byAxis[x.axis] += 1;
      byConcept[x.conceptId] = (byConcept[x.conceptId] ?? 0) + 1;
      diag[x.diagnosis] += 1;
      diagnosis[x.diagnosis] += 1;
    }
    for (const [conceptId, n] of Object.entries(byConcept)) {
      if (n < 2) singletons.push({ lang, conceptId });
    }
    total += items.length;
    langs.push({
      lang, verified: FUND_DIALECTS[lang].verified, items: items.length, dropped: dropped.length,
      byAxis, byConcept, diagnosis: diag,
    });
  }
  return { langs, total, diagnosis, singletons };
}
