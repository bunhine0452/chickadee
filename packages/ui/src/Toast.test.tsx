// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Toast } from './Toast';

afterEach(cleanup);

describe('Toast', () => {
  it('떠 있을 때만 .on 이고 포커스를 받지 않는다', () => {
    const { rerender } = render(<Toast msg="먼저 고르세요" on={false} />);
    const el = screen.getByRole('status');
    expect(el.className).toBe('toast');
    expect(el.getAttribute('tabindex')).toBeNull();

    rerender(<Toast msg="먼저 고르세요" on />);
    expect(screen.getByRole('status').className).toBe('toast on');
  });

  it('부제는 small 로 따로 붙는다', () => {
    render(<Toast msg="세션에서 나왔습니다." sub="진행은 저장됐습니다" on />);
    expect(screen.getByRole('status').querySelector('small')?.textContent).toBe('진행은 저장됐습니다');
  });
});
