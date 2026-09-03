// @vitest-environment jsdom
import { setLocale } from '@chickadee/i18n';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IdentityPanel } from './IdentityPanel';

afterEach(() => {
  cleanup();
  setLocale('ko');
});

const ME = { email: 'me@example.com', name: 'Kim Hyunbin' };
const OTHER = { email: 'other@example.com', name: 'Someone Else' };

function panel(props: Partial<React.ComponentProps<typeof IdentityPanel>> = {}) {
  return (
    <IdentityPanel
      value={props.value ?? []}
      suggestions={props.suggestions ?? []}
      onChange={props.onChange ?? (() => undefined)}
      onSuggest={props.onSuggest ?? (() => undefined)}
    />
  );
}

describe('IdentityPanel', () => {
  it('저장된 identity 를 메일과 이름으로 보인다', () => {
    render(panel({ value: [ME] }));
    expect(screen.getByText('me@example.com')).toBeTruthy();
    expect(screen.getByText('Kim Hyunbin')).toBeTruthy();
  });

  it('손으로 넣은 메일이 목록에 더해진다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(panel({ onChange }));

    await user.type(screen.getByLabelText('메일'), 'me@example.com');
    await user.type(screen.getByLabelText('이름'), 'Kim Hyunbin');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(onChange).toHaveBeenCalledWith([ME]);
  });

  it('메일 형태가 아니면 더하지 않고 이유를 말한다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(panel({ onChange }));

    await user.type(screen.getByLabelText('메일'), '나');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('메일 주소 형태가 아닙니다.')).toBeTruthy();
  });

  it('이미 있는 메일은 두 번 넣지 않는다 — 대소문자가 달라도 같은 사람이다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(panel({ value: [ME], onChange }));

    await user.type(screen.getByLabelText('메일'), 'ME@Example.com');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('이미 있는 메일입니다.')).toBeTruthy();
  });

  it('지우면 그 줄만 빠진다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(panel({ value: [ME, OTHER], onChange }));

    await user.click(screen.getByRole('button', { name: 'me@example.com 지우기' }));
    expect(onChange).toHaveBeenCalledWith([OTHER]);
  });

  it('제안은 이미 넣은 사람을 빼고 보인다', () => {
    render(panel({ value: [ME], suggestions: [ME, OTHER] }));
    expect(screen.queryByRole('button', { name: /Kim Hyunbin · me@/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Someone Else · other@example.com' })).toBeTruthy();
  });

  it('제안을 누르면 그대로 더해진다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(panel({ suggestions: [OTHER], onChange }));

    await user.click(screen.getByRole('button', { name: 'Someone Else · other@example.com' }));
    expect(onChange).toHaveBeenCalledWith([OTHER]);
  });

  it('제안이 하나도 없으면 손으로 넣으라고 말한다', () => {
    render(panel());
    expect(screen.getByText('읽은 커밋에 author 가 없습니다. 손으로 넣어 주세요.')).toBeTruthy();
  });

  it('en 에서는 같은 자리가 영어다', () => {
    setLocale('en');
    render(panel({ value: [ME] }));
    expect(screen.getByRole('button', { name: 'Remove me@example.com' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });
});
