// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { IngestScreen } from './IngestScreen.js';
import { boxes, positionOf } from './phases.js';

afterEach(cleanup);

const base = {
  repoName: 'cart-shop',
  at: null,
  warnings: [],
  done: false,
  onCancel: () => undefined,
  onDone: () => undefined,
};

describe('4단계 매핑 (D47)', () => {
  test('Rust 의 네 단계와 TS 의 두 단계가 네 칸으로 접힌다', () => {
    expect(boxes().map((b) => b.label)).toEqual(['코드 읽기', '히스토리', '개념 추출', '판 짜기']);
    expect(positionOf({ phase: 'walk', done: 1, total: 2 }).pos).toBe(0);
    expect(positionOf({ phase: 'parse', done: 1, total: 2 }).pos).toBe(0);
    expect(positionOf({ phase: 'git', done: 1, total: 2 }).pos).toBe(1);
    expect(positionOf({ phase: 'write', done: 1, total: 2 }).pos).toBe(1);
    expect(positionOf({ phase: 'derive', done: 1, total: 2 }).pos).toBe(2);
    expect(positionOf({ phase: 'cards', done: 1, total: 2 }).pos).toBe(3);
  });

  test('칸은 잡이 내보내는 순서대로만 앞으로 간다 (D110)', () => {
    // `jobs.rs` 의 실제 순서. 앞 묶음은 여기서 1 → 2 → **1** → 3 으로 되돌았다.
    const emitted = ['walk', 'parse', 'git', 'write', 'derive', 'cards'] as const;
    const seen = emitted.map((phase) => positionOf({ phase, done: 1, total: 2 }).pos);
    for (let i = 1; i < seen.length; i += 1) {
      expect(seen[i], `${emitted[i]} 에서 뒤로 갔다`).toBeGreaterThanOrEqual(seen[i - 1] as number);
    }
  });

  test('총량을 몰라도 칸 안에서 뒤로 가지 않는다 — 커밋 수가 그렇다 (D110)', () => {
    // `git` 은 `total: 0` 으로 온다. 안쪽 진행은 셀 수 없지만 **그 단계가 시작했다는 것**은
    // 세야 한다 — 앞 단계(`write` 아님, 같은 칸의 첫째)가 채운 자리를 0 으로 되돌리면 안 된다.
    expect(positionOf({ phase: 'git', done: 40, total: 0 }).progress).toBe(0);
    // 칸 하나에 단계 둘이면 안쪽 자리는 `(순번 + 진행) / 단계 수` 다.
    expect(positionOf({ phase: 'walk', done: 1, total: 4 }).progress).toBe(0.125);
    expect(positionOf({ phase: 'walk', done: 4, total: 4 }).progress).toBe(0.5);
    expect(positionOf({ phase: 'parse', done: 0, total: 4 }).progress).toBe(0.5);
    expect(positionOf({ phase: 'parse', done: 4, total: 4 }).progress).toBe(1);
  });

  test('한 칸 안에서도 채움이 뒤로 가지 않는다 (D110)', () => {
    const seq = [
      { phase: 'walk', done: 4, total: 10 }, { phase: 'walk', done: 10, total: 10 },
      { phase: 'parse', done: 6, total: 10 }, { phase: 'parse', done: 10, total: 10 },
    ] as const;
    let last = -1;
    for (const at of seq) {
      const { pos, progress } = positionOf(at);
      const share = pos + (progress ?? 0);
      expect(share, `${at.phase} ${at.done}/${at.total} 에서 뒤로 갔다`).toBeGreaterThanOrEqual(last);
      last = share;
    }
  });
});

describe('판 짜기 화면', () => {
  test('스피너가 아니라 시간 비례 큐로 말한다', () => {
    render(<IngestScreen {...base} at={{ phase: 'parse', done: 3, total: 6 }} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('1번째 「코드 읽기」');
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

  test('끝나면 취소가 아니라 나갈 문을 준다 — 막다른 골목을 만들지 않는다', async () => {
    const onDone = vi.fn();
    render(<IngestScreen {...base} done onDone={onDone} />);
    expect(screen.getByText('다 읽었습니다')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: '홈으로' }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  test('실패해도 나갈 문이 있다', () => {
    render(<IngestScreen {...base} done error="리포를 읽지 못했습니다." />);
    expect(screen.getByRole('button', { name: '홈으로' })).toBeDefined();
  });

  test('실패하면 그 문구가 자리를 대신한다', () => {
    render(<IngestScreen {...base} error="리포를 읽지 못했습니다." />);
    expect(screen.getByText('리포를 읽지 못했습니다.')).toBeDefined();
  });
});
