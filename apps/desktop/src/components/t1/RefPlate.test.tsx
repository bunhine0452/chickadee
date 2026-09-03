// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { placeholderEm, RefPlate } from './RefPlate';

afterEach(cleanup);

/** design/src/ink/data.js 의 `T1.original` 앞부분 + `show2` 를 그대로 쓴다. */
const ORIGINAL = [
  '// 로그인 폼. 제출하면 useLogin 의 submit 을 부르고, 실패 메시지는 폼 아래에 보여준다',
  'export function LoginForm() {',
  '  const { submit, error, pending } = useLogin()',
  "  const [email, setEmail] = useState('')",
  '',
  '  return (',
  '}',
] as const;

const SHOW = [0, 1, 4, 5, 6] as const;

describe('RefPlate', () => {
  it('1단계는 전부 잉크다 — 가려진 줄이 없다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={1} show={[]} peek={false} />);
    expect(container.querySelectorAll('.ref .code .ln')).toHaveLength(7);
    expect(container.querySelectorAll('.ln.hidden')).toHaveLength(0);
    expect(container.querySelector('.pane-h b')?.textContent).toBe('원본 — 보면서 그대로 치세요');
  });

  it('머리말의 언어는 받은 것만 적는다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={1} show={[]} peek={false} lang="TypeScript" />);
    expect(container.querySelector('.pane-h .mono')?.textContent).toBe('TypeScript · 7줄');
    cleanup();
    const bare = render(<RefPlate original={ORIGINAL} stage={1} show={[]} peek={false} />);
    expect(bare.container.querySelector('.pane-h .mono')?.textContent).toBe('7줄');
  });

  it('2단계는 show 에 든 줄만 잉크로 남고 나머지는 자리표가 된다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={2} show={SHOW} peek={false} />);
    expect(container.querySelectorAll('.ln.hidden')).toHaveLength(2);
    expect(container.querySelector('.ln[data-n="3"]')?.className).toContain('hidden');
    expect(container.querySelector('.ln[data-n="2"]')?.className).not.toContain('hidden');
    expect(container.querySelector('.pane-h b')?.textContent).toBe('주석과 시그니처만');
    expect(container.querySelector('.pane-h .mono')?.textContent).toBe('본문은 가려져 있습니다');
  });

  it('가려진 줄은 줄 수 · 들여쓰기 · 자리표 폭을 보존한다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={2} show={SHOW} peek={false} />);
    const row = container.querySelector('.ln[data-n="3"]');
    const ph = row?.querySelector<HTMLElement>('.ph');
    const line = ORIGINAL[2] ?? '';
    expect(ph?.style.width).toBe(`${placeholderEm(line).toFixed(1)}em`);
    // 원본의 들여쓰기 2칸은 자리표 앞에 그대로 남는다.
    expect(row?.querySelector('span')?.textContent?.startsWith('  ')).toBe(true);
  });

  it('자리표 폭은 4em 아래로 내려가지도 30em 위로 오르지도 않는다', () => {
    expect(placeholderEm('')).toBe(4);
    expect(placeholderEm('ab')).toBe(4);
    expect(placeholderEm('x'.repeat(200))).toBe(30);
    expect(placeholderEm('x'.repeat(20))).toBeCloseTo(11.2, 5);
  });

  it('가려진 줄은 aria-hidden 이고, peek 은 그것을 풀지 않는다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={2} show={SHOW} peek />);
    expect(container.querySelector('.ref')?.className).toContain('peek');
    const hidden = [...container.querySelectorAll('.ln.hidden')];
    expect(hidden).toHaveLength(2);
    expect(hidden.every((el) => el.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('잉크로 남은 줄에는 aria-hidden 이 없다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={2} show={SHOW} peek={false} />);
    expect(container.querySelector('.ln[data-n="2"]')?.getAttribute('aria-hidden')).toBeNull();
  });

  it('캐럿이 있는 줄에 data-cur 를 달아 부모가 스크롤할 자리를 남긴다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={1} show={[]} peek={false} curLine={2} />);
    const marked = [...container.querySelectorAll('[data-cur]')];
    expect(marked).toHaveLength(1);
    expect(marked[0]?.getAttribute('data-n')).toBe('3');
  });

  it('빈 줄도 높이를 지킨다 — 공백 한 칸이 남는다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={1} show={[]} peek={false} />);
    expect(container.querySelector('.ln[data-n="5"] span')?.textContent).toBe(' ');
  });

  it('구문 강조는 CodePlate 와 같은 6클래스만 쓴다', () => {
    const { container } = render(<RefPlate original={ORIGINAL} stage={1} show={[]} peek={false} />);
    const classes = [...container.querySelectorAll('.code i')].map((el) => el.className).filter((c) => c !== '');
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.every((c) => ['k', 's', 'n', 'c', 'p', 'f', 'ph'].includes(c))).toBe(true);
  });
});
