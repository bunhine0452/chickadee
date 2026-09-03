// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DiffRows, markDiff } from './DiffRows';
import type { DiffRow } from './DiffRows';

afterEach(cleanup);

/** 목업 데모 답안의 결과를 줄인 것 — 다섯 판정이 한 번씩 나온다. */
const ROWS: DiffRow[] = [
  {
    oi: 1,
    ui: 1,
    status: 'exact',
    original: 'export function LoginForm() {',
    user: 'export function LoginForm() {',
    tag: '정합',
    why: '',
    canAppeal: false,
    appealed: false,
  },
  {
    oi: 2,
    ui: 2,
    status: 'equiv',
    original: '  const { submit, error, pending } = useLogin()',
    user: '  const { submit, error, pending } = useLogin();',
    tag: '동등',
    why: '형태만 다릅니다. <b>틀린 게 아닙니다.</b> 사유: 세미콜론 / 후행 쉼표',
    canAppeal: false,
    appealed: false,
  },
  {
    oi: 8,
    ui: 8,
    status: 'differ',
    original: '    await submit(email, password)',
    user: '    await submit(password, email)',
    tag: '이름 맞바꿈',
    why: '이름 <code>email</code> 과 <code>password</code> 를 맞바꾼 형태입니다.',
    canAppeal: true,
    appealed: false,
  },
  {
    oi: 16,
    ui: -1,
    status: 'missing',
    original: '      {error && <p className="err">{error}</p>}',
    user: null,
    tag: '누락',
    why: '실패 메시지를 보여 주는 줄이 빠졌습니다.',
    canAppeal: false,
    appealed: false,
  },
  {
    oi: -1,
    ui: 19,
    status: 'extra',
    original: null,
    user: '  console.log(1)',
    tag: '추가',
    why: '원본에 없는 줄입니다.',
    canAppeal: false,
    appealed: false,
  },
];

describe('markDiff', () => {
  it('토큰 수가 같으면 다른 토큰만 감싼다', () => {
    expect(markDiff('await submit(email, password)', 'await submit(password, email)')).toEqual([
      { t: 'await submit(', mark: false },
      { t: 'password', mark: true },
      { t: ', ', mark: false },
      { t: 'email', mark: true },
      { t: ')', mark: false },
    ]);
  });

  it('토큰 수가 다르면 강조하지 않는다 — 추측한 강조는 없는 강조보다 나쁘다', () => {
    expect(markDiff('const a = 1', 'const a = 1 + 2')).toEqual([{ t: 'const a = 1 + 2', mark: false }]);
  });

  it('같은 줄이면 조각 하나로 합쳐 낸다', () => {
    expect(markDiff('  return null', '  return null')).toEqual([{ t: '  return null', mark: false }]);
  });

  it('빈 답안은 조각이 없다', () => {
    expect(markDiff('x', '')).toEqual([]);
  });
});

describe('DiffRows', () => {
  it('표가 아니라 목록이다', () => {
    render(<DiffRows rows={ROWS} filter="all" onAppeal={() => {}} />);
    expect(screen.getByRole('list', { name: '줄별 결과' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryAllByRole('row')).toHaveLength(0);
  });

  it('기본 필터는 정합을 빼고, 「어긋남만」은 동등까지 뺀다', () => {
    const { container, rerender } = render(<DiffRows rows={ROWS} filter="ne" onAppeal={() => {}} />);
    expect(container.querySelectorAll('.drow')).toHaveLength(4);
    expect(container.querySelectorAll('.drow.exact')).toHaveLength(0);

    rerender(<DiffRows rows={ROWS} filter="d" onAppeal={() => {}} />);
    expect(container.querySelectorAll('.drow')).toHaveLength(3);
    expect(container.querySelectorAll('.drow.equiv')).toHaveLength(0);
  });

  it('줄 번호 · 태그 · 사유를 그대로 낸다 — 문구는 부모가 만든다', () => {
    const { container } = render(<DiffRows rows={ROWS} filter="all" onAppeal={() => {}} />);
    const equiv = container.querySelector('.drow.equiv');
    expect(equiv?.querySelector('i')?.textContent).toBe('3');
    expect(equiv?.querySelector('.rtag')?.textContent).toBe('동등');
    expect(equiv?.querySelector('.rtag')?.className).toBe('rtag q');
    expect(equiv?.querySelector('.why')?.textContent).toContain('틀린 게 아닙니다.');
    expect(equiv?.querySelector('.why b')?.textContent).toBe('틀린 게 아닙니다.');
  });

  it('어긋난 줄에서 바뀐 토큰만 mark 로 뜬다', () => {
    const { container } = render(<DiffRows rows={ROWS} filter="d" onAppeal={() => {}} />);
    const differ = container.querySelector('.drow.differ');
    expect([...(differ?.querySelectorAll('mark') ?? [])].map((el) => el.textContent)).toEqual(['password', 'email']);
    expect(differ?.querySelector('.u')?.textContent).toBe('    await submit(password, email)');
  });

  it('누락 · 추가는 빈 칸을 말로 채운다', () => {
    const { container } = render(<DiffRows rows={ROWS} filter="d" onAppeal={() => {}} />);
    expect(container.querySelector('.drow.missing .u')?.textContent).toBe('이 줄을 안 썼습니다');
    expect(container.querySelector('.drow.extra .o')?.textContent).toBe('원본에 없는 줄입니다');
    expect(container.querySelector('.drow.extra i')?.textContent).toBe('＋');
  });

  it('이의 버튼은 어긋난 줄에만 있고 눌린 상태를 남긴다', () => {
    const { container } = render(<DiffRows rows={ROWS} filter="all" onAppeal={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.textContent).toBe('같은 뜻인데요');
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.drow.disputed')).toBeNull();
  });

  it('이의가 접수되면 문구와 aria-pressed 가 함께 바뀐다', () => {
    const appealed = ROWS.map((r, i) => (i === 2 ? { ...r, appealed: true } : r));
    const { container } = render(<DiffRows rows={appealed} filter="all" onAppeal={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.textContent).toBe('이의 접수됨 · 판정 보류');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.drow.differ')?.className).toContain('disputed');
  });

  it('올려보내는 번호는 필터 뒤 순서가 아니라 rows 안의 색인이다', async () => {
    const onAppeal = vi.fn();
    const user = userEvent.setup();
    render(<DiffRows rows={ROWS} filter="d" onAppeal={onAppeal} />);
    await user.click(screen.getByRole('button'));
    expect(onAppeal).toHaveBeenCalledWith(2);
  });

  it('필터에 걸리는 줄이 없으면 그 사실을 적는다', () => {
    const onlyExact = ROWS.filter((r) => r.status === 'exact');
    const { container } = render(<DiffRows rows={onlyExact} filter="d" onAppeal={() => {}} />);
    expect(container.querySelector('.drow.empty')?.textContent).toContain('이 조건에 맞는 줄이 없습니다.');
  });
});
