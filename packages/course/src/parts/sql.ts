/**
 * SQL 의 부 배치 (D190). 정본은 `docs/curriculum/sql.md` §0.2·§2·§3 다. 열 중 유일한 선언형이라 0부가
 * 「값 하나」가 아니라 「표 하나」다(README §8). 바닥의 남은 다섯과 중심은 저작 전이다.
 */
import type { PartAssignment } from '../curriculum.js';

export const SQL_PARTS: readonly PartAssignment[] = [
  {
    // 0부 「표와 절」 여덟 (sql.md §0.2)
    part: 0,
    concepts: [
      'sql/row-and-set',
      'sql/column-type',
      'sql/value-and-name',
      'sql/null-unknown',
      'sql/three-valued-comparison',
      'sql/implicit-cast',
      'sql/expression-per-row',
      'sql/clause-order',
    ],
  },
  {
    // 1부 「절을 읽기」 — 바닥 여덟 중 셋
    part: 1,
    concepts: [
      'sql/from-table',
      'sql/comparison',
      'sql/null-check',
    ],
  },
  {
    // 2부 — 저작 전
    part: 2,
    concepts: [],
  },
  {
    // 3부 — 없다
    part: 3,
    concepts: [],
  },
];
