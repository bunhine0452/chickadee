// @vitest-environment jsdom
/**
 * T1 판의 **키보드 완결** (정본 §3-8 · 05 §7).
 *
 * M3 인계 문서가 이 자리를 못박았다: Monaco 가 키를 공격적으로 먹으므로 T1 이 「고르기 →
 * Enter → Space」 관례에서 가장 쉽게 깨진다. Playwright 하네스는 M5(`m5-05-e2e-visual`)의
 * 것이라 여기서는 **브라우저 없이** 판 세 화면의 키를 고정한다.
 *
 * `ClonePad` 는 모의한다 — 진짜 Monaco 는 jsdom 에서 뜨지 않고(레이아웃·`ResizeObserver`),
 * 그 안의 키는 `components/t1/ClonePad.test.tsx` 가 따로 본다.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { Question, T1Result } from '@chickadee/grading';

vi.mock('../../components/t1/ClonePad.js', () => ({
  ClonePad: (props: { value: string }) => (
    <div className="editor">
      <textarea aria-label="필사 입력" defaultValue={props.value} />
    </div>
  ),
}));

const { T1Plate } = await import('./T1Plate.js');
const { asConceptId } = await import('@chickadee/store-sql');

const ORIGINAL = [
  '// 두 수를 더한다',
  'export function sum(a: number, b: number) {',
  '  const total = a + b',
  '  return total',
  '}',
];

const PAYLOAD = {
  track: 't1' as const,
  kind: 'transcribe' as const,
  blockId: 3,
  file: 'src/core/sum.ts',
  fn: 'sum()',
  original: ORIGINAL,
  show2: [0, 1, 4],
  why: { line: 2, q: '이 줄이 없으면 무엇이 달라질까요?', help: '한 줄이면 됩니다.', choices: [] },
};

const PLATE = {
  id: 1,
  pos: 0,
  cardId: 1,
  conceptId: asConceptId('ts/const-declaration'),
  track: 't1' as const,
  role: 'new' as const,
  estMin: 9,
  parentItemId: null,
  status: 'active' as const,
  elapsedS: 0,
  state: null,
  kind: 'transcribe' as const,
  level: 2 as const,
  siteId: null,
  payload: PAYLOAD,
  nameKo: '상수 선언',
  token: 'const',
  layer: 1 as const,
};

const RESULT: T1Result = {
  blockId: 3,
  stage: 2,
  rows: [
    { oi: 0, ui: 0, status: 'exact', reasons: [], maps: [], engine: 'regex' },
    { oi: 1, ui: 1, status: 'exact', reasons: [], maps: [], engine: 'regex' },
    { oi: 2, ui: 2, status: 'differ', reasons: [{ code: 'TOKEN_MISMATCH', detail: '+ ↔ -' }], maps: [], engine: 'regex' },
    { oi: 3, ui: 3, status: 'equiv', reasons: [{ code: 'INDENT' }], maps: [], engine: 'regex' },
    { oi: 4, ui: 4, status: 'exact', reasons: [], maps: [], engine: 'regex' },
  ],
  n: { exact: 3, equiv: 1, differ: 1, missing: 0, extra: 0 },
  total: 5,
  meaning: 4,
  pct: 80,
  passPct: 85,
  verdict: 'repeat-soft',
  peeks: 0,
  downgraded: false,
  engine: 'regex',
  elapsedMs: 0,
  appeals: 0,
};

const QUESTION: Question = {
  questionId: 'differ:3',
  line: 2,
  q: '이 줄이 없으면 무엇이 달라질까요?',
  help: '한 줄이면 됩니다.',
  choices: [],
};

type Props = Parameters<typeof T1Plate>[0];

function mount(over: Partial<Props> = {}) {
  const spies = {
    onView: vi.fn(),
    onDraft: vi.fn(),
    onPeek: vi.fn(),
    onLeaveLine: vi.fn(),
    onGrade: vi.fn(),
    onDowngrade: vi.fn(),
    onAppeal: vi.fn(),
    onWhyText: vi.fn(),
    onWhyPick: vi.fn(),
    onFinish: vi.fn(),
  };
  const props: Props = {
    plate: PLATE,
    no: 1,
    result: null,
    theme: 'light',
    graded: null,
    view: 'edit',
    stage: 2,
    draft: ORIGINAL.join('\n'),
    peeks: 0,
    peeking: false,
    ticks: {},
    savedAt: null,
    appealed: [],
    why: { text: '', pick: null },
    ...spies,
    ...over,
  };
  render(<T1Plate {...props} />);
  return spies;
}

/** `document` 에서 받는 키다 — 판을 걸면 포커스가 `article.ps` 에 있어 자식까지 안 내려간다. */
const press = (code: string, init: KeyboardEventInit = {}): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, ...init }));
};

