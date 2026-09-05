/**
 * `build` — **이 값이 나오게 식을 써라** (D187 ① · `fundamentals.md` §2).
 *
 * 형식 넷(`value`·`step`·`table`·`build`) 중 마지막이고, **유보돼 있던 것**이다. 유보의
 * 사유는 하나였다: 「러너가 없으면 인정 집합으로 판정해야 하는데, 인정 집합은 반드시
 * 불완전하고 불완전한 집합으로 오답을 내면 『맞는데 틀렸다』가 난다」(`exercises.md` §3).
 * D187 ① 이 그 조건을 그대로 두고 답을 정했다 — **stdin 러너가 서면 연다.** 이제 섰다.
 *
 * ## `value` 를 뒤집은 것이다
 *
 * `value` 는 식을 주고 값을 묻는다. `build` 는 값을 주고 식을 묻는다. 같은 규칙표
 * (`FUND_DIALECTS`)를 쓰고 같은 비트 동일성으로 견주지만(`gradeValue` 재사용), 재는 것이
 * 다르다 — `7 / 2` 가 `3` 임을 아는 것과, **`3.5` 를 만들려면 무엇을 바꿔야 하는지** 아는
 * 것은 다르다. 뒤쪽이 이 코스가 결국 재려는 「구성」에 한 걸음 가깝다.
 *
 * ## 러너 없는 언어에서는 판이 안 선다
 *
 * `FUND_LANGS` 는 열이고 stdin 러너가 든 것은 셋이다. 나머지 일곱은 이 형식을 **안 낸다** —
 * 인정 집합으로 대신하지 않는다. 화면이 그 자리에서 「이 언어는 이 컴퓨터에서 못 돌린다」를
 * 말하고 그 판은 게이트 밖이다 (D186 ④ · 정본 §5 ①).
 */
import { t, type MessageKey } from '@chickadee/i18n';

import { FUND_DIALECTS, type FundValue } from './fundamentals.js';

/** 러너가 든 셋. `stdin-runner.ts` 의 `STDIN_LANGS` 와 같은 집합이어야 한다. */
export const BUILD_LANGS = ['py', 'ts', 'java'] as const;
export type BuildLang = (typeof BUILD_LANGS)[number];

const SHELL: Readonly<Record<BuildLang, { grammar: string; name: string }>> = {
  py: { grammar: 'python', name: 'Python' },
  ts: { grammar: 'typescript', name: 'TypeScript' },
  java: { grammar: 'java', name: 'Java' },
};

export interface BuildItem {
  /** `<과제 id>:<언어>`. */
  id: string;
  taskId: string;
  lang: BuildLang;
  q: string;
  hint: string;
  /** 나와야 하는 값. 채점기가 **비트로** 견준다. */
  expected: FundValue;
  /** 사람이 읽는 기댓값 — 판의 라벨. */
  want: string;
  /** 식에 반드시 들어가야 하는 토막. 답을 그대로 적는 길을 막는다. */
  must: readonly string[];
  /** 그 언어의 참·거짓 표기. 대소문자를 봐주면 파이썬의 `true` 가 정답이 된다. */
  spell: { yes: string; no: string };
  /** 굽히는 0부 개념 (사전 id). 판정란이 「이건 그 개념이다」로 되비친다. */
  needs: readonly string[];
  grammar: string;
  langName: string;
}

export interface BuildTask {
  id: string;
  /** 물음의 i18n 키. 이름을 짓지 않고 문자열을 이어 붙이면 키가 타입 밖으로 샌다. */
  qKey: MessageKey;
  must: readonly string[];
  needs: readonly string[];
  /** 이 언어에서 나와야 하는 값. `null` 이면 그 언어에서는 안 낸다. */
  want: (lang: BuildLang) => FundValue | null;
}

