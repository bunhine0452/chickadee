/**
 * 기초 문항 채점 — **값 일치** (`docs/program/fundamentals.md` §4·§5).
 *
 * 고르기의 채점은 인덱스 비교 한 줄이다. 적기의 채점은 그렇지 않다 — `3` 과 `3.0` 과
 * `3.` 과 ` 3 ` 과 `3L` 이 다 들어온다. 그래서 이 파일의 절반은 **정규화**이고 나머지
 * 절반은 **오답 분류**다.
 *
 * ## 두 가지를 갈라 둔다
 *
 * **오타는 봐주고 오해는 안 봐준다.** 앞뒤 공백·자릿수 구분자(`1_000`)·정수 접미사(`3L`)는
 * 걷어낸다 — 그것을 틀렸다고 하면 재는 것이 이해가 아니라 타자다. 반대로 `3` 과 `3.0` 은
 * **다른 답**이고 `true` 와 `True` 도 **다른 답**이다. 파이썬에서 `true` 는 값이 아니라
 * 이름이고 그 자리에서 `NameError` 가 난다 — 봐주면 그 사실을 안 가르치게 된다.
 *
 * ## 실수는 엡실론이 아니라 **비트로** 견준다
 *
 * `0.1 + 0.2` 의 답이 `0.3` 이 아니라는 것이 이 코스가 가르치려는 것이다. 엡실론을 두면
 * 그 교훈이 채점기 안에서 지워진다. 대신 학습자의 십진 문자열을 `Number()` 로 파싱해
 * **같은 double 인지**를 본다 — `Number()` 는 십진→binary64 를 올바르게 반올림하므로
 * 이 비교는 자릿수를 적당히 봐준다. 이 저장소의 node 로 잰 값:
 *
 * | 학습자가 적은 것 | `0.1 + 0.2` 와 같은 double 인가 |
 * |---|---|
 * | `0.30000000000000004` | 그렇다 |
 * | `0.30000000000000005` | **그렇다** — 이웃 double 이 없다 |
 * | `0.3000000000000001`  | 아니다 |
 * | `0.3`                 | 아니다 (`0.3` 은 17자리로 `0.29999999999999999`) |
 *
 * 마지막 한 자리를 틀려도 통과하고 `0.3` 은 안 통과한다. 딱 그만큼만 봐주는 것이 맞다.
 *
 * ## 진단은 사람이 안 적는다
 *
 * 정본 §3-2 는 오답에 「**당신이 고른 그것이 참이 되는 조건**」을 보이라고 한다. 값 적기에서
 * 그 조건은 대개 **다른 언어**다 — `7 / 2` 에 `3.5` 를 적은 사람은 파이썬의 규칙을 쓴 것이다.
 * 그래서 문항이 `siblings` 로 **같은 식의 다른 언어 답**을 들고 오고, 채점기는 거기서 찾기만
 * 한다. 진단문을 개념마다 저작하지 않는다.
 *
 * `@chickadee/cards` 를 import 하지 않는다 — 의존 방향(01 §2)에 `grading → cards` 가 없다.
 * `FundGradeInput` 이 `FundItem` 을 **구조적으로** 받는다 (`StageRun` 이 `RunResult` 를
 * 그렇게 받은 자리와 같다).
 */

/** 답 하나. `@chickadee/cards` 의 `FundValue` 와 같은 모양이다. */
export type FundValue =
  | { t: 'int'; v: string }
  | { t: 'float'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'string'; v: string }
  | { t: 'event'; name: string; accept: readonly string[] }
  | { t: 'compile-error'; name: string; accept: readonly string[] }
  | { t: 'unspecified'; name: string; accept: readonly string[] };

export interface FoldStep { code: string; type: string }

/** 같은 언어 안의 다른 판. `@chickadee/cards` 의 `FundAlt` 와 같은 모양이다. */
export interface FundAlt {
  code: readonly string[];
  from: string;
  to: string;
  value: FundValue;
}

