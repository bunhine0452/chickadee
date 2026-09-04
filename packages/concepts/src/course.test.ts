/**
 * 코스 순서 (D162 · `docs/program/course.md` §2).
 */
import { describe, expect, test } from 'vitest';

import { buildCourse } from './course.js';
import type { FeatureUnit } from './units.js';

const unit = (name: string, files: string[]): FeatureUnit =>
  ({ name, entry: `FRONT/${name}Service.js`, files: [...files].sort() });

describe('챕터 순서', () => {
  test('새로 여는 파일이 적은 순 — 앞이 연 것은 다시 안 센다', () => {
    const course = buildCourse([
      unit('big', ['a', 'b', 'c', 'd', 'e']),
      unit('small', ['a', 'b', 'x']),
      unit('mid', ['a', 'b', 'c', 'y']),
    ]);
    expect(course.map((c) => c.name)).toStrictEqual(['small', 'mid', 'big']);
    // small 이 a·b·x 를 열었으므로 mid 는 c·y 둘만 새로 연다.
    expect(course[1]?.opens).toStrictEqual(['c', 'y']);
    expect(course[2]?.opens).toStrictEqual(['d', 'e']);
  });

  test('사람이 1번을 고정할 수 있다 — 그래프가 못 보는 판단이 들어오는 문', () => {
    const course = buildCourse([
      unit('big', ['a', 'b', 'c', 'd', 'e']),
      unit('small', ['a', 'b', 'x']),
    ], { first: 'big' });
    expect(course.map((c) => c.name)).toStrictEqual(['big', 'small']);
    expect(course[1]?.opens).toStrictEqual(['x']);
  });

  test('없는 이름을 고정하면 규칙이 정한다', () => {
    const course = buildCourse([
      unit('big', ['a', 'b', 'c']),
      unit('small', ['a']),
    ], { first: '없는것' });
    expect(course[0]?.name).toBe('small');
  });

  test('모든 파일이 정확히 한 번 열린다', () => {
    const course = buildCourse([
      unit('one', ['a', 'b']), unit('two', ['b', 'c']), unit('three', ['c', 'd']),
    ]);
    const opened = course.flatMap((c) => c.opens);
    expect([...opened].sort()).toStrictEqual(['a', 'b', 'c', 'd']);
    expect(new Set(opened).size).toBe(opened.length);
  });

  test('기능이 없으면 코스도 없다', () => {
    expect(buildCourse([])).toStrictEqual([]);
  });
});
