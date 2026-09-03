/**
 * T1 생성기 골든 (04 §3 · §9). 목업 `design/src/ink/data.js` 의 `T1` 판을 손으로 만든
 * 블록 후보 + 번들 사전으로 다시 만들어 본다.
 *
 * 왜 게이트에 쓸 사전 항목은 번들에 없다 — `why_gate` 는 04 §6 이 03 스키마에 **추가
 * 요청**한 필드이고 아직 어느 개념도 채우지 않았다. 그래서 여기서 `conceptSchema` 로
 * 하나를 만들어 넣는다. 스키마를 거치므로 「사전에 들어갈 수 있는 모양」임이 함께 검증된다.
 */
import { describe, expect, test } from 'vitest';
import { conceptSchema, loadDict } from '@chickadee/dictionary';
import type { Concept } from '@chickadee/dictionary';
import { cardPayloadSchema } from '@chickadee/store-sql';

import { contentHash } from './hash.js';
import { GEN_VERSION } from './payload.js';
import { generateT1, GENERIC_WHY_HELP, GENERIC_WHY_Q } from './t1.js';
import { isT1Card } from './t1-types.js';
import type { BlockCandidate, T1Card, T1Request } from './t1-types.js';

/**
 * 목업 `design/src/ink/data.js` 의 `T1.original` 20줄. `design/**` 은 린트·빌드 대상이
 * 아니라(eslint ignores) import 경로가 없다 — 05 가 화면을 옮겨 심을 때처럼 손으로 옮긴다.
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
/** 목업 `T1.show2`. */
const SHOW2 = [0, 1, 5, 6, 9, 10, 11, 12, 17, 18, 19];

const dict = loadDict({ dependencies: ['react'] });

/** 04 §6 ① 이 요구하는 사전 항목. 목업 `T1.why` 의 문항을 옮겼다. */
const PREVENT_DEFAULT: Concept = conceptSchema.parse({
  schema: 1,
  id: 'ts/prevent-default',
  name: { ko: '기본 동작 막기', en: 'preventDefault' },
  token: 'preventDefault',
  difficulty: 5,
  essential: true,
  dict: { one_liner: '<code>preventDefault</code> 는 이벤트의 기본 동작을 막는다.', why: '왜 필요한가' },
  rule: '이벤트의 기본 동작을 막는다',
  ok: '기본 동작이 막혔다',
  why_gate: {
    q: '{{site.line}}행 <code>e.preventDefault()</code> 는 왜 필요할까요?',
    choices: [
      { t: '브라우저가 폼을 제출하며 <b>페이지를 새로 고치는 기본 동작</b>을 막으려고', ok: true, fb: '맞습니다.' },
      { t: '로그인 버튼을 두 번 누르지 못하게 하려고', ok: false, fb: '그건 <code>disabled={pending}</code> 이 합니다.' },
      { t: '입력값을 비우려고', ok: false, fb: '입력값은 상태 갱신으로 비웁니다.' },
    ],
  },
});

const CONCEPTS: ReadonlyMap<string, Concept> =
  new Map([...dict.concepts, [PREVENT_DEFAULT.id, PREVENT_DEFAULT]]);
const ESSENTIAL = new Set([...(dict.langs.get('ts')?.essential ?? []), PREVENT_DEFAULT.id]);

function candidate(over: Partial<BlockCandidate> = {}): BlockCandidate {
  return {
    blockId: 42, fileId: 7, path: 'src/features/auth/LoginForm.tsx', rev: null,
    name: 'LoginForm', kind: 'function', lineStart: 1, lineEnd: 20, textHash: 'block-hash',
    lastCommitAt: 1_700_000_000_000,
    concepts: [
      { conceptId: 'ts/const-declaration', layer: 3, siteCount: 2, siteId: 11 },
      { conceptId: 'ts/prevent-default', layer: 2, siteCount: 1, siteId: 12 },
      { conceptId: 'react/functional-state-update', layer: 2, siteCount: 1, siteId: 13 },
    ],
    lines: [...LOGIN_FORM],
    ...over,
  };
}

function request(over: Partial<T1Request> = {}): T1Request {
  return {
    repoId: 1, dictVersion: '0.1.0', concepts: CONCEPTS, essential: ESSENTIAL,
    grammar: 'typescript', candidates: [candidate()], stage: 2, ...over,
  };
}

function card(req: T1Request): T1Card {
  const out = generateT1(req);
  if (!isT1Card(out)) throw new Error(`판이 없다: ${out.reason}`);
  return out;
}

