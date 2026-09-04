/**
 * 코스 골든 (`clone-gates-golden`). 두 가지를 얼린다: **목차 순서**와 **조각 분할**.
 *
 * `packages/concepts/src/clone-order.test.ts` 는 「같은 재료면 같은 결과」(자기 일관성)를
 * 이미 본다. 그것만으로는 규칙이 **바뀌어도** 초록이다 — 바뀐 규칙도 결정적이기만 하면
 * 두 번 돌려 같은 값이 나온다. 그래서 여기서는 **기록해 둔 값**과 맞춘다.
 *
 * 값을 다시 녹화하지 마라. 이 배열이 틀렸다면 순서 규칙(D120)이나 분할 규칙(04 §3.1)이
 * 바뀐 것이고, 그것은 결정 등록부를 먼저 지나야 한다.
 *
 * 로케일은 하네스가 `ko` 로 못박는다. 분할은 「…이어서」 헤더를 조각에 넣으므로
 * (`t1-block.ts`) 해시가 로케일을 탄다 — `ko` 가 아니면 두 번째 조각의 해시가 달라진다.
 */
import { segment } from '@chickadee/cards';
import {
  courseOrder, type CommitTouch, type CourseEdge, type CourseFile, type CourseUnit,
} from '@chickadee/concepts';
import { getLocale } from '@chickadee/i18n';
import { describe, expect, test } from 'vitest';

import { segmentHash } from '../../data/clone.js';

// ───────── 재료 ─────────

const FILES: CourseFile[] = [
  { fileId: 1, path: 'src/app/main.ts', unitId: 10 },
  { fileId: 2, path: 'src/app/view.ts', unitId: 10 },
  { fileId: 3, path: 'src/core/time.ts', unitId: 20 },
  { fileId: 4, path: 'src/core/util.ts', unitId: 20 },
  { fileId: 5, path: 'src/core/zip.ts', unitId: 20 },
];

/** `from` 이 `to` 를 import 한다. 코스는 **불리는 쪽을 먼저** 읽는다. */
const EDGES: CourseEdge[] = [
  { fromFileId: 1, toFileId: 2 },
  { fromFileId: 1, toFileId: 3 },
  { fromFileId: 2, toFileId: 4 },
  { fromFileId: 4, toFileId: 5 },
];

/** `c03` 은 파일 둘을 한 번에 만진다 — 그 동률을 경로 사전순이 깨는지가 이 재료의 요점이다. */
const TOUCHES: CommitTouch[] = [
  { sha: 'c05', authoredAt: 500, path: 'src/core/util.ts', fileId: 4 },
  { sha: 'c01', authoredAt: 100, path: 'src/core/zip.ts', fileId: 5 },
  { sha: 'c03', authoredAt: 300, path: 'src/app/view.ts', fileId: 2 },
  { sha: 'c03', authoredAt: 300, path: 'src/app/main.ts', fileId: 1 },
  { sha: 'c07', authoredAt: 700, path: 'src/core/time.ts', fileId: 3 },
];

/** `orderIdx` 가 대지의 바깥 순서다 — `core` 가 `app` 보다 앞이다(이름 순이 아니다). */
const UNITS: CourseUnit[] = [
  { id: 20, name: 'core', orderIdx: 0 },
  { id: 10, name: 'app', orderIdx: 1 },
];

const paths = (steps: readonly { path: string }[]): string[] => steps.map((s) => s.path);

// ───────── 순서 결정성 골든 ─────────

