/**
 * T1 판정 엔진 단위 테스트 (04 §4~§6).
 *
 * 골든(04 §9)은 규칙이 **끝에서** 맞는지를 보고, 여기서는 단계마다 맞는지를 본다 —
 * 골든 하나가 깨질 때 어느 단계가 깨졌는지 이 파일이 가른다.
 *
 * 목업 예시 답안(`design/src/ink/data.js` 의 `T1.sample`)을 채점하는 것이 M3 의
 * 「끝났다는 증거」 한 줄이라 그것도 여기 있다. 원본 20줄은 목업을 import 하지 않고
 * 그대로 적었다 — `design/**` 은 앱의 의존이 아니다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { align } from './t1-align.js';
import { CATALOG, draftAppeal, issueUrl, patternKey, shapeSignature, suggest } from './t1-appeal.js';
import { compareLine, evalLine, indentWidth, normalizeQuotes, sim } from './t1-line.js';
import { buildProt, freeIdents, origIdents } from './t1-prot.js';
import { gradeT1, nextStage, verdictOf } from './t1-result.js';
import { checkWhy, draftWhy, hasWord, pickQuestion } from './t1-why.js';

/** 목업 `T1.original` — LoginForm 20줄. */
const ORIGINAL = [
  '// 로그인 폼. 제출하면 useLogin 의 submit 을 부르고, 실패 메시지는 폼 아래에 보여준다',
  'export function LoginForm() {',
  '  const { submit, error, pending } = useLogin()',
  "  const [email, setEmail] = useState('')",
  "  const [password, setPassword] = useState('')",
  '',
  '  async function onSubmit(e: FormEvent) {',
  '    e.preventDefault()',
  '    await submit(email, password)',
  '  }',
  '',
  '  return (',
  '    <form onSubmit={onSubmit}>',
  '      <input value={email} onChange={(e) => setEmail(e.target.value)} />',
  '      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />',
  '      <button disabled={pending}>로그인</button>',
  '      {error && <p className="err">{error}</p>}',
  '    </form>',
  '  )',
  '}',
];

/** 목업 `T1.sample` — 동등(따옴표·이름 치환)과 어긋남(맞바꿈·누락)이 한 번씩 든 답안. */
const SAMPLE = [
  '// 로그인 폼. 제출하면 useLogin 의 submit 을 부르고, 실패 메시지는 폼 아래에 보여준다',
  'export function LoginForm() {',
  '  const { submit, error, pending } = useLogin();',
  '  const [email, setEmail] = useState("")',
  "  const [password, setPassword] = useState('')",
  '',
  '  async function onSubmit(ev: FormEvent) {',
  '    ev.preventDefault()',
  '    await submit(password, email)',
  '  }',
  '',
  '  return (',
  '    <form onSubmit={onSubmit}>',
  '      <input value={email} onChange={(e) => setEmail(e.target.value)} />',
  "      <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />",
  '      <button disabled={pending}>로그인</button>',
  '    </form>',
  '  )',
  '}',
];

const MODULE_DECLS = ['useLogin', 'useState', 'FormEvent'];
const prot = (): Set<string> =>
  buildProt({ original: ORIGINAL, grammar: 'tsx', moduleDecls: MODULE_DECLS });

const grade = (user: readonly string[]) =>
  gradeT1({
    blockId: 7,
    stage: 2,
    original: ORIGINAL,
    user,
    grammar: 'tsx',
    moduleDecls: MODULE_DECLS,
    peeks: 0,
    downgraded: false,
    clock: () => 0,
  });

