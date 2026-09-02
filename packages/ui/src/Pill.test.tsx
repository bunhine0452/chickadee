// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Pill } from './Pill';

afterEach(cleanup);

describe('Pill', () => {
  it('트랙 클래스를 목업 이름 그대로 붙인다', () => {
    render(<Pill track="t1">T1</Pill>);
    expect(screen.getByText('T1').className).toBe('pill t1');
  });

  it('색면 없이도 글자로 트랙을 읽을 수 있다', () => {
    render(<Pill ghost>다시 찍기</Pill>);
    const el = screen.getByText('다시 찍기');
    expect(el.className).toBe('pill ghost');
    expect(el.textContent).toBe('다시 찍기');
  });
});