/**
 * 채점에 필요한 것만. `FundItem` 이 이 모양을 구조적으로 만족한다.
 *
 * `variants`·`langAlt` 는 **선택**이다 — 이 형식을 빌려 쓰는 다른 판(`build` 형식의 실행
 * 채점)이 그 재료 없이도 이 함수를 부를 수 있어야 한다.
 */
export interface FundGradeInput {
  expected: FundValue;
  spell: { yes: string; no: string };
  siblings: readonly { lang: string; name: string; value: FundValue }[];
  ideal: FundValue | null;
  fold: readonly FoldStep[];
  /** 같은 언어, 한 글자 다른 판. */
  variants?: readonly FundAlt[];
  /** 같은 언어, 다른 규칙. */
  langAlt?: readonly FundAlt[];
}

/**
 * 왜 틀렸나. **이 값이 처방을 고른다** — 사다리(정본 §3-1)의 어느 단을 먼저 펼지가 여기서
 * 갈린다 (`fundamentals.md` §5 표).
 */
export type MissKind =
  /** 아무것도 안 적었다. */
  | 'blank'
  /** 숫자로도 표기로도 안 읽힌다. */
  | 'unparsable'
  /** 값은 맞는데 종류가 다르다 — `int` 자리에 `3.0`. */
  | 'type-drift'
  /** 기계가 아니라 수학의 답을 적었다 — `0.1 + 0.2` 에 `0.3`. */
  | 'ideal-math'
  /** 다른 언어에서는 그 답이 참이다. */
  | 'other-language'
  /** **같은 언어**에서 한 글자 다른 식의 답이다 — `2 + 3 * 4` 자리의 `(2 + 3) * 4`. */
  | 'other-form'
  /** **같은 언어**의 다른 규칙에서는 그 답이 참이다 — `Integer` 가 127 이었다면. */
  | 'other-rule'
  /** 버리는 자리에서 반올림했다 — `7 / 2` 에 `4`. */
  | 'rounding'
  /** 부호만 다르다. */
  | 'sign'
  /** 다른 언어의 표기를 썼다 — 파이썬 자리에 `true`. */
  | 'spelling'
  /**
   * 어디에도 안 걸렸고 **이 판에는 진단 재료가 아예 없다.** `unknown` 과 갈라 둔 것이
   * D186 ④ 다 — 「모르겠다」와 「우리가 댈 것이 없다」는 다른 말이고, 뒤쪽을 숨기면
   * 학습자는 앱이 답을 알면서 안 알려 준다고 읽는다.
   */
  | 'no-diagnosis'
  | 'unknown';

/** 진단 문구의 i18n 키. **문구는 `packages/i18n` 이 댄다** (`ABSENCE_MESSAGE_KEY` 선례). */
export const MISS_MESSAGE_KEY: Readonly<Record<MissKind, string>> = {
  blank: 'fund.missBlank',
  unparsable: 'fund.missUnparsable',
  'type-drift': 'fund.missTypeDrift',
  'ideal-math': 'fund.missIdealMath',
  'other-language': 'fund.missOtherLanguage',
  'other-form': 'fund.missOtherForm',
  'other-rule': 'fund.missOtherRule',
  'no-diagnosis': 'fund.missNoDiagnosis',
  rounding: 'fund.missRounding',
  sign: 'fund.missSign',
  spelling: 'fund.missSpelling',
  unknown: 'fund.missUnknown',
};