describe('PROT (04 §4.4)', () => {
  const set = prot();

  test('속성 이름·타입 이름·import 된 이름은 못 바꾼다', () => {
    for (const name of ['preventDefault', 'value', 'target', 'FormEvent', 'useState', 'useLogin']) {
      expect(set.has(name), name).toBe(true);
    }
  });

  test('import 된 호출의 구조 분해 키도 못 바꾼다', () => {
    for (const name of ['submit', 'error', 'pending']) expect(set.has(name), name).toBe(true);
  });

  test('JSX 속성명·태그명은 못 바꾼다', () => {
    for (const name of ['onSubmit', 'onChange', 'className', 'form', 'input', 'button']) {
      expect(set.has(name), name).toBe(true);
    }
  });

  test('지역 이름은 바꿀 수 있다 — 그러지 않으면 치환 규칙 자체가 성립하지 않는다', () => {
    for (const name of ['email', 'password', 'setEmail', 'e']) {
      expect(set.has(name), name).toBe(false);
    }
  });

  test('ORIG 는 모듈 수준 이름까지 포함한다 (§4.3)', () => {
    const orig = origIdents({ original: ORIGINAL, grammar: 'tsx', moduleDecls: MODULE_DECLS });
    expect(orig.has('email')).toBe(true);
    expect(orig.has('useLogin')).toBe(true);
  });

  test('ANS 는 PROT 자리를 뺀다 — `.value` 의 value 가 「답안에 남은 이름」이 되면 안 된다', () => {
    const ans = freeIdents(['setEmail(e.target.value)'], prot());
    expect(ans.has('value')).toBe(false);
    expect(ans.has('setEmail')).toBe(true);
  });
});

describe('정규화 파이프라인 (04 §4.2)', () => {
  const set = prot();

  test('1 후행 공백 → exact', () => {
    expect(compareLine('const x = 1', 'const x = 1   ', set).status).toBe('exact');
  });

  test('2 주석 줄 — 문구는 비교하지 않는다', () => {
    const r = compareLine('// 한국어', '// english', set);
    expect(r.status).toBe('equiv');
    expect(r.reasons[0]?.code).toBe('COMMENT_TEXT');
  });

  test('2 한쪽만 주석이면 어긋남', () => {
    expect(compareLine('// a', 'const x = 1', set).reasons[0]?.code).toBe('COMMENT_MISSING');
    expect(compareLine('const x = 1', '// a', set).reasons[0]?.code).toBe('COMMENT_EXTRA');
  });

  test('3 줄 끝 주석은 떼고 본다. 문자열 안의 `//` 는 안 뗀다', () => {
    const r = compareLine('const x = 1 // 설명', 'const x = 1', set);
    expect(r.status).toBe('equiv');
    expect(r.reasons.map((x) => x.code)).toContain('TRAILING_COMMENT');
    const url = compareLine("const u = 'https://a'", "const u = 'https://b'", set);
    expect(url.status).toBe('differ');
  });

  test('4 한쪽만 빈 줄 → BLANK_MISMATCH', () => {
    expect(compareLine('const x = 1', '', set).reasons[0]?.code).toBe('BLANK_MISMATCH');
  });

  test('5 들여쓰기는 사유만 남기고 계속한다', () => {
    const r = compareLine('  e.preventDefault()', 'e.preventDefault()', set);
    expect(r.status).toBe('equiv');
    expect(r.reasons.map((x) => x.code)).toStrictEqual(['INDENT']);
    expect(indentWidth('\t x')).toBe(3);
  });

  test('6·7 종결자와 따옴표', () => {
    expect(compareLine('f()', 'f();', set).reasons[0]?.code).toBe('TERMINATOR');
    expect(compareLine("f('')", 'f("")', set).reasons[0]?.code).toBe('QUOTE');
    // 안에 `"` 가 있으면 바꾸지 않는다 — 바꾸면 원래 같았던 짝이 어긋남이 된다.
    expect(normalizeQuotes(`x('say "hi"')`).changed).toBe(false);
  });

  test('8 토큰 열이 같으면 동등 — 다중문자 연산자는 한 토큰이다', () => {
    const r = compareLine('const p = a?.b', 'const p = a ?. b', set);
    expect(r.status).toBe('equiv');
    expect(r.reasons[0]?.code).toBe('WHITESPACE');
  });

  test('10 보호된 자리는 치환 후보가 아니다', () => {
    const r = compareLine('setEmail(e.target.value)', 'setEmail(e.target.val)', set);
    expect(r.status).toBe('differ');
    expect(r.reasons.at(-1)?.code).toBe('TOKEN_MISMATCH');
    expect(r.maps).toStrictEqual([]);
  });

  test('10 자유 식별자만 치환 후보로 모인다 (pending)', () => {
    const r = compareLine('  const t = a + b', '  const t = x + b', set);
    expect(r.status).toBe('pending');
    expect(r.maps).toStrictEqual([['a', 'x']]);
  });
});

