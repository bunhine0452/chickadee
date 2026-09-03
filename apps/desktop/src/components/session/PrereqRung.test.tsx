// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PrereqRung } from './PrereqRung';
import type { PrereqRow } from './PrereqRung';

afterEach(cleanup);

const ROWS: PrereqRow[] = [
  { conceptId: 'ts/nullish', n: '없을 때의 기본값', ly: 0, state: 'gap', note: '아직 안 찍힘', cardId: 12 },
  { conceptId: 'ts/object', n: '객체 접근', ly: 3, state: 'ok', note: '3일 전 · 3겹' },
  { conceptId: 'ts/guard', n: '값 있는지 보기', ly: 0, state: 'none', note: '판 없음' },
];

describe('PrereqRung', () => {
  it('목업 클래스를 그대로 붙이고 아래층마다 한 줄을 낸다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={[]} />);
    expect(container.querySelector('.prereq')).not.toBeNull();
    expect(container.querySelectorAll('.pq')).toHaveLength(3);
    expect(container.querySelector('.pq')?.className).toContain('gap');
  });

  it('비어 있는 층을 세어 진단한다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={[]} />);
    expect(container.textContent).toContain('3개 중 1개가 아직 안 찍혔습니다');
  });

  it('아래층이 없으면 「익숙하지 않은 것」이라고 말한다', () => {
    const { container } = render(<PrereqRung rows={[]} done={[]} />);
    expect(container.textContent).toContain('익숙하지 않은 것');
  });

  it('빈 층을 방금 채웠으면 이어보기로 보낸다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={['ts/nullish']} />);
    expect(container.textContent).toContain('비어 있던 층을 방금 채웠습니다');
    expect(container.querySelector('.pq')?.className).not.toContain('gap');
  });

  it('내려갈 판이 있는 빈 층에만 점프 버튼을 낸다', () => {
    render(<PrereqRung rows={ROWS} done={[]} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button').textContent).toContain('이 판으로 내려가기');
  });

  it('점프는 그 줄을 통째로 올려 보낸다', async () => {
    const onJump = vi.fn();
    const user = userEvent.setup();
    render(<PrereqRung rows={ROWS} done={[]} onJump={onJump} />);

    await user.click(screen.getByRole('button'));
    expect(onJump).toHaveBeenCalledWith(ROWS[0]);
  });

  it('보고 온 층은 버튼 대신 표시로 바뀌고 겹이 한 칸 오른다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={['ts/nullish']} onJump={() => undefined} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.pq .nm small')?.textContent).toBe('방금 봄 · 1겹');
  });

  it('판이 없는 층은 홈으로 안내한다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={[]} />);
    expect(container.textContent).toContain('판 없음 · 홈에서 「판 만들기」');
  });

  it('내려가도 지금 판이 사라지지 않는다고 적는다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={[]} />);
    expect(container.querySelector('.prereq-note')?.textContent).toContain('이 자리로 자동으로 돌아오고');
  });
});
