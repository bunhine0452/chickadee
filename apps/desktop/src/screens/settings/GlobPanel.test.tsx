// @vitest-environment jsdom
import { setLocale } from '@chickadee/i18n';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GlobPanel } from './GlobPanel';

afterEach(() => {
  cleanup();
  setLocale('ko');
});

const box = (): HTMLTextAreaElement => screen.getByLabelText('제외 글롭') as HTMLTextAreaElement;

describe('GlobPanel', () => {
  it('저장된 목록을 줄마다 하나로 보인다', () => {
    render(<GlobPanel value={['docs/**', '*.snap']} onChange={() => undefined} />);
    expect(box().value).toBe('docs/**\n*.snap');
  });

  it('포커스를 뗄 때 한 번 저장한다 — 타자마다가 아니다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<GlobPanel value={[]} onChange={onChange} />);

    await user.type(box(), 'docs/**');
    expect(onChange).not.toHaveBeenCalled();

    await user.tab();
    expect(onChange).toHaveBeenCalledWith(['docs/**']);
  });

  it('바뀐 것이 없으면 저장하지 않는다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<GlobPanel value={['docs/**']} onChange={onChange} />);

    await user.click(box());
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('문제 있는 줄은 이유를 말하고 저장에서 빠진다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<GlobPanel value={[]} onChange={onChange} />);

    await user.type(box(), 'docs/**\n!keep.ts');
    expect(screen.getByText(/부정\(!\)은 오히려 포함시킵니다/)).toBeTruthy();

    await user.tab();
    expect(onChange).toHaveBeenCalledWith(['docs/**']);
  });

  it('다시 읽어야 반영된다고 말한다 — 홈 배너와 같은 안내다', () => {
    render(<GlobPanel value={[]} onChange={() => undefined} />);
    expect(screen.getByText('바꾼 것은 리포를 다시 읽어야 반영됩니다.')).toBeTruthy();
  });

  it('en 에서는 같은 자리가 영어다', () => {
    setLocale('en');
    render(<GlobPanel value={[]} onChange={() => undefined} />);
    expect(screen.getByLabelText('Excluded paths')).toBeTruthy();
  });
});
