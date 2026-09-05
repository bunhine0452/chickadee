// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FeedbackSlot, FEEDBACK_SLOT_MIN_HEIGHT_PX, idleNoteText } from './FeedbackSlot';

afterEach(cleanup);

/**
 * 게이트는 CSS 세 줄에 있다. jsdom 은 레이아웃을 계산하지 않고 vitest 는 CSS 를 비워서
 * 넘기므로(`css: false`), 선언 자체를 파일에서 읽어 지킨다. 경로는 vitest 의 뿌리(리포 루트)
 * 기준이다 — `import.meta.url` 은 jsdom 환경에서 file: 스킴이 아니다.
 */
const CSS = readFileSync(join(process.cwd(), 'apps/desktop/src/components/plate/FeedbackSlot.css'), 'utf8');

/** 판정란 위에 놓이는 글. 「밀리지 않는다」의 기준점이다. */
function Above() {
  return <p className="ask">어느 자리가 이 줄의 주인인가요?</p>;
}

const GRADED = {
  state: 'wrong' as const,
  stamp: { text: '어긋남', sub: 'OFF REGISTER', tone: 'yellow' as const, rotate: 5 },
  title: '어긋났습니다 — <code>items</code> 를 골랐습니다',
  body: '<b>items</b> 가 참이 되는 조건은 앞이 이미 객체일 때뿐입니다.',
  rule: '앞이 <code>null</code> 이면 뒤를 건너뛴다.',
  gain: { from: 2 as const, to: 2 as const, text: '잉크 <b>2겹</b> 그대로' },
};

describe('FeedbackSlot — 판정란 0px 게이트 (정본 §3-3)', () => {
  it('비어 있을 때와 채워졌을 때 위 글의 DOM 자리가 같다', () => {
    const idle = render(
      <>
        <Above />
        <FeedbackSlot state="idle" />
      </>,
    );
    const idleShape = idle.container.innerHTML.slice(0, idle.container.innerHTML.indexOf('<div class="slot"'));
    cleanup();

    const graded = render(
      <>
        <Above />
        <FeedbackSlot {...GRADED} />
      </>,
    );
    const gradedShape = graded.container.innerHTML.slice(0, graded.container.innerHTML.indexOf('<div class="slot"'));

    // 판정이 들어와도 위쪽 마크업은 글자 하나 안 바뀐다 — 밀 것이 없다.
    expect(gradedShape).toBe(idleShape);
  });

  it('빈 안내는 지우지 않고 hidden 으로만 덮는다 — 지우면 격자 칸이 무너진다', () => {
    const { container, rerender } = render(<FeedbackSlot state="idle" />);
    const idleBox = container.querySelector('.slot-idle');
    expect(idleBox).not.toBeNull();
    expect(idleBox?.hasAttribute('hidden')).toBe(false);

    rerender(<FeedbackSlot {...GRADED} />);
    const stillThere = container.querySelector('.slot-idle');
    expect(stillThere).not.toBeNull();
    expect(stillThere?.hasAttribute('hidden')).toBe(true);
  });

  it('판정 상자(.fb)는 비어 있을 때도 자리에 있다', () => {
    const { container } = render(<FeedbackSlot state="idle" />);
    expect(container.querySelector('.slot .fb')).not.toBeNull();
  });

  it('CSS 가 118px 을 미리 잡고 두 겹을 같은 격자 칸에 놓는다', () => {
    expect(CSS).toMatch(new RegExp(`\\.slot\\s*\\{[^}]*min-height:\\s*${FEEDBACK_SLOT_MIN_HEIGHT_PX}px`));
    expect(CSS).toMatch(/\.slot-idle\s*\{[^}]*grid-area:\s*1\s*\/\s*1/);
    expect(CSS).toMatch(/\.fb\s*\{[^}]*grid-area:\s*1\s*\/\s*1/);
  });
});

describe('FeedbackSlot', () => {
  it('목업 클래스를 그대로 붙인다', () => {
    const { container } = render(<FeedbackSlot {...GRADED} />);
    for (const cls of ['.slot', '.slot-idle', '.fb', '.fb .stampbox']) {
      expect(container.querySelector(cls), cls).not.toBeNull();
    }
  });

  it('비어 있으면 왜 비어 있는지를 그 자리에 적는다', () => {
    render(<FeedbackSlot state="idle" />);
    expect(screen.getByText(idleNoteText())).toBeTruthy();
  });

  it('판정란은 낭독 지점이 아니다 — 포커스도 뺏지 않는다 (D114)', () => {
    const { container } = render(<FeedbackSlot {...GRADED} />);
    // D114 — 낭독은 오버레이의 `.vh#live` 한 곳이다. 판정란은 낭독 지점이 아니다.
    expect(container.querySelector('.fb')?.getAttribute('aria-live')).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('진단은 「틀렸다」가 아니라 고른 것이 참이 되는 조건을 적는다', () => {
    const { container } = render(<FeedbackSlot {...GRADED} />);
    expect(container.querySelector('.fb h4')?.textContent).toContain('items');
    expect(container.textContent).toContain('참이 되는 조건');
  });

  it('맞았으면 .fb.right, 틀렸으면 붙지 않는다', () => {
    const ok = render(<FeedbackSlot state="right" title="맞았습니다" />);
    expect(ok.container.querySelector('.fb')?.className).toContain('right');
    cleanup();

    const no = render(<FeedbackSlot {...GRADED} />);
    expect(no.container.querySelector('.fb')?.className).not.toContain('right');
  });

  it('가장 날카로운 자리는 코드 판으로 그린다', () => {
    const { container } = render(
      <FeedbackSlot {...GRADED} edge={{ h: '이 경우엔 이렇게 터집니다', code: ['cart = null;', 'cart.items'] }} />,
    );
    const edge = container.querySelector('.fb .edge');
    expect(edge?.querySelector('b')?.textContent).toBe('이 경우엔 이렇게 터집니다');
    expect(edge?.querySelectorAll('.code .ln')).toHaveLength(2);
  });

  it('겹 이동은 막대 둘과 문장으로 낸다 (D179 — 마스코트가 아니다)', () => {
    const { container } = render(<FeedbackSlot {...GRADED} gain={{ from: 2, to: 3, text: '잉크 <b>3겹</b>' }} />);
    const gain = container.querySelector('.fb .gain');
    expect(gain?.querySelectorAll('.passes')).toHaveLength(2);
    expect(gain?.querySelectorAll('.passes i.on')).toHaveLength(5);
    expect(gain?.querySelector('.dee, .dee-sticker')).toBeNull();
    expect(gain?.textContent).toContain('3겹');
  });

  it('서식 글의 위험한 태그는 정화한다', () => {
    const { container } = render(<FeedbackSlot {...GRADED} body={'<b>ok</b><img src=x onerror=1>'} />);
    expect(container.querySelector('.fb img')).toBeNull();
  });
});
