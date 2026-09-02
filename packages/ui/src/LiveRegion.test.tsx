// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANNOUNCE_MAX_LEN } from './announce';
import { LiveRegion, REANNOUNCE_DELAY_MS } from './LiveRegion';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('LiveRegion', () => {
  it('앱에 하나뿐인 polite 낭독 지점이다', () => {
    render(<LiveRegion text="정합 — 맞았습니다. 잉크 3겹. Space 로 다음." />);
    const el = screen.getByRole('status');
    expect(el.id).toBe('live');
    expect(el.className).toBe('vh');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('들어온 문구도 announce 규약으로 다시 정규화된다', () => {
    render(<LiveRegion text={`<b>정합</b> — ${'맞았습니다 '.repeat(20)}`} />);
    const text = screen.getByRole('status').textContent ?? '';
    expect(text).not.toContain('<');
    expect(text.length).toBeLessThanOrEqual(ANNOUNCE_MAX_LEN);
    expect(text.endsWith('.')).toBe(true);
  });

  it('같은 문장을 다시 읽히려면 30ms 비웠다 채운다', () => {
    const { rerender } = render(<LiveRegion text="정합." nonce={0} />);
    expect(screen.getByRole('status').textContent).toBe('정합.');

    rerender(<LiveRegion text="정합." nonce={1} />);
    expect(screen.getByRole('status').textContent).toBe('');

    act(() => {
      vi.advanceTimersByTime(REANNOUNCE_DELAY_MS);
    });
    expect(screen.getByRole('status').textContent).toBe('정합.');
  });
});
