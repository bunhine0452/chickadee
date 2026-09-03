// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LinkPara } from './LinkPara';

afterEach(cleanup);

describe('LinkPara', () => {
  it('「이어보기」 구역이고 목업 클래스를 그대로 붙인다', () => {
    const { container } = render(<LinkPara payoff="아까 막힌 자리가 이렇게 이어집니다." />);
    expect(screen.getByRole('region', { name: '이어보기' })).toBeTruthy();
    expect(container.querySelector('.link-para')).not.toBeNull();
    expect(container.querySelector('.link-para .tag-new')?.textContent).toBe('새로 열림');
  });

  it('기본으로는 포커스를 가져가지 않는다', () => {
    render(<LinkPara payoff="본문" />);
    expect(document.activeElement).toBe(document.body);
  });

  it('아래층에서 돌아온 판이면 포커스가 여기로 온다', () => {
    render(<LinkPara payoff="본문" focusOnMount />);
    expect(screen.getByRole('region', { name: '이어보기' })).toBe(document.activeElement);
  });

  it('서식은 살리고 위험한 태그는 정화한다', () => {
    const { container } = render(<LinkPara payoff={'<b>여기</b><script>x</script>'} />);
    expect(container.querySelector('.link-para p b')?.textContent).toBe('여기');
    expect(container.querySelector('script')).toBeNull();
  });
});