describe('정렬 (04 §4.1)', () => {
  test('A 같은 줄 우선 — 밀림이 없으면 자리를 그대로 쓴다', () => {
    const a = align(ORIGINAL, SAMPLE);
    expect(a.usedNw).toBe(false);
    expect(a.pairs.slice(0, 5).map((p) => p.ui)).toStrictEqual([0, 1, 2, 3, 4]);
  });

  test('B 창 ±2 — 한 줄 끼워 넣은 것은 흡수한다', () => {
    const user = ['const noop = 0', ...ORIGINAL.slice(0, 5)];
    const a = align(ORIGINAL.slice(0, 5), user);
    expect(a.usedNw).toBe(false);
    // 원본 다섯 줄이 답안 1~5 로 한 칸 밀렸고, 끼운 줄만 `extra` 로 남는다.
    expect(a.pairs.map((p) => p.ui)).toStrictEqual([1, 2, 3, 4, 5]);
    expect(a.extra).toStrictEqual([0]);
  });

  test('C 세 줄 이상 밀리면 NW 가 받는다', () => {
    const user = ['// 1', '// 2', '// 3', '// 4', ...ORIGINAL];
    const a = align(ORIGINAL, user);
    expect(a.usedNw).toBe(true);
    expect(a.pairs.every((p) => p.ui >= 0)).toBe(true);
  });

  test('주석 줄끼리는 문구를 안 봐도 짝이 된다 — 04 §4.2 2단계의 전제다', () => {
    expect(sim('// 한국어 주석', '// english comment')).toBe(1);
    expect(sim('// a', 'const x = 1')).toBe(0);
  });
});

describe('전역 치환 3조건 + 검증 ④ (04 §4.3)', () => {
  test('일관된 치환은 동등이다', () => {
    const user = ORIGINAL.map((l) => l.replace(/\bemail\b/g, 'mail'));
    const r = grade(user);
    const row = r.rows.find((x) => x.oi === 3);
    expect(row?.status).toBe('equiv');
    expect(row?.reasons.map((x) => x.code)).toContain('RENAME');
  });

  test('③ 이름 맞바꿈은 어떤 규칙으로도 동등이 되지 않는다', () => {
    const user = [...ORIGINAL];
    user[8] = '    await submit(password, email)';
    const r = grade(user);
    const row = r.rows.find((x) => x.oi === 8);
    expect(row?.swap).toBe(true);
    expect(row?.reasons.map((x) => x.code)).toContain('SWAP');
    // 스왑이 있으면 백분율과 무관하게 진급이 막힌다 (04 §4.6).
    expect(r.pct).toBeGreaterThanOrEqual(r.passPct);
    expect(r.verdict).toBe('repeat-soft');
  });

  test('④ 한 줄만 바꾼 치환은 인정하지 않는다', () => {
    const user = [...ORIGINAL];
    user[3] = "  const [mail, setEmail] = useState('')";
    const row = grade(user).rows.find((x) => x.oi === 3);
    expect(row?.status).toBe('differ');
    expect(row?.reasons.map((x) => x.code)).toContain('RENAME_INCONSISTENT');
  });
});

