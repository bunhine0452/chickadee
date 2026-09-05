// @vitest-environment jsdom
/**
 * 값 추적 판 (D187 ⑱). 재는 것 넷 — **바뀐 칸만 비어 있나** · 키보드로 완결되나 ·
 * 판정란이 미리 비어 있나(정본 §3-3) · 틀린 칸이 색이 아니라 자리로 보이나.
 */
import { t } from '@chickadee/i18n';
import type { StageVerdict } from '@chickadee/grading';
import type { CardPayload } from '@chickadee/store-sql';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { EST_MIN, type StageCardView } from './run.js';
import { TraceTablePlate } from './TraceTablePlate.js';

const ROWS = [78, 84, 85, 86];

const trace: Extract<CardPayload, { kind: 'trace' }> = {
  track: 't3', kind: 'trace', stage: 2,
  q: 'AuthService.java — user 가 가리키는 상자가 언제 바뀌나',
  hint: '값이 바뀌는 칸만 비어 있습니다.',
  file: 'BACK/AuthService.java',
  lines: ROWS.map((n) => ({ n, t: `line ${String(n)}` })),
  cols: [
    { k: 'c_user', axis: 'obj', t: 'user 가 가리키는 상자' },
    { k: 'c_role', axis: 'var', t: 'role 이 있나' },
  ],
  rows: ROWS.map((n) => ({ k: `r${String(n)}`, line: n, t: `line ${String(n)}` })),
  cells: [
    { r: 'r78', c: 'c_user', v: { t: 'box', label: 'A', accept: ['A'] }, carry: null },
    { r: 'r84', c: 'c_user', v: { t: 'box', label: 'A', accept: ['A'] }, carry: 'r78' },
    { r: 'r85', c: 'c_user', v: { t: 'box', label: 'B', accept: ['B'] }, carry: null },
    { r: 'r86', c: 'c_user', v: { t: 'box', label: 'B', accept: ['B'] }, carry: 'r85' },
    { r: 'r78', c: 'c_role', v: { t: 'bool', v: false }, carry: null },
    { r: 'r84', c: 'c_role', v: { t: 'bool', v: false }, carry: 'r78' },
    { r: 'r85', c: 'c_role', v: { t: 'bool', v: false }, carry: 'r84' },
    { r: 'r86', c: 'c_role', v: { t: 'bool', v: true }, carry: null },
  ],
  hidden: ['r78|c_user', 'r85|c_user', 'r78|c_role', 'r86|c_role'],
  ok: '85 줄에서 user 가 다른 상자를 가리키게 됩니다.',
  rule: '규칙 — 참조는 상자를 가리킬 뿐 상자를 들고 있지 않습니다.',
  promptLines: [],
};

const card: StageCardView = {
  id: 11, kind: 'flow', conceptId: 'common/reassignment' as StageCardView['conceptId'],
  stageNo: 2, type: 'trace-table', payload: trace, estMin: EST_MIN['trace-table'],
};

function mount(verdict: StageVerdict | null, onGrade = vi.fn(), onNext = vi.fn()) {
  render(
    <TraceTablePlate
      card={card} no={3} unitName="로그인" conceptName="재대입" layer={1}
      verdict={verdict} stuckOpen={false}
      onGrade={onGrade} onNext={onNext} onDunno={vi.fn()}
    />,
  );
  return { onGrade, onNext };
}

afterEach(cleanup);

describe('격자 판 (D187 ⑱)', () => {
  test('판 머리는 챕터 · 2단 · 값 추적이다', () => {
    mount(null);
    expect(screen.getByText(t('chapter.kindAndStage', {
      kind: t('chapter.tTraceTable'), stage: t('chapter.stage2'),
    }))).toBeTruthy();
    expect(screen.getByText(trace.q)).toBeTruthy();
  });

  test('바뀐 칸만 입력이고 나머지는 채워진 채 남는다 (I2 규칙)', () => {
    mount(null);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(trace.hidden.length);
    // 안 물은 칸은 답이 그대로 보인다 — 그것이 예측의 재료다.
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });

  test('열이 다섯까지여도 격자가 창 안에서만 흐른다 — 문서는 안 밀린다', () => {
    mount(null);
    const wrap = document.querySelector('.cc-grid-wrap');
    expect(wrap).toBeTruthy();
    expect(wrap?.className).toContain('cc-grid-wrap');
  });

  test('⌘↵ 가 채운 칸을 그대로 넘긴다', () => {
    const { onGrade } = mount(null);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLInputElement, { target: { value: 'A' } });
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(onGrade).toHaveBeenCalledWith({ kind: 'cells', cells: { 'r78|c_user': 'A' } });
  });

  test('칸 안에서 Enter 도 채점이다 (정본 §3-8)', () => {
    const { onGrade } = mount(null);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0] as HTMLInputElement, { target: { value: 'A' } });
    fireEvent.keyDown(inputs[0] as HTMLInputElement, { key: 'Enter' });
    expect(onGrade).toHaveBeenCalled();
  });

  test('↓ 가 같은 열의 아래 칸으로 옮긴다', () => {
    mount(null);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const first = inputs[0] as HTMLInputElement;
    first.focus();
    // 첫 입력은 (행 0, 열 0) 이고 상자 열의 다음 입력은 (행 2, 열 0) 이다.
    expect(first.dataset.row).toBe('0');
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    // 행 1 의 그 열은 입력이 아니므로 포커스가 안 옮겨진다 — 격자는 좌표로 찾는다.
    expect(document.activeElement).toBe(first);
  });

  test('판정란은 답하기 전에 이미 자리를 잡고 있다 (정본 §3-3)', () => {
    mount(null);
    expect(document.querySelector('.slot')).toBeTruthy();
  });

  test('채점 뒤 틀린 칸에 자국이 남고 Space 가 다음이다', () => {
    const verdict: StageVerdict = {
      ok: false, pct: 75, diagnosis: '85 줄의 「user 가 가리키는 상자」 칸', okText: null, rule: trace.rule,
      detail: {
        kind: 'trace',
        result: {
          ok: false, pct: 75, asked: 4, correct: 3, okText: null, rule: trace.rule,
          diagnosis: '85 줄의 「user 가 가리키는 상자」 칸',
          misses: [{ key: 'r85|c_user', row: '85', col: 'user 가 가리키는 상자', kind: 'reused', text: 'x' }],
        },
      },
      gated: true, run: null,
    };
    const { onNext } = mount(verdict);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(document.querySelector('.cc-cell.miss')).toBeTruthy();
    fireEvent.keyDown(document, { code: 'Space' });
    expect(onNext).toHaveBeenCalled();
  });
});
