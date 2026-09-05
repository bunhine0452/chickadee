// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Callout } from './Callout';
import { Card } from './Card';
import { Field } from './Field';
import { Progress } from './Progress';
import { Tag } from './Tag';

afterEach(cleanup);

describe('Button', () => {
  it('변형과 크기를 클래스로 낸다 — 기본은 secondary · md', () => {
    const { container } = render(<Button>닫기</Button>);
    expect(container.querySelector('.btn.secondary')).not.toBeNull();
    expect(container.querySelector('.btn.sm, .btn.lg')).toBeNull();
  });

  it('pressed 를 준 것만 aria-pressed 를 낸다 — 안 준 버튼은 토글이 아니다', () => {
    const { container, rerender } = render(<Button>제출</Button>);
    expect(container.querySelector('[aria-pressed]')).toBeNull();
    rerender(<Button pressed={false}>모르겠어요</Button>);
    expect(screen.getByRole('button', { pressed: false })).not.toBeNull();
  });

  it('누르고 있는 동안만 참인 동작 — repeat 는 한 번만 센다', () => {
    const onHold = vi.fn();
    render(<Button onHold={onHold}>홀드</Button>);
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { code: 'Space' });
    fireEvent.keyDown(btn, { code: 'Space', repeat: true });
    fireEvent.keyUp(btn, { code: 'Space' });
    expect(onHold.mock.calls).toEqual([[true], [false]]);
  });
});

describe('Card', () => {
  it('onClick 이 있으면 button 으로, 없으면 div 로 그린다', () => {
    const { container } = render(<Card>본문</Card>);
    expect(container.querySelector('div.card')).not.toBeNull();
    cleanup();
    const tap = render(<Card onClick={() => undefined}>본문</Card>);
    expect(tap.container.querySelector('button.card.tap')).not.toBeNull();
  });

  it('제목 층위를 부르는 쪽이 정한다 — 화면 개요를 컴포넌트가 바꾸지 않는다', () => {
    render(<Card title="로그인" titleAs="h3">본문</Card>);
    expect(screen.getByRole('heading', { level: 3, name: '로그인' })).not.toBeNull();
  });
});

describe('Tag', () => {
  it('기본은 중립이다 — 색은 뜻이 있을 때만 붙는다 (정본 §6)', () => {
    const { container } = render(<Tag>2단 추적</Tag>);
    const el = container.querySelector('.tag');
    expect(el?.className).toBe('tag');
  });

  it('상태 넷은 클래스로 나간다', () => {
    const { container } = render(<Tag tone="bad">틀림</Tag>);
    expect(container.querySelector('.tag.bad')).not.toBeNull();
  });
});

describe('Progress', () => {
  it('막대 길이와 같은 정보를 글자가 따로 나른다 (05 §9 색맹)', () => {
    render(<Progress value={35} label="오늘 학습 35% 진행" />);
    const bar = screen.getByRole('progressbar', { name: '오늘 학습 35% 진행' });
    expect(bar.getAttribute('aria-valuenow')).toBe('35');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('범위 밖 값을 잘라 낸다 — 넘치는 막대를 그리지 않는다', () => {
    const { container } = render(<Progress value={9} max={5} label="다섯 단 중" steps />);
    expect(container.querySelectorAll('.prog-step')).toHaveLength(5);
    expect(container.querySelectorAll('.prog-step.on')).toHaveLength(5);
  });
});

describe('Callout', () => {
  it('live 를 줄 때만 스스로 읽힌다', () => {
    const { container } = render(<Callout title="맞았습니다" tone="ok"><p>숙련도 3단계.</p></Callout>);
    expect(container.querySelector('[role="status"]')).toBeNull();
    cleanup();
    render(<Callout tone="bad" live><p>틀렸습니다.</p></Callout>);
    expect(screen.getByRole('status')).not.toBeNull();
  });
});

describe('Field', () => {
  it('라벨과 입력을 id 로 잇고, 도움말을 describedby 로 붙인다 (근접성)', () => {
    render(
      <Field label="리포 주소" hint="로컬 경로도 됩니다.">
        {(a) => <input type="text" {...a} />}
      </Field>,
    );
    const input = screen.getByLabelText('리포 주소');
    const hint = input.getAttribute('aria-describedby');
    expect(hint).not.toBeNull();
    expect(document.getElementById(hint as string)?.textContent).toBe('로컬 경로도 됩니다.');
  });

  it('오류가 있으면 도움말 자리를 대신하고 aria-invalid 가 붙는다', () => {
    render(
      <Field label="API 키" hint="선택입니다." error="키를 읽을 수 없습니다.">
        {(a) => <input type="password" {...a} />}
      </Field>,
    );
    const input = screen.getByLabelText('API 키');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toBe('키를 읽을 수 없습니다.');
    expect(screen.queryByText('선택입니다.')).toBeNull();
  });
});
