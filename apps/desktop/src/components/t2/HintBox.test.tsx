// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HintBox } from './HintBox';

afterEach(cleanup);

describe('HintBox', () => {
  it('아직 안 펼쳤으면 자리도 없다', () => {
    const { container } = render(<HintBox hints={[]} />);
    expect(container.querySelector('.hintbox')).toBeNull();
  });

  it('펼친 순서대로 「힌트 N — …」 로 낸다', () => {
    const { container } = render(
      <HintBox hints={['이 기능은 4개 층 중 <b>3개 층</b>에 걸쳐 있습니다.', '새 파일이 2개 있습니다.']} />,
    );
    const rows = [...container.querySelectorAll('.hintbox > span')];
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toBe('힌트 1 — 이 기능은 4개 층 중 3개 층에 걸쳐 있습니다.');
    expect(rows[1]?.textContent).toBe('힌트 2 — 새 파일이 2개 있습니다.');
  });

  it('힌트 문구의 서식은 RichText 를 지나 살아 있다', () => {
    const { container } = render(<HintBox hints={['<b>3개 층</b><script>alert(1)</script>']} />);
    // 첫 <b> 는 「힌트 1」 머리말, 둘째가 문구 안의 서식이다.
    expect([...container.querySelectorAll('.hintbox b')].map((el) => el.textContent)).toEqual(['힌트 1', '3개 층']);
    expect(container.querySelector('script')).toBeNull();
  });
});
