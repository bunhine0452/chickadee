// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CLONE_STAGES, Stepper } from './Stepper';

afterEach(cleanup);

describe('Stepper', () => {
  it('목업 클래스를 그대로 붙이고 3단을 목록으로 낸다', () => {
    const { container } = render(<Stepper stage={1} />);
    expect(container.querySelector('.stepper')).not.toBeNull();
    expect(container.querySelectorAll('.stepper .step')).toHaveLength(3);
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('단 이름과 부제는 목업 STAGES 그대로다', () => {
    const { container } = render(<Stepper stage={2} />);
    const steps = [...container.querySelectorAll('.step')];
    expect(steps.map((el) => el.querySelector('span')?.textContent)).toEqual(['보고 치기', '뼈대만', '백지']);
    expect(steps.map((el) => el.querySelector('small')?.textContent)).toEqual([
      '원본을 보면서 그대로',
      '주석과 시그니처만',
      '한 줄 스펙만',
    ]);
    expect(CLONE_STAGES).toHaveLength(3);
  });

  it('지난 단은 done, 지금 단은 cur, 다음 단은 맨 단이다', () => {
    const { container } = render(<Stepper stage={2} />);
    const steps = [...container.querySelectorAll('.step')];
    expect(steps[0]?.className).toContain('done');
    expect(steps[0]?.className).not.toContain('cur');
    expect(steps[1]?.className).toContain('cur');
    expect(steps[1]?.className).not.toContain('done');
    expect(steps[2]?.className).toBe('step');
  });

  it('지금 단만 aria-current 로 말한다 — 색과 굵기는 낭독되지 않는다', () => {
    const { container } = render(<Stepper stage={3} />);
    const marked = [...container.querySelectorAll('[aria-current]')];
    expect(marked).toHaveLength(1);
    expect(marked[0]?.getAttribute('aria-current')).toBe('step');
    expect(marked[0]?.textContent).toContain('백지');
  });

  it('1단계에서는 done 이 없다', () => {
    const { container } = render(<Stepper stage={1} />);
    expect(container.querySelectorAll('.step.done')).toHaveLength(0);
    expect(container.querySelectorAll('.step.cur')).toHaveLength(1);
  });
});
