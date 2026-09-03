/**
 * 2단계 유지 집합 (04 §3.2). 못박힌 것은 하나다 — 목업 `T1.original` 20줄에
 * `keepSet` 을 걸면 `T1.show2` 가 그대로 나와야 한다 (§3.2 마지막 문장).
 *
 * 원본 20줄은 여기에 그대로 적는다. `design/**` 은 목업이고 린트·빌드 대상이 아니라
 * import 경로가 없다 — 화면(05)이 옮겨 심을 때도 손으로 옮긴다.
 */
import { describe, expect, test } from 'vitest';

import { keepKinds, keepSet, placeholderWidth } from './t1-mask.js';

/** `design/src/ink/data.js` 의 `T1.original`. */
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

/** `design/src/ink/data.js` 의 `T1.show2`. */
const SHOW2 = [0, 1, 5, 6, 9, 10, 11, 12, 17, 18, 19];

describe('keepSet — ts/js(x)', () => {
  test('목업 LoginForm 20줄이 show2 를 그대로 낸다', () => {
    expect(keepSet(LOGIN_FORM, 'typescript')).toStrictEqual(SHOW2);
  });

  test('tsx·javascript 문법 키도 같은 표를 쓴다 (04 §3.2 첫 열이 한 칸)', () => {
    expect(keepSet(LOGIN_FORM, 'tsx')).toStrictEqual(SHOW2);
    expect(keepSet(LOGIN_FORM, 'javascript')).toStrictEqual(SHOW2);
  });

  test('유지 종류가 표의 다섯 종으로 갈린다', () => {
    expect(keepKinds(LOGIN_FORM, 'typescript')).toStrictEqual([
      'comment', 'signature', null, null, null, 'blank', 'signature', null, null, 'close',
      'blank', 'open', 'open', null, null, null, null, 'close', 'close', 'close',
    ]);
  });

  test('잎 JSX 는 남지 않는다 — 자기 닫힘·텍스트 있는 태그·표현식 줄', () => {
    const leaves = [
      '      <input value={email} />',
      '      <button disabled={pending}>로그인</button>',
      '      {error && <p className="err">{error}</p>}',
    ];
    expect(keepSet(leaves, 'typescript')).toStrictEqual([]);
  });

  test('JSX 루트는 `return (` 바로 다음 줄일 때만 남는다', () => {
    expect(keepSet(['  return (', '    <form>'], 'typescript')).toStrictEqual([0, 1]);
    // `return (` 가 없으면 같은 줄도 잎이다.
    expect(keepSet(['  const x = 1', '    <form>'], 'typescript')).toStrictEqual([]);
  });

  test('흐름 제어는 시그니처가 아니다', () => {
    const body = ['  if (!res.ok) {', '  for (const x of xs) {', '  } catch (e) {'];
    expect(keepSet(body, 'typescript')).toStrictEqual([]);
  });

  test('화살표 함수 선언은 시그니처, 화살표를 인자로 넘기는 호출은 아니다', () => {
    expect(keepSet(['const onKey = (e: KeyEvent) => {'], 'typescript')).toStrictEqual([0]);
    expect(keepSet(["  const [v, setV] = useState('')"], 'typescript')).toStrictEqual([]);
    expect(keepSet(['  const t = (a + b)'], 'typescript')).toStrictEqual([]);
  });

  test('클래스 메서드도 중첩 시그니처로 남는다', () => {
    const cls = [
      'export class Store {',
      '  private items: Item[] = []',
      '  async load(id: number): Promise<void> {',
      '    this.items = await fetchItems(id)',
      '  }',
      '}',
    ];
    expect(keepSet(cls, 'typescript')).toStrictEqual([0, 2, 4, 5]);
  });
});

describe('keepSet — py · go · rs · 폴백', () => {
  test('py — def·class·데코레이터·docstring·빈 줄. 닫힘 줄은 없다', () => {
    const py = [
      '@dataclass',
      'class Cart:',
      '    """장바구니 한 개.',
      '',
      '    합계는 항목 목록에서 파생한다.',
      '    """',
      '',
      '    def total(self) -> int:',
      '        # 세금은 뺀다',
      '        return sum(i.price for i in self.items)',
    ];
    expect(keepSet(py, 'python')).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('go — func 행과 닫힘 `}` 행', () => {
    const go = [
      'func Load(id int) (*Item, error) {',
      '\titem, err := repo.Find(id)',
      '\tif err != nil {',
      '\t\treturn nil, err',
      '\t}',
      '\treturn item, nil',
      '}',
    ];
    expect(keepSet(go, 'go')).toStrictEqual([0, 4, 6]);
  });

  test('rs — 속성·fn·impl 행과 닫힘 행', () => {
    const rs = [
      '#[derive(Debug)]',
      'pub struct Cart { items: Vec<Item> }',
      '',
      'impl Cart {',
      '    pub fn total(&self) -> u32 {',
      '        self.items.iter().map(|i| i.price).sum()',
      '    }',
      '}',
    ];
    expect(keepSet(rs, 'rust')).toStrictEqual([0, 2, 3, 4, 6, 7]);
  });

  test('모르는 문법은 폴백 열 — 선언 접두·`return (`·닫힘 정규식', () => {
    const other = [
      '# 합계',
      'func total(items):',
      '  x = 0',
      '  return (',
      '    x',
      '  )',
      'end',
    ];
    expect(keepSet(other, 'ruby')).toStrictEqual([0, 1, 3, 5]);
  });
});

describe('placeholderWidth', () => {
  test('목업 공식 min(30, max(4, 트림길이 · 0.56)) 그대로', () => {
    expect(placeholderWidth('    e.preventDefault()')).toBeCloseTo(18 * 0.56, 10);
    expect(placeholderWidth('  x')).toBe(4);          // 1 · 0.56 = 0.56 → 하한 4
    expect(placeholderWidth('a'.repeat(80))).toBe(30); // 44.8 → 상한 30
  });
});
