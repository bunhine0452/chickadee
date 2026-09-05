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

  test('사전이 1번을 고른다 — 규약 근거가 가장 많은 챕터', () => {
    // 그래프 지표 셋이 다 실패한 자리를 `proto/` 의 근거 낱말이 답한다 (D162).
    const course = buildCourse([
      unit('big', ['a', 'b', 'c', 'd']),
      unit('auth', ['a', 'jwt.java', 'filter.java']),
    ], { protoHits: new Map([['jwt.java', 3], ['filter.java', 1], ['a', 9]]) });
    expect(course[0]?.name).toBe('auth');
  });

  test('공유 파일의 근거는 안 센다 — 세면 전부 동점이 된다', () => {
    // `a` 를 둘 다 갖고 있고 거기에 근거가 몰려 있다. 그것으로는 못 가른다.
    const course = buildCourse([
      unit('big', ['a', 'b', 'c', 'd']),
      unit('small', ['a', 'x']),
    ], { protoHits: new Map([['a', 99]]) });
    // 아무 챕터도 자기 것에 근거가 없으므로 규칙(새로 여는 파일 적은 순)이 정한다.
    expect(course[0]?.name).toBe('small');
  });

  test('사람이 고정한 것이 사전보다 우선한다', () => {
    const course = buildCourse([
      unit('big', ['a', 'b', 'c', 'd']),
      unit('auth', ['jwt.java']),
    ], { first: 'big', protoHits: new Map([['jwt.java', 5]]) });
    expect(course[0]?.name).toBe('big');
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
