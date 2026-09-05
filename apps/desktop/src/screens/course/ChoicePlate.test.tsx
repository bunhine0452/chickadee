// @vitest-environment jsdom
import { t } from '@chickadee/i18n';
import type { StageVerdict } from '@chickadee/grading';
import type { CardPayload } from '@chickadee/store-sql';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ChoicePlate } from './ChoicePlate.js';
import { EST_MIN, type StageCardView } from './run.js';

const cut: Extract<CardPayload, { kind: 'twin' | 'origin' | 'cut' | 'reorder' | 'contract' }> = {
  track: 't3', kind: 'cut', stage: 3, file: 'BACK/UserMapper.xml', focus: 35,
  lines: [{ n: 35, t: 'AND deleted_date IS NULL' }],
  q: '이 줄을 지우면 무엇이 달라지나요?', hint: '고른 것이 참이 되는 조건을 생각하세요',
  options: [{ t: '탈퇴한 회원이 다시 로그인된다' }, { t: '아무것도 안 달라진다' }, { t: '아무도 로그인 못 한다' }, { t: '비밀번호 검사가 빠진다' }],
  answer: 0,
  why: [null, { t: 'soft delete 를 안 봤다' }, { t: '조건이 하나 줄 뿐이다' }, { t: '그 검사는 자바에 있다' }],
  ok: '탈퇴는 행을 지우지 않는다.', rule: '가드를 지우면 가드가 막던 입력이 들어온다.', promptLines: [],
};

const card: StageCardView = {
  id: 7, kind: 'cut', conceptId: 'common/conditional-branch' as StageCardView['conceptId'],
  stageNo: 3, type: 'cut', payload: cut, estMin: EST_MIN.cut,
};

const wrong: StageVerdict = {
  ok: false, pct: 0, diagnosis: 'soft delete 를 안 봤다', okText: cut.ok, rule: cut.rule,
  detail: { kind: 'choice', sel: 1, answer: 0, reasonOk: null },
};

function mount(verdict: StageVerdict | null, onGrade = vi.fn(), onNext = vi.fn()) {
  render(
    <ChoicePlate
      card={card} no={2} unitName="로그인" conceptName="조건 분기" layer={1}
      verdict={verdict} stuckOpen={false}
      onGrade={onGrade} onNext={onNext} onDunno={vi.fn()}
    />,
  );
  return { onGrade, onNext };
}

afterEach(cleanup);

describe('선택형 판 (D171 ④)', () => {
  test('판 머리는 챕터 · 단 · 유형이다 — 트랙이 아니다', () => {
    mount(null);
    expect(screen.getByText(t('chapter.kindAndStage', { kind: t('chapter.tCut'), stage: t('chapter.stage3') }))).toBeTruthy();
    expect(screen.getByText(cut.q)).toBeTruthy();
  });

  test('1 → Enter 가 채점을 부른다 (정본 §3-8)', () => {
    const { onGrade } = mount(null);
    fireEvent.keyDown(document, { code: 'Digit2' });
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(onGrade).toHaveBeenCalledWith({ kind: 'choice', sel: 1 });
  });

  test('고르기 전에는 Enter 가 아무것도 안 한다', () => {
    const { onGrade } = mount(null);
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(onGrade).not.toHaveBeenCalled();
  });

  test('채점 뒤 판정란은 「고른 그것이 참이 되는 조건」과 규칙을 싣고 Space 가 다음이다', () => {
    const { onNext } = mount(wrong);
    expect(screen.getByText(t('session.wrong'))).toBeTruthy();
    expect(screen.getByText('soft delete 를 안 봤다')).toBeTruthy();
    expect(screen.getByText(/가드를 지우면/)).toBeTruthy();
    fireEvent.keyDown(document, { code: 'Space' });
    expect(onNext).toHaveBeenCalled();
  });
});
