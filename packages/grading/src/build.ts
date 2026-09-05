/**
 * `build` 형식의 채점 — **식을 돌려서 나온 값으로** (D187 ① · `fundamentals.md` §2).
 *
 * 유보였던 형식이 서는 자리다. 유보의 사유가 「인정 집합은 반드시 불완전하다」였으므로,
 * 이 채점기는 **인정 집합을 안 쓴다** — 학습자의 식을 그 언어의 프로그램으로 감싸 실제로
 * 찍어 보고, 찍힌 글자를 `value` 형식과 **같은 규칙**으로 견준다(`gradeValue` 재사용).
 * 그래서 `7 / 2.0` 이든 `(double) 7 / 2` 든 `7.0 / 2` 든 다 맞는 답이다.
 *
 * ## 실행 앞에 순수한 문 셋이 있다
 *
 * 돌리기 전에 세 가지를 본다. 프로세스를 아끼려는 것이 아니라 **그 셋이 오답의 종류가
 * 다르기 때문**이다.
 *
 * ① **빈칸** — 아무것도 안 적었다.
 * ② **답을 그대로 적었다** — `3.5` 라고만 쓰면 그 판은 아무것도 안 묻는다. 식을 쓰라고
 *    했는데 값을 적은 것이고, 실행하면 통과해 버리므로 **실행 앞에서** 막아야 한다.
 * ③ **줘야 할 수를 안 썼다** — 「7과 2로」인데 7이 없으면 그것도 다른 문제를 푼 것이다.
 *
 * 셋 다 「틀렸다」가 아니라 **무엇을 하라는 물음이었는지**를 되짚는 진단이 붙는다 (정본 §3-2).
 *
 * ## 문구는 i18n 이 댄다
 *
 * `MISS_MESSAGE_KEY`(값 적기)와 같은 규약이다 — 채점기는 키만 고르고 문장은 `packages/i18n`
 * 이 갖는다.
 */
import { gradeValue, type FundValue } from './fundamentals.js';
import type { RunnerReason } from './runner.js';
import { runStdin, type StdinLang } from './stdin-runner.js';

/** 왜 틀렸나. **이 값이 처방을 고른다** (`fundamentals.md` §5 의 표와 같은 자리). */
export type BuildMiss =
  /** 아무것도 안 적었다. */
  | 'blank'
  /** 식이 아니라 값을 적었다 — `3.5`. */
  | 'literal'
  /** 주어진 수를 안 썼다. */
  | 'missing-token'
  /** 식이 그 언어의 문법이 아니다. */
  | 'compile-error'
  /** 돌다가 멈췄다 — 0 나눗셈·넘침 트랩. */
  | 'crashed'
  /** 상한 안에 안 끝났다. */
  | 'timeout'
  /** 값이 다르다. */
  | 'value';

export const BUILD_MESSAGE_KEY: Readonly<Record<BuildMiss, string>> = {
  blank: 'drill.buildMissBlank',
  literal: 'drill.buildMissLiteral',
  'missing-token': 'drill.buildMissToken',
  'compile-error': 'drill.buildMissCompile',
  crashed: 'drill.buildMissCrashed',
  timeout: 'drill.buildMissTimeout',
  value: 'drill.buildMissValue',
};

export interface BuildGradeInput {
  lang: StdinLang;
  expected: FundValue;
  /** 식에 반드시 들어가야 하는 토막. */
  must: readonly string[];
  /** 그 언어의 참·거짓 표기. */
  spell: { yes: string; no: string };
}

export interface BuildVerdict {
  ok: boolean;
  /** 식 하나라 0 아니면 100 이다. 부분 점수는 `table` 형식의 것이다. */
  pct: number;
  miss: BuildMiss | null;
  /** {@link BUILD_MESSAGE_KEY} 의 값. 정답이면 `null`. */
  diagKey: string | null;
  /** 프로그램이 찍은 글. 안 돌렸거나 못 돌렸으면 `null`. */
  printed: string | null;
  /** 안 쓴 토막들. `missing-token` 일 때만 찬다. */
  missing: readonly string[];
  /** 러너를 못 켠 사유. 있으면 이 판은 **게이트 밖**이고 오답이 아니다. */
  reason: RunnerReason | null;
  /** 실행기가 남긴 글 — 컴파일 오류와 예외가 여기 있다. */
  log: string;
}