describe('점수와 판정 (04 §4.6)', () => {
  test('분모는 비공백 줄이다 — 20줄 블록의 빈 줄 2개는 공짜가 아니다', () => {
    const r = grade(SAMPLE);
    expect(ORIGINAL.length).toBe(20);
    expect(r.total).toBe(18);
    expect(r.rows.filter((x) => x.oi >= 0)).toHaveLength(18);
  });

  test('목업 예시 답안 — 동등 넷과 어긋남 둘이 나온다', () => {
    const r = grade(SAMPLE);
    expect(r.n.missing).toBe(1); // 16행 `{error && …}` 를 안 썼다
    expect(r.rows.find((x) => x.oi === 16)?.status).toBe('missing');
    expect(r.rows.find((x) => x.oi === 8)?.swap).toBe(true);
    expect(r.rows.find((x) => x.oi === 2)?.reasons.map((x) => x.code)).toContain('TERMINATOR');
    expect(r.rows.find((x) => x.oi === 3)?.reasons.map((x) => x.code)).toContain('QUOTE');
    expect(r.rows.find((x) => x.oi === 14)?.reasons.map((x) => x.code)).toContain('QUOTE');
    // 이름 맞바꿈이 있으므로 진급은 막힌다.
    expect(r.verdict).toBe('repeat-soft');
  });

  test('소블록 완충 — 12줄은 83, 14줄부터 85, 아래로는 65 가 하한이다', () => {
    expect(verdictOf(83, 83, false)).toBe('advance');
    expect(verdictOf(84, 85, false)).toBe('repeat-soft');
    expect(verdictOf(40, 65, false)).toBe('repeat');
  });

  test('다음 단계는 진급에서만 오르고 3 이 상한이다 (02 §4)', () => {
    expect(nextStage(1, 'advance')).toBe(2);
    expect(nextStage(3, 'advance')).toBe(3);
    expect(nextStage(2, 'repeat-soft')).toBe(2);
  });

  test('완벽한 답안은 100 % 이고 진급이다', () => {
    const r = grade(ORIGINAL);
    expect(r.pct).toBe(100);
    expect(r.verdict).toBe('advance');
    expect(r.n.exact).toBe(18);
  });
});

describe('거터 (05 §8)', () => {
  const set = prot();

  test('줄을 벗어날 때 그 줄만 본다 — 창 밖의 원본과는 안 맞춰 본다', () => {
    expect(evalLine(3, "  const [email, setEmail] = useState('')", ORIGINAL, set)).toBe('exact');
    expect(evalLine(3, '  const [email, setEmail] = useState("")', ORIGINAL, set)).toBe('equiv');
    expect(evalLine(3, '  const zzz = 1', ORIGINAL, set)).toBe('differ');
    expect(evalLine(3, '   ', ORIGINAL, set)).toBe('');
  });

  test('치환 중인 줄을 어긋남으로 칠하지 않는다 — 전역 판정은 채점 때다', () => {
    expect(evalLine(3, "  const [mail, setMail] = useState('')", ORIGINAL, set)).toBe('equiv');
  });
});

