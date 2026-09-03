// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MapStatus } from './MapStatus';
import type { MapEdge } from './DependencyMap';

afterEach(cleanup);

const EDGES: MapEdge[] = [
  ['a.ts', 'c.ts', 'static'],
  ['b.ts', 'c.ts', 'static'],
  ['c.ts', 'd.ts', 'http'],
];

describe('MapStatus', () => {
  it('아무것도 안 짚었으면 지도 읽는 법 두 문장이다', () => {
    const { container } = render(<MapStatus edges={EDGES} hovered={null} graded={false} />);
    const lines = [...container.querySelectorAll('.map-status > span')].map((el) => el.textContent);
    expect(lines).toEqual([
      '파일 상자에 마우스를 올리면 연결이 보이고, 클릭하면 고릅니다.',
      '위쪽 = 사용자와 가까운 쪽 · 아래쪽 = 데이터와 가까운 쪽',
    ]);
  });

  it('짚은 파일의 「쓰는 곳」과 「쓰는 것」을 센다', () => {
    const { container } = render(<MapStatus edges={EDGES} hovered="c.ts" graded={false} />);
    expect(container.querySelector('.map-status')?.textContent).toBe(
      'c.ts · 이 파일을 쓰는 곳 2 · 이 파일이 쓰는 것 1클릭하면 선택 / 해제',
    );
  });

  it('채점 뒤에는 둘째 줄이 배지 범례로 바뀐다', () => {
    const { container } = render(<MapStatus edges={EDGES} hovered="c.ts" graded />);
    expect(container.querySelectorAll('.map-status > span')[1]?.textContent).toBe(
      '✓ 맞게 고름 · ＋ 놓침 · ✕ 아닌데 고름 · ◆ 같이 바뀜',
    );
  });

  it('호버 문장을 live 로 보내지 않는다 (05 §5)', () => {
    const { container } = render(<MapStatus edges={EDGES} hovered="c.ts" graded={false} />);
    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
