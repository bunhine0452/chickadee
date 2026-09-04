// @vitest-environment jsdom
/**
 * 코스 화면. 데이터 층은 `data.ts` 가 자기 테스트를 갖고 있으므로 여기서는 **화면이
 * 무엇을 하는지**만 본다: 빈 상태 셋을 갈라 그리는가, 이어하기가 초안을 되살리는가,
 * Esc 가 **한 겹**인가, 목차가 조각 상태를 적는가.
 *
 * `ClonePad` 는 모의한다 — 진짜 Monaco 는 jsdom 에서 뜨지 않는다(레이아웃·`ResizeObserver`).
 * 그 안의 키는 `components/t1/ClonePad.test.tsx` 가 따로 본다.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { CloneRun, CloneStepRow, CoursePlate } from '../../data/clone.js';
import type { CourseNext, Toc } from './data.js';

vi.mock('../../components/t1/ClonePad.js', () => ({
  ClonePad: (props: { value: string }) => (
    <div className="editor">
      <textarea aria-label="필사 입력" defaultValue={props.value} />
    </div>
  ),
}));

let entered: { run: CloneRun; resumed: boolean } | null = null;
let next: CourseNext = { at: 'nothing' };
let toc: Toc = { units: [], files: 0, filesDone: 0, cut: 0, cutDone: 0 };
let readable = true;
const saved: { stepId: number; elapsedS: number; draft: string | null }[] = [];
const closed: { runId: number; status: string }[] = [];

vi.mock('./data.js', async (orig) => {
  const real = await orig<typeof import('./data.js')>();
  return {
    ...real,
    courseDeps: () => Promise.resolve({ repoId: 1, rootPath: '/w/r', dict: { concepts: new Map(), locale: 'ko' }, dictVersion: 'x', now: 0, day: '2026-09-04' }),
    enterCourse: () => Promise.resolve(entered),
    nextPlate: () => Promise.resolve(next),
    loadToc: () => Promise.resolve(toc),
    loadUnitNames: () => Promise.resolve(new Map([[10, '핵심']])),
    layerOf: () => Promise.resolve(2),
    conceptName: () => '변수 선언',
    canReadSource: () => Promise.resolve(readable),
    gradeStep: () => Promise.resolve({ result: null, finish: null }),
    saveDraft: (stepId: number, elapsedS: number, draft: string | null) => {
      saved.push({ stepId, elapsedS, draft });
      return Promise.resolve(null);
    },
    closeCourse: (runId: number, status: string) => {
      closed.push({ runId, status });
      return Promise.resolve(undefined);
    },
  };
});

vi.mock('../../data/settings.js', () => ({
  loadSettings: () => Promise.resolve({ theme: 'light' }),
  loadScheduler: () => Promise.resolve({}),
}));

vi.mock('../../flow.js', () => ({ report: () => undefined, todayKey: () => '2026-09-04' }));

const { CloneScreen } = await import('./CloneScreen.js');
const { useUi } = await import('../../store.js');

const RUN = {
  id: 4, repoId: 1, sessionId: 9, mode: 'dep', scope: 'repo', unitId: null, status: 'active',
  steps: [{ fileId: 7, path: 'src/a.ts', unitId: 10 }],
  startedAt: 0, finishedAt: null,
} as CloneRun;

const STEP = {
  id: 21, run_id: 4, seq: 0, part: 0, file_id: 7, block_id: 3,
  line_start: 4, line_end: 20, text_hash: 'h', status: 'active', pct: null,
  elapsed_s: 42, draft_text: '이어서 치던 줄', session_item_id: null, review_log_id: null,
  done_at: null, path: 'src/a.ts', grammar: 'typescript',
} as CloneStepRow;

const PLATE = {
  step: STEP,
  stage: 2 as const,
  grammar: 'typescript',
  payload: {
    track: 't1' as const,
    kind: 'transcribe' as const,
    blockId: 3,
    file: 'src/a.ts',
    fn: 'sum()',
    original: ['export function sum(a, b) {', '  return a + b', '}'],
    show2: [0, 2],
    why: { line: 1, q: '', help: '', choices: [] },
  },
  spec: { signature: [], mustHold: [] },
  conceptId: 'ts/const' as CoursePlate['conceptId'],
  secondary: [],
  contentHash: 'c',
  ast: null,
} as unknown as CoursePlate;

const FULL_TOC: Toc = {
  units: [{
    unitId: 10,
    name: '핵심',
    files: [{
      seq: 0,
      fileId: 7,
      path: 'src/a.ts',
      parts: [
        { id: 20, part: 0, status: 'done', pct: 91, lineStart: 1, lineEnd: 3 },
        { id: 21, part: 1, status: 'active', pct: null, lineStart: 4, lineEnd: 20 },
        { id: 22, part: 2, status: 'stale', pct: null, lineStart: 21, lineEnd: 30 },
      ],
      done: 1,
      total: 2,
    }],
  }],
  files: 1,
  filesDone: 0,
  cut: 2,
  cutDone: 1,
};

const view = (over: Partial<React.ComponentProps<typeof CloneScreen>> = {}) => (
  <CloneScreen
    repoId={1}
    repoName="chickadee"
    rootPath="/w/r"
    scope={{ kind: 'repo' }}
    onBack={over.onBack ?? (() => undefined)}
    {...over}
  />
);

beforeEach(() => {
  entered = { run: RUN, resumed: false };
  next = { at: 'nothing' };
  toc = { units: [], files: 0, filesDone: 0, cut: 0, cutDone: 0 };
  readable = true;
  saved.length = 0;
  closed.length = 0;
  useUi.setState({ toast: undefined, session: null, activeId: 1, screen: 'clone' });
});

afterEach(cleanup);

describe('빈 상태 (clone-screen-empty)', () => {
  test('코스에 담을 파일이 없으면 그렇게 말한다', async () => {
    entered = null;
    render(view());
    expect(await screen.findByText('이 리포로는 코스가 서지 않습니다')).toBeTruthy();
    expect(screen.getByText(/그런 파일이 없습니다/)).toBeTruthy();
  });

  test('목차는 섰는데 조각이 없으면 「12줄 이상인 함수가 없다」다', async () => {
    next = { at: 'nothing' };
    readable = true;
    render(view());
    expect(await screen.findByText(/12줄 이상인 함수가 한 개도 없는/)).toBeTruthy();
  });

  test('원문을 못 읽으면 폴더를 확인하라고 한다 — 함수가 없는 것과 할 일이 다르다', async () => {
    next = { at: 'nothing' };
    readable = false;
    render(view());
    expect(await screen.findByText(/리포 폴더가 옮겨졌는지/)).toBeTruthy();
  });
});

describe('이어하기 (clone-resume)', () => {
  test('나갔다 오면 마지막 조각의 초안이 그대로 있다', async () => {
    entered = { run: RUN, resumed: true };
    next = { at: 'plate', plate: PLATE, recut: false };
    toc = FULL_TOC;
    render(view());

    const pad = await screen.findByLabelText('필사 입력');
    expect((pad as HTMLTextAreaElement).value).toBe('이어서 치던 줄');
    // 어디서 이어 가는지를 말한다 — 목차를 뒤져 찾게 두지 않는다.
    await waitFor(() => {
      expect(useUi.getState().toast).toBe('src/a.ts 의 1번째 조각부터 이어 갑니다.');
    });
  });

  test('새로 연 코스는 이어하기 안내를 내지 않는다', async () => {
    entered = { run: RUN, resumed: false };
    next = { at: 'plate', plate: PLATE, recut: false };
    toc = FULL_TOC;
    render(view());
    await screen.findByLabelText('필사 입력');
    expect(useUi.getState().toast).toBeUndefined();
  });

  test('다시 자른 직후에는 그 사실을 판 위에 적는다', async () => {
    next = { at: 'plate', plate: PLATE, recut: true };
    toc = FULL_TOC;
    render(view());
    expect(await screen.findByText('원본이 바뀌어 이 파일을 다시 잘랐습니다.')).toBeTruthy();
  });
});

describe('Esc 는 한 겹이다 (clone-screen-esc)', () => {
  test('Esc 는 초안을 저장하고 코스를 멈추고 나간다 — 확인 모달이 없다', async () => {
    next = { at: 'plate', plate: PLATE, recut: false };
    toc = FULL_TOC;
    let back = 0;
    render(view({ onBack: () => { back += 1; } }));
    await screen.findByLabelText('필사 입력');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(back).toBe(1));
    expect(saved).toEqual([{ stepId: 21, elapsedS: 42, draft: '이어서 치던 줄' }]);
    // 멈춤이지 버림이 아니다 — `clone.run_open` 이 `paused` 도 이어할 코스로 집는다.
    expect(closed).toEqual([{ runId: 4, status: 'paused' }]);
    expect(useUi.getState().toast).toBe('코스에서 나왔습니다. 진행은 저장됐습니다.');
  });

  test('「저장하고 나가기」 단추가 Esc 와 같은 것을 부른다', async () => {
    next = { at: 'plate', plate: PLATE, recut: false };
    toc = FULL_TOC;
    let back = 0;
    render(view({ onBack: () => { back += 1; } }));
    await screen.findByLabelText('필사 입력');

    await userEvent.click(screen.getByRole('button', { name: /저장하고 나가기/ }));
    await waitFor(() => expect(back).toBe(1));
    expect(closed).toEqual([{ runId: 4, status: 'paused' }]);
  });
});

describe('목차 (clone-screen-toc)', () => {
  test('대지 → 파일 → 조각과 조각별 상태를 적는다', async () => {
    next = { at: 'plate', plate: PLATE, recut: false };
    toc = FULL_TOC;
    render(view());
    await screen.findByLabelText('필사 입력');

    const nav = screen.getByLabelText('코스 목차');
    expect(nav.textContent).toContain('핵심');
    expect(nav.textContent).toContain('src/a.ts');
    expect(nav.textContent).toContain('끝 · 91%');
    expect(nav.textContent).toContain('원본이 바뀜');
    expect(nav.textContent).toContain('0 / 1 파일');
    expect(nav.textContent).toContain('지금까지 자른 조각 1/2');
  });

  test('지금 치는 조각에 aria-current 가 붙는다 — 색만으로 말하지 않는다', async () => {
    next = { at: 'plate', plate: PLATE, recut: false };
    toc = FULL_TOC;
    const { container } = render(view());
    await screen.findByLabelText('필사 입력');
    const cur = container.querySelectorAll('[aria-current="step"]');
    // 단계 표시(`Stepper`)와 목차의 지금 조각 둘이다.
    expect([...cur].some((el) => el.className.includes('ctoc-part'))).toBe(true);
  });
});

describe('마침', () => {
  test('남은 조각이 없으면 코스를 닫고 마침을 보인다', async () => {
    next = { at: 'done' };
    toc = { ...FULL_TOC, cutDone: 7 };
    render(view());
    expect(await screen.findByText('코스를 마쳤습니다')).toBeTruthy();
    expect(screen.getByText(/7개 조각을 필사했습니다/)).toBeTruthy();
    expect(closed).toEqual([{ runId: 4, status: 'done' }]);
  });

  test('마친 코스에서 나갈 때는 다시 멈추지 않는다', async () => {
    next = { at: 'done' };
    toc = { ...FULL_TOC, cutDone: 7 };
    render(view());
    await screen.findByText('코스를 마쳤습니다');
    closed.length = 0;

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(useUi.getState().toast).toBe('코스에서 나왔습니다. 진행은 저장됐습니다.'));
    expect(closed).toEqual([]);
  });
});
