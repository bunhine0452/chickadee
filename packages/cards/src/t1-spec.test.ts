/**
 * 3단계 스펙 카드 (04 §3.3). 확인하는 것 셋 — 출처 우선순위, ①이 있을 때의 3개 제한,
 * ③휴리스틱이 근거 없는 문장을 만들지 않는가.
 */
import { describe, expect, test } from 'vitest';
import { loadDict } from '@chickadee/dictionary';

import { buildSpec, EXTRA_LIMIT } from './t1-spec.js';
import type { BlockConcept } from './t1-types.js';

const dict = loadDict({ dependencies: ['react'] });

/**
 * 목업 `design/src/ink/data.js` 의 `T1.original` 20줄. `design/**` 은 린트·빌드 대상이
 * 아니라(eslint ignores) import 경로가 없다 — 05 가 화면을 옮겨 심을 때처럼 손으로 옮긴다.
 * 테스트 파일마다 제 몫을 들고 있는 것은 이 20줄이 **바깥 목업에 못박힌 입력**이라
 * 파일 하나만 보고 무엇을 재는지 알아야 하기 때문이다.
 */
const LOGIN_FORM = [
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

const concepts: BlockConcept[] = [
  { conceptId: 'ts/const-declaration', layer: 3, siteCount: 2, siteId: 11 },
  { conceptId: 'react/functional-state-update', layer: 2, siteCount: 1, siteId: 13 },
];

const spec = (over: Partial<Parameters<typeof buildSpec>[0]> = {}) => buildSpec({
  lines: LOGIN_FORM, grammar: 'typescript', concepts, dict: dict.concepts,
  path: 'src/features/auth/LoginForm.tsx', ...over,
});

const textsOf = (source: 'user' | 'dict' | 'ast') =>
  spec().mustHold.filter((h) => h.source === source).map((h) => h.text);

describe('buildSpec', () => {
  test('signature 는 시그니처 범위만 — 앞머리 주석은 들어가지 않는다', () => {
    expect(spec().signature).toStrictEqual(['export function LoginForm() {']);
  });

  test('②사전 층은 블록 안 개념의 one_liner 를 렌더한 최종 문자열이다 (D74)', () => {
    const one = dict.concepts.get('ts/const-declaration')?.dict.one_liner;
    expect(one).toBeDefined();
    expect(textsOf('dict')).toContain(one);
    // `const` 가 보이는 세 줄을 짚는다.
    const held = spec().mustHold.find((h) => h.text === one);
    expect(held?.anchor).toStrictEqual([2, 3, 4]);
  });

  test('③휴리스틱 — 외부 호출은 블록 안에서 묶이지 않은 이름만', () => {
    // `submit` 은 2행에서 구조 분해로 묶이므로 외부 호출이 아니다.
    expect(textsOf('ast')).toContain('<code>useLogin</code> · <code>useState</code> 를 부른다');
  });

  test('③휴리스틱 — 지역 변수 수와 반환 루트', () => {
    const ast = textsOf('ast');
    expect(ast.some((t) => t.startsWith('지역 변수 7개를 선언한다'))).toBe(true);
    expect(ast).toContain('<code>&lt;form&gt;</code> 을 루트로 돌려준다');
  });

  test('③휴리스틱 — 조기 반환이 없으면 그 문장은 없다', () => {
    expect(textsOf('ast').some((t) => t.includes('조기 반환'))).toBe(false);
  });

  test('③휴리스틱 — 조기 반환은 본문 최상위보다 깊은 return 을 센다', () => {
    const guarded = [
      'export function load(id: number) {',
      '  if (id < 0) {',
      '    return null',
      '  }',
      '  if (!cache.has(id)) return fetchItem(id)',
      '  return cache.get(id)',
    ];
    const out = buildSpec({ lines: guarded, grammar: 'typescript', concepts: [], dict: dict.concepts });
    const early = out.mustHold.find((h) => h.text.includes('조기 반환'));
    expect(early?.text).toBe('조기 반환이 2군데 있다');
    expect(early?.anchor).toStrictEqual([2, 4]);
  });

  test('①사용자 문장이 있으면 맨 위에 오고 ②③은 3개까지만 보탠다', () => {
    const whyOwn = ['제출하면 서버로 한 번만 보낸다', '  ', '실패 메시지는 폼 아래에 남는다'];
    const out = spec({ whyOwn });
    expect(out.mustHold.slice(0, 2)).toStrictEqual([
      { text: '제출하면 서버로 한 번만 보낸다', source: 'user', anchor: [] },
      { text: '실패 메시지는 폼 아래에 남는다', source: 'user', anchor: [] },
    ]);
    expect(out.mustHold).toHaveLength(2 + EXTRA_LIMIT);
    // 사용자 문장이 없을 때는 제한이 없다.
    expect(spec().mustHold.length).toBeGreaterThan(EXTRA_LIMIT);
  });

  test('사전에 없는 개념은 ②층에서 빠진다', () => {
    const out = buildSpec({
      lines: LOGIN_FORM, grammar: 'typescript', dict: dict.concepts,
      concepts: [{ conceptId: 'ts/not-in-dict', layer: 0, siteCount: 1, siteId: 1 }],
    });
    expect(out.mustHold.filter((h) => h.source === 'dict')).toStrictEqual([]);
  });

  test('조각 카드의 헤더는 그대로 실린다', () => {
    expect(spec({ header: '// …이어서' }).header).toBe('// …이어서');
    expect(spec().header).toBeUndefined();
  });
});
