// @vitest-environment jsdom
import { setLocale } from '@chickadee/i18n';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DictLangPanel } from './DictLangPanel';

afterEach(() => {
  cleanup();
  setLocale('ko');
});

const LANGS = [
  { lang: 'py', conceptCount: 7 },
  { lang: 'ts', conceptCount: 30 },
];

const boxes = (): HTMLInputElement[] => screen.getAllByRole('checkbox') as HTMLInputElement[];

describe('DictLangPanel', () => {
  it('빈 목록은 전부 켜진 것이다', () => {
    render(<DictLangPanel langs={LANGS} value={[]} onChange={() => undefined} />);
    expect(boxes().map((b) => b.checked)).toEqual([true, true]);
  });

  it('일부만 저장돼 있으면 그것만 켜진다', () => {
    render(<DictLangPanel langs={LANGS} value={['ts']} onChange={() => undefined} />);
    expect(boxes().map((b) => b.checked)).toEqual([false, true]);
  });

  it('전부 켜진 상태에서 하나를 끄면 나머지가 저장된다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DictLangPanel langs={LANGS} value={[]} onChange={onChange} />);

    await user.click(boxes()[0] as HTMLInputElement);
    expect(onChange).toHaveBeenCalledWith(['ts']);
  });

  it('다시 전부 켜지면 빈 목록으로 돌아간다 — 「전부」의 표기는 하나다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DictLangPanel langs={LANGS} value={['ts']} onChange={onChange} />);

    await user.click(boxes()[0] as HTMLInputElement);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('마지막 하나는 끄지 못한다 — 「전부 켜짐」과 값이 같아진다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DictLangPanel langs={LANGS} value={['ts']} onChange={onChange} />);

    await user.click(boxes()[1] as HTMLInputElement);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('개념 수를 같이 보인다', () => {
    render(<DictLangPanel langs={LANGS} value={[]} onChange={() => undefined} />);
    expect(screen.getByText('개념 30개')).toBeTruthy();
  });

  it('읽은 사전이 없으면 그렇게 말한다', () => {
    render(<DictLangPanel langs={[]} value={[]} onChange={() => undefined} />);
    expect(screen.getByText(/아직 읽은 사전이 없습니다/)).toBeTruthy();
  });

  it('en 에서는 같은 자리가 영어다', () => {
    setLocale('en');
    render(<DictLangPanel langs={LANGS} value={[]} onChange={() => undefined} />);
    expect(screen.getByText('30 concepts')).toBeTruthy();
  });
});
