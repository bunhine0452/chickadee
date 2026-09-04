// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Newcomer } from './Newcomer';

afterEach(cleanup);

describe('Newcomer', () => {
  it("플래그가 'none' 이면 아무것도 그리지 않는다", () => {
    const { container } = render(<Newcomer flag="none" />);
    expect(container.innerHTML).toBe('');
  });

  it('두 플래그의 사유 문장이 다르다 — 한 세션인지 두 세션인지', () => {
    render(<Newcomer flag="suspect" />);
    expect(screen.getByRole('complementary').textContent).toContain('오늘 뿌리 개념 판이 막혔고');
    cleanup();

    render(<Newcomer flag="confirmed" />);
    expect(screen.getByRole('complementary').textContent).toContain('두 세션 내리');
  });

  it('안내는 게이트가 아니다 — 버튼도 닫기도 없고 잠기지 않는다고 말한다', () => {
    render(<Newcomer flag="confirmed" />);
    const notice = screen.getByRole('complementary', { name: '먼저 읽을 것' });
    expect(notice.querySelectorAll('button, a, input')).toHaveLength(0);
    expect(notice.textContent).toContain('잠기는 것은 없습니다');
    // D147 전에는 외부 입문 자료 둘로 내보냈다. 이제는 **0장으로 데려간다** — 안내가
    // 가리키는 곳이 앱 밖이 아니라 앱 안이라는 것이 그 결정의 요점이다.
    expect(notice.textContent).toContain('0장');
    expect(notice.textContent).not.toContain('opentutorials.org');
  });
});