describe('generateT1 — 목업 T1 판', () => {
  test('payload 가 02 §8.2 의 t1 변형이다 — zod 가 정본', () => {
    expect(() => cardPayloadSchema.parse(card(request()).payload)).not.toThrow();
  });

  test('file · fn · original · show2 가 목업과 같다', () => {
    const { payload } = card(request());
    expect(payload.track).toBe('t1');
    expect(payload.kind).toBe('transcribe');
    expect(payload.file).toBe('src/features/auth/LoginForm.tsx');
    expect(payload.fn).toBe('LoginForm()');
    expect(payload.original).toStrictEqual(LOGIN_FORM);
    expect(payload.show2).toStrictEqual(SHOW2);
  });

  test('대표 개념은 D27 — 필수 문법 중 difficulty 최고, 나머지는 부수', () => {
    const out = card(request());
    expect(out.conceptId).toBe('ts/prevent-default');
    expect(out.secondary).toStrictEqual(['react/functional-state-update', 'ts/const-declaration']);
    expect(out.blockId).toBe(42);
    expect(out.fileId).toBe(7);
  });

  test('왜 게이트 ① — 사전 why_gate 를 렌더해 보기 3개, line 은 0-based 원본 색인', () => {
    const { why } = card(request()).payload;
    expect(why.line).toBe(7);
    expect(LOGIN_FORM[why.line]).toBe('    e.preventDefault()');
    // `{{site.line}}` 은 파일 줄 번호(1-based) 다 — 목업의 「8행」과 같다.
    expect(why.q).toBe('8행 <code>e.preventDefault()</code> 는 왜 필요할까요?');
    expect(why.choices).toHaveLength(3);
    expect(why.choices.filter((c) => c.ok)).toHaveLength(1);
    // `help` 가 없는 사전 항목은 일반 안내문을 쓴다.
    expect(why.help).toBe(GENERIC_WHY_HELP);
  });

  test('왜 게이트 ④ — why_gate 가 없으면 일반 템플릿, 보기는 0개', () => {
    const plain = request({ concepts: dict.concepts, essential: new Set(dict.langs.get('ts')?.essential ?? []) });
    const { why } = card(plain).payload;
    expect(why.q).toBe(GENERIC_WHY_Q);
    expect(why.choices).toStrictEqual([]);
    // 첫 지워지는 줄 = 첫 비-시그니처 문장 (04 §6 ④).
    expect(why.line).toBe(2);
  });

  test('왜 게이트 — choices 는 3개 아니면 0개다 (grading 의 출처 구분)', () => {
    for (const req of [request(), request({ concepts: dict.concepts, essential: new Set(dict.langs.get('ts')?.essential ?? []) })]) {
      expect([0, 3]).toContain(card(req).payload.why.choices.length);
    }
  });

  test('사전 문항이 이 블록에 없는 변수를 쓰면 일반 템플릿으로 내려간다', () => {
    const needsPick = conceptSchema.parse({
      ...PREVENT_DEFAULT, why_gate: { ...PREVENT_DEFAULT.why_gate, q: '{{pick.1}} 는 왜 필요할까요?' },
    });
    const { why } = card(request({
      concepts: new Map([...dict.concepts, [needsPick.id, needsPick]]),
    })).payload;
    expect(why.q).toBe(GENERIC_WHY_Q);
    expect(why.choices).toStrictEqual([]);
  });

  test('spec 은 3단계용 스펙 카드 — 시그니처 + mustHold', () => {
    const { spec } = card(request());
    expect(spec.signature).toStrictEqual(['export function LoginForm() {']);
    expect(spec.mustHold.length).toBeGreaterThan(0);
    expect(new Set(spec.mustHold.map((h) => h.source))).toStrictEqual(new Set(['dict', 'ast']));
  });

  test('whyOwn 을 주면 ①사용자 문장이 맨 위, 나머지는 3개', () => {
    const { spec } = card(request({ whyOwn: ['제출은 한 번만 보낸다'] }));
    expect(spec.mustHold[0]).toStrictEqual({
      text: '제출은 한 번만 보낸다', source: 'user', anchor: [],
    });
    expect(spec.mustHold).toHaveLength(4);
  });

  test('contentHash 는 대표 개념 · transcribe · 대표 Site · 페이로드로 정해진다', () => {
    const out = card(request());
    expect(out.contentHash).toBe(contentHash({
      conceptId: 'ts/prevent-default', kind: 'transcribe', siteId: 12,
      genVersion: GEN_VERSION, payload: out.payload,
    }));
  });

  test('결정성 — 같은 입력에 같은 카드 (04 §9)', () => {
    expect(generateT1(request())).toStrictEqual(generateT1(request()));
  });

  test('개념이 바뀌면 다른 카드다 — 같은 블록도 대표 Site 가 해시에 든다', () => {
    const a = card(request());
    const b = card(request({
      candidates: [candidate({
        concepts: [{ conceptId: 'ts/prevent-default', layer: 2, siteCount: 1, siteId: 99 }],
      })],
    }));
    expect(b.contentHash).not.toBe(a.contentHash);
  });
});

describe('generateT1 — 판 없음', () => {
  test('후보가 없으면 사유가 붙는다', () => {
    const out = generateT1(request({ candidates: [] }));
    expect(out).toStrictEqual({ noPlate: true, reason: '리포에 필사할 블록 후보가 없다' });
  });

  test('전부 탈락하면 가장 자주 나온 사유를 낸다', () => {
    const out = generateT1(request({
      candidates: [
        candidate({ blockId: 1, lines: ['a'] }),
        candidate({ blockId: 2, lines: ['a', 'b'] }),
        candidate({ blockId: 3, lines: Array.from({ length: 30 }, () => 'x') }),
      ],
      stage: 1,
    }));
    expect(out).toStrictEqual({ noPlate: true, reason: '1줄 — 필사 블록은 12~40줄이다' });
  });

  test('대표 개념이 없는 후보는 건너뛰고 다음 후보를 쓴다', () => {
    const out = card(request({
      candidates: [
        candidate({ blockId: 1, concepts: [{ conceptId: 'ts/array-foreach', layer: 2, siteCount: 1, siteId: 5 }] }),
        candidate({ blockId: 2 }),
      ],
    }));
    expect(out.blockId).toBe(2);
  });

  test('이름 없는 블록은 파일명으로 부른다', () => {
    const out = card(request({ candidates: [candidate({ name: null, kind: 'file' })] }));
    expect(out.payload.fn).toBe('LoginForm.tsx');
  });
});
