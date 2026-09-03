// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { DictLayer } from '@chickadee/store-sql';

import { DictRung } from './DictRung';

afterEach(cleanup);

const LAYERS: DictLayer[] = [
  { k: '한 줄로', t: '앞이 <b>null</b> 이면 뒤를 건너뛴다.' },
  { k: '왜 필요한가', t: '없을 수도 있는 값을 다룰 때 줄이 터지지 않게 한다.' },
  { k: '42행 안에서', steps: ['cart 를 본다', '없으면 undefined 로 끝난다'] },
];

describe('DictRung', () => {
  it('목업 클래스를 그대로 붙이고 층마다 한 줄을 낸다', () => {
    const { container } = render(<DictRung layers={LAYERS} />);
    expect(container.querySelector('.dict')).not.toBeNull();
    expect(container.querySelectorAll('.dict > div')).toHaveLength(3);
    expect([...container.querySelectorAll('.dict > div > b')].map((el) => el.textContent)).toEqual([
      '한 줄로',
      '왜 필요한가',
      '42행 안에서',
    ]);
  });

  it('단계형 층은 번호를 매긴 목록으로 그린다', () => {
    const { container } = render(<DictRung layers={LAYERS} />);
    const steps = container.querySelectorAll('.steps li');
    expect(steps).toHaveLength(2);
    expect(steps[0]?.textContent).toBe('1. cart 를 본다');
    expect(steps[1]?.textContent).toBe('2. 없으면 undefined 로 끝난다');
  });

  it('1~3단이 인터넷 없이 도는 것을 그 자리에 적는다', () => {
    const { container } = render(<DictRung layers={LAYERS} />);
    expect(container.textContent).toContain('인터넷도 API 키도 없이 동작합니다');
  });

  it('사전 문구의 서식은 살리고 위험한 태그는 정화한다', () => {
    const { container } = render(<DictRung layers={[{ k: 'x', t: '<b>ok</b><script>x</script>' }]} />);
    expect(container.querySelector('.dict p b')?.textContent).toBe('ok');
    expect(container.querySelector('script')).toBeNull();
  });
});
