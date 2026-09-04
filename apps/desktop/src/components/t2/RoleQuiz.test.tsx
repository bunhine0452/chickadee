// @vitest-environment jsdom
/**
 * 「이 폴더는 왜 있나」 한 문항 4지 (04 §8.5 · D142).
 *
 * 보기는 T0 의 `Choices` 를 그대로 쓴다 — 그래서 여기서 보는 것은 보기 상자 자체가 아니라
 * **보기가 지도의 밴드 라벨 그대로인가**와 **고른 값이 `gradeRole` 이 읽는 색인으로
 * 나가는가**이다. `payload.role.answer` 가 그 색인이라 하나만 어긋나도 정답이 밀린다.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { RoleQuiz } from './RoleQuiz';

const BANDS = [
  { l: '화면', s: 'app/' },
  { l: '기능', s: 'features/' },
  { l: '동작 · 통신', s: 'core/' },
  { l: '공용 · 데이터', s: 'lib/' },
];

const FOLDER = 'src/core/';

afterEach(cleanup);

describe('한 문항 4지', () => {
  test('보기 넷은 지도의 밴드 라벨 그대로다', () => {
    render(<RoleQuiz folder={FOLDER} bands={BANDS} pick={null} onPick={vi.fn()} />);
    expect(document.querySelectorAll('.rquiz .choices')).toHaveLength(1);
    expect([...document.querySelectorAll('.rquiz .ch .t')].map((el) => el.textContent))
      .toEqual(['화면', '기능', '동작 · 통신', '공용 · 데이터']);
  });

  test('문항이 하나라 번호를 매기지 않는다 — 지도에서 빠진 폴더만 상자로 선다', () => {
    render(<RoleQuiz folder={FOLDER} bands={BANDS} pick={null} onPick={vi.fn()} />);
    expect(screen.getByText(FOLDER).className).toContain('rq-f');
    expect(document.querySelector('.rquiz .dq-q')).toBeNull();
  });

  test('고른 값은 0부터 센 색인으로 나간다 — `payload.role.answer` 와 같은 축이다', () => {
    const onPick = vi.fn();
    render(<RoleQuiz folder={FOLDER} bands={BANDS} pick={null} onPick={onPick} />);
    fireEvent.click(document.querySelectorAll('.rquiz .ch')[2] as HTMLElement);
    expect(onPick).toHaveBeenCalledWith(2);
  });

  test('고른 보기만 굳는다 — 화면은 정답을 모른다', () => {
    render(<RoleQuiz folder={FOLDER} bands={BANDS} pick={1} onPick={vi.fn()} />);
    const boxes = [...document.querySelectorAll('.rquiz .ch')];
    expect(boxes.map((el) => el.getAttribute('aria-checked')))
      .toEqual(['false', 'true', 'false', 'false']);
    expect(document.querySelector('.rquiz .ch.right')).toBeNull();
  });

  test('`1~4` 물리 키로 고른다 (05 §7)', () => {
    const onPick = vi.fn();
    render(<RoleQuiz folder={FOLDER} bands={BANDS} pick={null} onPick={onPick} />);
    fireEvent.keyDown(document.querySelector('.rquiz .choices') as HTMLElement, { code: 'Digit4' });
    expect(onPick).toHaveBeenCalledWith(3);
  });

  test('`onPick` 이 없으면 읽기 전용이다', () => {
    render(<RoleQuiz folder={FOLDER} bands={BANDS} pick={2} />);
    fireEvent.click(document.querySelectorAll('.rquiz .ch')[0] as HTMLElement);
    expect(document.querySelectorAll('.rquiz .ch')[2]?.getAttribute('aria-checked')).toBe('true');
  });
});
