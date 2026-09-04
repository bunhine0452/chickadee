// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Crumb } from './Crumb';

afterEach(cleanup);

describe('Crumb', () => {
  it('목업 클래스를 그대로 붙인다', () => {
    const { container } = render(<Crumb depth="prereq" parent="옵셔널 체이닝 ?." onBack={() => undefined} />);
    expect(container.querySelector('.crumb')).not.toBeNull();
    expect(container.querySelector('.crumb .depth')?.textContent).toBe('아래층');
    expect(container.querySelector('.crumb .arr')).not.toBeNull();
  });

  it('아래층이면 위 판 이름을 앞에 세운다', () => {
    const { container } = render(<Crumb depth="prereq" parent="옵셔널 체이닝 ?." />);
    expect(container.querySelector('.crumb b')?.textContent).toBe('옵셔널 체이닝 ?.');
  });

  it('다시 찍기는 위 판이 없고 기본 문구를 쓴다', () => {
    const { container } = render(<Crumb depth="reprint" />);
    expect(container.querySelector('.crumb .depth')?.textContent).toBe('다시 찍기');
    expect(container.querySelector('.crumb .arr')).toBeNull();
    expect(container.textContent).toContain('지난번에 어긋난 판입니다');
  });

  it('「위로」 버튼은 onBack 이 있을 때만 나오고 B 를 함께 적는다', () => {
    render(<Crumb depth="reprint" />);
    expect(screen.queryByRole('button')).toBeNull();
    cleanup();

    render(<Crumb depth="prereq" parent="위 판" onBack={() => undefined} />);
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('위로 돌아가기');
    expect(button.querySelector('kbd')?.textContent).toBe('B');
  });

  it('「위로」를 누르면 onBack 을 부른다', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<Crumb depth="prereq" parent="위 판" onBack={onBack} />);

    await user.click(screen.getByRole('button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('설명은 갈아 끼울 수 있고 서식은 정화한다', () => {
    const { container } = render(<Crumb depth="prereq" note={'<b>지금</b> · 1문제<script>x</script>'} />);
    expect(container.querySelector('.crumb b')?.textContent).toBe('지금');
    expect(container.querySelector('script')).toBeNull();
  });
});
