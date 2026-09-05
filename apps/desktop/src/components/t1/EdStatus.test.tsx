// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EdStatus, hhmm } from './EdStatus';

afterEach(cleanup);

describe('EdStatus', () => {
  it('판정 3색에는 낱말이 같이 붙고 색면은 낭독하지 않는다', () => {
    const { container } = render(<EdStatus lines={0} savedAt={null} peeks={0} />);
    const legend = container.querySelector('.legend');
    expect(legend?.textContent).toBe('같음 같은 뜻 다름');
    const swatches = [...container.querySelectorAll('.legend i')];
    expect(swatches.map((el) => el.className)).toEqual(['e', 'q', 'd']);
    expect(swatches.every((el) => el.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('아직 저장 전이면 「자동 저장」이라고만 적는다', () => {
    render(<EdStatus lines={12} savedAt={null} peeks={0} />);
    expect(screen.getByText('12줄 · 자동 저장')).toBeTruthy();
  });

  it('저장 시각은 HH:MM 으로 적는다', () => {
    const at = new Date(2026, 8, 3, 9, 5).getTime();
    render(<EdStatus lines={20} savedAt={at} peeks={0} />);
    expect(hhmm(at)).toBe('09:05');
    expect(screen.getByText('20줄 · 저장됨 09:05')).toBeTruthy();
  });

  it('원본 본 횟수를 그대로 낸다 — 감점 문구는 없다', () => {
    const { container } = render(<EdStatus lines={3} savedAt={null} peeks={4} />);
    const spans = [...container.querySelectorAll('.ed-status > span')];
    const peek = spans.find((el) => el.textContent?.startsWith('원본 본 횟수'));
    expect(peek?.textContent).toBe('원본 본 횟수 4');
    expect(peek?.querySelector('b')?.textContent).toBe('4');
    expect(container.textContent).not.toContain('감점');
  });

  it('손으로 앉힌 글자를 백분율로 낸다 — 감점 문구는 없다 (D143)', () => {
    const { container } = render(
      <EdStatus
        lines={12}
        savedAt={null}
        peeks={1}
        assist={{ keyed: 88, assisted: 12, pasted: 0, accepted: 3 }}
      />,
    );
    const spans = [...container.querySelectorAll('.ed-status > span')];
    const hand = spans.find((el) => el.textContent?.startsWith('손으로 앉힌 글자'));
    expect(hand?.textContent).toBe('손으로 앉힌 글자 88%');
    expect(container.textContent).not.toContain('감점');
  });

  it('안 센 판에는 그 칸이 아예 없다 — 「0 %」와 「안 쟀다」는 다른 말이다', () => {
    const { container } = render(<EdStatus lines={3} savedAt={null} peeks={0} />);
    expect(container.textContent).not.toContain('손으로 앉힌 글자');
  });

  it('키 안내 3개는 Kbd 로 찍는다', () => {
    const { container } = render(<EdStatus lines={0} savedAt={null} peeks={0} />);
    expect([...container.querySelectorAll('kbd.k')].map((el) => el.textContent)).toEqual(['Tab', '`', '⌘↵']);
  });
});