/**
 * 과제 여섯. 전부 **같은 두 수로 다른 값을 만드는** 모양이다 — 무엇을 바꾸면 값이 어떻게
 * 바뀌는지가 0부의 내용 그 자체라서다.
 *
 * `neg-remainder` 만 언어마다 답이 다르지 않다: 물음이 **내림 나머지**를 못박으므로
 * 파이썬은 `%` 하나로 되고 자바·타입스크립트는 고쳐 써야 한다. 그 비대칭이 곧 0부가
 * 가르친 것이고, 여기서 손으로 겪는다.
 */
const TASKS: readonly BuildTask[] = [
  {
    id: 'to-fraction',
    qKey: 'drill.buildToFraction',
    must: ['7', '2'],
    needs: ['common/arithmetic', 'cs/type-conversion'],
    want: () => ({ t: 'float', v: '3.5' }),
  },
  {
    id: 'to-whole',
    qKey: 'drill.buildToWhole',
    must: ['7', '2'],
    needs: ['common/arithmetic', 'common/integer-literal'],
    want: () => ({ t: 'int', v: '3' }),
  },
  {
    id: 'neg-remainder',
    qKey: 'drill.buildNegRemainder',
    must: ['7', '2'],
    needs: ['common/arithmetic', 'cs/type-conversion'],
    want: () => ({ t: 'int', v: '1' }),
  },
  {
    id: 'inexact-sum',
    qKey: 'drill.buildInexactSum',
    must: ['0.1', '0.2'],
    needs: ['common/float-literal', 'cs/floating-point'],
    want: () => ({ t: 'float', v: '0.30000000000000004' }),
  },
  {
    id: 'past-32-bits',
    qKey: 'drill.buildPast32Bits',
    must: ['2147483647', '1'],
    needs: ['common/integer-literal', 'cs/integer-overflow'],
    want: () => ({ t: 'int', v: '2147483648' }),
  },
  {
    id: 'truth-from-numbers',
    qKey: 'drill.buildTruthFromNumbers',
    must: ['7', '2'],
    needs: ['common/comparison', 'common/boolean-value'],
    want: () => ({ t: 'bool', v: true }),
  },
];

/** 값 하나를 판의 라벨로. 참·거짓은 **그 언어의 표기**로 보여야 한다. */
export function wantText(value: FundValue, spell: { yes: string; no: string }): string {
  switch (value.t) {
    case 'bool': return value.v ? spell.yes : spell.no;
    case 'string': return JSON.stringify(value.v);
    // `compile-error`·`unspecified` 는 `event` 와 같은 모양이다 — 이름이 곧 답이다 (S12 · 문서 §13).
    case 'event': case 'compile-error': case 'unspecified': return value.name;
    default: return value.v;
  }
}

/** 과제 하나에 언어 하나를 입힌다. */
export function toBuildItem(task: BuildTask, lang: BuildLang): BuildItem | null {
  const value = task.want(lang);
  if (value === null) return null;
  const d = FUND_DIALECTS[lang];
  const want = wantText(value, d.spell);
  return {
    id: `${task.id}:${lang}`,
    taskId: task.id,
    lang,
    q: t(task.qKey, { want, lang: d.name }),
    hint: t('drill.buildHint', { must: task.must.join(', '), want }),
    expected: value,
    want,
    must: task.must,
    spell: d.spell,
    needs: task.needs,
    grammar: SHELL[lang].grammar,
    langName: SHELL[lang].name,
  };
}

/** 이 언어에서 설 수 있는 `build` 판 전부. */
export function buildBuildItems(lang: BuildLang): BuildItem[] {
  return TASKS.map((task) => toBuildItem(task, lang)).filter((x): x is BuildItem => x !== null);
}

/** 이 형식이 실제로 굽히는 0부 개념 전부 — 센서스가 이 값을 센다 (D181 의 태도). */
export function buildConcepts(): string[] {
  return [...new Set(TASKS.flatMap((x) => x.needs))].sort();
}
