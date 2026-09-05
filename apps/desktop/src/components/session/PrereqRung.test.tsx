// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PrereqRung } from './PrereqRung';
import type { PrereqRow } from './PrereqRung';

afterEach(cleanup);

const ROWS: PrereqRow[] = [
  { conceptId: 'ts/nullish', n: '없을 때의 기본값', ly: 0, state: 'gap', note: '아직 안 찍힘' },
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
    expect(container.textContent).toContain('3개 중 1개를 아직 안 익혔습니다');
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
    expect(screen.getByRole('button').textContent).toContain('이 문제로 내려가기');
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
    expect(container.querySelector('.pq .nm small')?.textContent).toBe('방금 봄 · 1단계');
  });

  it('판이 없는 층은 홈으로 안내한다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={[]} />);
    expect(container.textContent).toContain('문제 없음 · 홈에서 「문제 만들기」');
  });

  it('내려가도 지금 판이 사라지지 않는다고 적는다', () => {
    const { container } = render(<PrereqRung rows={ROWS} done={[]} />);
    expect(container.querySelector('.prereq-note')?.textContent).toContain('이 자리로 자동으로 돌아오고');
  });
});

describe('합성 예제 예고 (D137 · 방안 E-4)', () => {
  const preview: PrereqRow = {
    conceptId: 'ts/spread',
    n: '펼치기 <code>...</code>',
    ly: 0,
    state: 'preview',
    note: '판이 없습니다',
    previewSiteId: 77,
  };

  it('「판 없음」 알약 대신 내려가는 단추가 선다', () => {
    render(<PrereqRung rows={[preview]} done={[]} onJump={vi.fn()} />);
    expect(screen.getByRole('button', { name: /가장 단순한 모양/ })).toBeTruthy();
    expect(screen.queryByText(/판 없음 · 홈에서/)).toBeNull();
  });

  it('「곧 네 코드 어디에서 본다」를 반드시 적는다 — 이 문장이 규칙이다', () => {
    const { container } = render(<PrereqRung rows={[preview]} done={[]} />);
    const note = container.querySelector('.prereq-preview');
    expect(note).not.toBeNull();
    expect(note?.textContent).toContain('내 코드에 있지만');
    expect(note?.textContent).toContain('오늘 안에 다시 만납니다');
  });

  it('개념 이름의 서식을 벗겨서 평문 문장에 넣는다', () => {
    const { container } = render(<PrereqRung rows={[preview]} done={[]} />);
    const note = container.querySelector('.prereq-preview');
    expect(note?.textContent).toContain('펼치기 ...');
    expect(note?.textContent).not.toContain('<code>');
  });

  it('예고할 자리가 없으면 예고 문단을 내지 않는다 — 합성을 만들지 않는 자리다', () => {
    const { container } = render(
      <PrereqRung rows={[{ ...preview, previewSiteId: null }]} done={[]} />,
    );
    expect(container.querySelector('.prereq-preview')).toBeNull();
  });

  it('사용처가 아예 없으면 그대로 「판 없음」이다', () => {
    const { container } = render(<PrereqRung rows={[ROWS[2] as PrereqRow]} done={[]} />);
    expect(container.querySelector('.prereq-preview')).toBeNull();
    expect(container.textContent).toContain('판 없음');
  });

  it('이미 보고 왔으면 예고를 되풀이하지 않는다', () => {
    const { container } = render(<PrereqRung rows={[preview]} done={['ts/spread']} />);
    expect(container.querySelector('.prereq-preview')).toBeNull();
  });
});
