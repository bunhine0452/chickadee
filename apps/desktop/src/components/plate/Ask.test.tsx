// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Ask } from './Ask';

afterEach(cleanup);

describe('Ask', () => {
  it('물음은 <p class="ask"> 다 — 행 길이 강제가 여기에 걸린다', () => {
    const { container } = render(<Ask q="어느 자리가 이 줄의 주인인가요?" hint="1~3 으로 고르세요." />);
    const p = container.querySelector('p.ask');
    expect(p).not.toBeNull();
    expect(p?.tagName).toBe('P');
  });

  it('곁말은 <small> 로 물음 아래 붙는다', () => {
    const { container } = render(<Ask q="물음" hint="곁말" />);
    expect(container.querySelector('.ask small')?.textContent).toBe('곁말');
  });

  it('서식은 살리고 위험한 태그는 정화한다', () => {
    const { container } = render(
      <Ask q={'<code>?.</code> 가 하는 일<script>x</script>'} hint={'<b>Enter</b> 로 제출'} />,
    );
    expect(container.querySelector('.ask code')?.textContent).toBe('?.');
    expect(container.querySelector('.ask small b')?.textContent).toBe('Enter');
    expect(container.querySelector('script')).toBeNull();
  });
});
