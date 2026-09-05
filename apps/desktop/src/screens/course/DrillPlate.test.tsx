// @vitest-environment jsdom
/**
 * 작은 문제 판 (D186 ⑧). 재는 것 다섯 —
 * **판정란이 미리 비어 있나**(정본 §3-3) · 케이스 표가 돌리기 전에도 서나 ·
 * `⌘↵` 로 실행되나(정본 §3-8) · 통과한 뒤에만 잠기나 · **못 돌린 이유가 화면에 뜨나**(D186 ④).
 */
import type { BuildItem, DrillItem } from '@chickadee/cards';
import { t } from '@chickadee/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { BuildVerdict } from '@chickadee/grading';

import type { DrillView } from '../../data/runner.js';
import { BuildPlate, buildVerdictText, DrillPlate, showText, verdictText } from './DrillPlate.js';

// 진짜 Monaco 는 jsdom 에서 안 뜬다 — 안의 키는 `components/t1/ClonePad.test.tsx` 가 본다.
vi.mock('../../components/t1/ClonePad.js', () => ({
  ClonePad: (props: { value: string; ariaLabel: string }) => (
    <textarea aria-label={props.ariaLabel} defaultValue={props.value} />
  ),
}));

const item: DrillItem = {
  id: 'floor-divide:py',
  drillId: 'floor-divide',
  lang: 'py',
  topic: 'arithmetic',
  statement: '한 줄에 정수 a 와 b 가 주어집니다. 내림 몫과 나머지를 두 줄로 출력하세요.',
  needs: ['common/arithmetic', 'cs/type-conversion'],
  cases: [
    { name: '1번', stdin: '7 2\n', stdout: '3\n1\n' },
    { name: '2번', stdin: '-7 2\n', stdout: '-4\n1\n' },
  ],
  starter: 'import sys\n\ndata = sys.stdin.read()\n',
  grammar: 'python',
  langName: 'Python',
};

const failed: DrillView = {
  kind: 'failed',
  passed: 1,
  failed: 1,
  durationMs: 42,
  log: '2번: 기대한 것과 나온 것이 다릅니다.',
  cases: [
    { name: '1번', stdin: '7 2\n', expected: '3\n1\n', actual: '3\n1\n', stderr: '', status: 'passed', durationMs: 16 },
    { name: '2번', stdin: '-7 2\n', expected: '-4\n1\n', actual: '-3\n-1\n', stderr: '', status: 'failed', durationMs: 17 },
  ],
};

function mount(view: DrillView, over: Partial<React.ComponentProps<typeof DrillPlate>> = {}) {
  const props = {
    item, no: 1, layer: 2 as const, theme: 'light' as const, view,
    stuckOpen: false, onRun: vi.fn(), onNext: vi.fn(), onDunno: vi.fn(), ...over,
  };
  render(<DrillPlate {...props} />);
  return props;
}

afterEach(cleanup);

describe('돌리기 전', () => {
  test('판정란이 미리 비어 있다 — 답해도 위 글이 안 밀린다 (정본 §3-3)', () => {
    mount({ kind: 'idle' });
    expect(document.querySelector('.slot')).not.toBeNull();
    expect(screen.queryByText(t('session.right'))).toBeNull();
    expect(screen.queryByText(t('session.wrong'))).toBeNull();
  });

  test('케이스 표가 이미 서 있고 판정 칸만 「아직」이다', () => {
    mount({ kind: 'idle' });
    expect(screen.getAllByText(t('drill.markIdle')).length).toBe(item.cases.length);
    // 넣는 것과 나와야 하는 것은 처음부터 보인다 — 무엇을 만들지가 물음의 일부다.
    expect(screen.getByText('7 2⏎')).toBeTruthy();
    expect(screen.getByText('3⏎1⏎')).toBeTruthy();
  });

  test('코드 창에 껍데기가 깔려 있다', () => {
    mount({ kind: 'idle' });
    const pad = screen.getByLabelText(t('drill.editorLabel')) as HTMLTextAreaElement;
    expect(pad.value).toContain('sys.stdin.read()');
  });

  test('이 문제가 딛는 개념이 보인다', () => {
    mount({ kind: 'idle' });
    expect(screen.getByText(/common\/arithmetic/u)).toBeTruthy();
  });
});

