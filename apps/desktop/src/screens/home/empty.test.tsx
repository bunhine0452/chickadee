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
      newcomer={props.newcomer ?? false}
      onNewcomer={props.onNewcomer ?? (() => undefined)}
    />
  );
}

describe('FirstRun', () => {
  it('로고 · 한 문단 · 언어 고르기 · 리포로 들어오는 문 둘', () => {
    render(first());
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chickadee');
    expect(screen.getByText(/리포에는\s*아무것도 쓰지 않습니다/)).toBeTruthy();
    // 언어 스위치는 `role=switch` 라 버튼 셈에 들지 않는다. 버튼 둘 = 폴더 고르기와
    // 주소로 받기(D129) — 리포가 이 컴퓨터에 있을 수도, 없을 수도 있다.
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('switch', { name: /표시 언어 고르기/ })).toBeTruthy();
    expect(screen.getByLabelText('git 주소')).toBeTruthy();
  });

  it('주소가 비어 있으면 「주소로 받기」가 잠겨 있다', () => {
    render(first());
    expect(screen.getByRole('button', { name: '주소로 받기' })).toHaveProperty('disabled', true);
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

    await user.click(screen.getByRole('switch', { name: /표시 언어 고르기/ }));
    expect(onLocale).toHaveBeenCalledWith('en');
  });

  it('en 으로 세우면 문단과 버튼이 영어다', () => {
    setLocale('en');
    render(first({ locale: 'en' }));
    expect(screen.getByText(/nothing is written back to the repo/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a repo' })).toBeTruthy();
    // 언어 이름은 en 카탈로그에 없다 — ko 로 폴백해 그 언어의 이름이 그대로 나온다.
    expect(screen.getByRole('switch', { name: /Choose a display language/ }).textContent)
      .toContain('한국어');
  });
});

describe('대상 경계 (D139 · D147 이 넓혔다)', () => {
  it('첫 화면에서 먼저 말한다 — 두 세션 헛돌기를 기다리지 않는다', () => {
    render(first());
    expect(screen.getByText(/「변수」·「함수」가 처음이어도 됩니다/)).toBeTruthy();
  });

  it('밖으로 내보내지 않고 0장으로 데려간다 (D147)', () => {
    const { container } = render(first());
    const scope = container.querySelector('.firstrun-scope')?.textContent ?? '';
    expect(scope).toContain('0장');
    // D139 는 외부 자료로 돌려보냈다. D147 이 그 전제를 뒤집었으니 그 문장은 없어야 한다.
    expect(scope).not.toContain('opentutorials.org');
    expect(scope).not.toContain('cs50.harvard.edu');
  });

  it('한 문항만 묻는다 — 레벨을 고르게 하지 않는다 (D147 · E-5 유지)', () => {
    render(first());
    // 스위치는 둘뿐이다: 표시 언어와 이 한 문항. 레벨 고르기·배치고사는 없다.
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    expect(screen.getByText('프로그래밍이 처음이신가요?')).toBeTruthy();
  });

  it('답해도 잠기는 것이 없다 — 버튼은 그대로다', () => {
    render(first({ newcomer: true }));
    expect(screen.getByRole('button', { name: '리포 등록' })).toBeTruthy();
  });

  it('답이 위로 올라간다', async () => {
    const onNewcomer = vi.fn();
    const user = userEvent.setup();
    render(first({ onNewcomer }));
    await user.click(screen.getByRole('switch', { name: '프로그래밍이 처음이신가요?' }));
    expect(onNewcomer).toHaveBeenCalledWith(true);
  });

  it('en 으로도 경계를 말한다', () => {
    setLocale('en');
    render(first({ locale: 'en' }));
    expect(screen.getByText(/It is fine if/)).toBeTruthy();
  });
});