describe('이의 (04 §5)', () => {
  test('형태 서명은 이름과 값을 지우고 모양만 남긴다', () => {
    expect(shapeSignature("const a = 'x'")).toBe(shapeSignature('const bbb = "yyy"'));
    expect(shapeSignature('a == b')).not.toBe(shapeSignature('a === b'));
  });

  test('patternKey 는 사유 순서에 기대지 않는다', () => {
    const one = patternKey({
      grammar: 'tsx',
      reasons: [{ code: 'INDENT' }, { code: 'TOKEN_COUNT' }],
      original: 'a', user: 'b',
    });
    const two = patternKey({
      grammar: 'tsx',
      reasons: [{ code: 'TOKEN_COUNT' }, { code: 'INDENT' }],
      original: 'a', user: 'b',
    });
    expect(one).toBe(two);
  });

  test('문법이 다르면 다른 규칙이다', () => {
    const base = { reasons: [{ code: 'TOKEN_COUNT' as const }], original: 'a', user: 'b' };
    expect(patternKey({ ...base, grammar: 'tsx' }))
      .not.toBe(patternKey({ ...base, grammar: 'python' }));
  });

  test('이의 초안의 줄 번호는 1-based 다 (02 `appeal.line_no`)', () => {
    const row = grade(SAMPLE).rows.find((x) => x.oi === 8);
    const draft = draftAppeal(row as NonNullable<typeof row>, ORIGINAL, SAMPLE, 'tsx');
    expect(draft.lineNo).toBe(9);
    expect(draft.autoVerdict).toBe('differ');
    expect(draft.reasons.some((r) => r.startsWith('SWAP'))).toBe(true);
  });

  test('3건이 모이면 켤 토글을 제안한다', () => {
    const groups = [{ patternKey: 'k', n: 3, reasons: ['TOKEN_COUNT'] }];
    expect(suggest(groups)[0]?.rules.length).toBeGreaterThan(0);
    expect(suggest([{ patternKey: 'k', n: 2, reasons: ['TOKEN_COUNT'] }])).toStrictEqual([]);
  });

  test('절대 동등이 될 수 없는 것은 제안하지 않는다', () => {
    expect(suggest([{ patternKey: 'k', n: 9, reasons: ['SWAP', 'TOKEN_COUNT'] }]))
      .toStrictEqual([]);
  });

  test('카탈로그는 다섯이고 전부 어느 사유를 올리는지 안다 (D89)', () => {
    expect(CATALOG).toHaveLength(5);
    for (const rule of CATALOG) expect(rule.promotes.length).toBeGreaterThan(0);
  });

  test('이슈 본문에 코드 두 줄은 기본으로 안 들어간다 (04 §5 · 06)', () => {
    const base = {
      repoSlug: 'bunhine0452/chickadee', grammar: 'tsx', reasons: ['TOKEN_COUNT'],
      patternKey: 'k', shapeOriginal: 'I=L', shapeUser: 'I=L', engineVersion: '1',
      dictVersion: 'ts@1.0.0', localCount: 3,
      originalText: "const secret = 'abc'", userText: "const secret = 'abc'",
    };
    expect(issueUrl(base)).not.toContain('secret');
    expect(issueUrl({ ...base, includeCode: true })).toContain('secret');
  });

  test('쿼리 키가 이슈 폼의 필드 id 와 같다 (06 §7.3)', () => {
    // GitHub 이슈 **폼**은 `body=` 를 무시하고 필드 id 로만 미리 채운다. 이름이 하나라도
    // 어긋나면 오류 없이 빈 칸으로 열리므로, 폼 파일을 읽어 대조한다.
    const form = readFileSync(
      join(process.cwd(), '.github/ISSUE_TEMPLATE/t1-appeal.yml'), 'utf8',
    );
    const ids = new Set([...form.matchAll(/^\s{4}id:\s*(\S+)/gm)].map((m) => m[1]));
    const url = new URL(issueUrl({
      repoSlug: 'bunhine0452/chickadee', grammar: 'tsx', reasons: ['TOKEN_COUNT'],
      patternKey: 'k', shapeOriginal: 'I=L', shapeUser: 'I=L', engineVersion: '1',
      dictVersion: 'ts@1.0.0', localCount: 3, includeCode: true,
      originalText: 'a', userText: 'b',
    }));
    expect(url.searchParams.get('template')).toBe('t1-appeal.yml');
    for (const key of url.searchParams.keys()) {
      if (key === 'template') continue;
      expect(ids, `이슈 폼에 없는 필드: ${key}`).toContain(key);
    }
  });
});

