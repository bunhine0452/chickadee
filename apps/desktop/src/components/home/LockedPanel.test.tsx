// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LockedPanel } from './LockedPanel';

afterEach(cleanup);

describe('LockedPanel', () => {
  it('필사 후보가 하나도 없으면 왜 안 열리는지 말한다', () => {
    render(<LockedPanel openable={0} files={120} />);
    expect(screen.getByLabelText('아직 안 열린 것')).toBeTruthy();
    expect(screen.getByText(/문법을 조금 익힌 뒤에 열립니다/)).toBeTruthy();
  });

  it('후보가 하나라도 있으면 사라진다 — 안내는 조건이 풀리면 스스로 없어진다', () => {
    const { container } = render(<LockedPanel openable={1} files={120} />);
    expect(container.firstChild).toBeNull();
  });

  it('아직 아무것도 안 읽은 리포에서는 그리지 않는다 — 안내할 것이 없다', () => {
    const { container } = render(<LockedPanel openable={0} files={0} />);
    expect(container.firstChild).toBeNull();
  });
});
