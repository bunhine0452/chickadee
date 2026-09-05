// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FlatButton } from '@chickadee/ui';

import { JobBand } from './JobBand';
import type { QueueItem } from '../shell/TimeQueue';

afterEach(cleanup);

const QUEUE: QueueItem[] = [
  { kind: 't0', label: '함수형 업데이트', mins: 0.7, sub: '복습', review: true },
  { kind: 't0', label: '옵셔널 체이닝', mins: 0.5, sub: '새 판' },
  { kind: 't1', label: 'formatPrice 필사', mins: 9, sub: '클론' },
  { kind: 't2', label: '책임 배치', mins: 4, sub: '구조' },
];

describe('JobBand', () => {
  it('진행 띠이고 장식은 하나도 안 남았다 (D182)', () => {
    const { container } = render(<JobBand runNo="Run 08" repo="cart-shop-web" queue={QUEUE} pos={0} elapsed={0} />);
    expect(screen.getByRole('banner', { name: '진행 띠' })).toBeTruthy();
    for (const cls of ['.jobband', '.jb-line', '.jb-count', '.jb-what', '.jb-time', '.jb-ctl']) {
      expect(container.querySelector(cls), cls).not.toBeNull();
    }
    // 로고 · 디스플레이 제목 · 질감은 띠에서 내려갔다 (정본 §6·§7).
    for (const cls of ['.jb-brand', '.jb-title', '.logo', '.grain', '.jq-labels']) {
      expect(container.querySelector(cls), cls).toBeNull();
    }
  });

  it('리포 이름은 곁말로 남고 학습 회차는 낭독으로만 간다', () => {
    const { container } = render(<JobBand runNo="Run 08" repo="cart-shop-web" queue={QUEUE} pos={0} elapsed={0} />);
    expect(container.querySelector('.jb-repo')?.textContent).toBe('cart-shop-web');
    expect(container.querySelector('.jb-where .vh')?.textContent).toBe('Run 08');
  });

  it('지금 몇 번째 문제인지 세어 적는다', () => {
    const { container } = render(<JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={2} elapsed={0} />);
    const head = container.querySelector('.jb-where');
    expect(head?.textContent).toContain('3 / 4');
    expect(head?.textContent).toContain('formatPrice 필사');
    expect(head?.textContent).toContain('클론');
  });

  it('남은 시간은 지금 문제의 경과를 빼고 센다', () => {
    const { container } = render(<JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={0} elapsed={0} />);
    // 0.7 + 0.5 + 9 + 4 = 14.2분 → 14분
    expect(container.querySelector('.jb-time')?.textContent).toContain('약 14분');

    cleanup();
    const later = render(<JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={2} elapsed={120} />);
    // 9 - 2 + 4 = 11분
    expect(later.container.querySelector('.jb-time')?.textContent).toContain('약 11분');
  });

  it('1분 미만 문제는 초로 적는다', () => {
    const { container } = render(<JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={1} elapsed={0} />);
    expect(container.querySelector('.jb-time')?.textContent).toContain('30초');
  });

  it('다 풀면 학습 완료로 바뀐다', () => {
    const { container } = render(
      <JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={4} elapsed={0} totalElapsed={900} />,
    );
    expect(container.querySelector('.jb-where')?.textContent).toContain('4 / 4');
    expect(container.querySelector('.jb-where')?.textContent).toContain('오늘 학습 완료');
    expect(container.querySelector('.jb-time')?.textContent).toContain('오늘 15분');
  });

  it('막대는 시간 비례이고 문장으로도 읽힌다 (정본 §3-5)', () => {
    render(<JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={2} elapsed={0} />);
    const bar = screen.getByRole('img');
    expect(bar.getAttribute('aria-label')).toContain('4칸 중 3번째');
    expect(bar.getAttribute('aria-label')).toContain('formatPrice 필사');
  });

  it('칸마다 이름을 또 적지 않는다 — 지금 무엇을 푸는지는 위 줄이 말한다 (D182)', () => {
    const { container } = render(<JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={2} elapsed={0} />);
    expect(container.querySelector('.jq-labels')).toBeNull();
    expect(container.querySelector('.jb-what')?.textContent).toContain('formatPrice 필사');
  });

  it('오른쪽 조작은 그대로 받아 낸다', () => {
    render(
      <JobBand runNo="Run 08" repo="r" queue={QUEUE} pos={0} elapsed={0}>
        <FlatButton ghost>나가기</FlatButton>
      </JobBand>,
    );
    expect(screen.getByRole('button', { name: '나가기' })).toBeTruthy();
  });
});