describe('왜 게이트 (04 §6)', () => {
  const payload = { line: 7, q: '', help: '', choices: [] };

  test('사전 문항이 있으면 그것이 최우선이다 (①)', () => {
    const withChoices = {
      line: 7,
      q: '8행은 왜 필요할까요?',
      help: '한 줄이면 됩니다.',
      choices: [
        { t: '기본 제출을 막는다', ok: true, fb: '맞습니다' },
        { t: '두 번 누르지 못하게', ok: false, fb: '아닙니다' },
        { t: '입력값을 비운다', ok: false, fb: '아닙니다' },
      ],
    };
    const q = pickQuestion({
      payload: withChoices, result: grade(SAMPLE), conceptId: 'ts/prevent-default',
    });
    expect(q.questionId).toBe('why_gate:ts/prevent-default');
    expect(q.choices).toHaveLength(3);
  });

  test('없으면 누락 행 → 첫 어긋남 행 → 첫 비-시그니처 문장 순이다 (②③④)', () => {
    const missing = pickQuestion({ payload, result: grade(SAMPLE), conceptId: 'c' });
    expect(missing.questionId).toBe('missing:17');

    const noMissing = [...ORIGINAL];
    noMissing[8] = '    await submit(password, email)';
    const differ = pickQuestion({ payload, result: grade(noMissing), conceptId: 'c' });
    expect(differ.questionId).toBe('differ:9');

    const clean = pickQuestion({
      payload, result: grade(ORIGINAL), conceptId: 'c', signatureLines: [0, 1],
    });
    expect(clean.questionId).toBe('generic');
    expect(clean.line).toBe(2);
  });

  test('검증 4조건 — 넷을 전부 통과해야 마칠 수 있다', () => {
    const orig = '    e.preventDefault()';
    expect(checkWhy('짧다', orig).ok).toBe(false);
    expect(checkWhy(orig, orig).ok).toBe(false);
    expect(checkWhy('e.preventDefault() 를 부른다', orig).ok).toBe(false);
    expect(checkWhy('!@#$%^&*()_+{}|', orig).ok).toBe(false);
    expect(checkWhy('브라우저가 폼을 보내며 새로 고치는 것을 막는다', orig).ok).toBe(true);
    expect(hasWord('가나')).toBe(true);
    expect(hasWord('a')).toBe(false);
  });

  test('코드포인트로 센다 — 이모지 다섯 개는 10자가 아니다', () => {
    expect(checkWhy('가나다라마바사아자차', '').message).toBe('10 / 10자');
    expect(checkWhy('🙂🙂🙂🙂🙂', '').ok).toBe(false);
  });

  test('저장 모양의 줄 번호는 1-based 이고 고른 보기의 정오가 실린다', () => {
    const q = pickQuestion({ payload, result: grade(SAMPLE), conceptId: 'c' });
    const draft = draftWhy(q, 7, '  자기 말 한 줄  ', null);
    expect(draft.lineNo).toBe(17);
    expect(draft.text).toBe('자기 말 한 줄');
    expect(draft.pickOk).toBeNull();
  });
});

describe('성능 예산 (04 §9)', () => {
  const set = prot();

  test('거터 한 줄 < 0.2 ms', () => {
    const line = '      <input value={email} onChange={(e) => setEmail(e.target.value)} />';
    const runs = 200;
    const started = performance.now();
    for (let i = 0; i < runs; i += 1) evalLine(13, line, ORIGINAL, set);
    const each = (performance.now() - started) / runs;
    expect(each, `${each.toFixed(3)} ms/줄`).toBeLessThan(0.2);
  });

  test('비교 엔진 20줄 < 20 ms · 40줄 < 35 ms', () => {
    const twenty = performance.now();
    grade(SAMPLE);
    const t20 = performance.now() - twenty;
    expect(t20, `20줄 ${t20.toFixed(2)} ms`).toBeLessThan(20);

    const big = [...ORIGINAL, ...ORIGINAL];
    const answer = [...SAMPLE, ...SAMPLE];
    const forty = performance.now();
    gradeT1({
      blockId: 1, stage: 2, original: big, user: answer, grammar: 'tsx',
      moduleDecls: MODULE_DECLS, peeks: 0, downgraded: false, clock: () => 0,
    });
    const t40 = performance.now() - forty;
    expect(t40, `40줄 ${t40.toFixed(2)} ms`).toBeLessThan(35);
  });
});
