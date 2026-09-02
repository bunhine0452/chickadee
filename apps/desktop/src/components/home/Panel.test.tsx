// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Panel } from './Panel';

afterEach(cleanup);

describe('Panel', () => {
  it('제목이 section 의 이름이 된다', () => {
    render(
      <Panel title="잉크 겹" plain="= 얼마나 익혔나" tag="4겹 = 완성">
        <p>속</p>
      </Panel>,
    );
    const section = screen.getByRole('region', { name: '잉크 겹' });
    expect(section.textContent).toContain('= 얼마나 익혔나');
    expect(section.textContent).toContain('4겹 = 완성');
    expect(section.textContent).toContain('속');
  });
});
