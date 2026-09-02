// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Dee } from './Dee';
import { DEE_MOTIONS, DEE_MOTION_BUDGET_MS, DEE_MOTION_CLASSES } from './useDeeMotion';

afterEach(cleanup);

const deeOf = (container: Element) => container.querySelector('svg.dee') as SVGSVGElement;

describe('useDeeMotion — 예산', () => {
  it('hop·tilt·hang 은 720ms 예산 안이다', () => {
    for (const m of ['hop', 'tilt', 'hang'] as const) {
      expect(DEE_MOTIONS[m].durationMs).toBeLessThanOrEqual(DEE_MOTION_BUDGET_MS);
    }
  });

  it('LIFER 만 예산을 넘고 1.36s 를 넘지 않는다 (정본 §3.9 명시 예외)', () => {
    expect(DEE_MOTIONS.lifer.durationMs).toBeGreaterThan(DEE_MOTION_BUDGET_MS);
    expect(DEE_MOTIONS.lifer.durationMs).toBeLessThanOrEqual(1360);
  });

  it('상시 애니메이션이 없다 — peek 는 2회로 끝난다 (00 D11)', () => {
    for (const m of DEE_MOTION_CLASSES) {
      expect(Number.isFinite(DEE_MOTIONS[m].iterations)).toBe(true);
    }
    expect(DEE_MOTIONS.peek.iterations).toBe(2);
  });
});

describe('useDeeMotion — 동작 클래스', () => {
  it('동작을 클래스로 붙인다', () => {
    const { container } = render(<Dee ly={4} motion="hop" />);
    expect(deeOf(container).classList.contains('hop')).toBe(true);
  });

  it('동작이 바뀌면 앞 동작 클래스는 남지 않는다', () => {
    const { container, rerender } = render(<Dee ly={4} motion="hop" />);
    rerender(<Dee ly={4} motion="tilt" />);
    const el = deeOf(container);
    expect(el.classList.contains('hop')).toBe(false);
    expect(el.classList.contains('tilt')).toBe(true);
  });

  it('motion 이 null 이면 아무 클래스도 없다', () => {
    const { container, rerender } = render(<Dee ly={4} motion="lifer" />);
    rerender(<Dee ly={4} motion={null} />);
    expect(deeOf(container).className.baseVal).toBe('dee');
  });
});

describe('useDeeMotion — 타이핑 중 모션 0 (05 §6)', () => {
  it('타이핑 중이면 motion 을 통째로 무시한다', () => {
    const { container } = render(<Dee ly={4} motion="hop" typing />);
    expect(deeOf(container).classList.contains('hop')).toBe(false);
  });

  it('타이핑이 시작되면 붙어 있던 동작도 벗긴다', () => {
    const { container, rerender } = render(<Dee ly={4} motion="tilt" />);
    expect(deeOf(container).classList.contains('tilt')).toBe(true);
    rerender(<Dee ly={4} motion="tilt" typing />);
    expect(deeOf(container).classList.contains('tilt')).toBe(false);
  });

  it('타이핑이 끝나면 다시 움직인다', () => {
    const { container, rerender } = render(<Dee ly={4} motion="hop" typing />);
    rerender(<Dee ly={4} motion="hop" />);
    expect(deeOf(container).classList.contains('hop')).toBe(true);
  });
});

describe('useDeeMotion — 감축 모드 (05 §6)', () => {
  it('감축 모드에서도 클래스는 그대로 붙는다 — 최종 포즈가 남아야 한다', () => {
    const { container } = render(<Dee ly={4} motion="hang" reducedMotion />);
    expect(deeOf(container).classList.contains('hang')).toBe(true);
  });

  it('감축 모드는 동작을 지우는 게 아니라 전환만 없앤다', () => {
    for (const m of DEE_MOTION_CLASSES) {
      const { container, unmount } = render(<Dee ly={4} motion={m} reducedMotion />);
      expect(deeOf(container).classList.contains(m)).toBe(true);
      unmount();
    }
  });

  it('감축 모드여도 타이핑 중이면 모션 0 이 이긴다', () => {
    const { container } = render(<Dee ly={4} motion="hang" reducedMotion typing />);
    expect(deeOf(container).classList.contains('hang')).toBe(false);
  });
});