describe('목차 순서 골든', () => {
  test('커밋 순 — 처음 나온 커밋 자리, 같은 커밋 안은 경로 사전순', () => {
    const out = courseOrder({ files: FILES, commitCount: 25, touches: TOUCHES, units: UNITS, edges: EDGES });
    expect(out.mode).toBe('commit');
    expect(paths(out.steps)).toEqual([
      'src/core/zip.ts',   // c01
      'src/app/main.ts',   // c03 — 같은 커밋, 경로가 앞
      'src/app/view.ts',   // c03
      'src/core/util.ts',  // c05
      'src/core/time.ts',  // c07
    ]);
  });

  test('위상 폴백 — 대지 order_idx 가 바깥, 대지 안은 불리는 쪽이 먼저', () => {
    const out = courseOrder({ files: FILES, commitCount: 3, touches: [], units: UNITS, edges: EDGES });
    expect(out.mode).toBe('dep');
    expect(paths(out.steps)).toEqual([
      'src/core/time.ts',  // core 안에서 간선이 없다 — 경로 사전순으로 앞
      'src/core/zip.ts',   // util 이 zip 을 부른다
      'src/core/util.ts',
      'src/app/view.ts',   // main 이 view 를 부른다
      'src/app/main.ts',
    ]);
  });

  test('원장에 담기는 것은 `order_json` 이다 — 입력 순서를 뒤집어도 그 글자가 같다', () => {
    const once = courseOrder({ files: FILES, commitCount: 25, touches: TOUCHES, units: UNITS, edges: EDGES });
    const twice = courseOrder({
      files: [...FILES].reverse(),
      commitCount: 25,
      touches: [...TOUCHES].reverse(),
      units: [...UNITS].reverse(),
      edges: [...EDGES].reverse(),
    });
    // `startCourse` 가 `JSON.stringify(order.steps)` 를 `clone_run.order_json` 에 넣는다.
    // 목차의 정본이 그 글자이므로 비교도 그 글자로 한다.
    expect(JSON.stringify(twice.steps)).toBe(JSON.stringify(once.steps));
  });
});

// ───────── 조각 분할 골든 ─────────

/** 12~40줄 규칙을 넘기려고 일부러 넓힌 함수 하나. 본문은 한 줄씩 늘어난다. */
function wide(n: number): string[] {
  const body = Array.from({ length: n - 3 }, (_, i) => `  const v${String(i)} = compute(${String(i)});`);
  return ['export function wide(input: number): number {', '  // head', ...body, '  return 0;', '}'];
}

const shapeOf = (lines: readonly string[], grammar: string, from: number) =>
  segment(lines, { grammar, lineStart: from }).map((s) => ({
    lineStart: s.lineStart,
    lineEnd: s.lineEnd,
    continued: s.continued,
    lines: s.lines.length,
    hash: segmentHash(s.lines),
  }));

describe('조각 분할 골든', () => {
  test('하네스 로케일이 ko 다 — 「…이어서」 헤더가 해시에 들어간다', () => {
    expect(getLocale()).toBe('ko');
  });

  test('40줄 이하는 조각 하나 — 자르지 않는다', () => {
    expect(shapeOf(wide(25), 'typescript', 1)).toEqual([
      { lineStart: 1, lineEnd: 26, continued: false, lines: 26, hash: '729685916019914f' },
    ]);
  });

  test('41줄 이상은 시그니처 + 문장 + 닫힘으로 나뉘고 둘째부터 「이어서」가 붙는다', () => {
    // 블록이 파일 10번째 줄에서 시작한다 — 조각의 줄 범위는 **본문**이라 시그니처(10)는 밖이다.
    expect(shapeOf(wide(60), 'typescript', 10)).toEqual([
      { lineStart: 11, lineEnd: 40, continued: false, lines: 32, hash: 'ed722115fb2f3d27' },
      { lineStart: 41, lineEnd: 69, continued: true, lines: 32, hash: 'ab180eb4b5a6840e' },
    ]);
  });

  test('같은 원문이면 같은 해시다 — `text_hash` 가 재인제스트를 잡는 근거다', () => {
    const a = shapeOf(wide(60), 'typescript', 10);
    const b = shapeOf(wide(60), 'typescript', 10);
    expect(a.map((s) => s.hash)).toEqual(b.map((s) => s.hash));
    // 한 줄만 바뀌어도 그 조각의 해시가 달라진다 (`clone-resume-stale` 의 방아쇠).
    const changed = wide(60);
    changed[5] = '  const v3 = compute(999);';
    expect(shapeOf(changed, 'typescript', 10)[0]?.hash).not.toBe(a[0]?.hash);
  });
});
