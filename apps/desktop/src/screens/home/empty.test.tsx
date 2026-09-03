// @vitest-environment jsdom
import { setLocale } from '@chickadee/i18n';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FirstRun } from './empty';

afterEach(() => {
  cleanup();
  setLocale('ko');
});

/** 0단계가 붙기 전 서명 그대로 부르기 위한 기본값. */
function first(props: Partial<React.ComponentProps<typeof FirstRun>> = {}) {
  return (
    <FirstRun
      onPick={props.onPick ?? (() => undefined)}
      locale={props.locale ?? 'ko'}
      onLocale={props.onLocale ?? (() => undefined)}
    />
  );
}

describe('FirstRun', () => {
  it('로고 · 한 문단 · 언어 고르기 · 버튼 하나뿐이다', () => {
    render(first());
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chickadee');
    expect(screen.getByText(/리포에는\s*아무것도 쓰지 않습니다/)).toBeTruthy();
    // 언어 스위치는 `role=switch` 라 버튼 셈에 들지 않는다 — 버튼은 여전히 하나다.
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('「리포 등록」이 폴더 고르기를 부른다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(first({ onPick }));

    await user.click(screen.getByRole('button', { name: '리포 등록' }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('0단계 — 언어를 고르면 그 값이 위로 올라간다 (D117)', async () => {
    const onLocale = vi.fn();
    const user = userEvent.setup();
    render(first({ onLocale }));

    await user.click(screen.getByRole('switch'));
    expect(onLocale).toHaveBeenCalledWith('en');
  });

  it('en 으로 세우면 문단과 버튼이 영어다', () => {
    setLocale('en');
    render(first({ locale: 'en' }));
    expect(screen.getByText(/nothing is written back to the repo/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a repo' })).toBeTruthy();
    // 언어 이름은 en 카탈로그에 없다 — ko 로 폴백해 그 언어의 이름이 그대로 나온다.
    expect(screen.getByRole('switch').textContent).toContain('한국어');
  });
});
