// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import type { HomeSheet } from '../../screens/home/data';
import { Sheet } from './Sheet';

afterEach(cleanup);

const NOW = Date.UTC(2026, 8, 3, 9, 0, 0);

const SHEET: HomeSheet = {
  unitId: 2,
  name: '로그인 흐름',
  rootPath: 'src/features/auth', zero: false,
  files: 8,
  avgLayer: 2,
  state: 'current',
  nodes: [
    {
      conceptId: 'ts/destructuring',
      track: 't0',
      nameKo: '구조분해 할당',
      token: null,
      layer: 2,
      shownLayer: 2,
      state: 'done',
      dueAt: null,
    },
    {
      conceptId: 'ts/optional-chaining',
      track: 't0',
      nameKo: '옵셔널 체이닝',
      token: '?.',
      layer: 1,
      shownLayer: 1,
      state: 'current',
      dueAt: null,
    },
  ],
};

const DONE: HomeSheet = { ...SHEET, unitId: 1, name: '장바구니', state: 'done' };

describe('Sheet', () => {
  it('대지 이름·경로·개수를 머리에 적는다', () => {
    render(<Sheet sheet={SHEET} no={2} now={NOW} />);
    const article = screen.getByRole('article', { name: /로그인 흐름/ });
    expect(article.textContent).toContain('src/features/auth · 파일 8개 · 개념 2개');
    expect(article.textContent).toContain('학습 중 1 / 2');
  });

  it('완료 대지는 도장을 얹는다', () => {
    const { container } = render(<Sheet sheet={DONE} no={1} now={NOW} />);
    expect(container.querySelector('.stamp')?.textContent).toBe('완료');
  });

  it('Enter 로 상세를 열고 Esc 로 닫으며 포커스가 스티커로 돌아온다', async () => {
    const user = userEvent.setup();
    render(<Sheet sheet={SHEET} no={2} now={NOW} />);

    const node = screen.getByRole('button', { name: /옵셔널 체이닝/ });
    node.focus();
    await user.keyboard('{Enter}');

    const detail = screen.getByRole('region', { name: '옵셔널 체이닝 상세' });
    expect(detail).toBe(document.activeElement);
    expect(node.getAttribute('aria-expanded')).toBe('true');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('region', { name: '옵셔널 체이닝 상세' })).toBeNull();
    expect(node.getAttribute('aria-expanded')).toBe('false');
    expect(node).toBe(document.activeElement);
  });

  it('대지 하나에 상세는 하나만 열린다', async () => {
    const user = userEvent.setup();
    render(<Sheet sheet={SHEET} no={2} now={NOW} />);

    await user.click(screen.getByRole('button', { name: /구조분해 할당/ }));
    expect(screen.getByRole('region', { name: '구조분해 할당 상세' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /옵셔널 체이닝/ }));
    expect(screen.queryByRole('region', { name: '구조분해 할당 상세' })).toBeNull();
    expect(screen.getByRole('region', { name: '옵셔널 체이닝 상세' })).toBeTruthy();
  });

  it('길잡이 말풍선은 접근성 트리에 없다 — 같은 문구는 LiveRegion 이 읽는다', () => {
    render(<Sheet sheet={SHEET} no={2} guide="다음은 「옵셔널 체이닝」입니다." now={NOW} />);
    expect(screen.queryByText(/다음은 「옵셔널 체이닝」입니다/)?.closest('[aria-hidden="true"]')).toBeTruthy();
  });
});

describe('0장 대지 (D136)', () => {
  const ZERO: HomeSheet = {
    ...SHEET, unitId: 9, name: '0장 — 이 언어의 바닥', rootPath: null, zero: true, files: 0,
  };

  it('머리가 몇 장이고 끝이 있다는 것을 말한다 — 「경로 없음 · 파일 0개」가 아니라', () => {
    render(<Sheet sheet={ZERO} no={1} now={NOW} />);
    expect(screen.getByText(/끝이 있는 도입부/)).toBeTruthy();
    expect(screen.queryByText(/경로 없음/)).toBeNull();
  });

  it('도입 문단이 장수를 적는다 — 「과정」이 아니라는 약속이다', () => {
    render(<Sheet sheet={ZERO} no={1} now={NOW} />);
    const lead = screen.getByText(/이 언어를 처음 보시는군요/);
    expect(lead.textContent).toContain(String(ZERO.nodes.length));
    expect(lead.className).toContain('note');
  });

  it('다 찍으면 다시 열 수 있다고 말한다 — 사라지지 않는다', () => {
    render(<Sheet sheet={{ ...ZERO, state: 'done' }} no={1} now={NOW} />);
    expect(screen.getByText(/언제든 다시 열 수 있습니다/)).toBeTruthy();
  });

  it('「기능 N」 꼬리표를 달지 않는다 — 리포의 기능이 아니다', () => {
    render(<Sheet sheet={ZERO} no={1} now={NOW} />);
    expect(screen.queryByText(/기능 1/)).toBeNull();
  });

  it('보통 대지는 경로와 파일 수를 그대로 낸다', () => {
    render(<Sheet sheet={SHEET} no={2} now={NOW} />);
    expect(screen.getByText(/src\/features\/auth/)).toBeTruthy();
  });
});
