// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReprintLadder } from './ReprintLadder';
import type { LadderCard, RungNo } from './ReprintLadder';

afterEach(cleanup);

const CARD: LadderCard = {
  dict: [
    { k: '한 줄로', t: '앞이 <b>null</b> 이면 뒤를 건너뛴다.' },
    { k: '왜 필요한가', t: '없을 수도 있는 값을 다룰 때 줄이 터지지 않게 한다.' },
    { k: '42행 안에서', steps: ['cart 를 본다', '없으면 undefined', '있으면 items 로 간다'] },
  ],
  prereq: [
    { conceptId: 'ts/nullish', n: '없을 때의 기본값', ly: 0, state: 'gap', note: '아직 안 찍힘', cardId: 12 },
    { conceptId: 'ts/object', n: '객체 접근', ly: 3, state: 'ok', note: '3일 전 · 3겹' },
  ],
  uses: [{ siteId: 7, f: 'checkout.ts', l: 88, code: 'const id = user?.id;' }],
};

const ASK = {
  text: '',
  onText: () => undefined,
  prompt: undefined,
  onBuild: () => undefined,
  onCopy: () => undefined,
};

function Ladder(props: { rung?: RungNo; onRung?: (r: RungNo) => void; onJump?: () => void }) {
  return (
    <ReprintLadder
      rung={props.rung ?? 1}
      onRung={props.onRung ?? (() => undefined)}
      lyFrom={3}
      lyTo={2}
      card={CARD}
      prereqDone={[]}
      nextWas="11일 뒤"
      onJump={props.onJump}
      ask={ASK}
    />
  );
}

describe('ReprintLadder', () => {
  it('목업 클래스를 그대로 붙인다 — 세션 .ladder 는 .reprint 로 개명했다', () => {
    const { container } = render(<Ladder />);
    expect(container.querySelector('.reprint')).not.toBeNull();
    expect(container.querySelector('.ladder')).toBeNull();
    for (const cls of ['.ld-head', '.ld-gain', '.rungs', '.rung', '.rung-body']) {
      expect(container.querySelector(cls), cls).not.toBeNull();
    }
  });

  it('tablist · tab · tabpanel 로 짠다', () => {
    render(<Ladder rung={2} />);
    expect(screen.getByRole('tablist', { name: '다시 찍기 4단' })).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel')).toBeTruthy();
  });

  it('겹이 내려가는 것을 이득으로 적는다', () => {
    const { container } = render(<Ladder />);
    const gain = container.querySelector('.ld-gain');
    expect(gain?.textContent).toContain('3겹');
    expect(gain?.textContent).toContain('2겹');
    expect(gain?.textContent).toContain('11일 뒤');
    expect(gain?.textContent).toContain('오늘 안에');
  });

  it('열면 포커스가 현재 단으로 온다', () => {
    render(<Ladder rung={3} />);
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[2]);
  });

  it('← → 는 포커스만 옮긴다 — 여는 것은 Enter/Space 다', async () => {
    const onRung = vi.fn();
    const user = userEvent.setup();
    render(<Ladder rung={1} onRung={onRung} />);
    const tabs = screen.getAllByRole('tab');

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[1]);
    expect(onRung).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');
    expect(onRung).toHaveBeenCalledWith(2);
  });

  it('← 는 처음에서 끝으로 돈다', async () => {
    const user = userEvent.setup();
    render(<Ladder rung={1} />);
    const tabs = screen.getAllByRole('tab');

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tabs[3]);
  });

  it('Home · End 로 처음과 끝으로 간다', async () => {
    const user = userEvent.setup();
    render(<Ladder rung={2} />);
    const tabs = screen.getAllByRole('tab');

    await user.keyboard('{End}');
    expect(document.activeElement).toBe(tabs[3]);

    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('Space 로도 연다', async () => {
    const onRung = vi.fn();
    const user = userEvent.setup();
    render(<Ladder rung={1} onRung={onRung} />);

    await user.keyboard('{ArrowRight}{ArrowRight}');
    await user.keyboard('[Space]');
    expect(onRung).toHaveBeenCalledWith(3);
  });

  it('1~4 는 포커스가 사다리 안일 때 단을 고른다 (D11)', async () => {
    const onRung = vi.fn();
    const user = userEvent.setup();
    render(<Ladder rung={1} onRung={onRung} />);

    await user.keyboard('[Digit4]');
    expect(onRung).toHaveBeenCalledWith(4);
  });

  it('1~4 는 사다리 밖으로 새지 않는다 — 세션의 「보기 고르기」와 겹치지 않게 멈춘다', async () => {
    const outside = vi.fn();
    const user = userEvent.setup();
    document.addEventListener('keydown', outside);
    try {
      render(<Ladder rung={1} />);
      await user.keyboard('[Digit2]');
      expect(outside).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', outside);
    }
  });

  it('입력 칸 안에서는 1~4 가 글자다', async () => {
    const onRung = vi.fn();
    const user = userEvent.setup();
    render(<Ladder rung={4} onRung={onRung} />);

    const box = screen.getByLabelText('막힌 지점');
    box.focus();
    await user.keyboard('[Digit2]');
    expect(onRung).not.toHaveBeenCalled();
  });

  it('단마다 제 몸을 그린다', () => {
    const one = render(<Ladder rung={1} />);
    expect(one.container.querySelector('.dict')).not.toBeNull();
    cleanup();

    const two = render(<Ladder rung={2} />);
    expect(two.container.querySelector('.prereq')).not.toBeNull();
    cleanup();

    const three = render(<Ladder rung={3} />);
    expect(three.container.querySelector('.uses')).not.toBeNull();
    cleanup();

    const four = render(<Ladder rung={4} />);
    expect(four.container.querySelector('.askbox')).not.toBeNull();
  });

  it('눌러서도 단을 연다', async () => {
    const onRung = vi.fn();
    const user = userEvent.setup();
    render(<Ladder rung={1} onRung={onRung} />);

    await user.click(screen.getAllByRole('tab')[2] as HTMLElement);
    expect(onRung).toHaveBeenCalledWith(3);
  });
});