/** 어느 언어에서든 「값 하나만 적은 것」으로 읽히는 모양. */
const BARE = /^[+-]?(?:\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?[fFdDlL]?|\.\d+|0[xXbBoO][0-9a-fA-F_]+)$/u;
const QUOTED = /^(["'`]).*\1$/su;
const TRUTHY = new Set(['true', 'True', 'TRUE', 'false', 'False', 'FALSE']);

/** 토막 하나가 식 안에 **낱말로** 들어 있나. `7` 이 `27` 에 걸리면 안 된다. */
export function usesToken(source: string, token: string): boolean {
  const at = source.indexOf(token);
  if (at < 0) return false;
  const word = /[A-Za-z0-9_.]/u;
  for (let i = 0; i >= 0; i = source.indexOf(token, i + 1)) {
    const before = source[i - 1];
    const after = source[i + token.length];
    const left = before === undefined || !word.test(before);
    const right = after === undefined || !word.test(after);
    if (left && right) return true;
  }
  return false;
}

/**
 * 실행 앞의 문 셋. 통과하면 `null` 이고, 그때만 프로세스가 뜬다.
 *
 * **순수 함수다** — 시험이 러너 없이 이 셋을 다 밟을 수 있어야 하고, 화면도 타이핑 중에
 * 「아직 7을 안 썼습니다」를 낼 수 있어야 한다.
 */
export function checkExpr(input: BuildGradeInput, source: string): { miss: BuildMiss; missing: string[] } | null {
  const s = source.trim();
  if (s === '') return { miss: 'blank', missing: [] };
  if (BARE.test(s.replace(/\s+/gu, '')) || QUOTED.test(s) || TRUTHY.has(s)) {
    return { miss: 'literal', missing: [] };
  }
  const missing = input.must.filter((token) => !usesToken(s, token));
  if (missing.length > 0) return { miss: 'missing-token', missing };
  return null;
}

/** 식 하나를 그 언어의 프로그램 한 장으로. **여기가 언어 지식의 전부**다. */
export function wrapExpr(lang: StdinLang, expr: string): string {
  const one = expr.trim();
  if (lang === 'py') return `print(${one})\n`;
  if (lang === 'ts') return `console.log(${one});\n`;
  return [
    'public class Main {',
    '    public static void main(String[] args) {',
    `        System.out.println(${one});`,
    '    }',
    '}',
    '',
  ].join('\n');
}

const verdict = (over: Partial<BuildVerdict> & Pick<BuildVerdict, 'ok'>): BuildVerdict => ({
  pct: over.ok ? 100 : 0,
  miss: null,
  diagKey: null,
  printed: null,
  missing: [],
  reason: null,
  log: '',
  ...over,
});

/**
 * 식 하나의 채점. 문 셋을 지나면 실제로 돌린다 — 케이스는 하나이고 표준 입력은 비어 있다.
 *
 * 기대 글자를 `runStdin` 에 안 넘긴다(`stdout: ''`). 「찍힌 글이 이 글자와 같은가」가 아니라
 * 「찍힌 글이 그 **값**인가」를 물어야 하기 때문이다 — `3.5` 와 `3.50` 은 같은 double 이고
 * 그 판정은 `gradeValue` 가 이미 안다.
 */
export async function gradeBuild(input: BuildGradeInput, source: string): Promise<BuildVerdict> {
  const gate = checkExpr(input, source);
  if (gate !== null) {
    return verdict({ ok: false, miss: gate.miss, diagKey: BUILD_MESSAGE_KEY[gate.miss], missing: gate.missing });
  }

  const run = await runStdin({
    lang: input.lang,
    source: wrapExpr(input.lang, source),
    cases: [{ name: 'build', stdin: '', stdout: '' }],
  });

  if (run.status === 'no-runner') {
    return verdict({ ok: false, pct: 0, reason: run.reason ?? null, log: run.log });
  }
  if (run.status === 'compile-error') {
    return verdict({ ok: false, miss: 'compile-error', diagKey: BUILD_MESSAGE_KEY['compile-error'], log: run.log });
  }
  if (run.status === 'timeout') {
    return verdict({ ok: false, miss: 'timeout', diagKey: BUILD_MESSAGE_KEY.timeout, log: run.log });
  }
  const one = run.cases[0];
  if (one === undefined) {
    return verdict({ ok: false, reason: 'not-detected', log: run.log });
  }
  if (one.stderr.trim() !== '') {
    // 돌긴 돌았는데 예외가 났다 — 0 나눗셈과 넘침 트랩이 여기다. 답이 아니라 **사건**이
    // 나온 것이고, 그것도 이 층이 가르치는 것 중 하나다.
    return verdict({ ok: false, miss: 'crashed', diagKey: BUILD_MESSAGE_KEY.crashed, printed: one.actual.trim(), log: one.stderr.trim() });
  }

  const printed = one.actual.trim();
  const value = gradeValue(
    { expected: input.expected, spell: input.spell, siblings: [], ideal: null, fold: [] },
    printed,
  );
  if (value.ok) return verdict({ ok: true, printed });
  return verdict({ ok: false, miss: 'value', diagKey: BUILD_MESSAGE_KEY.value, printed });
}