afterEach(cleanup);

describe('T1 판 · 편집 화면', () => {
  test('3단계 표시와 원본이 그려진다', async () => {
    mount();
    expect(screen.getByText('뼈대만')).toBeTruthy();
    // 에디터는 `React.lazy` 로 온다 (05 §1.3) — 첫 프레임에는 자리만 있다.
    expect(await screen.findByLabelText('필사 입력')).toBeTruthy();
    expect(screen.getByRole('button', { name: /채점하기/ })).toBeTruthy();
  });

  test('Enter 는 에디터로 들어간다 (05 §7 「T1 편집」)', async () => {
    mount();
    const editor = await screen.findByLabelText('필사 입력');
    press('Enter');
    expect(document.activeElement).toBe(editor);
  });

  test('원본 잠깐 보기는 누르고 있는 동안만이다 — 횟수만 기록한다', () => {
    const spies = mount();
    const hold = screen.getByRole('button', { name: /원본 잠깐 보기/ });
    hold.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    hold.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(spies.onPeek.mock.calls.map(([on]) => on)).toStrictEqual([true, false]);
  });

  test('채점은 버튼으로도 눌린다 — 에디터 밖에서 ⌘↵ 를 못 쓸 때의 길이다', () => {
    const spies = mount();
    screen.getByRole('button', { name: /채점하기/ }).click();
    expect(spies.onGrade).toHaveBeenCalledTimes(1);
  });
});

describe('T1 판 · 채점 결과', () => {
  const graded = { result: RESULT, question: QUESTION };

  test('점수와 줄별 결과가 보인다', () => {
    mount({ view: 'result', graded });
    expect(screen.getByText(/의미가 맞은 줄/)).toBeTruthy();
    expect(screen.getByRole('list', { name: '줄별 결과' })).toBeTruthy();
  });

  test('Enter 는 「왜」로 넘어간다 (05 §7 「T1 결과」)', () => {
    const spies = mount({ view: 'result', graded });
    press('Enter');
    expect(spies.onView).toHaveBeenCalledWith('why');
  });

  test('이의는 어긋난 줄에서만 접수되고 원본 줄 색인으로 온다 (04 §5)', () => {
    const spies = mount({ view: 'result', graded });
    const buttons = screen.getAllByRole('button', { name: /같은 뜻인데요/ });
    expect(buttons).toHaveLength(1); // `differ` 한 줄뿐이다
    buttons[0]?.click();
    expect(spies.onAppeal).toHaveBeenCalledWith(2);
  });
});

describe('T1 판 · 왜 게이트 (04 §6)', () => {
  const graded = { result: RESULT, question: QUESTION };

  test('열 자 미만이면 마칠 수 없다 — 버튼도 Enter 도 막힌다', () => {
    const spies = mount({ view: 'why', graded, why: { text: '짧다', pick: null } });
    const finish = screen.getByRole('button', { name: /저장하고 마치기/ });
    expect(finish.getAttribute('disabled')).not.toBeNull();
    press('Enter');
    expect(spies.onFinish).not.toHaveBeenCalled();
  });

  test('코드를 그대로 옮기면 막고 이유를 말한다', () => {
    mount({
      view: 'why',
      graded,
      why: { text: ORIGINAL[2] as string, pick: null },
    });
    expect(screen.getByText('코드를 그대로 옮기지 말고 말로 써 주세요')).toBeTruthy();
  });

  test('자기 말 한 줄이면 Enter 로 마친다', () => {
    const spies = mount({
      view: 'why',
      graded,
      why: { text: '두 수를 더한 값을 담아 두려고 이름을 붙였다', pick: null },
    });
    press('Enter');
    expect(spies.onFinish).toHaveBeenCalledTimes(1);
  });

  test('Shift+Enter 는 줄바꿈이라 마치지 않는다', () => {
    const spies = mount({
      view: 'why',
      graded,
      why: { text: '두 수를 더한 값을 담아 두려고 이름을 붙였다', pick: null },
    });
    press('Enter', { shiftKey: true });
    expect(spies.onFinish).not.toHaveBeenCalled();
  });

  test('IME 조합 중에는 아무 키도 안 먹는다 (05 §7)', () => {
    const spies = mount({
      view: 'why',
      graded,
      why: { text: '두 수를 더한 값을 담아 두려고 이름을 붙였다', pick: null },
    });
    document.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, isComposing: true }),
    );
    expect(spies.onFinish).not.toHaveBeenCalled();
  });
});
