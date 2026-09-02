// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Kbd } from './Kbd';

afterEach(cleanup);

describe('Kbd', () => {
  it('kbd 요소에 목업 클래스 k 를 붙인다', () => {
    render(<Kbd keys="Enter" />);
    const el = screen.getByText('Enter');
    expect(el.tagName).toBe('KBD');
    expect(el.className).toBe('k');
  });
});