export interface FundVerdict {
  ok: boolean;
  /** `value` 는 한 칸이라 0 아니면 100 이다. 부분 점수는 `table` 형식의 것이다. */
  pct: number;
  miss: MissKind | null;
  /** {@link MISS_MESSAGE_KEY} 의 값. 정답이면 `null`. */
  diagKey: string | null;
  /** `other-language` 일 때 그 언어의 이름. 그 밖에는 `null`. */
  trueIn: string | null;
  /**
   * `other-form`·`other-rule` 일 때 **그 답이 참이 되는 코드**와 무엇이 바뀌었나.
   * 화면이 두 판을 나란히 놓는다. 그 밖에는 `null`.
   */
  alt: FundAlt | null;
  /** 정규화한 학습자의 답. 판정란이 「당신이 적은 것」으로 되비친다. 못 읽었으면 `null`. */
  normalized: string | null;
  /** 오답일 때 펴 보이는 기계의 걸음. 정답이면 빈 배열 (정본 §3-3 은 자리를 미리 비운다). */
  fold: readonly FoldStep[];
}

/** 앞뒤를 자르고 안쪽 공백을 한 칸으로. */
const collapse = (raw: string): string => raw.trim().replace(/\s+/gu, ' ');

/**
 * 숫자에서 **뜻이 없는 글자**를 걷어낸다 — 자릿수 구분자(`1_000`)와 접미사
 * (자바 `3L` · C `3u` · 러스트 `3i32`·`1.5f64` · C `1.5f`). 값은 안 바뀐다.
 */
const stripNumeric = (s: string): string => s
  .replace(/_/gu, '')
  .replace(/(?:[uUlL]+|[fFdD]|[iuf](?:8|16|32|64|128|size))$/u, '');

/** 십진 정수 표기인가. `+3` 도 받는다 — 뜻이 같다. */
const INT_RE = /^[+-]?\d+$/u;
/** 십진 실수 표기인가. `3.`·`.5`·`1e3` 을 받는다. */
const FLOAT_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/u;

/** 특수한 실수의 표기. 언어마다 찍는 글자가 다르므로 넉넉히 받는다. */
const SPECIAL: Readonly<Record<string, number>> = {
  infinity: Infinity, inf: Infinity, '+infinity': Infinity, '+inf': Infinity,
  '-infinity': -Infinity, '-inf': -Infinity, nan: NaN,
};

/** 정수 표기를 canonical 십진으로. `+007` → `7`. 못 읽으면 `null`. */
export function normalizeInt(raw: string): string | null {
  const s = stripNumeric(collapse(raw));
  if (!INT_RE.test(s)) return null;
  return BigInt(s).toString();
}

/**
 * 실수 표기를 double 로. 못 읽으면 `null`.
 *
 * **정수 표기도 받는다** — double `3` 의 값은 `3` 이고, 종류를 묻는 것은 판의 라벨이지
 * 이 함수가 아니다. 반대로 `int` 자리에 소수점을 적으면 {@link gradeValue} 가
 * `type-drift` 로 잡는다.
 */
