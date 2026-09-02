// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { IngestScreen } from './IngestScreen.js';
import { BOXES, positionOf } from './phases.js';

afterEach(cleanup);

const base = {
  repoName: 'cart-shop',
  at: null,
  warnings: [],
  done: false,
  onCancel: () => undefined,
};

describe('4단계 매핑 (D47)', () => {
  test('Rust 의 네 단계와 TS 의 두 단계가 네 칸으로 접힌다', () => {
    expect(BOXES.map((b) => b.label)).toEqual(['git 읽기', '파싱', '개념 추출', '판 짜기']);
    expect(positionOf({ phase: 'walk', done: 1, total: 2 }).pos).toBe(0);
    expect(positionOf({ phase: 'git', done: 1, total: 2 }).pos).toBe(0);
    expect(positionOf({ phase: 'parse', done: 1, total: 2 }).pos).toBe(1);
    expect(positionOf({ phase: 'write', done: 1, total: 2 }).pos).toBe(2);
    expect(positionOf({ phase: 'derive', done: 1, total: 2 }).pos).toBe(2);
    expect(positionOf({ phase: 'cards', done: 1, total: 2 }).pos).toBe(3);
  });

  test('총량을 모르면 칸 안의 진행은 비운다 — 커밋 수가 그렇다', () => {
    expect(positionOf({ phase: 'git', done: 40, total: 0 }).progress).toBeUndefined();
    expect(positionOf({ phase: 'parse', done: 1, total: 4 }).progress).toBe(0.25);
  });
});

describe('판 짜기 화면', () => {
  test('스피너가 아니라 시간 비례 큐로 말한다', () => {
    render(<IngestScreen {...base} at={{ phase: 'parse', done: 3, total: 6 }} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('2번째 「파싱」');
  });

  test('리포에 쓰지 않는다는 것을 먼저 말한다', () => {
    render(<IngestScreen {...base} />);
    expect(screen.getByText(/리포에는 아무것도 쓰지 않습니다/)).toBeDefined();
  });

  test('지금 읽는 파일은 리포 상대 경로다', () => {
    render(<IngestScreen {...base} currentPath="src/features/cart/useCart.ts" />);
    expect(screen.getByText('src/features/cart/useCart.ts')).toBeDefined();
  });

  test('건너뛴 파일은 사유를 사람 말로 낸다', () => {
    render(<IngestScreen {...base} warnings={[{ relPath: 'src/big.ts', reason: 'oversize' }]} />);
    expect(screen.getByText('src/big.ts')).toBeDefined();
    expect(screen.getByText(/너무 커서 건너뜀/)).toBeDefined();
  });

  test('건너뛴 파일이 많으면 다섯 개만 보이고 나머지는 수로 말한다', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ relPath: `src/f${i}.ts`, reason: 'binary' }));
    render(<IngestScreen {...base} warnings={many} />);
    expect(screen.getByText('건너뛴 파일 9개')).toBeDefined();
    expect(screen.getByText('그 밖 4개')).toBeDefined();
  });

  test('그만 읽기를 누르면 취소가 나간다', async () => {
    const onCancel = vi.fn();
    render(<IngestScreen {...base} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '그만 읽기' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  test('취소를 누른 뒤에는 버튼이 잠긴다', () => {
    render(<IngestScreen {...base} cancelling />);
    expect((screen.getByRole('button', { name: '멈추는 중…' }) as HTMLButtonElement).disabled).toBe(true);
  });

  test('끝나면 취소 버튼이 사라지고 다음 할 일을 말한다', () => {
    render(<IngestScreen {...base} done />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('다 읽었습니다')).toBeDefined();
  });

  test('실패하면 그 문구가 자리를 대신한다', () => {
    render(<IngestScreen {...base} error="리포를 읽지 못했습니다." />);
    expect(screen.getByText('리포를 읽지 못했습니다.')).toBeDefined();
  });
});
