// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FlatButton, PressButton } from '@chickadee/ui';

import { Acts } from './Acts';

afterEach(cleanup);

describe('Acts', () => {
  it('목업 클래스를 그대로 붙이고 좌우를 밀어낸다', () => {
    const { container } = render(<Acts hint="고르고 <b>Enter</b>" />);
    expect(container.querySelector('.acts')).not.toBeNull();
    expect(container.querySelector('.acts .hint')).not.toBeNull();
    expect(container.querySelector('.acts .sp')).not.toBeNull();
  });

  it('왼쪽 「모르겠어요」는 맞혀도 남는다', () => {
    render(
      <Acts
        left={
          <FlatButton variant="dunno" on={false}>
            모르겠어요 · 다시 찍기
          </FlatButton>
        }
        hint="맞혔어도 개운하지 않으면 눌러도 됩니다"
        right={<PressButton tone="blue">다음</PressButton>}
      />,
    );
    expect(screen.getByRole('button', { name: /모르겠어요/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: '다음' })).toBeTruthy();
  });

  it('안내의 서식은 살리고 위험한 태그는 정화한다', () => {
    const { container } = render(<Acts hint={'<b>Enter</b><script>x</script>'} />);
    expect(container.querySelector('.acts .hint b')?.textContent).toBe('Enter');
    expect(container.querySelector('script')).toBeNull();
  });
});