export function normalizeFloat(raw: string): number | null {
  const plain = collapse(raw);
  // 특수 표기를 **먼저** 본다 — `-inf` 를 접미사 규칙에 먼저 넣으면 끝의 `f` 가 잘려
  // `-in` 이 된다. 시험이 잡은 자리다.
  const special = SPECIAL[plain.toLowerCase()];
  if (special !== undefined) return special;
  const s = stripNumeric(plain);
  if (!FLOAT_RE.test(s)) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/** 두 double 이 **같은 비트**인가. `Object.is` 라 `-0` 과 `0` 도 갈린다. */
const sameDouble = (a: number, b: number): boolean => Object.is(a, b) || (a === b);

/** 어느 언어의 것이든 참·거짓으로 읽히는 표기. 형제(다른 언어의 답)를 볼 때만 쓴다. */
const TRUE_SPELLINGS = new Set(['true', 'True', 'TRUE', '1', 'yes', '.T.']);
const FALSE_SPELLINGS = new Set(['false', 'False', 'FALSE', '0', 'no', '.F.']);

/**
 * 값 하나를 학습자가 적은 글과 견준다. 같으면 참.
 *
 * `spell` 을 넘기면 **그 언어의 표기 하나만** 참이다(정답·같은 언어의 다른 판). 안 넘기면
 * 어느 언어의 표기든 받는다 — 형제를 볼 때 묻는 것이 「그 답이 **다른 언어**에서 참인가」라
 * 표기까지 그 언어의 것으로 적었기를 기대할 수 없다.
 */
function matches(value: FundValue, raw: string, spell?: { yes: string; no: string }): boolean {
  const s = collapse(raw);
  switch (value.t) {
    case 'int': {
      const n = normalizeInt(s);
      return n !== null && n === BigInt(value.v).toString();
    }
    case 'float': {
      const n = normalizeFloat(s);
      return n !== null && sameDouble(n, Number(value.v));
    }
    case 'bool':
      return spell === undefined
        ? (value.v ? TRUE_SPELLINGS : FALSE_SPELLINGS).has(s)
        : s === (value.v ? spell.yes : spell.no);
    case 'string':
      return unquote(s) === value.v;
    case 'event': case 'compile-error': case 'unspecified': {
      const low = s.toLowerCase();
      return value.accept.some((a) => a.toLowerCase() === low);
    }
    default:
      return false;
  }
}

/** 양끝의 같은 따옴표 한 겹만 벗긴다. 안쪽 공백은 뜻이 있으므로 안 건드린다. */
function unquote(s: string): string {
  const q = s[0];
  if ((q === '"' || q === "'" || q === '`') && s.length >= 2 && s[s.length - 1] === q) {
    return s.slice(1, -1);
  }
  return s;
}

/** 어느 언어의 것이든 참·거짓으로 읽히는 표기. `spelling` 진단이 이 목록을 본다. */
const BOOL_SPELLINGS = new Set([
  'true', 'false', 'True', 'False', 'TRUE', 'FALSE', '1', '0', 'yes', 'no', '.T.', '.F.',
]);

const verdict = (over: Partial<FundVerdict> & Pick<FundVerdict, 'ok'>): FundVerdict => ({
  pct: over.ok ? 100 : 0,
  miss: null,
  diagKey: null,
  trueIn: null,
  alt: null,
  normalized: null,
  fold: [],
  ...over,
});

/** 학습자의 답을 보여 줄 모양으로. 못 읽으면 걷어내기만 한 글을 그대로 되비친다. */
function shown(expected: FundValue, raw: string): string {
  const s = collapse(raw);
  if (expected.t === 'int') return normalizeInt(s) ?? s;
  if (expected.t === 'float') {
    const n = normalizeFloat(s);
    return n === null ? s : String(n);
  }
  return s;
}

/**
 * `value` 형식 한 칸의 채점.
 *
 * 순서가 규칙이다 — ① 맞았나 ② 종류만 어긋났나 ③ **다른 언어의 답인가** ③′ 같은 언어의
 * 다른 판·다른 규칙인가 ④ 수학의 답인가 ⑤ 반올림·부호인가 ⑥ 모르겠다(또는 **댈 것이 없다**).
 *
 * **③ 이 ④·⑤ 보다 앞이다.** 처음엔 ④ 를 앞에 뒀다가 시험이 뒤집었다 — `7 / 2` 에 `3.5` 를
 * 적으면 그것은 「나눗셈의 참값」이면서 동시에 「파이썬의 답」인데, 둘 중 가르치는 것은
 * 뒤쪽이다. 정본 §3-2 가 요구하는 것은 **그 답이 참이 되는 조건**이고 조건은 기계여야 한다
 * — 「수학에서는 맞다」는 학습자가 이미 아는 것이고 왜 자바가 다른지는 안 말해 준다.
 * `ideal-math` 는 **어느 언어도 그 답을 안 낼 때**만 남는다 (`0.1 + 0.2` 의 `0.3` 이 그 하나다).
 */
export function gradeValue(item: FundGradeInput, raw: string): FundVerdict {
  const s = collapse(raw);
  if (s === '') {
    return verdict({ ok: false, miss: 'blank', diagKey: MISS_MESSAGE_KEY.blank, fold: item.fold });
  }

  const { expected } = item;
  if (matches(expected, s, item.spell)) return verdict({ ok: true, normalized: shown(expected, s) });

  const wrong = (miss: MissKind, trueIn: string | null = null, alt: FundAlt | null = null): FundVerdict => verdict({
    ok: false, miss, diagKey: MISS_MESSAGE_KEY[miss], trueIn, alt,
    normalized: shown(expected, s), fold: item.fold,
  });

  // ① 참·거짓 자리에 **다른 언어의 표기**를 썼다. 파이썬의 `true` 가 여기다 — 그 자리에서
  //    그 글자는 값이 아니라 이름이고 `NameError` 가 난다. 이 언어의 표기로 적었는데 값이
  //    반대인 경우는 여기가 아니다 — 그것은 표기 문제가 아니라 **답 문제**라 아래로 내려간다.
  if (expected.t === 'bool' && s !== item.spell.yes && s !== item.spell.no) {
    if (BOOL_SPELLINGS.has(s)) return wrong('spelling');
  }

  // ② 값은 같은데 종류가 다르다. `int` 자리의 `3.0` 이 여기다.
  if (expected.t === 'int') {
    const asFloat = normalizeFloat(s);
    if (asFloat !== null && Number.isInteger(asFloat) && String(asFloat) === BigInt(expected.v).toString()) {
      return wrong('type-drift');
    }
  }

  // ③ 다른 언어에서는 참이다 — 정본 §3-2 가 값 적기에서 서는 자리.
  const sibling = item.siblings.find((x) => matches(x.value, s));
  if (sibling !== undefined) return wrong('other-language', sibling.name);

  // ③′ 언어 밖에 없으면 **언어 안**을 본다 (D186 ③ㄷ). 한 글자 다른 식이 먼저고 그다음이
  //     같은 언어의 다른 규칙이다 — 앞은 「어디를 잘못 읽었나」, 뒤는 「어느 규칙을 쓰고
  //     있었나」이고 앞쪽이 더 좁은 진단이다.
  const variant = (item.variants ?? []).find((x) => matches(x.value, s, item.spell));
  if (variant !== undefined) return wrong('other-form', null, variant);

  const rule = (item.langAlt ?? []).find((x) => matches(x.value, s, item.spell));
  if (rule !== undefined) return wrong('other-rule', null, rule);

  // ④ 어느 언어도 그 답을 안 내면, 그제야 「수학의 답」이다.
  if (item.ideal !== null && matches(item.ideal, s, item.spell)) return wrong('ideal-math');

  // ⑤ 버릴 자리에서 반올림했나 · 부호만 다른가.
  const mine = normalizeFloat(s);
  if (mine !== null && Number.isFinite(mine)) {
    if (item.ideal !== null && (item.ideal.t === 'float' || item.ideal.t === 'int')) {
      const ideal = Number(item.ideal.v);
      if (Number.isFinite(ideal) && mine === Math.round(ideal) && mine !== Math.trunc(ideal)) {
        return wrong('rounding');
      }
    }
    if (expected.t === 'int' || expected.t === 'float') {
      const want = Number(expected.v);
      if (Number.isFinite(want) && want !== 0 && mine === -want) return wrong('sign');
    }
  }

  // ⑥ 참·거짓 자리에 참도 거짓도 아닌 글을 적었으면 못 읽은 것이다.
  if (expected.t === 'bool' && !BOOL_SPELLINGS.has(s)) return wrong('unparsable');

  // ⑦ 어디에도 안 걸렸다. **재료가 아예 없었으면 그 사실을 말한다** (D186 ④).
  const hasMaterial = item.siblings.length > 0
    || (item.variants ?? []).length > 0 || (item.langAlt ?? []).length > 0;
  return wrong(hasMaterial ? 'unknown' : 'no-diagnosis');
}