describe('실행', () => {
  test('⌘↵ 가 실행한다 — 편집기 안에서도 받는다 (정본 §3-8)', () => {
    const props = mount({ kind: 'idle' });
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(props.onRun).toHaveBeenCalledTimes(1);
    expect((props.onRun as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain('sys.stdin.read()');
  });

  test('돌리는 중에는 단추가 잠기고 한 번 더 안 돈다', () => {
    const props = mount({ kind: 'running' });
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(props.onRun).not.toHaveBeenCalled();
  });
});

describe('돌린 뒤', () => {
  test('틀린 케이스에 나온 글이 실리고 그 줄이 표시된다', () => {
    mount(failed);
    expect(screen.getByText('-3⏎-1⏎')).toBeTruthy();
    expect(document.querySelectorAll('.dr-cases tbody tr.miss').length).toBe(1);
  });

  test('틀려도 코드 창은 안 잠긴다 — 고쳐서 다시 돌리는 것이 이 층의 학습이다', () => {
    const props = mount(failed);
    expect(screen.queryByLabelText(t('drill.editorLabel'))).not.toBeNull();
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(props.onRun).toHaveBeenCalledTimes(1);
  });

  test('전부 통과하면 잠기고 Space 가 다음 판으로 간다', () => {
    const view: DrillView = {
      kind: 'passed', durationMs: 33,
      cases: failed.cases.map((c) => ({ ...c, status: 'passed' as const, actual: c.expected })),
    };
    const props = mount(view);
    expect(screen.queryByLabelText(t('drill.editorLabel'))).toBeNull();
    fireEvent.keyDown(document, { code: 'Space' });
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  test('컴파일 오류는 실행이 남긴 글을 접어서 보인다', () => {
    mount({ kind: 'compile-error', log: 'SyntaxError: unexpected EOF' });
    expect(screen.getByText(t('drill.compileError'))).toBeTruthy();
    expect(screen.getByText('SyntaxError: unexpected EOF')).toBeTruthy();
  });
});

describe('못 돌렸을 때 — 숨지 않는다 (D186 ④)', () => {
  test('어느 언어가 이 컴퓨터에 없는지 말한다', () => {
    mount({ kind: 'no-runner', reason: 'toolchain-missing:py' });
    expect(screen.getByText(t('drill.none'))).toBeTruthy();
    expect(screen.getByText(/python3/u)).toBeTruthy();
    // 설치를 권하지 않는다 (정본 §5 ①).
    expect(screen.getByText(t('drill.noneHint'))).toBeTruthy();
  });
});

describe('순수 함수', () => {
  test('보이지 않는 글자를 보이게 한다', () => {
    expect(showText('3\n1\n')).toBe('3⏎1⏎');
    expect(showText('')).toBe(t('drill.blankOut'));
  });

  test('상태마다 한 문장이고 아직이면 `null` 이다', () => {
    expect(verdictText({ kind: 'idle' }, 2)).toBeNull();
    expect(verdictText({ kind: 'running' }, 2)).toBeNull();
    expect(verdictText(failed, 2)?.body).toContain('1');
  });
});

// ───────────────────────── `build` 판 (D187 ①) ─────────────────────────

const buildItem: BuildItem = {
  id: 'to-fraction:java',
  taskId: 'to-fraction',
  lang: 'java',
  q: '7과 2로 <b>3.5</b> 가 나오는 식을 쓰세요.',
  hint: '7, 2 를 쓴 식 하나.',
  expected: { t: 'float', v: '3.5' },
  want: '3.5',
  must: ['7', '2'],
  spell: { yes: 'true', no: 'false' },
  needs: ['common/arithmetic', 'cs/type-conversion'],
  grammar: 'java',
  langName: 'Java',
};

const bv = (over: Partial<BuildVerdict>): BuildVerdict => ({
  ok: false, pct: 0, miss: null, diagKey: null, printed: null, missing: [], reason: null, log: '',
  ...over,
});

function mountBuild(view: React.ComponentProps<typeof BuildPlate>['view']) {
  const props = {
    item: buildItem, no: 3, layer: 1 as const, view,
    stuckOpen: false, onRun: vi.fn(), onNext: vi.fn(), onDunno: vi.fn(),
  };
  render(<BuildPlate {...props} />);
  return props;
}

describe('`build` 판', () => {
  test('나와야 하는 값이 물음 옆에 보이고 칸은 비어 있다', () => {
    mountBuild({ kind: 'idle' });
    const box = screen.getByLabelText(t('drill.exprLabel')) as HTMLInputElement;
    expect(box.value).toBe('');
    // 물음 안과 「나와야 하는 값」 줄 — 기댓값이 두 번 보인다.
    expect(screen.getAllByText('3.5').length).toBe(2);
    expect(document.querySelector('.slot')).not.toBeNull();
  });

  test('빈 칸이면 Enter 가 안 돌린다 — ⌘↵ 는 그래도 받는다', () => {
    const props = mountBuild({ kind: 'idle' });
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(props.onRun).not.toHaveBeenCalled();
  });

  test('적은 식이 그대로 넘어간다', () => {
    const props = mountBuild({ kind: 'idle' });
    fireEvent.change(screen.getByLabelText(t('drill.exprLabel')), { target: { value: '7 / 2.0' } });
    fireEvent.keyDown(document, { code: 'Enter', metaKey: true });
    expect(props.onRun).toHaveBeenCalledWith('7 / 2.0');
  });

  test('값을 그대로 적으면 진단이 그것을 말한다 — 실행 앞에서 걸린다', () => {
    mountBuild({ kind: 'done', verdict: bv({ miss: 'literal', diagKey: 'drill.buildMissLiteral' }) });
    expect(screen.getByText(t('session.wrong'))).toBeTruthy();
    expect(screen.getByText(/그 값이 나오는 식/u)).toBeTruthy();
  });

  test('안 쓴 토막을 이름으로 말한다', () => {
    const said = buildVerdictText(
      bv({ miss: 'missing-token', diagKey: 'drill.buildMissToken', missing: ['7'] }),
      ['7'],
    );
    expect(said.body).toContain('7');
  });

  test('러너가 없으면 오답이 아니라 「이 컴퓨터에서는 안 돈다」다 (D186 ④)', () => {
    mountBuild({ kind: 'done', verdict: bv({ reason: 'toolchain-missing:java' }) });
    expect(screen.getByText(t('drill.none'))).toBeTruthy();
    expect(screen.getByText(t('drill.noneHint'))).toBeTruthy();
  });

  test('통과하면 칸이 잠기고 찍힌 값이 보인다', () => {
    const props = mountBuild({ kind: 'done', verdict: bv({ ok: true, pct: 100, printed: '3.5' }) });
    expect((screen.getByLabelText(t('drill.exprLabel')) as HTMLInputElement).disabled).toBe(true);
    fireEvent.keyDown(document, { code: 'Space' });
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });
});
