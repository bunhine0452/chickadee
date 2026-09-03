// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** `settings` 테이블의 행. 테스트가 이 배열을 갈아 끼워 「재실행」을 흉내낸다. */
let rows: { key: string; value_json: string; updated_at: number }[] = [];
/** `settings.set` 으로 나간 것 — E7 이 확인하는 「저장했나」다. */
let saved: { key: string; valueJson: string }[] = [];

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string) => {
        if (name !== 'settings.get_all') throw new Error(`예상 밖 statement: ${name}`);
        return Promise.resolve(rows);
      },
      exec: (name: string, params: { key: string; valueJson: string }) => {
        if (name !== 'settings.set') throw new Error(`예상 밖 statement: ${name}`);
        saved.push({ key: params.key, valueJson: params.valueJson });
        rows = [
          ...rows.filter((r) => r.key !== params.key),
          { key: params.key, value_json: params.valueJson, updated_at: 0 },
        ];
        return Promise.resolve({ changes: 1, lastId: 0 });
      },
    },
  },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
}));

const { Masthead } = await import('./Masthead.js');

const MASTHEAD = { concepts: 21, printed: 9, avgLayer: 2.4 };

function setup(onSettings: () => void = () => undefined) {
  return render(
    <Masthead
      repoName="cart-shop-web"
      today="2026-09-03"
      streak={7}
      masthead={MASTHEAD}
      onSettings={onSettings}
    />,
  );
}

beforeEach(() => {
  rows = [];
  saved = [];
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-trim');
});

describe('Masthead', () => {
  it('작업 지시서에 리포·날짜·연속일·겹 평균을 적는다', () => {
    setup();
    const ticket = screen.getByRole('group', { name: '작업 지시서' });
    expect(ticket.textContent).toContain('cart-shop-web');
    expect(ticket.textContent).toContain('2026-09-03');
    expect(ticket.textContent).toContain('7');
    expect(ticket.textContent).toContain('2.4');
  });

  it('리포 칸은 전환 자리다 — 목록은 아직 없다', () => {
    setup();
    const button = screen.getByRole('button', { name: '리포' });
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('스위치 두 개가 <html> 의 data-theme · data-trim 을 세운다', async () => {
    const user = userEvent.setup();
    setup();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-trim')).toBe('off');

    await user.click(screen.getByRole('switch', { name: '주간반 · 야간반 전환' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await user.click(screen.getByRole('switch', { name: '인쇄 부속 보이기 · 숨기기' }));
    expect(document.documentElement.getAttribute('data-trim')).toBe('on');
  });

  // ───────── E7 (06 §1.5) ─────────

  it('스위치를 누르면 settings 테이블에 저장한다', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('switch', { name: '주간반 · 야간반 전환' }));
    await user.click(screen.getByRole('switch', { name: '인쇄 부속 보이기 · 숨기기' }));

    await waitFor(() => expect(saved).toHaveLength(2));
    expect(saved).toEqual([
      { key: 'theme', valueJson: '"dark"' },
      { key: 'trim', valueJson: '"on"' },
    ]);
  });

  it('재실행하면 저장된 야간반·부속 숨김이 그대로 돌아온다 (E7)', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('switch', { name: '주간반 · 야간반 전환' }));
    await user.click(screen.getByRole('switch', { name: '인쇄 부속 보이기 · 숨기기' }));
    await waitFor(() => expect(saved).toHaveLength(2));

    // 「재실행」 — 화면을 통째로 버리고 속성도 지운 뒤 같은 `settings` 행 위에서 다시 연다.
    cleanup();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-trim');
    setup();

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.getAttribute('data-trim')).toBe('on');
    });
    expect(screen.getByRole('switch', { name: '주간반 · 야간반 전환' }).getAttribute('aria-checked'))
      .toBe('true');
  });

  it('설정을 못 읽어도 기본 모양으로 뜬다', async () => {
    rows = [{ key: 'theme', value_json: 'not json', updated_at: 0 }];
    setup();
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('light'));
  });

  it('설정 버튼이 설정 화면을 연다', async () => {
    const user = userEvent.setup();
    const onSettings = vi.fn();
    setup(onSettings);
    await user.click(screen.getByRole('button', { name: '설정' }));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
