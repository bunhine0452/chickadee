// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Legend } from './Legend';

afterEach(cleanup);

describe('Legend', () => {
  it('트랙 색 옆에 항상 라벨이 붙는다 (05 §9 색맹)', () => {
    render(<Legend />);
    const legend = screen.getByRole('list', { name: '잉크 범례' });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(legend.textContent).toBe('T0문법T1클론 코딩T2구조');
  });
});
