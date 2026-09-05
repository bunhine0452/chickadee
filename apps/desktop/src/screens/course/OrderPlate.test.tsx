// @vitest-environment jsdom
/**
 * 섞기 판 (D187 ⑱). 재는 것 셋 — 마우스 없이 세워지나 · 채점 뒤 **왜 그 자리인가**가 펴지나 ·
 * 판정란이 미리 자리를 잡고 있나(정본 §3-3).
 */
import { t } from '@chickadee/i18n';
import type { StageVerdict } from '@chickadee/grading';
import type { CardPayload } from '@chickadee/store-sql';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { OrderPlate } from './OrderPlate.js';
import { EST_MIN, type StageCardView } from './run.js';

const order: Extract<CardPayload, { kind: 'order' }> = {
  track: 't3', kind: 'order', stage: 5,
  q: 'authService.js 에서 UserMapper.xml 까지 — 도는 순서대로 세우세요.',
  hint: '카드를 위에서 아래로 세우고 채점합니다.',
  pieces: [
    { id: 'a', t: 'authService.js:21', fact: 'authService.js:21 이 AuthController.java 를 부릅니다' },
    { id: 'b', t: 'AuthController.java:56', fact: 'AuthController.java:56 이 AuthService.java 를 부릅니다' },
    { id: 'c', t: 'AuthService.java:78', fact: '여기서 더 부르는 곳이 없습니다' },
  ],
  answer: ['a', 'b', 'c'],
  deck: ['c', 'a', 'b'],
  ok: '순서가 맞습니다.',
  rule: '규칙 — 순서는 부르는 자리에서 읽습니다.',
  promptLines: [],
};

const card: StageCardView = {
  id: 21, kind: 'reorder', conceptId: 'exec/order' as StageCardView['conceptId'],
  stageNo: 5, type: 'order', payload: order, estMin: EST_MIN.order,
};

function mount(verdict: StageVerdict | null, onGrade = vi.fn(), onNext = vi.fn()) {
  render(
    <OrderPlate
      card={card} no={1} unitName="로그인" conceptName="실행 순서" layer={2}
      verdict={verdict} stuckOpen={false}
      onGrade={onGrade} onNext={onNext} onDunno={vi.fn()}
    />,
  );
  return { onGrade, onNext };
}

const verdictOf = (ok: boolean): StageVerdict => ({
  ok, pct: ok ? 100 : 50, diagnosis: ok ? null : '순서가 반대입니다',
  okText: ok ? order.ok : null, rule: order.rule,
  detail: {
    kind: 'order',
    result: {
      ok, pct: ok ? 100 : 50, hit: ok ? 2 : 1, total: 2, misses: [],
      okText: ok ? order.ok : null, rule: order.rule, diagnosis: null,
    },
  },
  gated: true, run: null,
});

afterEach(cleanup);

describe('섞기 판 (D187 ⑱ · 5단의 1겹)', () => {
  test('판 머리는 챕터 · 5단 · 섞기다', () => {
    mount(null);
    expect(screen.getByText(t('chapter.kindAndStage', {
      kind: t('chapter.tOrder'), stage: t('chapter.stage5'),
    }))).toBeTruthy();
    expect(screen.getByText(order.q)).toBeTruthy();
  });

  test('덱은 섞인 순서로 서고 조각의 이름표는 카드가 든 글자다', () => {
    mount(null);
    const deck = document.querySelectorAll('.frest .add');
    expect([...deck].map((b) => b.textContent)).toEqual([
      'AuthService.java:78', 'authService.js:21', 'AuthController.java:56',
    ]);
  });

  test('마우스 없이 세워진다 — 단추 세 번이면 순서가 된다', () => {
    const { onGrade } = mount(null);
    const add = () => document.querySelectorAll<HTMLButtonElement>('.frest .add');
    fireEvent.click(add()[1] as HTMLButtonElement); // a
    fireEvent.click(add()[1] as HTMLButtonElement); // b
    fireEvent.click(add()[0] as HTMLButtonElement); // c
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(onGrade).toHaveBeenCalledWith({ kind: 'order', ordered: ['a', 'b', 'c'] });
  });

  test('↑ 단추가 자리를 바꾼다', () => {
    const { onGrade } = mount(null);
    const add = () => document.querySelectorAll<HTMLButtonElement>('.frest .add');
    fireEvent.click(add()[1] as HTMLButtonElement); // a
    fireEvent.click(add()[1] as HTMLButtonElement); // b
    const up = document.querySelectorAll<HTMLButtonElement>('.fcard .mv-up');
    fireEvent.click(up[1] as HTMLButtonElement);
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(onGrade).toHaveBeenCalledWith({ kind: 'order', ordered: ['b', 'a'] });
  });

  test('세우기 전에는 채점이 안 눌린다', () => {
    const { onGrade } = mount(null);
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(onGrade).not.toHaveBeenCalled();
  });

  test('판정란은 답하기 전에 이미 자리를 잡고 있다 (정본 §3-3)', () => {
    mount(null);
    expect(document.querySelector('.slot')).toBeTruthy();
  });

  test('채점 뒤 정답 순서가 서고 조각마다 왜 그 자리인가가 펴진다', () => {
    const { onNext } = mount(verdictOf(false));
    const seats = document.querySelectorAll('.fpath .fcard .nm');
    expect([...seats].map((s) => s.textContent)).toEqual([
      'authService.js:21', 'AuthController.java:56', 'AuthService.java:78',
    ]);
    expect(screen.getByText(t('chapter.orderFacts'))).toBeTruthy();
    expect(screen.getByText(/AuthController.java 를 부릅니다/)).toBeTruthy();
    fireEvent.keyDown(document, { code: 'Space' });
    expect(onNext).toHaveBeenCalled();
  });
});
