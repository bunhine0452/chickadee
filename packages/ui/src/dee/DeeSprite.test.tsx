// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DEE_PLATES } from './deePlates';
import { DeeSprite } from './DeeSprite';

afterEach(cleanup);

describe('DeeSprite', () => {
  it('심볼 3종 + 로고를 한 벌로 박는다', () => {
    const { container } = render(<DeeSprite />);
    for (const id of ['dee', 'deeBird', 'deeHead', 'logo']) {
      expect(container.querySelector(`symbol#${id}`)).not.toBeNull();
    }
  });

  it('판 6장을 한 벌만 두고 심볼이 공유한다', () => {
    const { container } = render(<DeeSprite />);
    const plates = container.querySelectorAll('#deePlates > path');
    expect(plates).toHaveLength(DEE_PLATES.length);
    expect(container.querySelectorAll('use[href="#deePlates"]').length).toBeGreaterThanOrEqual(4);
  });

  it('판 색은 CSS 변수로만 들어간다 — 겹은 색만 바꾼다', () => {
    const { container } = render(<DeeSprite />);
    for (const path of container.querySelectorAll<SVGPathElement>('#deePlates > path')) {
      expect(path.style.fill).toMatch(/^var\(--l[a-z]+\)$/);
    }
  });

  it('하프톤 스크린과 다이컷 클립이 있다', () => {
    const { container } = render(<DeeSprite />);
    expect(container.querySelector('pattern#htGray')).not.toBeNull();
    expect(container.querySelector('pattern#htGrayL')).not.toBeNull();
    expect(container.querySelector('clipPath#deeBirdClip')).not.toBeNull();
  });

  it('스프라이트 자체는 접근성 트리에 없다', () => {
    const { container } = render(<DeeSprite />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });
});
